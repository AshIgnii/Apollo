import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["eslint.config.mts", "customRules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: "commonjs",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-namespace": ["error", { allowDeclarations: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "no-restricted-imports": "off",
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: ["!./*", "!../*"],
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["strictCamelCase", "StrictPascalCase", "UPPER_CASE"],
          leadingUnderscore: "allow",
        },
        {
          selector: "import",
          format: null,
        },
        {
          selector: "class",
          format: ["PascalCase"],
        },
        {
          selector: "interface",
          format: ["StrictPascalCase"],
        },
        {
          selector: "variable",
          modifiers: ["const"],
          format: ["strictCamelCase", "StrictPascalCase", "UPPER_CASE"],
        },
      ],
      "prettier/prettier": [
        "error",
        {
          singleQuote: true,
          trailingComma: "all",
          tabWidth: 4,
          semi: true,
          printWidth: 140,
          arrowParens: "avoid",
          bracketSpacing: true,
          useTabs: false,
          endOfLine: "auto",
        },
      ],
    },
  },
);
