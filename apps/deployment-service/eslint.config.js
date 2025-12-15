import base from "@axion-stack/eslint-config/base";
import typescript from "@axion-stack/eslint-config/typescript";

export default [
  ...base,
  ...typescript.map((config) => {
    // Disable project-aware linting to avoid tsconfig resolution issues
    if (config.languageOptions?.parserOptions?.project) {
      return {
        ...config,
        languageOptions: {
          ...config.languageOptions,
          parserOptions: {
            ...config.languageOptions.parserOptions,
            project: null, // Disable project-aware linting until tsconfig is fixed
          },
        },
      };
    }
    return config;
  }),
  {
    files: ["**/*.ts"],
    rules: {
      // Disable no-undef for TypeScript files since TypeScript handles this
      "no-undef": "off",
      // Disable base no-unused-vars for TypeScript files - use @typescript-eslint/no-unused-vars instead
      // This is needed because base rule doesn't understand TypeScript parameter properties
      "no-unused-vars": "off",
      // Disable all type-aware rules when project is null
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      // Configure no-unused-vars to properly handle parameter properties
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          // Don't report unused args if they are parameter properties (used as class properties)
          args: "after-used",
        },
      ],
      // Disable consistent-type-imports when project-aware linting is disabled
      // Without type information, ESLint can't correctly determine if imports are type-only
      // This causes false positives for classes used in constructors as parameter properties
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "*.config.ts", "*.config.js"],
  },
];
