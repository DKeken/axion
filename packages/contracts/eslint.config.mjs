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
            project: null,
          },
        },
      };
    }
    return config;
  }),
  {
    files: ["**/*.ts"],
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          args: "after-used",
        },
      ],
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "generated/**",
      "*.config.ts",
      "*.config.js",
    ],
  },
];

