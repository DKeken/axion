#!/usr/bin/env bun
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { dump } from "js-yaml";
import { getAllServiceConfigs } from "./services.config";

interface TraefikRouter {
  rule: string;
  entryPoints: string[];
  service: string;
  middlewares?: string[];
  tls?: { certResolver: string };
}

interface TraefikService {
  loadBalancer: {
    servers: Array<{ url: string }>;
  };
}

interface TraefikMiddleware {
  stripPrefix?: {
    prefixes: string[];
  };
  headers?: {
    customRequestHeaders: Record<string, string>;
  };
}

interface TraefikConfig {
  http: {
    routers: Record<string, TraefikRouter>;
    services: Record<string, TraefikService>;
    middlewares: Record<string, TraefikMiddleware>;
  };
}

function generateTraefikConfig(isDev: boolean): TraefikConfig {
  const config: TraefikConfig = {
    http: { routers: {}, services: {}, middlewares: {} },
  };

  const API_BASE_PATH = "/api/v1";

  // Traefik dashboard
  config.http.routers.traefik = {
    rule: "Host(`traefik.localhost`)",
    entryPoints: ["web"],
    service: "api@internal",
  };

  for (const s of getAllServiceConfigs()) {
    const serviceUrl = isDev
      ? `http://host.docker.internal:${s.port}`
      : `http://${s.dockerServiceName}:${s.port}`;

    config.http.services[s.dockerServiceName] = {
      loadBalancer: { servers: [{ url: serviceUrl }] },
    };

    // Path-based routing with basepath
    if (s.pathPrefix) {
      const pathPrefix = `${API_BASE_PATH}/${s.pathPrefix}`;
      const middlewares: string[] = [];

      // Strip prefix middleware if needed
      if (s.stripPrefix) {
        const stripPrefixMiddleware = `${s.routerName}-stripprefix`;
        config.http.middlewares[stripPrefixMiddleware] = {
          stripPrefix: {
            prefixes: [pathPrefix],
          },
        };
        middlewares.push(stripPrefixMiddleware);
      }

      // Main HTTP router
      const routerConfig: TraefikRouter = {
        rule: `PathPrefix(\`${pathPrefix}\`)`,
        entryPoints: s.entrypoints || ["web"],
        service: s.dockerServiceName,
      };
      if (middlewares.length > 0) {
        routerConfig.middlewares = middlewares;
      }
      config.http.routers[s.routerName] = routerConfig;

      // WebSocket router
      if (s.websocket) {
        const wsMiddleware = `${s.routerName}-ws-headers`;
        config.http.middlewares[wsMiddleware] = {
          headers: { customRequestHeaders: { Upgrade: "websocket" } },
        };

        const wsMiddlewares = [...middlewares, wsMiddleware];
        config.http.routers[`${s.routerName}-ws`] = {
          rule: `PathPrefix(\`${pathPrefix}\`)`,
          entryPoints: ["web"],
          service: s.dockerServiceName,
          middlewares: wsMiddlewares,
        };
      }

      // HTTPS router
      // In dev: without TLS (for testing)
      // In prod: with TLS and certResolver (if https: true)
      const secureRouter: TraefikRouter = {
        rule: `PathPrefix(\`${pathPrefix}\`)`,
        entryPoints: ["websecure"],
        service: s.dockerServiceName,
      };
      if (middlewares.length > 0) {
        secureRouter.middlewares = middlewares;
      }
      // Only add TLS in production if explicitly enabled
      if (!isDev && s.https) {
        secureRouter.tls = { certResolver: "letsencrypt" };
      }
      config.http.routers[`${s.routerName}-secure`] = secureRouter;
    } else {
      // Fallback to Host-based routing for backward compatibility
      config.http.routers[s.routerName] = {
        rule: `Host(\`${s.host}\`)`,
        entryPoints: s.entrypoints || ["web"],
        service: s.dockerServiceName,
      };

      if (s.websocket) {
        const wsMiddleware = `${s.routerName}-ws-headers`;
        config.http.middlewares[wsMiddleware] = {
          headers: { customRequestHeaders: { Upgrade: "websocket" } },
        };
        config.http.routers[`${s.routerName}-ws`] = {
          rule: `Host(\`${s.host}\`)`,
          entryPoints: ["web"],
          service: s.dockerServiceName,
          middlewares: [wsMiddleware],
        };
      }

      if (s.https) {
        config.http.routers[`${s.routerName}-secure`] = {
          rule: `Host(\`${s.host}\`)`,
          entryPoints: ["websecure"],
          service: s.dockerServiceName,
          tls: { certResolver: "letsencrypt" },
        };
      }
    }
  }

  return config;
}

function main() {
  const isDev = !process.argv.includes("--prod");
  const mode = isDev ? "dev" : "prod";
  const config = generateTraefikConfig(isDev);
  const outputPath = join(process.cwd(), "docker/traefik/dynamic/routers.yml");

  const header = `# Auto-generated from docker/services.config.ts
# DO NOT EDIT - run: bun run docker:generate-traefik-config
# Mode: ${mode}

`;

  writeFileSync(
    outputPath,
    header + dump(config, { indent: 2, noRefs: true }),
    "utf-8"
  );

  console.log(`✅ Generated: ${outputPath} (${mode})`);
  console.log(
    `   ${Object.keys(config.http.routers).length} routers, ${Object.keys(config.http.services).length} services`
  );
}

main();
