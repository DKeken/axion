export const ROUTES = {
  HOME: "/",
  AUTH: {
    SIGN_IN: "/auth/sign-in",
    SIGN_UP: "/auth/sign-up",
    FORGOT_PASSWORD: "/auth/forgot-password",
  },
  DASHBOARD: {
    PROJECTS: {
      ROOT: "/projects",
      NEW: "/projects/new",
      ID: (id: string) => `/projects/${id}`,
      CODE: (id: string) => `/projects/${id}/code`,
    },
    DEPLOYMENTS: {
      ROOT: "/deployments",
      ID: (id: string) => `/deployments/${id}`,
    },
    INFRASTRUCTURE: {
      ROOT: "/infrastructure",
      SERVERS: {
        NEW: "/infrastructure/servers/new",
      },
      CLUSTERS: {
        NEW: "/infrastructure/clusters/new",
      },
    },
  },
  ADMIN: {
    ROOT: "/admin",
  },
} as const;
