// Lightweight email-based auth for the Railway build.
//
// The Manus build delegated login to an external OAuth provider. Here we use
// a stateless flow: the client posts an email + name; we upsert a user row
// and hand back the same JWT-cookie the rest of the app already understands.
//
// This is a low-friction sign-in for testing and small deployments. It does
// NOT verify email ownership — anyone who knows an email can sign in as that
// user. Swap this file for a proper provider if you need stronger auth.

import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function classifyEmail(email: string) {
  const lower = email.toLowerCase();
  const isOwner = ENV.ownerEmail !== "" && lower === ENV.ownerEmail;
  const isTeacher = ENV.teacherEmails.includes(lower);
  return { isOwner, isTeacher };
}

export function registerOAuthRoutes(app: Express) {
  // POST /api/auth/login { email, name }
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, name } = req.body ?? {};

    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: "Valid email required" });
      return;
    }
    if (typeof name !== "string" || name.trim().length === 0) {
      res.status(400).json({ error: "Name required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const displayName = name.trim();
    const openId = normalizedEmail; // email doubles as the stable user id

    const { isOwner, isTeacher } = classifyEmail(normalizedEmail);

    let roleToSet: "teacher" | "student" | "admin" | undefined;
    if (isOwner) {
      roleToSet = "admin";
    } else if (isTeacher) {
      roleToSet = "teacher";
    } else {
      const existing = await db.getUserByOpenId(openId);
      if (!existing || existing.role === "user") {
        roleToSet = "student";
      }
    }

    try {
      await db.upsertUser({
        openId,
        name: displayName,
        email: normalizedEmail,
        loginMethod: "email",
        lastSignedIn: new Date(),
        ...(roleToSet ? { role: roleToSet } : {}),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: displayName,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      const user = await db.getUserByOpenId(openId);
      res.json({ ok: true, user });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // POST /api/auth/logout — clears the session cookie. (Convenience for
  // pure-fetch clients; the tRPC auth.logout procedure already exists.)
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, cookieOptions);
    res.json({ ok: true });
  });
}
