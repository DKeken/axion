#!/usr/bin/env bun
/**
 * Development startup script
 * Usage: bun dev
 */

import { spawn, execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORTS = [3000, 3001, 3002, 3003, 3004];

async function killProcessesOnPorts() {
  console.log("🔄 Killing processes on ports:", PORTS.join(", "));
  
  for (const port of PORTS) {
    try {
      // Find process on port
      const result = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();
      if (result) {
        const pids = result.split("\n").filter(Boolean);
        for (const pid of pids) {
          console.log(`  Killing process ${pid} on port ${port}`);
          execSync(`kill -9 ${pid}`);
        }
      }
    } catch (error) {
      // No process found on this port, which is fine
    }
  }
}

async function setupInfrastructure() {
  console.log("🔧 Setting up infrastructure...");

  return new Promise<void>((resolve, reject) => {
    const proc = spawn("bun", ["run", "docker:infra"], {
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Infrastructure setup failed with code ${code}`));
      }
    });
  });
}

async function startServices() {
  console.log("🚀 Starting application services...");

  // Start turbo dev
  const proc = spawn("turbo", ["run", "dev"], {
    stdio: "inherit",
    shell: true,
  });

  proc.on("close", (code) => {
    process.exit(code || 0);
  });

  // Handle cleanup
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    proc.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    proc.kill("SIGTERM");
  });
}

async function main() {
  try {
    await killProcessesOnPorts();
    await setupInfrastructure(); // Генерирует конфиги Traefik автоматически
    await startServices();
  } catch (error) {
    console.error("❌ Failed to start:", error);
    process.exit(1);
  }
}

main();
