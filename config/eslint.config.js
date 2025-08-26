module.exports = [
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        console: "readonly",
        exports: "writable",
        global: "readonly",
        module: "writable",
        require: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_" 
      }],
      "no-console": "off",
      "semi": ["error", "always"],
      "quotes": ["error", "single", { 
        "avoidEscape": true,
        "allowTemplateLiterals": true 
      }],
      "indent": ["error", 2, { 
        "SwitchCase": 1 
      }],
      "comma-dangle": ["error", "never"],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
      "no-multiple-empty-lines": ["error", { 
        "max": 2, 
        "maxEOF": 1 
      }]
    }
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        jest: "readonly",
        describe: "readonly",
        test: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly"
      }
    }
  }
];