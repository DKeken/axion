#!/usr/bin/env node
/**
 * Wrapper script for ts-proto plugin
 * This script is used by protoc to generate TypeScript types from .proto files
 *
 * Protoc plugins receive data via stdin and output via stdout.
 * This wrapper finds and executes the actual ts-proto plugin.
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Try to find ts-proto binary in node_modules
const possiblePaths = [
  join(rootDir, "node_modules", ".bin", "protoc-gen-ts_proto"),
  join(
    rootDir,
    "node_modules",
    "ts-proto",
    "build",
    "bin",
    "protoc-gen-ts_proto.js"
  ),
];

let tsProtoPath = possiblePaths.find((path) => existsSync(path));

if (tsProtoPath) {
  // Use the found binary directly
  const child = spawn(process.execPath || "node", [tsProtoPath], {
    stdio: "inherit", // Forward stdin/stdout/stderr
    cwd: rootDir,
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });
} else {
  // If not found, use bunx to run ts-proto
  // Note: bunx might not work perfectly with protoc's stdin/stdout, but we try
  const child = spawn("bunx", ["--bun", "ts-proto"], {
    stdio: "inherit",
    cwd: rootDir,
  });

  child.on("exit", (code) => {
    process.exit(code || 0);
  });
}
