import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";
import globals from "globals";

const styleRules = {
    "indent": ["error", 4, { SwitchCase: 1 }],
    "quotes": ["error", "double"],
    "brace-style": ["error", "1tbs"],
    "curly": ["error", "all"],
    "eqeqeq": "error",
    "no-else-return": "error",
    "no-extra-bind": "error",
    "no-invalid-this": "error",
    "no-multi-spaces": "error",
    "no-sparse-arrays": "warn",
    "no-useless-escape": "warn",
    "no-useless-concat": "warn",
    "array-bracket-spacing": ["warn", "never"],
    "block-spacing": ["error", "always"],
    "camelcase": ["warn", { properties: "never" }],
    "comma-dangle": "warn",
    "space-before-blocks": "error",
    "space-in-parens": ["error", "never"],
    "space-infix-ops": "error",
    "no-multiple-empty-lines": "error",
    "eol-last": "error",
    "semi": "error",
    "keyword-spacing": ["error", {
        overrides: {
            if: { after: false },
            for: { after: false },
            while: { after: false },
            switch: { after: false },
            catch: { after: false }
        }
    }],
    "no-trailing-spaces": "error",
    "jsx-quotes": ["warn", "prefer-double"],

    // JSX formatting — successors to the removed eslint-plugin-react stylistic rules
    "@stylistic/jsx-curly-spacing": ["error", { when: "always", children: true }],
    "@stylistic/jsx-wrap-multilines": "warn",
    "@stylistic/jsx-self-closing-comp": "warn"
};

export default defineConfig([
    {
        ignores: ["coverage/**", "public/**", "build/**", "node_modules/**"]
    },
    js.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
        extends: [
            eslintReact.configs["recommended-typescript"],
            reactHooks.configs.flat["recommended-latest"]
        ],
        plugins: {
            "@stylistic": stylistic,
            "@typescript-eslint": tseslint.plugin
        },
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            parser: tseslint.parser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                }
            },
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2020,
                grecaptcha: "readonly",
                __BUILD_VERSION__: "readonly"
            }
        },
        rules: {
            ...styleRules,

            // TODO: 12 legacy prop-sync effects and the render-phase ref read in
            // useCardListWithExit still need rewriting — warn until then
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/refs": "warn",

            // eslint-plugin-react-hooks (react-compiler based) owns everything hooks-related;
            // these @eslint-react rules are its duplicates
            "@eslint-react/error-boundaries": "off",
            "@eslint-react/exhaustive-deps": "off",
            "@eslint-react/purity": "off",
            "@eslint-react/rules-of-hooks": "off",
            "@eslint-react/set-state-in-effect": "off",
            "@eslint-react/set-state-in-render": "off",
            "@eslint-react/static-components": "off",
            "@eslint-react/unsupported-syntax": "off",
            "@eslint-react/use-memo": "off",

            "no-undef": "off", // TypeScript handles this
            "no-unused-vars": "off",
            "no-useless-constructor": "off",
            "@typescript-eslint/no-useless-constructor": "warn",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
            "@typescript-eslint/no-explicit-any": ["error", { fixToUnknown: true }],

            "no-restricted-imports": ["error", {
                paths: [{
                    name: "react-redux",
                    importNames: ["connect"],
                    message: "Use useAppSelector / useAppDispatch from ./hooks instead of the legacy connect() HOC."
                }]
            }]
        }
    },
    {
        files: ["server/**/*.ts"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.es2020
            }
        }
    },
    {
        files: ["test/**/*.ts", "test/**/*.tsx"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.browser,
                ...globals.es2020
            }
        },
        rules: {
            "no-invalid-this": "off"
        }
    }
]);
