#!/usr/bin/env bash
set -euo pipefail

INPUT_FILE="${1:-ocr-results.json}"
OUTPUT_DIR="${2:-./spec-artifacts}"
MASTER_FILE="ocr-results-spec.json"

echo "[INFO] Starting artifact extraction..."

if [ ! -f "$INPUT_FILE" ]; then
  echo "Error: Input file not found: $INPUT_FILE" >&2
  exit 1
fi

# Clean previous run
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

JSONL_FILE=$(jq -r '.summary.file_path // empty' "$INPUT_FILE")

if [ -z "$JSONL_FILE" ] || [ ! -f "$JSONL_FILE" ]; then
  echo "Error: JSONL session file path not found or invalid in summary: $JSONL_FILE" >&2
  exit 1
fi

# 1. Create a temporary file with the exact list of valid target files
VALID_FILES_FILE=$(mktemp)
trap 'rm -f "$VALID_FILES_FILE"' EXIT
jq -r '.items[]? | select(.type == "done" and (.comments // 0) > 0) | .file_path' "$INPUT_FILE" > "$VALID_FILES_FILE"

echo "[INFO] Loaded $(wc -l < "$VALID_FILES_FILE") valid files from summary."
echo "[INFO] Processing session JSONL log from: $JSONL_FILE"

# 2. Extract individual findings
while IFS= read -r line; do
  [ -z "$line" ] && continue

  file_path=$(echo "$line" | jq -r '.filePath // empty' 2>/dev/null || true)
  if [ -z "$file_path" ] || [ "$file_path" = "null" ]; then
    continue
  fi

  if grep -qxF "$file_path" "$VALID_FILES_FILE"; then
    safe_name=$(jq -n -r --arg fp "$file_path" '$fp | gsub("[^a-zA-Z0-9_-]"; "_")')
    output_file="$OUTPUT_DIR/spec-${safe_name}.json"

    # Extract findings using robust jq filter for arguments
    set +e
    extracted=$(echo "$line" | jq --arg fpath "$file_path" '{
      specId: ("SPEC-FINDING-" + $fpath),
      sourceFile: $fpath,
      sessionId: .sessionId,
      timestamp: .timestamp,
      status: "Review Findings",
      findings: [
        .messages[]?
        | select(.tool_calls != null)
        | .tool_calls[]?
        | select(.function.name == "code_comment")
        | .function.arguments
        | if type == "string" then (try fromjson catch null) else . end
        | select(. != null and type == "object")
        | .comments[]?
      ]
    }' 2>/dev/null)
    jq_status=$?
    set -e

    if [ $jq_status -eq 0 ]; then
      findings_count=$(echo "$extracted" | jq '.findings | length // 0' 2>/dev/null || echo "0")
      if [ "$findings_count" -gt 0 ]; then
        echo "$extracted" > "$output_file"
        echo "  -> Extracted: $(basename "$output_file") ($findings_count findings)"
      fi
    fi
  fi
done < "$JSONL_FILE"

# 3. Consolidate into Master Spec
shopt -s nullglob
ARTIFACT_FILES=("$OUTPUT_DIR"/spec-*.json)
shopt -u nullglob

if [ ${#ARTIFACT_FILES[@]} -gt 0 ]; then
  echo "[INFO] Consolidating ${#ARTIFACT_FILES[@]} artifacts into master spec..."
  
  # Slurp all individual artifacts into one master array and wrap it in metadata
  jq -s '{
    type: "MasterCodeReviewSpec",
    generatedAt: now | todate,
    totalFiles: length,
    totalFindings: (map(.findings | length) | add),
    artifacts: .
  }' "${ARTIFACT_FILES[@]}" > "$MASTER_FILE"
  
  echo "[SUCCESS] Master spec generated at: $MASTER_FILE"
else
  echo "[WARN] No findings were extracted. Master spec not generated."
fi