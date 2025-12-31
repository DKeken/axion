import baseConfig from "@axion-stack/eslint-config/base";

export default [
  ...baseConfig,
  {
    ignores: ["dist/**", "node_modules/**", "drizzle/**"],
  },
];

