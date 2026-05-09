// Environment configuration for the Railway-hosted SchoolHub.
//
// The Manus build of this project pulled OAuth + Forge keys from env. The
// Railway build replaces those with self-contained equivalents:
//   - Auth: a JWT signed with JWT_SECRET, no external OAuth provider.
//   - Storage: local disk under STORAGE_DIR (default ./uploads).
//   - LLM: any OpenAI-compatible endpoint via OPENAI_API_KEY.

const ownerEmailRaw =
  process.env.OWNER_EMAIL ?? process.env.OWNER_OPEN_ID ?? "";

export const ENV = {
  // Signs the session JWT cookie. Required.
  cookieSecret: process.env.JWT_SECRET ?? "",

  // MySQL connection string. Required.
  databaseUrl: process.env.DATABASE_URL ?? "",

  // Email of the user promoted to admin on first login (case-insensitive).
  ownerEmail: ownerEmailRaw.toLowerCase(),

  // Comma-separated emails that are always assigned the teacher role on login.
  teacherEmails: (process.env.TEACHER_EMAILS ?? "j.gazawi@fikr.edu.sa")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),

  isProduction: process.env.NODE_ENV === "production",

  // OpenAI-compatible LLM. Optional — AI features fail with a clear error if unset.
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiApiBase: (process.env.OPENAI_API_BASE ?? "https://api.openai.com/v1").replace(
    /\/+$/,
    ""
  ),
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",

  // Local-disk storage. Mount a Railway volume here for persistence across redeploys.
  storageDir: process.env.STORAGE_DIR ?? "./uploads",

  // Manus-only features (image generation, voice transcription, push
  // notifications, the Manus data API, Google Maps proxy). These remain
  // unconfigured on the Railway build — callers see "not configured" errors,
  // which is the expected graceful failure for features we don't proxy.
  forgeApiUrl: "",
  forgeApiKey: "",
};

export function assertEnv() {
  const missing: string[] = [];
  if (!ENV.cookieSecret) missing.push("JWT_SECRET");
  if (!ENV.databaseUrl) missing.push("DATABASE_URL");
  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars: ${missing.join(", ")}. See README for setup.`
    );
  }
}
