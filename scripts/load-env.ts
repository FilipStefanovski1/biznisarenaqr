import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Minimal .env loader for scripts (does not override variables already set). */
export function loadEnv(files = [".env.local", ".env"]) {
  for (const file of files) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || line.trim().startsWith("#")) continue;
      const [, key, raw] = match;
      const value = raw!.replace(/^(['"])(.*)\1$/, "$2");
      if (process.env[key!] === undefined) process.env[key!] = value;
    }
  }
}
