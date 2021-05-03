module.exports = {
    root: true,
    env: {
      node: true,
      jest: true
    },
    parser: "@typescript-eslint/parser",
    plugins: [
      "@typescript-eslint"
    ],
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended"
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "camelcase": "warn",
      "prefer-const": ["warn"]
    },
    overrides: [
      {
        "files": ["tests/**/*.ts"],
        "rules": {
          "@typescript-eslint/ban-ts-comment": ["off"]
        }
      }
    ]
  };
    