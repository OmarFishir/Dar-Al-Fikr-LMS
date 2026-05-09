/**
 * Tests for email-based role assignment and Jitsi Meet link generation.
 */
import { describe, expect, it } from "vitest";

// ─── Email-based role assignment logic ───────────────────────────────────────
// Mirror the logic from server/_core/oauth.ts so we can unit-test it in isolation.

const TEACHER_EMAILS = ["j.gazawi@fikr.edu.sa"];

function deriveRole(
  email: string,
  openId: string,
  ownerOpenId: string,
  existingRole?: string
): "admin" | "teacher" | "student" | undefined {
  const normalizedEmail = email.toLowerCase();
  const isOwner = openId === ownerOpenId;

  if (isOwner) {
    // Owner role is handled by upsertUser — return undefined to let it assign "admin"
    return undefined;
  }

  if (TEACHER_EMAILS.includes(normalizedEmail)) {
    return "teacher";
  }

  // Non-teacher, non-owner: assign student only if no existing meaningful role
  if (!existingRole || existingRole === "user") {
    return "student";
  }

  // Existing role is already "teacher" or "student" — preserve it
  return undefined;
}

describe("email-based role assignment", () => {
  const OWNER_OPEN_ID = "owner-open-id-123";

  it("assigns teacher role to Jad's school email", () => {
    const role = deriveRole("j.gazawi@fikr.edu.sa", "some-open-id", OWNER_OPEN_ID);
    expect(role).toBe("teacher");
  });

  it("is case-insensitive for teacher email matching", () => {
    const role = deriveRole("J.GAZAWI@FIKR.EDU.SA", "some-open-id", OWNER_OPEN_ID);
    expect(role).toBe("teacher");
  });

  it("assigns student role to any other email on first login", () => {
    const role = deriveRole("student@gmail.com", "student-open-id", OWNER_OPEN_ID, undefined);
    expect(role).toBe("student");
  });

  it("assigns student role when existing role is the default 'user'", () => {
    const role = deriveRole("student@gmail.com", "student-open-id", OWNER_OPEN_ID, "user");
    expect(role).toBe("student");
  });

  it("preserves existing 'teacher' role for non-teacher-email users", () => {
    // A user who was manually promoted to teacher should keep their role
    const role = deriveRole("other@school.com", "other-id", OWNER_OPEN_ID, "teacher");
    expect(role).toBeUndefined();
  });

  it("preserves existing 'student' role on subsequent logins", () => {
    const role = deriveRole("student@gmail.com", "student-open-id", OWNER_OPEN_ID, "student");
    expect(role).toBeUndefined();
  });

  it("returns undefined for the owner so upsertUser assigns admin", () => {
    const role = deriveRole("owner@example.com", OWNER_OPEN_ID, OWNER_OPEN_ID);
    expect(role).toBeUndefined();
  });

  it("teacher email always gets teacher even if they had a different role", () => {
    // Teacher emails are always enforced regardless of existing role
    const role = deriveRole("j.gazawi@fikr.edu.sa", "jad-open-id", OWNER_OPEN_ID, "student");
    expect(role).toBe("teacher");
  });
});

// ─── Jitsi Meet link generation ──────────────────────────────────────────────
// Mirror the logic from server/routers.ts zoom.create procedure.

function generateMeetLink(): string {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const rand = (n: number) =>
    Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
  const roomId = `SchoolHub-${rand(10)}`;
  return `https://meet.jit.si/${roomId}`;
}

describe("Jitsi Meet link generation", () => {
  it("generates a valid Jitsi Meet URL", () => {
    const link = generateMeetLink();
    expect(link).toMatch(/^https:\/\/meet\.jit\.si\/SchoolHub-[A-Za-z0-9]{10}$/);
  });

  it("generates unique links each time", () => {
    const links = new Set(Array.from({ length: 100 }, () => generateMeetLink()));
    // With 100 generations, we should have very close to 100 unique links
    expect(links.size).toBeGreaterThan(95);
  });

  it("link starts with https://meet.jit.si/", () => {
    const link = generateMeetLink();
    expect(link.startsWith("https://meet.jit.si/")).toBe(true);
  });

  it("room ID starts with SchoolHub- prefix and has 10 alphanumeric chars", () => {
    const link = generateMeetLink();
    const roomId = link.replace("https://meet.jit.si/", "");
    expect(roomId).toMatch(/^SchoolHub-[A-Za-z0-9]{10}$/);
  });
});
