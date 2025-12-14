# @axion-stack/eslint-config

Shared ESLint configuration for Axion Stack monorepo using ESLint v9 Flat Config.

## Usage

### Full Configuration

```js
import eslintConfig from "@axion-stack/eslint-config";

export default eslintConfig;
```

### Base Only

```js
import base from "@axion-stack/eslint-config/base";

export default base;
```

### TypeScript Only

```js
import typescript from "@axion-stack/eslint-config/typescript";

export default typescript;
```

### Next.js Only

```js
import nextjs from "@axion-stack/eslint-config/nextjs";

export default nextjs;
```

## Installation

This package is part of the monorepo and should be installed as a workspace dependency:

```bash
bun add -D @axion-stack/eslint-config
```

## Features

- ESLint v9 Flat Config
- TypeScript support with `@typescript-eslint`
- React and Next.js support
- Import ordering and validation
- Prettier integration ready
