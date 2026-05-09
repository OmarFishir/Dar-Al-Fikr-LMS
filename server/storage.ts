// Local-disk storage for the Railway build.
//
// Manus's storage.ts uploaded to S3 via a Forge presign endpoint. The Railway
// build writes files directly to STORAGE_DIR on the server. The public URL
// stays /manus-storage/{key} so the rest of the app (including stored
// references in the DB) keeps working unchanged.
//
// To persist files across redeploys, attach a Railway volume and mount it at
// the same path you set STORAGE_DIR to.

import { promises as fs } from "node:fs";
import path from "node:path";
import { ENV } from "./_core/env";

function normalizeKey(relKey: string): string {
  // Strip leading slashes and anything that would escape the storage dir.
  const cleaned = relKey.replace(/^\/+/, "").replace(/\\/g, "/");
  if (cleaned.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return cleaned;
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export function resolveStoragePath(key: string): string {
  const normalized = normalizeKey(key);
  return path.resolve(ENV.storageDir, normalized);
}

async function ensureDirFor(filePath: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  const filePath = resolveStoragePath(key);
  await ensureDirFor(filePath);

  const buf =
    typeof data === "string" ? Buffer.from(data, "utf-8") : Buffer.from(data);
  await fs.writeFile(filePath, buf);

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(
  relKey: string,
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  // No real signing — files are served by our own proxy. Return the public
  // URL the same way the Manus build did, so callers don't have to branch.
  return `/manus-storage/${normalizeKey(relKey)}`;
}
