# @axion/better-auth

Better Auth integration package for Axion Stack with UI components support.

## Installation

This package is already configured in the monorepo. For external usage:

```bash
npm install @axion/better-auth
# or
bun add @axion/better-auth
```

## Usage

### Server-side (NestJS)

```typescript
import { AxionAuthModule } from "@axion/better-auth/nestjs";
import { createBetterAuth } from "@axion/better-auth";
import { db } from "@axion/database";

const auth = createBetterAuth({
  database: db,
  basePath: "/api/auth",
  trustedOrigins: ["http://localhost:3000"],
});

@Module({
  imports: [AxionAuthModule.forRoot({ auth })],
})
export class AppModule {}
```

### Client-side (React/Next.js)

#### 1. Create Auth Client

```typescript
// lib/auth-client.ts
import { createAuthClient } from "@axion/better-auth/ui";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});
```

#### 2. Use UI Components

```tsx
// app/login/page.tsx
"use client";

import { SignInForm } from "@axion/better-auth/ui";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  return (
    <div>
      <h1>Sign In</h1>
      <SignInForm authClient={authClient} />
    </div>
  );
}
```

Or use the full AuthView component:

```tsx
// app/auth/page.tsx
"use client";

import { AuthView } from "@axion/better-auth/ui";
import { authClient } from "@/lib/auth-client";

export default function AuthPage() {
  return <AuthView authClient={authClient} />;
}
```

#### 3. Use Hooks

```tsx
// components/user-menu.tsx
"use client";

import { UserButton } from "@axion/better-auth/ui";
import { useSession, useSignOut } from "better-auth/react";
import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session, isPending } = useSession({ authClient });
  const { signOut } = useSignOut({ authClient });

  if (isPending) return <div>Loading...</div>;
  if (!session?.user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {session.user.email}</p>
      {/* Use built-in UserButton component */}
      <UserButton authClient={authClient} />
      {/* Or custom button */}
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

#### 4. Import CSS Styles

```tsx
// app/layout.tsx
import "better-auth-ui/css";

export default function RootLayout({ children }) {
  return <html>{children}</html>;
}
```

## Available Exports

### Server

- `createBetterAuth` - Create Better Auth instance
- `AxionAuthModule` - NestJS module for Better Auth
- `sessionToMetadata` - Convert session to Axion metadata
- `getUserIdFromSession` - Extract user ID from session

### Client (UI)

- `AuthView` - Complete auth view with routing
- `AuthForm` - Unified auth form component
- `SignInForm` - Sign in form component
- `SignUpForm` - Sign up form component
- `SignOut` - Sign out button component
- `UserButton` - User menu button component
- `UserAvatar` - User avatar component
- `AccountView` - Account settings view
- `OrganizationView` - Organization management view
- `AuthUIProvider` - UI provider component
- `useAuthenticate` - Hook for authentication (from better-auth-ui)
- `useAuthData` - Hook to get auth data (from better-auth-ui)
- `createAuthClient` - Create auth client instance

**Note:** For `useSession`, `useSignIn`, `useSignUp`, `useSignOut` hooks, import directly from `better-auth/react`:

```typescript
import {
  useSession,
  useSignIn,
  useSignUp,
  useSignOut,
} from "better-auth/react";
```

## TypeScript Path Aliases

This package supports TypeScript path aliases. Make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

For Next.js projects, use:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/app/*": ["./app/*"],
      "@/lib/*": ["./lib/*"]
    }
  }
}
```

## Documentation

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Better Auth UI Docs](https://better-auth-ui.com/)
