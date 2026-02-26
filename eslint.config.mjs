import js from "@eslint/js"
import importPlugin from "eslint-plugin-import"
import prettier from "eslint-config-prettier"
import globals from "globals"

export default [
  js.configs.recommended,

  // Browser code (your apps + shared frontend utilities)
  {
    files: ["apps/**/*.js", "shared/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser
      }
    },
    plugins: { import: importPlugin },
    rules: {
      "no-unused-vars": ["warn"],
      "import/order": [
        "warn",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always"
        }
      ]
    }
  },

  // Node config files (Vite config, tooling)
  {
    files: ["vite.config.js", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    }
  },

  prettier
]