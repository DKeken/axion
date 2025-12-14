# @axion-stack/configs

Shared configuration packages for Axion Stack monorepo.

## Packages

### @axion-stack/eslint-config

ESLint v9 Flat Config configuration with TypeScript, React, and Next.js support.

**Usage:**

```js
// eslint.config.js
import eslintConfig from "@axion-stack/eslint-config";

export default eslintConfig;
```

### @axion-stack/typescript-config

TypeScript configuration presets for different project types.

**Available presets:**

- `base` - Base TypeScript configuration
- `nextjs` - Next.js specific configuration
- `strict` - Strict TypeScript configuration
- `node` - Node.js specific configuration

**Usage:**

```json
{
  "extends": "@axion-stack/typescript-config/nextjs"
}
```

## Installation

These packages are part of the monorepo and are automatically available to all workspace packages.

To use them in a workspace package:

```bash
bun add -D @axion-stack/eslint-config @axion-stack/typescript-config
```

Or add to `package.json`:

```json
{
  "devDependencies": {
    "@axion-stack/eslint-config": "workspace:*",
    "@axion-stack/typescript-config": "workspace:*"
  }
}
```
