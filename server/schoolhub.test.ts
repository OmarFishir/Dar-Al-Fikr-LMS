import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock the DB helpers ────────────────────────────────────────────────────
vi.mock("./db", () => ({
  createClass: vi.fn().mockResolvedValue({ id: 1, name: "Math 9", inviteCode: "MATH0001", teacherId: 1, subject: "Mathematics", description: null, createdAt: new Date(), updatedAt: new Date() }),
  getClassesByTeacher: vi.fn().mockResolvedValue([]),
  getClassesByStudent: vi.fn().mockResolvedValue([]),
  getClassById: vi.fn().mockResolvedValue({ id: 1, name: "Math 9", teacherId: 1, inviteCode: "MATH0001", subject: null, description: null, createdAt: new Date(), updatedAt: new Date() }),
  getClassByInviteCode: vi.fn().mockResolvedValue({ id: 1, name: "Math 9", teacherId: 1, inviteCode: "MATH0001", subject: null, description: null, createdAt: new Date(), updatedAt: new Date() }),
  enrollStudent: vi.fn().mockResolvedValue(undefined),
  getStudentsInClass: vi.fn().mockResolvedValue([]),
  createAssignment: vi.fn().mockResolvedValue({ id: 1, title: "HW1", classId: 1, teacherId: 1, description: null, dueDate: null, fileUrl: null, fileKey: null, fileName: null, createdAt: new Date(), updatedAt: new Date() }),
  getAssignmentsByClass: vi.fn().mockResolvedValue([]),
  getAssignmentsByTeacher: vi.fn().mockResolvedValue([]),
  getAssignmentById: vi.fn().mockResolvedValue({ id: 1, title: "HW1", classId: 1, teacherId: 1, description: null, dueDate: null, fileUrl: null, fileKey: null, fileName: null, createdAt: new Date(), updatedAt: new Date() }),
  updateAssignment: vi.fn().mockResolvedValue(undefined),
  deleteAssignment: vi.fn().mockResolvedValue(undefined),
  createSubmission: vi.fn().mockResolvedValue({ id: 1, assignmentId: 1, studentId: 2, text: "My answer", fileUrl: null, fileKey: null, fileName: null, status: "submitted", grade: null, feedback: null, submittedAt: new Date(), updatedAt: new Date() }),
  getSubmissionByStudentAndAssignment: vi.fn().mockResolvedValue(null),
  getSubmissionsByAssignment: vi.fn().mockResolvedValue([]),
  getSubmissionsByStudent: vi.fn().mockResolvedValue([]),
  getSubmissionById: vi.fn().mockResolvedValue({ id: 1, assignmentId: 1, studentId: 2, text: "My answer", status: "submitted", grade: null, feedback: null, submittedAt: new Date(), updatedAt: new Date() }),
  gradeSubmission: vi.fn().mockResolvedValue(undefined),
  createMessage: vi.fn().mockResolvedValue({ id: 1, threadId: "thread-abc", senderId: 1, recipientId: 2, subject: null, body: "Hello!", isRead: false, createdAt: new Date(), updatedAt: new Date() }),
  getMessagesByUser: vi.fn().mockResolvedValue([]),
  getThreadMessages: vi.fn().mockResolvedValue([]),
  getUnreadMessageCount: vi.fn().mockResolvedValue(0),
  markThreadRead: vi.fn().mockResolvedValue(undefined),
  createWeeklyPlan: vi.fn().mockResolvedValue({ id: 1, classId: 1, teacherId: 1, title: "Week 1", content: "Content", weekNumber: 1, weekStart: new Date(), fileUrl: null, fileKey: null, fileName: null, createdAt: new Date(), updatedAt: new Date() }),
  getWeeklyPlansByClass: vi.fn().mockResolvedValue([]),
  getWeeklyPlansByTeacher: vi.fn().mockResolvedValue([]),
  updateWeeklyPlan: vi.fn().mockResolvedValue(undefined),
  createZoomMeeting: vi.fn().mockResolvedValue({ id: 1, classId: 1, teacherId: 1, title: "Live Session", zoomLink: "https://zoom.us/j/123", scheduledAt: new Date(), duration: 60, description: null, createdAt: new Date(), updatedAt: new Date() }),
  getZoomMeetingsByClass: vi.fn().mockResolvedValue([]),
  getZoomMeetingsByTeacher: vi.fn().mockResolvedValue([]),
  getUpcomingMeetingsForStudent: vi.fn().mockResolvedValue([]),
  createNotification: vi.fn().mockResolvedValue(undefined),
  getNotificationsByUser: vi.fn().mockResolvedValue([]),
  getUnreadNotificationCount: vi.fn().mockResolvedValue(0),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue({ id: 2, name: "Student A", email: "student@test.com", role: "student", openId: "student-1", loginMethod: "manus", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  listTeachers: vi.fn().mockResolvedValue([]),
  listStudents: vi.fn().mockResolvedValue([]),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "/manus-storage/test-key", key: "test-key" }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Here is a helpful hint for you." } }],
  }),
}));

// ─── Context factories ──────────────────────────────────────────────────────
function makeTeacherCtx(): TrpcContext {
  return {
    user: { id: 1, openId: "teacher-1", name: "Teacher A", email: "teacher@test.com", loginMethod: "manus", role: "teacher", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeStudentCtx(): TrpcContext {
  return {
    user: { id: 2, openId: "student-1", name: "Student A", email: "student@test.com", loginMethod: "manus", role: "student", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth tests ─────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns the current user", async () => {
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.auth.me();
    expect(result?.role).toBe("teacher");
    expect(result?.name).toBe("Teacher A");
  });

  it("logout clears session cookie and returns success", async () => {
    const ctx = makeTeacherCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalledOnce();
  });

  it("setRole updates the user role", async () => {
    const { updateUserRole } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    await caller.auth.setRole({ role: "student" });
    expect(updateUserRole).toHaveBeenCalledWith(1, "student");
  });
});

// ─── Classes tests ───────────────────────────────────────────────────────────
describe("classes", () => {
  it("teacher can create a class", async () => {
    const { createClass } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.classes.create({ name: "Math 9", subject: "Mathematics" });
    expect(createClass).toHaveBeenCalledOnce();
    expect(result?.name).toBe("Math 9");
  });

  it("student cannot create a class (FORBIDDEN)", async () => {
    const caller = appRouter.createCaller(makeStudentCtx());
    await expect(caller.classes.create({ name: "My Class" })).rejects.toThrow();
  });

  it("student can join a class with valid invite code", async () => {
    const { enrollStudent } = await import("./db");
    const caller = appRouter.createCaller(makeStudentCtx());
    const result = await caller.classes.join({ inviteCode: "MATH0001" });
    expect(enrollStudent).toHaveBeenCalledOnce();
    expect(result.name).toBe("Math 9");
  });

  it("student cannot join with invalid invite code (NOT_FOUND)", async () => {
    const { getClassByInviteCode } = await import("./db");
    vi.mocked(getClassByInviteCode).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeStudentCtx());
    await expect(caller.classes.join({ inviteCode: "INVALID" })).rejects.toThrow("Invalid invite code");
  });
});

// ─── Assignments tests ───────────────────────────────────────────────────────
describe("assignments", () => {
  it("teacher can create an assignment", async () => {
    const { createAssignment } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.assignments.create({ classId: 1, title: "Chapter 1 HW" });
    expect(createAssignment).toHaveBeenCalledOnce();
    expect(result?.title).toBe("HW1");
  });

  it("student cannot create an assignment (FORBIDDEN)", async () => {
    const caller = appRouter.createCaller(makeStudentCtx());
    await expect(caller.assignments.create({ classId: 1, title: "HW" })).rejects.toThrow();
  });

  it("teacher can delete their own assignment", async () => {
    const { deleteAssignment } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.assignments.delete({ id: 1 });
    expect(result.success).toBe(true);
    expect(deleteAssignment).toHaveBeenCalledWith(1);
  });

  it("teacher cannot delete another teacher's assignment (FORBIDDEN)", async () => {
    const { getAssignmentById } = await import("./db");
    vi.mocked(getAssignmentById).mockResolvedValueOnce({
      id: 1, title: "HW1", classId: 1, teacherId: 99, description: null, dueDate: null,
      fileUrl: null, fileKey: null, fileName: null, createdAt: new Date(), updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeTeacherCtx());
    await expect(caller.assignments.delete({ id: 1 })).rejects.toThrow();
  });
});

// ─── Submissions tests ───────────────────────────────────────────────────────
describe("submissions", () => {
  it("student can submit an assignment", async () => {
    const { createSubmission } = await import("./db");
    const caller = appRouter.createCaller(makeStudentCtx());
    const result = await caller.submissions.submit({ assignmentId: 1, text: "My answer" });
    expect(createSubmission).toHaveBeenCalledOnce();
    expect(result?.status).toBe("submitted");
  });

  it("student cannot submit the same assignment twice (CONFLICT)", async () => {
    const { getSubmissionByStudentAndAssignment } = await import("./db");
    vi.mocked(getSubmissionByStudentAndAssignment).mockResolvedValueOnce({
      id: 1, assignmentId: 1, studentId: 2, text: "Already submitted", fileUrl: null,
      fileKey: null, fileName: null, status: "submitted", grade: null, feedback: null,
      submittedAt: new Date(), updatedAt: new Date(),
    });
    const caller = appRouter.createCaller(makeStudentCtx());
    await expect(caller.submissions.submit({ assignmentId: 1, text: "Again" })).rejects.toThrow("Already submitted");
  });

  it("teacher can grade a submission", async () => {
    const { gradeSubmission } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.submissions.grade({ submissionId: 1, grade: 95, feedback: "Excellent!" });
    expect(result.success).toBe(true);
    expect(gradeSubmission).toHaveBeenCalledWith(1, 95, "Excellent!");
  });
});

// ─── Notifications tests ─────────────────────────────────────────────────────
describe("notifications", () => {
  it("user can list their notifications", async () => {
    const { getNotificationsByUser } = await import("./db");
    const caller = appRouter.createCaller(makeStudentCtx());
    const result = await caller.notifications.list();
    expect(getNotificationsByUser).toHaveBeenCalledWith(2);
    expect(Array.isArray(result)).toBe(true);
  });

  it("user can get their unread notification count", async () => {
    const { getUnreadNotificationCount } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const count = await caller.notifications.unreadCount();
    expect(getUnreadNotificationCount).toHaveBeenCalledWith(1);
    expect(typeof count).toBe("number");
  });

  it("user can mark all notifications as read", async () => {
    const { markAllNotificationsRead } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.notifications.markAllRead();
    expect(result.success).toBe(true);
    expect(markAllNotificationsRead).toHaveBeenCalledWith(1);
  });
});

// ─── AI Assistant tests ──────────────────────────────────────────────────────
describe("ai.ask", () => {
  it("returns a helpful reply for student mode", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const caller = appRouter.createCaller(makeStudentCtx());
    const result = await caller.ai.ask({ message: "What is a variable?", mode: "student_help" });
    expect(invokeLLM).toHaveBeenCalledOnce();
    expect(result.reply).toBe("Here is a helpful hint for you.");
  });

  it("returns a draft for teacher mode", async () => {
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.ai.ask({ message: "Write an assignment about fractions", mode: "teacher_draft" });
    expect(result.reply).toBeTruthy();
  });
});

// ─── File Upload tests ───────────────────────────────────────────────────────
describe("files.upload", () => {
  it("uploads a file and returns a storage URL", async () => {
    const { storagePut } = await import("./storage");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.files.upload({
      fileName: "homework.pdf",
      fileType: "application/pdf",
      fileBase64: Buffer.from("fake pdf content").toString("base64"),
    });
    expect(storagePut).toHaveBeenCalledOnce();
    expect(result.url).toContain("/manus-storage/");
    expect(result.fileName).toBe("homework.pdf");
  });
});

// ─── Weekly Plans tests ──────────────────────────────────────────────────────
describe("weeklyPlans", () => {
  it("teacher can create a weekly plan", async () => {
    const { createWeeklyPlan } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.weeklyPlans.create({
      classId: 1,
      title: "Week 1 Plan",
      content: "We will cover algebra basics.",
      weekNumber: 1,
      weekStart: "2026-04-21",
    });
    expect(createWeeklyPlan).toHaveBeenCalledOnce();
    expect(result?.title).toBe("Week 1");
  });

  it("student cannot create a weekly plan (FORBIDDEN)", async () => {
    const caller = appRouter.createCaller(makeStudentCtx());
    await expect(caller.weeklyPlans.create({
      classId: 1, title: "My Plan", content: "Content", weekNumber: 1, weekStart: "2026-04-21",
    })).rejects.toThrow();
  });
});

// ─── Messages tests ─────────────────────────────────────────────────────────
describe("messages", () => {
  beforeEach(async () => {
    const { getMessagesByUser } = await import("./db");
    vi.mocked(getMessagesByUser).mockResolvedValue([]);
  });

  it("user can start a conversation and recipient gets notified", async () => {
    const { createMessage, createNotification } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.messages.startConversation({
      recipientId: 2,
      subject: "Assignment Question",
      message: "Hello student, please check the assignment.",
    });
    expect(createMessage).toHaveBeenCalledOnce();
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 2, type: "new_message" })
    );
    expect(result.threadId).toBeTruthy();
  });

  it("user can get unread message count", async () => {
    const { getUnreadMessageCount } = await import("./db");
    const caller = appRouter.createCaller(makeStudentCtx());
    const count = await caller.messages.unreadCount();
    expect(getUnreadMessageCount).toHaveBeenCalledWith(2);
    expect(typeof count).toBe("number");
  });

  it("user can list conversations", async () => {
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.messages.conversations();
    expect(Array.isArray(result)).toBe(true);
  });

  it("user can search for other users to message", async () => {
    const { listTeachers, listStudents } = await import("./db");
    vi.mocked(listTeachers).mockResolvedValueOnce([]);
    vi.mocked(listStudents).mockResolvedValueOnce([{ id: 3, name: "Another Student", email: "other@test.com", role: "student", openId: "s3", loginMethod: "manus", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }]);
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.messages.searchUsers({ query: "Another" });
    expect(listStudents).toHaveBeenCalledOnce();
    expect(result.length).toBeGreaterThan(0);
  });
});

// ─── Notification trigger tests ───────────────────────────────────────────────
describe("notification triggers", () => {
  it("creating an assignment notifies enrolled students", async () => {
    const { createNotification, getStudentsInClass } = await import("./db");
    vi.mocked(getStudentsInClass).mockResolvedValueOnce([
      { id: 2, classId: 1, studentId: 2, enrolledAt: new Date() } as never,
    ]);
    // Override to return id:2 for student lookup
    vi.mocked(createNotification).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(makeTeacherCtx());
    await caller.assignments.create({ classId: 1, title: "Notification Test HW" });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "new_assignment" })
    );
  });

  it("grading a submission notifies the student", async () => {
    const { createNotification } = await import("./db");
    vi.mocked(createNotification).mockClear();
    const caller = appRouter.createCaller(makeTeacherCtx());
    await caller.submissions.grade({ submissionId: 1, grade: 88, feedback: "Good job!" });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "grade_update", userId: 2 })
    );
  });

  it("publishing a weekly plan notifies enrolled students", async () => {
    const { createNotification, getStudentsInClass } = await import("./db");
    vi.mocked(getStudentsInClass).mockResolvedValueOnce([
      { id: 2, classId: 1, studentId: 2, enrolledAt: new Date() } as never,
    ]);
    vi.mocked(createNotification).mockClear();
    const caller = appRouter.createCaller(makeTeacherCtx());
    await caller.weeklyPlans.create({
      classId: 1,
      title: "Week 2 Plan",
      content: "We will cover geometry.",
      weekNumber: 2,
      weekStart: "2026-04-28",
    });
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "new_weekly_plan" })
    );
  });
});

// ─── Zoom Meetings tests ─────────────────────────────────────────────────────
describe("zoom", () => {
  it("teacher can schedule a meeting", async () => {
    const { createZoomMeeting } = await import("./db");
    const caller = appRouter.createCaller(makeTeacherCtx());
    const result = await caller.zoom.create({
      classId: 1,
      title: "Live Review",
      zoomLink: "https://zoom.us/j/123456",
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(createZoomMeeting).toHaveBeenCalledOnce();
    expect(result?.title).toBe("Live Session");
  });

  it("student cannot schedule a meeting (FORBIDDEN)", async () => {
    const caller = appRouter.createCaller(makeStudentCtx());
    await expect(caller.zoom.create({
      classId: 1,
      title: "My Meeting",
      zoomLink: "https://zoom.us/j/999",
      scheduledAt: new Date().toISOString(),
    })).rejects.toThrow();
  });
});
