import type { Express } from "express";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveStoragePath } from "../storage";
import { ENV } from "./env";

// Serves files written by storage.ts. The route is /manus-storage/* (kept the
// same path the Manus build used so DB-stored URLs still resolve).
export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)["0"];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    let filePath: string;
    try {
      filePath = resolveStoragePath(key);
    } catch {
      res.status(400).send("Invalid storage key");
      return;
    }

    // Defense-in-depth: refuse to serve anything outside STORAGE_DIR even if
    // resolveStoragePath's normaliser misses something.
    const root = path.resolve(ENV.storageDir);
    if (!filePath.startsWith(root + path.sep) && filePath !== root) {
      res.status(400).send("Invalid storage key");
      return;
    }

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        res.status(404).send("Not found");
        return;
      }
    } catch {
      res.status(404).send("Not found");
      return;
    }

    res.sendFile(filePath, {
      headers: { "Cache-Control": "private, max-age=3600" },
    });
  });
}
