import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

const CACHE_DIR = path.join(process.cwd(), ".cache", "ingest");

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function keyToPath(namespace: string, key: string) {
  const hash = crypto.createHash("sha1").update(key).digest("hex");
  return path.join(CACHE_DIR, namespace, `${hash}.json`);
}

export async function getCachedJson<T>(namespace: string, key: string): Promise<T | null> {
  try {
    const p = keyToPath(namespace, key);
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCachedJson(namespace: string, key: string, value: unknown) {
  const dir = path.join(CACHE_DIR, namespace);
  await ensureDir(dir);
  const p = keyToPath(namespace, key);
  await fs.writeFile(p, JSON.stringify(value, null, 2), "utf8");
}

