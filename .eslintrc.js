module.exports = {
  "env": {
    "es2021": true,
    "node": true,
    "jest": true
  },
  "extends": [
    "expo",
    "plugin:react/recommended",
    "plugin:react-native/all",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "react-native",
    "@typescript-eslint"
  ],
  "rules": {
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "react-native/no-inline-styles": "warn",
    "react-native/no-color-literals": "warn",
    "react-native/no-raw-text": "warn",
    "react-native/sort-styles": "warn",
    "react-native/no-unused-styles": "error",
    "react-hooks/exhaustive-deps": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "overrides": [
    {
      "files": [
        "*.test.ts",
        "*.test.tsx",
        "*.spec.ts",
        "*.spec.tsx",
        "tests/**/*.{ts,tsx}"
      ],
      "env": {
        "jest": true
      },
      "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "react-hooks/exhaustive-deps": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-require-imports": "off",
        "react/jsx-no-undef": "off",
        "react-native/no-inline-styles": "off",
        "react-native/no-color-literals": "off"
      }
    }
  ]
};