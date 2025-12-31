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

const PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007];

async function killProcessesOnPorts() {
  console.log("🔄 Killing processes on ports:", PORTS.join(", "));

  // Kill all processes on specified ports
  for (const port of PORTS) {
    try {
      // Find process on port
      const result = execSync(`lsof -ti:${port}`, { encoding: "utf8" }).trim();
      if (result) {
        const pids = result.split("\n").filter(Boolean);
        for (const pid of pids) {
          console.log(`  Killing process ${pid} on port ${port}`);
          try {
            execSync(`kill -9 ${pid}`, { stdio: "ignore" });
          } catch {
            // Process might already be dead
          }
        }
      }
    } catch (error) {
      // No process found on this port, which is fine
    }
  }

  // Wait a bit for processes to actually die
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Kill any remaining dev processes
  try {
    console.log("🧹 Cleaning up any remaining dev processes...");
    execSync('pkill -9 -f "turbo.*dev" 2>/dev/null || true', {
      stdio: "ignore",
    });
    execSync('pkill -9 -f "next.*dev" 2>/dev/null || true', {
      stdio: "ignore",
    });
    execSync('pkill -9 -f "bun.*--watch" 2>/dev/null || true', {
      stdio: "ignore",
    });
  } catch {
    // Ignore errors - processes might not exist
  }

  // Final wait
  await new Promise((resolve) => setTimeout(resolve, 300));
  console.log("✅ All ports cleared");
}

async function ensureDockerRunning() {
  console.log("🐳 Checking Docker...");

  try {
    execSync("docker ps", { stdio: "ignore" });
    console.log("✅ Docker is running");
    return;
  } catch {
    console.log("⚠️  Docker is not running, attempting to start...");
  }

  // Try to start OrbStack or Docker Desktop
  try {
    const hasOrbStack =
      execSync("test -d /Applications/OrbStack.app && echo 1 || echo 0", {
        encoding: "utf8",
      }).trim() === "1";
    const hasDocker =
      execSync("test -d /Applications/Docker.app && echo 1 || echo 0", {
        encoding: "utf8",
      }).trim() === "1";

    if (hasOrbStack) {
      console.log("🚀 Starting OrbStack...");
      execSync("open -a OrbStack");
    } else if (hasDocker) {
      console.log("🚀 Starting Docker Desktop...");
      execSync("open -a Docker");
    } else {
      throw new Error("Neither OrbStack nor Docker Desktop is installed");
    }

    // Wait for Docker to be ready
    console.log("⏳ Waiting for Docker daemon...");
    for (let i = 0; i < 60; i++) {
      try {
        execSync("docker ps", { stdio: "ignore" });
        console.log("✅ Docker is ready");
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error("Docker failed to start within 60 seconds");
  } catch (error) {
    throw new Error(`Failed to start Docker: ${error}`);
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
    await ensureDockerRunning();
    await setupInfrastructure(); // Генерирует конфиги Traefik автоматически
    await startServices();
  } catch (error) {
    console.error("❌ Failed to start:", error);
    process.exit(1);
  }
}

main();
