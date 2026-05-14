/**
 * WHY : macOS often inherits MallocStackLogging* (Xcode/Instruments/shell profile).
 * Next + Turbopack spawn many short-lived node children; each can spam stderr with
 * "MallocStackLogging: can't turn off malloc stack logging because it was not enabled."
 * Clearing Malloc* keys before exec keeps logs readable and avoids allocator quirks.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

const require = createRequire(import.meta.url);

let nextCli;
try {
  nextCli = require.resolve("next/dist/bin/next");
} catch {
  console.error("next not found. Run: npm install");
  process.exit(1);
}

function envWithoutMallocKeys(env) {
  const out = { ...env };
  for (const key of Object.keys(out)) {
    if (key.startsWith("Malloc")) delete out[key];
  }
  return out;
}

const nextArgs = process.argv.slice(2);
if (nextArgs.length === 0) {
  console.error("Usage: node scripts/next-with-clean-env.mjs <next-args…>");
  console.error('Example: node scripts/next-with-clean-env.mjs dev --turbopack');
  process.exit(1);
}

const child = spawn(process.execPath, [nextCli, ...nextArgs], {
  stdio: "inherit",
  env: envWithoutMallocKeys(process.env),
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
