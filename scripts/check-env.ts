#!/usr/bin/env bun
/**
 * Environment configuration checker
 * Validates that all services have required .env files
 * Usage: bun run scripts/check-env.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

interface ServiceConfig {
  name: string;
  path: string;
  requiredEnvVars: string[];
  optionalEnvVars?: string[];
}

const SERVICES: ServiceConfig[] = [
  {
    name: "graph-service",
    path: join(ROOT, "apps/graph-service"),
    requiredEnvVars: ["DATABASE_URL", "KAFKA_BROKERS"],
    optionalEnvVars: ["PORT", "NODE_ENV", "TRUSTED_ORIGINS"],
  },
  {
    name: "codegen-service",
    path: join(ROOT, "apps/codegen-service"),
    requiredEnvVars: ["DATABASE_URL", "KAFKA_BROKERS"],
    optionalEnvVars: ["PORT", "NODE_ENV", "OPENROUTER_API_KEY"],
  },
  {
    name: "infrastructure-service",
    path: join(ROOT, "apps/infrastructure-service"),
    requiredEnvVars: ["DATABASE_URL", "REDIS_URL", "KAFKA_BROKERS"],
    optionalEnvVars: ["PORT", "NODE_ENV"],
  },
  {
    name: "deployment-service",
    path: join(ROOT, "apps/deployment-service"),
    requiredEnvVars: ["DATABASE_URL", "REDIS_URL", "KAFKA_BROKERS"],
    optionalEnvVars: ["PORT", "NODE_ENV"],
  },
];

function checkEnvFile(service: ServiceConfig): {
  exists: boolean;
  missing: string[];
  present: string[];
  warnings: string[];
} {
  const envPath = join(service.path, ".env");
  const examplePath = join(ROOT, "templates/env/.env.example");

  const result = {
    exists: existsSync(envPath),
    missing: [] as string[],
    present: [] as string[],
    warnings: [] as string[],
  };

  if (!result.exists) {
    result.missing = service.requiredEnvVars;
    result.warnings.push(
      `.env file not found. Copy templates/env/.env.example to ${service.path}/.env`
    );
    return result;
  }

  // Read .env file
  const envContent = readFileSync(envPath, "utf-8");
  const envLines = envContent.split("\n");

  // Parse env variables (simple parser, doesn't handle quotes/comments perfectly)
  const envVars = new Set<string>();
  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
      if (match) {
        envVars.add(match[1]);
      }
    }
  }

  // Check required variables
  for (const varName of service.requiredEnvVars) {
    if (envVars.has(varName)) {
      result.present.push(varName);
    } else {
      result.missing.push(varName);
    }
  }

  // Warn about empty values
  for (const varName of service.requiredEnvVars) {
    const line = envLines.find((l) => l.startsWith(`${varName}=`));
    if (line && line.match(new RegExp(`^${varName}=\\s*$`))) {
      result.warnings.push(
        `${varName} is defined but empty (required: ${service.requiredEnvVars.includes(varName) ? "yes" : "no"})`
      );
    }
  }

  return result;
}

function main() {
  console.log("🔍 Checking environment configuration...\n");

  let hasErrors = false;
  let hasWarnings = false;

  for (const service of SERVICES) {
    console.log(`📦 ${service.name}`);
    const check = checkEnvFile(service);

    if (!check.exists) {
      console.log(`  ❌ .env file not found`);
      console.log(
        `  💡 Copy templates/env/.env.example to ${service.path}/.env\n`
      );
      hasErrors = true;
      continue;
    }

    if (check.missing.length > 0) {
      console.log(
        `  ❌ Missing required variables: ${check.missing.join(", ")}`
      );
      hasErrors = true;
    } else {
      console.log(`  ✅ All required variables present`);
    }

    if (check.present.length > 0) {
      console.log(`  ✅ Found: ${check.present.join(", ")}`);
    }

    if (check.warnings.length > 0) {
      console.log(`  ⚠️  Warnings:`);
      for (const warning of check.warnings) {
        console.log(`     - ${warning}`);
      }
      hasWarnings = true;
    }

    console.log();
  }

  // Summary
  if (hasErrors) {
    console.log("❌ Environment configuration check failed");
    console.log("\n💡 To fix:");
    console.log("1. Copy templates/env/.env.example to each service directory");
    console.log("2. Fill in the required values");
    console.log("3. Run this check again\n");
    process.exit(1);
  } else if (hasWarnings) {
    console.log("⚠️  Environment configuration has warnings (see above)");
    process.exit(0);
  } else {
    console.log("✅ All environment configurations are valid");
    process.exit(0);
  }
}

main();
