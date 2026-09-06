const { ChecklistSchema } = require('./src/utils/validation.ts');

// Test the failing case specifically
const invalidChecklist = {
  id: "", // Empty string
  practiceId: "pr-67890",
  time: "14:30",
  temperature: 80,
  humidity: 60,
  heatIndex: 88,
  actionTaken: "No restrictions",
  timestamp: "2026-09-02T14:30:00Z",
  deviceInfo: "iPhone 12 Pro"
};

console.log('Testing empty ID...');

try {
  const result = ChecklistSchema.parse(invalidChecklist);
  console.log('✗ Empty ID PASSED (unexpected)');
  console.log('Result:', result);
} catch (error) {
  console.log('✓ Empty ID FAILED (expected)');
  console.log('Error:', error.message);
}

// Test a valid case for comparison
const validChecklist = {
  id: "cl-123",
  practiceId: "pr-67890",
  time: "14:30",
  temperature: 80,
  humidity: 60,
  heatIndex: 88,
  actionTaken: "No restrictions",
  timestamp: "2026-09-02T14:30:00Z",
  deviceInfo: "iPhone 12 Pro"
};

console.log('\nTesting valid ID...');

try {
  const result = ChecklistSchema.parse(validChecklist);
  console.log('✓ Valid ID PASSED (expected)');
  console.log('Result:', result);
} catch (error) {
  console.log('✗ Valid ID FAILED (unexpected)');
  console.log('Error:', error.message);
}