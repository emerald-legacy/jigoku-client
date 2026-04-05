const path = require("path");
const js = require("@eslint/js");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const babelParser = require("@babel/eslint-parser");
const tseslint = require("typescript-eslint");
const globals = require("globals");

module.exports = [
    {
        ignores: ["coverage/**", "public/**", "build/**", "node_modules/**"]
    },
    js.configs.recommended,
    {
        files: ["**/*.js"],
        plugins: {
            react,
            "react-hooks": reactHooks
        },
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            parser: babelParser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true
                },
                requireConfigFile: true,
                babelOptions: {
                    configFile: path.resolve(__dirname, "babel.config.json")
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
        settings: {
            react: {
                version: "detect"
            }
        },
        rules: {
            // React rules
            ...react.configs.recommended.rules,
            "react/prop-types": "off",
            "react/no-string-refs": "warn",
            "react/no-deprecated": "warn",
            "react/display-name": "warn",
            "react/jsx-boolean-value": "warn",
            "react/jsx-no-undef": "warn",
            "react/sort-prop-types": "warn",
            "react/jsx-sort-props": "off",
            "react/jsx-uses-react": "off",
            "react/jsx-uses-vars": "warn",
            "react/no-danger": "warn",
            "react/no-did-mount-set-state": "warn",
            "react/no-did-update-set-state": "warn",
            "react/no-multi-comp": "warn",
            "react/no-unknown-property": "warn",
            "react/react-in-jsx-scope": "off",
            "react/self-closing-comp": "warn",
            "react/sort-comp": "warn",
            "react/jsx-wrap-multilines": "warn",
            "react/jsx-curly-spacing": ["error", { when: "always", children: true }],

            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            "react/no-unescaped-entities": "off", // Apostrophes in prose are fine
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],

            // Code style rules
            "indent": ["error", 4, { SwitchCase: 1 }],
            "quotes": ["error", "double"],
            "strict": ["warn", "global"],
            "brace-style": ["error", "1tbs"],
            "no-sparse-arrays": "warn",
            "eqeqeq": "error",
            "no-else-return": "error",
            "no-extra-bind": "error",
            "curly": ["error", "all"],
            "no-multi-spaces": "error",
            "no-invalid-this": "error",
            "no-useless-escape": "warn",
            "no-useless-concat": "warn",
            "no-useless-constructor": "warn",
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
            "jsx-quotes": ["warn", "prefer-double"]
        }
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        plugins: {
            react,
            "react-hooks": reactHooks,
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
        settings: {
            react: {
                version: "detect"
            }
        },
        rules: {
            // React rules
            ...react.configs.recommended.rules,
            "react/prop-types": "off",
            "react/no-string-refs": "warn",
            "react/no-deprecated": "warn",
            "react/display-name": "warn",
            "react/jsx-boolean-value": "warn",
            "react/jsx-no-undef": "warn",
            "react/sort-prop-types": "warn",
            "react/jsx-sort-props": "off",
            "react/jsx-uses-react": "off",
            "react/jsx-uses-vars": "warn",
            "react/no-danger": "warn",
            "react/no-did-mount-set-state": "warn",
            "react/no-did-update-set-state": "warn",
            "react/no-multi-comp": "warn",
            "react/no-unknown-property": "warn",
            "react/react-in-jsx-scope": "off",
            "react/self-closing-comp": "warn",
            "react/sort-comp": "warn",
            "react/jsx-wrap-multilines": "warn",
            "react/jsx-curly-spacing": ["error", { when: "always", children: true }],

            // React Hooks rules
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",

            "react/no-unescaped-entities": "off", // Apostrophes in prose are fine
            "no-undef": "off", // TypeScript handles this
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],

            // Code style rules
            "indent": ["error", 4, { SwitchCase: 1 }],
            "quotes": ["error", "double"],
            "strict": "off",
            "brace-style": ["error", "1tbs"],
            "no-sparse-arrays": "warn",
            "eqeqeq": "error",
            "no-else-return": "error",
            "no-extra-bind": "error",
            "curly": ["error", "all"],
            "no-multi-spaces": "error",
            "no-invalid-this": "error",
            "no-useless-escape": "warn",
            "no-useless-concat": "warn",
            "no-useless-constructor": "off",
            "@typescript-eslint/no-useless-constructor": "warn",
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
            "jsx-quotes": ["warn", "prefer-double"]
        }
    },
    {
        files: ["server/**/*.js", "server/**/*.ts"],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.es2020
            }
        },
        rules: {
            "react/react-in-jsx-scope": "off",
            "react/jsx-uses-react": "off"
        }
    },
    {
        files: ["test/**/*.js", "test/**/*.ts", "test/**/*.tsx"],
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
];
