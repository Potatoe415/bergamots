import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  { ignores: ["dist/**", ".vercel/**", "public/games/**/vendor/**"] },

  js.configs.recommended,

  // Browser code: the hub, the shared frontend utilities and every game.
  // Games live in public/, not apps/ - an earlier glob mismatch left this whole
  // tree without browser globals, which reported 1164 phantom no-undef errors.
  {
    files: [
      "hub.js",
      "auth.js",
      "version.js",
      "wordplayer.js",
      "public/**/*.js",
      "shared/**/*.js"
    ],
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

  // diceduel loads its four files as classic scripts (no type="module"), so they
  // share one global scope: STATES comes from engine.js, Engine from
  // window.Engine, UI from ui.js. Declare them instead of adding imports the
  // runtime does not use.
  {
    files: ["public/games/diceduel/js/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: {
        Engine: "readonly",
        STATES: "readonly",
        Storage: "writable",
        UI: "readonly"
      }
    },
    rules: {
      // These files are where those globals are defined, so the declaration is
      // not a redeclaration. Double declarations inside one file still error.
      "no-redeclare": ["error", { builtinGlobals: false }]
    }
  },

  // Service worker: self, caches and clients instead of window and document.
  {
    files: ["**/sw.js"],
    languageOptions: {
      globals: {
        ...globals.serviceworker
      }
    }
  },

  // Node config files (Vite config, tooling) + Vercel serverless functions
  {
    files: ["vite.config.js", "eslint.config.mjs", "**/*.cjs", "api/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node
      }
    }
  },

  prettier
];
