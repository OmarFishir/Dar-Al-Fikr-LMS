import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createAssignment,
  createClass,
  createMessage,
  createNotification,
  createSubmission,
  createWeeklyPlan,
  createZoomMeeting,
  deleteAssignment,
  enrollStudent,
  getAssignmentById,
  getAssignmentsByClass,
  getAssignmentsByTeacher,
  getClassByInviteCode,
  getClassById,
  getClassesByStudent,
  getClassesByTeacher,
  getMessagesByUser,
  getNotificationsByUser,
  getStudentsInClass,
  getSubmissionByStudentAndAssignment,
  getSubmissionById,
  getSubmissionsByAssignment,
  getSubmissionsByStudent,
  getThreadMessages,
  getUnreadMessageCount,
  getUnreadNotificationCount,
  getUpcomingMeetingsForStudent,
  getUserById,
  getWeeklyPlansByClass,
  getWeeklyPlansByTeacher,
  getZoomMeetingsByClass,
  getZoomMeetingsByTeacher,
  gradeSubmission,
  listStudents,
  listTeachers,
  markAllNotificationsRead,
  markNotificationRead,
  markThreadRead,
  updateAssignment,
  updateUserRole,
  updateWeeklyPlan,
  createQuiz,
  getQuizById,
  getQuizzesByClass,
  getQuizzesByTeacher,
  updateQuiz,
  deleteQuiz,
  getQuestionsByQuiz,
  replaceQuizQuestions,
  createQuizAttempt,
  getAttemptByStudentAndQuiz,
  getAttemptsByQuiz,
  getAttemptsByStudent,
  getSubClassesByParent,
  createClassMaterial,
  getMaterialsByClass,
  deleteClassMaterial,
  addStudentPoints,
  getPointsSummaryByClass,
  getPointsByClassAndStudent,
  createGameSession,
  getGameSessionByCode,
  getGameSessionById,
  joinGameSession,
  getGamePlayers,
  submitGameAnswer,
  getGameAnswersForQuestion,
  advanceGameQuestion,
  finishGameSession,
  getPlayerBySessionAndUser,
} from "./db";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";

// ─── Helper: require teacher role ─────────────────────────────────────────────
const teacherProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "teacher" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Teachers only" });
  }
  return next({ ctx });
});

// ─── Helper: require student role ─────────────────────────────────────────────
const studentProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "student" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Students only" });
  }
  return next({ ctx });
});

// ─── Notify helper ────────────────────────────────────────────────────────────
async function notifyUsers(
  userIds: number[],
  type: Parameters<typeof createNotification>[0]["type"],
  title: string,
  body: string,
  linkId?: number
) {
  for (const userId of userIds) {
    await createNotification({ userId, type, title, body, linkId });
  }
}

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    setRole: protectedProcedure
      .input(z.object({ role: z.enum(["teacher", "student"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserRole(ctx.user.id, input.role);
        return { success: true };
      }),
  }),

  // ─── Classes ───────────────────────────────────────────────────────────────
  classes: router({
    create: teacherProcedure
      .input(z.object({ name: z.string().min(1), subject: z.string().optional(), description: z.string().optional(), gradeLevel: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const inviteCode = nanoid(8).toUpperCase();
        const result = await createClass({ ...input, teacherId: ctx.user.id, inviteCode });
        return result;
      }),
    createSubClass: teacherProcedure
      .input(z.object({ parentId: z.number(), name: z.string().min(1), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const parent = await getClassById(input.parentId);
        if (!parent || parent.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const inviteCode = nanoid(8).toUpperCase();
        const result = await createClass({
          name: input.name,
          description: input.description,
          teacherId: ctx.user.id,
          inviteCode,
          parentId: input.parentId,
          subject: parent.subject ?? undefined,
          gradeLevel: parent.gradeLevel ?? undefined,
        });
        return result;
      }),
    broadcastAssignment: teacherProcedure
      .input(z.object({
        parentClassId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const parent = await getClassById(input.parentClassId);
        if (!parent || parent.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const subClasses = await getSubClassesByParent(input.parentClassId);
        if (subClasses.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No sub-classes found" });
        const results = await Promise.all(subClasses.map(async (sub) => {
          return createAssignment({
            classId: sub.id,
            teacherId: ctx.user.id,
            title: input.title,
            description: input.description,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          });
        }));
        // Notify students in each sub-class
        for (const sub of subClasses) {
          const students = await getStudentsInClass(sub.id);
          await notifyUsers(students.map(s => s.id), "new_assignment", `New Assignment: ${input.title}`, `A new assignment has been broadcast to ${sub.name}.`);
        }
        return { count: results.length };
      }),

    listSubClasses: protectedProcedure
      .input(z.object({ parentClassId: z.number() }))
      .query(async ({ input }) => {
        return getSubClassesByParent(input.parentClassId);
      }),
    myClasses: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "teacher" || ctx.user.role === "admin") {
        return getClassesByTeacher(ctx.user.id);
      }
      return getClassesByStudent(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getClassById(input.id);
      }),

    join: studentProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const cls = await getClassByInviteCode(input.inviteCode.toUpperCase());
        if (!cls) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite code" });
        await enrollStudent({ classId: cls.id, studentId: ctx.user.id });
        return cls;
      }),

    students: teacherProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ ctx, input }) => {
        const cls = await getClassById(input.classId);
        if (!cls || cls.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return getStudentsInClass(input.classId);
      }),
  }),

  // ─── Assignments ───────────────────────────────────────────────────────────
  assignments: router({
    create: teacherProcedure
      .input(
        z.object({
          classId: z.number(),
          title: z.string().min(1),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
          fileName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createAssignment({
          ...input,
          teacherId: ctx.user.id,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        });
        // Notify enrolled students
        const students = await getStudentsInClass(input.classId);
        await notifyUsers(
          students.map((s) => s.id),
          "new_assignment",
          `New Assignment: ${input.title}`,
          `A new assignment has been posted in your class.`,
          result?.id
        );
        return result;
      }),

    list: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        return getAssignmentsByClass(input.classId);
      }),

    myAssignments: teacherProcedure.query(async ({ ctx }) => {
      return getAssignmentsByTeacher(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getAssignmentById(input.id);
      }),

    update: teacherProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
          fileName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, dueDate, ...rest } = input;
        const assignment = await getAssignmentById(id);
        if (!assignment || assignment.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateAssignment(id, { ...rest, dueDate: dueDate ? new Date(dueDate) : undefined });
        return { success: true };
      }),

    delete: teacherProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const assignment = await getAssignmentById(input.id);
        if (!assignment || assignment.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteAssignment(input.id);
        return { success: true };
      }),
  }),

  // ─── Submissions ───────────────────────────────────────────────────────────
  submissions: router({
    submit: studentProcedure
      .input(
        z.object({
          assignmentId: z.number(),
          text: z.string().optional(),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
          fileName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getSubmissionByStudentAndAssignment(ctx.user.id, input.assignmentId);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already submitted" });
        const result = await createSubmission({ ...input, studentId: ctx.user.id });
        // Notify teacher
        const assignment = await getAssignmentById(input.assignmentId);
        if (assignment) {
          await notifyUsers(
            [assignment.teacherId],
            "submission_received",
            `New Submission: ${assignment.title}`,
            `A student submitted their work.`,
            result?.id
          );
        }
        return result;
      }),

    mySubmission: studentProcedure
      .input(z.object({ assignmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getSubmissionByStudentAndAssignment(ctx.user.id, input.assignmentId);
      }),

    mySubmissions: studentProcedure.query(async ({ ctx }) => {
      return getSubmissionsByStudent(ctx.user.id);
    }),

    forAssignment: teacherProcedure
      .input(z.object({ assignmentId: z.number() }))
      .query(async ({ ctx, input }) => {
        const assignment = await getAssignmentById(input.assignmentId);
        if (!assignment || assignment.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const subs = await getSubmissionsByAssignment(input.assignmentId);
        // Enrich with student info
        const enriched = await Promise.all(
          subs.map(async (s) => {
            const student = await getUserById(s.studentId);
            return { ...s, studentName: student?.name ?? "Unknown" };
          })
        );
        return enriched;
      }),

    grade: teacherProcedure
      .input(z.object({ submissionId: z.number(), grade: z.number().min(0).max(100), feedback: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const sub = await getSubmissionById(input.submissionId);
        if (!sub) throw new TRPCError({ code: "NOT_FOUND" });
        const assignment = await getAssignmentById(sub.assignmentId);
        if (!assignment || assignment.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await gradeSubmission(input.submissionId, input.grade, input.feedback ?? "");
        await notifyUsers(
          [sub.studentId],
          "grade_update",
          `Grade Posted: ${assignment.title}`,
          `Your submission has been graded: ${input.grade}/100`,
          sub.assignmentId
        );
        return { success: true };
      }),
  }),

  // ─── Messages ──────────────────────────────────────────────────────────────
  messages: router({
    // Start a new conversation or send to existing thread
    startConversation: protectedProcedure
      .input(z.object({
        recipientId: z.number(),
        subject: z.string().optional(),
        message: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if thread already exists between these two users
        const existing = await getMessagesByUser(ctx.user.id);
        const existingThread = existing.find(
          (m) => (m.senderId === input.recipientId || m.recipientId === input.recipientId)
        );
        const threadId = existingThread?.threadId ?? nanoid(16);
        const result = await createMessage({
          threadId,
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          subject: input.subject,
          body: input.message,
        });
        await notifyUsers(
          [input.recipientId],
          "new_message",
          `New Message from ${ctx.user.name ?? "Someone"}`,
          input.message.slice(0, 100),
          result?.id
        );
        return { conversationId: result?.id, threadId };
      }),

    // Send to existing conversation (by message id used as conv id)
    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Find the thread from the first message
        const firstMsg = await getMessagesByUser(ctx.user.id);
        // Find thread where this message id is the first or any message
        const allMsgs = await getMessagesByUser(ctx.user.id);
        // Get thread by finding message with matching id
        const refMsg = allMsgs.find((m) => m.id === input.conversationId) ??
          (await getMessagesByUser(ctx.user.id)).find(() => true);
        // Fallback: get thread from db
        const threadMsg = await getUserById(ctx.user.id); // just to get user
        // We need to find the thread for this conversation id
        // The conversationId in our UI is the first message id of the thread
        const allUserMsgs = await getMessagesByUser(ctx.user.id);
        const convMsg = allUserMsgs.find((m) => m.id === input.conversationId);
        if (!convMsg) throw new TRPCError({ code: "NOT_FOUND", message: "Conversation not found" });
        const otherId = convMsg.senderId === ctx.user.id ? convMsg.recipientId : convMsg.senderId;
        const result = await createMessage({
          threadId: convMsg.threadId,
          senderId: ctx.user.id,
          recipientId: otherId,
          body: input.content,
        });
        await notifyUsers(
          [otherId],
          "new_message",
          `New Message from ${ctx.user.name ?? "Someone"}`,
          input.content.slice(0, 100),
          result?.id
        );
        return { success: true };
      }),

    // List conversations (grouped threads)
    conversations: protectedProcedure.query(async ({ ctx }) => {
      const msgs = await getMessagesByUser(ctx.user.id);
      const threads = new Map<string, {
        id: number;
        threadId: string;
        subject: string | null;
        otherUserId: number;
        otherUserName: string | null;
        lastMessage: string | null;
        lastMessageAt: Date | null;
        unreadCount: number;
      }>();
      for (const msg of msgs) {
        if (!threads.has(msg.threadId)) {
          const otherId = msg.senderId === ctx.user.id ? msg.recipientId : msg.senderId;
          const other = await getUserById(otherId);
          const threadMsgs = msgs.filter((m) => m.threadId === msg.threadId);
          const unread = threadMsgs.filter((m) => m.recipientId === ctx.user.id && !m.isRead).length;
          threads.set(msg.threadId, {
            id: msg.id, // first message id = conversation id
            threadId: msg.threadId,
            subject: msg.subject,
            otherUserId: otherId,
            otherUserName: other?.name ?? null,
            lastMessage: threadMsgs[threadMsgs.length - 1]?.body ?? null,
            lastMessageAt: threadMsgs[threadMsgs.length - 1]?.createdAt ?? null,
            unreadCount: unread,
          });
        }
      }
      return Array.from(threads.values()).sort(
        (a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0)
      );
    }),

    // Get messages in a thread by conversation id (first message id)
    thread: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const allMsgs = await getMessagesByUser(ctx.user.id);
        const convMsg = allMsgs.find((m) => m.id === input.conversationId);
        if (!convMsg) return [];
        await markThreadRead(convMsg.threadId, ctx.user.id);
        const threadMsgs = await getThreadMessages(convMsg.threadId);
        // Enrich with sender name
        const enriched = await Promise.all(threadMsgs.map(async (m) => {
          const sender = await getUserById(m.senderId);
          return { ...m, content: m.body, senderName: sender?.name ?? "Unknown" };
        }));
        return enriched;
      }),

    markRead: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const allMsgs = await getMessagesByUser(ctx.user.id);
        const convMsg = allMsgs.find((m) => m.id === input.conversationId);
        if (convMsg) await markThreadRead(convMsg.threadId, ctx.user.id);
        return { success: true };
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadMessageCount(ctx.user.id);
    }),

    searchUsers: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        if (input.query.length < 2) return [];
        const teachers = await listTeachers();
        const students = await listStudents();
        const all = [...teachers, ...students].filter((u) => u.id !== ctx.user.id);
        return all.filter((u) =>
          u.name?.toLowerCase().includes(input.query.toLowerCase()) ||
          u.email?.toLowerCase().includes(input.query.toLowerCase())
        ).slice(0, 10);
      }),

    // Teacher: send a message to all students in a class
    sendToClass: teacherProcedure
      .input(z.object({
        classId: z.number(),
        subject: z.string().optional(),
        message: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const students = await getStudentsInClass(input.classId);
        if (students.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "No students in this class" });
        const { nanoid } = await import("nanoid");
        const threadId = nanoid(16);
        let sent = 0;
        for (const student of students) {
          const result = await createMessage({
            threadId,
            senderId: ctx.user.id,
            recipientId: student.id,
            subject: input.subject,
            body: input.message,
          });
          await notifyUsers(
            [student.id],
            "new_message",
            `Class Message from ${ctx.user.name ?? "Teacher"}`,
            input.message.slice(0, 100),
            result?.id
          );
          sent++;
        }
        return { sent };
      }),
  }),

  // ─── Weekly Plans ──────────────────────────────────────────────────────────
  weeklyPlans: router({
    create: teacherProcedure
      .input(
        z.object({
          classId: z.number(),
          title: z.string().min(1),
          content: z.string().optional(),
          weekNumber: z.number(),
          weekStart: z.string(),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
          fileName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await createWeeklyPlan({
          ...input,
          teacherId: ctx.user.id,
          weekStart: new Date(input.weekStart),
        });
        const students = await getStudentsInClass(input.classId);
        await notifyUsers(
          students.map((s) => s.id),
          "new_weekly_plan",
          `Weekly Plan: ${input.title}`,
          `A new weekly plan has been published.`,
          result?.id
        );
        return result;
      }),

    list: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        return getWeeklyPlansByClass(input.classId);
      }),

    myPlans: teacherProcedure.query(async ({ ctx }) => {
      return getWeeklyPlansByTeacher(ctx.user.id);
    }),

    update: teacherProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          content: z.string().optional(),
          weekStart: z.string().optional(),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
          fileName: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, weekStart, ...rest } = input;
        await updateWeeklyPlan(id, { ...rest, weekStart: weekStart ? new Date(weekStart) : undefined });
        return { success: true };
      }),
  }),

  // ─── Zoom Meetings ─────────────────────────────────────────────────────────
  zoom: router({
    create: teacherProcedure
      .input(
        z.object({
          classId: z.number(),
          title: z.string().min(1),
          scheduledAt: z.string(),
          duration: z.number().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Auto-generate a unique Jitsi Meet link.
        // Jitsi Meet is 100% free, requires no sign-in, no API key, and works
        // instantly for anyone who clicks the link. Room is created on first join.
        const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const rand = (n: number) =>
          Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
        const roomId = `SchoolHub-${rand(10)}`;
        const meetLink = `https://meet.jit.si/${roomId}`;
        const result = await createZoomMeeting({
          classId: input.classId,
          title: input.title,
          zoomLink: meetLink,
          scheduledAt: new Date(input.scheduledAt),
          duration: input.duration,
          description: input.description,
          teacherId: ctx.user.id,
        });
        const students = await getStudentsInClass(input.classId);
        await notifyUsers(
          students.map((s) => s.id),
          "new_meeting",
          `Meeting Scheduled: ${input.title}`,
          `A Jitsi Meet session has been scheduled. No sign-in required.`,
          result?.id
        );
        return result;
      }),

    list: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        return getZoomMeetingsByClass(input.classId);
      }),

    myMeetings: teacherProcedure.query(async ({ ctx }) => {
      return getZoomMeetingsByTeacher(ctx.user.id);
    }),

    upcoming: studentProcedure.query(async ({ ctx }) => {
      return getUpcomingMeetingsForStudent(ctx.user.id);
    }),

    deletePastMeetings: teacherProcedure.mutation(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { zoomMeetings } = await import("../drizzle/schema");
      const { eq, lt, and } = await import("drizzle-orm");
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = await db.delete(zoomMeetings)
        .where(and(
          eq(zoomMeetings.teacherId, ctx.user.id),
          lt(zoomMeetings.scheduledAt, cutoff)
        ));
      return { deleted: 0 }; // Meetings deleted (Drizzle doesn't return count for MySQL delete)
    }),
  }),

  // ─── Notifications ─────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationsByUser(ctx.user.id);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return getUnreadNotificationCount(ctx.user.id);
    }),

    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationRead(input.id);
        return { success: true };
      }),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── File Upload ───────────────────────────────────────────────────────────
  files: router({
    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileType: z.string(),
          fileBase64: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.fileBase64, "base64");
        const key = `uploads/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.fileType);
        return { url, key, fileName: input.fileName };
      }),
    getSignedUrl: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const { storageGetSignedUrl } = await import("./storage");
        const signedUrl = await storageGetSignedUrl(input.key);
        return { signedUrl };
      }),
  }),

  // ─── AI Assistant ──────────────────────────────────────────────────────────
  ai: router({
    ask: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1),
          context: z.string().optional(),
          mode: z.enum(["student_help", "teacher_draft"]).default("student_help"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const systemPrompt =
          input.mode === "teacher_draft"
            ? `You are an expert educational assistant helping a teacher named ${ctx.user.name ?? "Teacher"} draft clear, engaging assignment descriptions. Provide structured, professional content.`
            : `You are a helpful academic tutor assisting a student named ${ctx.user.name ?? "Student"}. Help them understand assignment instructions and concepts. Give hints and explanations — do not solve the entire assignment for them. Encourage critical thinking.`;

        const messages: { role: "system" | "user"; content: string }[] = [
          { role: "system", content: systemPrompt },
        ];

        if (input.context) {
          messages.push({ role: "user", content: `Context: ${input.context}` });
        }

        messages.push({ role: "user", content: input.message });

        const response = await invokeLLM({ messages });
        return { reply: response.choices[0]?.message?.content ?? "I couldn't generate a response." };
      }),
  }),

  // ─── Quizzes ────────────────────────────────────────────────────────────────
  quizzes: router({
    create: teacherProcedure
      .input(z.object({
        classId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        timeLimit: z.number().optional(),
        autoGrade: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createQuiz({
          ...input,
          teacherId: ctx.user.id,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        });
        return result;
      }),

    saveQuestions: teacherProcedure
      .input(z.object({
        quizId: z.number(),
        questions: z.array(z.object({
          questionText: z.string().min(1),
          questionType: z.enum(["mcq", "true_false", "short_answer", "long_answer"]),
          options: z.array(z.string()).optional(),
          correctAnswer: z.string().optional(),
          points: z.number().default(1),
          orderIndex: z.number().default(0),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const quiz = await getQuizById(input.quizId);
        if (!quiz || quiz.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await replaceQuizQuestions(input.quizId, input.questions.map(q => ({ ...q, quizId: input.quizId })));
        return { success: true };
      }),

    publish: teacherProcedure
      .input(z.object({ quizId: z.number(), published: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const quiz = await getQuizById(input.quizId);
        if (!quiz || quiz.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await updateQuiz(input.quizId, { published: input.published });
        if (input.published) {
          const students = await getStudentsInClass(quiz.classId);
          await notifyUsers(students.map(s => s.id), "new_assignment", `New Quiz: ${quiz.title}`, "A new quiz has been published.", quiz.id);
        }
        return { success: true };
      }),

    delete: teacherProcedure
      .input(z.object({ quizId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const quiz = await getQuizById(input.quizId);
        if (!quiz || quiz.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await deleteQuiz(input.quizId);
        return { success: true };
      }),

    myQuizzes: teacherProcedure.query(async ({ ctx }) => {
      return getQuizzesByTeacher(ctx.user.id);
    }),

    forClass: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        return getQuizzesByClass(input.classId);
      }),

    getWithQuestions: protectedProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ input }) => {
        const quiz = await getQuizById(input.quizId);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        const questions = await getQuestionsByQuiz(input.quizId);
        return { quiz, questions };
      }),

    submit: studentProcedure
      .input(z.object({
        quizId: z.number(),
        answers: z.record(z.string(), z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await getAttemptByStudentAndQuiz(ctx.user.id, input.quizId);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already submitted" });
        const quiz = await getQuizById(input.quizId);
        if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
        const questions = await getQuestionsByQuiz(input.quizId);
        // Auto-grade MCQ and true/false
        let score = 0;
        let maxScore = 0;
        for (const q of questions) {
          maxScore += q.points;
          if (q.questionType === "mcq" || q.questionType === "true_false") {
            const studentAnswer = input.answers[String(q.id)];
            if (studentAnswer && q.correctAnswer && studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
              score += q.points;
            }
          }
        }
        const status = quiz.autoGrade ? "graded" : "submitted";
        const result = await createQuizAttempt({
          quizId: input.quizId,
          studentId: ctx.user.id,
          answers: input.answers,
          score: quiz.autoGrade ? score : undefined,
          maxScore,
          status,
          submittedAt: new Date(),
          gradedAt: quiz.autoGrade ? new Date() : undefined,
        });
        return { score, maxScore, result };
      }),

    myAttempt: studentProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getAttemptByStudentAndQuiz(ctx.user.id, input.quizId);
      }),
    myAttempts: studentProcedure
      .query(async ({ ctx }) => {
        const attempts = await getAttemptsByStudent(ctx.user.id);
        const enriched = await Promise.all(attempts.map(async (a) => {
          const quiz = await getQuizById(a.quizId);
          return { ...a, quizTitle: quiz?.title ?? null };
        }));
        return enriched;
      }),

    attempts: teacherProcedure
      .input(z.object({ quizId: z.number() }))
      .query(async ({ ctx, input }) => {
        const quiz = await getQuizById(input.quizId);
        if (!quiz || quiz.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const attempts = await getAttemptsByQuiz(input.quizId);
        const enriched = await Promise.all(attempts.map(async (a) => {
          const student = await getUserById(a.studentId);
          return { ...a, studentName: student?.name ?? "Unknown" };
        }));
        return enriched;
      }),

    aiGenerate: teacherProcedure
      .input(z.object({
        subject: z.string().min(1),
        topic: z.string().min(1),
        questionCount: z.number().min(1).max(20).default(5),
        questionTypes: z.array(z.enum(["mcq", "true_false", "short_answer"])).default(["mcq"]),
      }))
      .mutation(async ({ input }) => {
        const typeDesc = input.questionTypes.join(", ");
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert teacher. Generate quiz questions as valid JSON only, no markdown." },
            { role: "user", content: `Generate ${input.questionCount} quiz questions for subject "${input.subject}", topic "${input.topic}". Types: ${typeDesc}. Return JSON array: [{ "questionText": "...", "questionType": "mcq|true_false|short_answer", "options": ["A","B","C","D"] or null, "correctAnswer": "..." or null, "points": 1 }]` },
          ],
          response_format: { type: "json_schema", json_schema: { name: "quiz_questions", strict: true, schema: { type: "object", properties: { questions: { type: "array", items: { type: "object", properties: { questionText: { type: "string" }, questionType: { type: "string" }, options: { anyOf: [{ type: "array", items: { type: "string" } }, { type: "null" }] }, correctAnswer: { anyOf: [{ type: "string" }, { type: "null" }] }, points: { type: "number" } }, required: ["questionText", "questionType", "options", "correctAnswer", "points"], additionalProperties: false } } }, required: ["questions"], additionalProperties: false } } },
        });
        const raw = (response.choices[0]?.message?.content as string) ?? "{}";
        const parsed = JSON.parse(raw);
        return parsed.questions ?? [];
      }),
  }),

  // ─── Class Materials ────────────────────────────────────────────────────────
  materials: router({
    upload: teacherProcedure
      .input(z.object({
        classId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        fileUrl: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileType: z.string().optional(),
        category: z.enum(["book", "slides", "notes", "other"]).default("other"),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await createClassMaterial({ ...input, teacherId: ctx.user.id });
        return result;
      }),

    list: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        return getMaterialsByClass(input.classId);
      }),

    delete: teacherProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteClassMaterial(input.id);
        return { success: true };
      }),
  }),

  // ─── Student Points ─────────────────────────────────────────────────────────
  points: router({
    add: teacherProcedure
      .input(z.object({
        classId: z.number(),
        studentId: z.number(),
        points: z.number(),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await addStudentPoints({ ...input, teacherId: ctx.user.id });
        return { success: true };
      }),

    leaderboard: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        const summary = await getPointsSummaryByClass(input.classId);
        const enriched = await Promise.all(summary.map(async (s) => {
          const student = await getUserById(s.studentId);
          return { studentId: s.studentId, name: student?.name ?? "Unknown", total: s.total };
        }));
        return enriched.sort((a, b) => b.total - a.total);
      }),

    bulkAdd: teacherProcedure
      .input(z.object({
        classId: z.number(),
        studentIds: z.array(z.number()),
        points: z.number(),
        comment: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        for (const studentId of input.studentIds) {
          await addStudentPoints({ classId: input.classId, studentId, points: input.points, comment: input.comment, teacherId: ctx.user.id });
        }
        return { success: true, count: input.studentIds.length };
      }),
    history: teacherProcedure
      .input(z.object({ classId: z.number(), studentId: z.number() }))
      .query(async ({ input }) => {
        return getPointsByClassAndStudent(input.classId, input.studentId);
      }),
  }),


  // ─── Learning Modules (Qubit-style) ──────────────────────────────────────────────────────────────────────────────────
  modules: router({
    // List modules for a class
    list: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) return [];
        const { learningModules } = await import("../drizzle/schema");
        const { eq, asc } = await import("drizzle-orm");
        return db.select().from(learningModules)
          .where(eq(learningModules.classId, input.classId))
          .orderBy(asc(learningModules.createdAt));
      }),

    // Get a single module with all its blocks
    get: protectedProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { learningModules, moduleBlocks } = await import("../drizzle/schema");
        const { eq, asc } = await import("drizzle-orm");
        const [mod] = await db.select().from(learningModules).where(eq(learningModules.id, input.moduleId));
        if (!mod) throw new TRPCError({ code: "NOT_FOUND" });
        const blocks = await db.select().from(moduleBlocks)
          .where(eq(moduleBlocks.moduleId, input.moduleId))
          .orderBy(asc(moduleBlocks.orderIndex));
        return { ...mod, blocks };
      }),

    // Teacher: delete a module
    delete: teacherProcedure
      .input(z.object({ moduleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { learningModules, moduleBlocks } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [mod] = await db.select().from(learningModules).where(eq(learningModules.id, input.moduleId));
        if (!mod || mod.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await db.delete(moduleBlocks).where(eq(moduleBlocks.moduleId, input.moduleId));
        await db.delete(learningModules).where(and(eq(learningModules.id, input.moduleId), eq(learningModules.teacherId, ctx.user.id)));
        return { success: true };
      }),

    // Teacher: publish / unpublish a module
    setPublished: teacherProcedure
      .input(z.object({ moduleId: z.number(), published: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { learningModules } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [mod] = await db.select().from(learningModules).where(eq(learningModules.id, input.moduleId));
        if (!mod || mod.teacherId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await db.update(learningModules).set({ published: input.published }).where(and(eq(learningModules.id, input.moduleId), eq(learningModules.teacherId, ctx.user.id)));
        return { success: true };
      }),

    // Teacher: import a module from a URL (AI scrapes + structures content)
    importFromUrl: teacherProcedure
      .input(z.object({
        url: z.string().url(),
        classId: z.number(),
        subject: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // 1. Fetch the page HTML
        let html = "";
        try {
          const res = await fetch(input.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SchoolHub/1.0)" }, signal: AbortSignal.timeout(15000) });
          html = await res.text();
        } catch (e) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Could not fetch the URL. Make sure it is publicly accessible." });
        }

        // 2. Extract text + video URLs with cheerio
        const { load } = await import("cheerio");
        const $ = load(html);
        // Remove nav, footer, scripts, ads
        $("nav, footer, script, style, header, .nav, .footer, .sidebar, .ad, .advertisement, .cookie").remove();
        const title = $("title").text().trim() || $("h1").first().text().trim() || "Imported Lesson";
        const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000);
        // Extract YouTube / video iframes
        const videoUrls: string[] = [];
        $("iframe[src*='youtube'], iframe[src*='youtu.be'], iframe[src*='vimeo']").each((_, el) => {
          const src = $(el).attr("src") || "";
          if (src) videoUrls.push(src);
        });
        $("a[href*='youtube.com/watch'], a[href*='youtu.be']").each((_, el) => {
          const href = $(el).attr("href") || "";
          if (href && !videoUrls.includes(href)) videoUrls.push(href);
        });

        // 3. Ask AI to structure the content into blocks
        const { invokeLLM } = await import("./_core/llm");
        const isCS = /computer.?science|\bcs\b|python|programming|coding|javascript|html|css/i.test(input.subject ?? "");
        const prompt = `You are an educational content structurer. Given the raw text from a learning webpage, create a structured lesson with clear blocks.

Raw page text (truncated):
${bodyText}

Video URLs found on the page: ${videoUrls.length > 0 ? videoUrls.join(", ") : "none"}

Subject: ${input.subject ?? "general"}
Is Computer Science / Programming: ${isCS}

Return a JSON object with this exact schema:
{
  "title": "string - lesson title",
  "description": "string - 1-2 sentence summary",
  "blocks": [
    { "type": "heading", "content": "string" },
    { "type": "text", "content": "string - markdown formatted text" },
    { "type": "video", "content": "string - video URL", "caption": "string - optional caption" },
    { "type": "code", "content": "string - code example", "language": "python" }
  ]
}

Rules:
- Use "heading" blocks for section titles
- Use "text" blocks for explanations (use markdown: **bold**, *italic*, bullet lists)
- Include "video" blocks for any video URLs found
- ${isCS ? 'Since this is a CS/Python subject, include at least one "code" block with a relevant Python example from the content' : 'Only add code blocks if there is actual code in the source'}
- Keep text blocks concise and educational
- Aim for 5-12 blocks total
- Return ONLY valid JSON, no extra text`;

        let structured: { title: string; description: string; blocks: Array<{ type: string; content: string; language?: string; caption?: string }> };
        try {
          const result = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_schema", json_schema: { name: "lesson_blocks", strict: true, schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, blocks: { type: "array", items: { type: "object", properties: { type: { type: "string" }, content: { type: "string" }, language: { type: "string" }, caption: { type: "string" } }, required: ["type", "content"], additionalProperties: false } } }, required: ["title", "description", "blocks"], additionalProperties: false } } },
          });
          structured = JSON.parse(result.choices[0].message.content as string);
        } catch {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI failed to structure the content. Please try again." });
        }

        // 4. Save to DB
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { learningModules, moduleBlocks } = await import("../drizzle/schema");
        const [mod] = await db.insert(learningModules).values({
          classId: input.classId,
          teacherId: ctx.user.id,
          title: structured.title || title,
          subject: input.subject,
          description: structured.description,
          sourceUrl: input.url,
          published: false,
        }).$returningId();
        const modId = mod.id;
        if (structured.blocks.length > 0) {
          await db.insert(moduleBlocks).values(
            structured.blocks.map((b, i) => ({
              moduleId: modId,
              type: (["text", "video", "code", "heading", "image"].includes(b.type) ? b.type : "text") as "text" | "video" | "code" | "heading" | "image",
              orderIndex: i,
              content: b.content,
              language: b.language ?? (b.type === "code" && isCS ? "python" : null) ?? undefined,
              caption: b.caption ?? undefined,
            }))
          );
        }
        return { id: modId, title: structured.title || title, blockCount: structured.blocks.length };
      }),

    // Teacher: create a module manually (with blocks)
    createManual: teacherProcedure
      .input(z.object({
        classId: z.number(),
        title: z.string().min(1),
        subject: z.string().optional(),
        description: z.string().optional(),
        blocks: z.array(z.object({
          type: z.enum(["text", "video", "code", "heading", "image"]),
          content: z.string(),
          language: z.string().optional(),
          caption: z.string().optional(),
          orderIndex: z.number(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { learningModules, moduleBlocks } = await import("../drizzle/schema");
        const [mod] = await db.insert(learningModules).values({
          classId: input.classId,
          teacherId: ctx.user.id,
          title: input.title,
          subject: input.subject,
          description: input.description,
          published: false,
        }).$returningId();
        const modId = mod.id;
        if (input.blocks.length > 0) {
          await db.insert(moduleBlocks).values(
            input.blocks.map((b) => ({
              moduleId: modId,
              type: b.type,
              orderIndex: b.orderIndex,
              content: b.content,
              language: b.language,
              caption: b.caption,
            }))
          );
        }
        return { id: modId };
      }),
  }),

  // ─── Attendance ──────────────────────────────────────────────────────────────
  attendance: router({
    // Teacher marks attendance for a class on a given date
    mark: teacherProcedure
      .input(z.object({
        classId: z.number(),
        date: z.string(), // YYYY-MM-DD
        records: z.array(z.object({
          studentId: z.number(),
          status: z.enum(["present", "absent", "late", "excused"]),
          note: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { attendance } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Upsert each record
        for (const rec of input.records) {
          // Ensure date is in YYYY-MM-DD format
          const dateStr = typeof input.date === 'string' ? input.date.split('T')[0] : input.date;
          const existing = await db.select().from(attendance)
            .where(and(eq(attendance.classId, input.classId), eq(attendance.studentId, rec.studentId), eq(attendance.date, dateStr)))
            .limit(1);
          if (existing.length > 0) {
            await db.update(attendance).set({ status: rec.status, note: rec.note ?? null })
              .where(eq(attendance.id, existing[0].id));
          } else {
            await db.insert(attendance).values({ classId: input.classId, studentId: rec.studentId, teacherId: ctx.user.id, date: dateStr, status: rec.status, note: rec.note });
          }
        }
        return { success: true };
      }),
    // Teacher gets attendance for a class on a date
    getByClassDate: teacherProcedure
      .input(z.object({ classId: z.number(), date: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { attendance } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Ensure date is in YYYY-MM-DD format
        const dateStr = typeof input.date === 'string' ? input.date.split('T')[0] : input.date;
        return db.select().from(attendance).where(and(eq(attendance.classId, input.classId), eq(attendance.date, dateStr)));
      }),
    // Student gets their own attendance record for a class
    getMyRecord: studentProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { attendance } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        return db.select().from(attendance).where(and(eq(attendance.classId, input.classId), eq(attendance.studentId, ctx.user.id))).orderBy(desc(attendance.date));
      }),
    // Get all dates that have attendance records for a class
    getDates: teacherProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { attendance } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await db.selectDistinct({ date: attendance.date }).from(attendance).where(eq(attendance.classId, input.classId));
        return rows.map(r => r.date);
      }),
    // Get ALL attendance records for a class (for spreadsheet view)
    getAllForClass: teacherProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { attendance } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select().from(attendance).where(eq(attendance.classId, input.classId));
      }),
  }),

  // ─── Python Labs ─────────────────────────────────────────────────────────────
  labs: router({
    create: teacherProcedure
      .input(z.object({
        classId: z.number(),
        title: z.string().min(1),
        instructions: z.string().optional(),
        starterCode: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { pythonLabs } = await import("../drizzle/schema");
        const [lab] = await db.insert(pythonLabs).values({ classId: input.classId, teacherId: ctx.user.id, title: input.title, instructions: input.instructions, starterCode: input.starterCode }).$returningId();
        return { id: lab.id };
      }),
    list: protectedProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { pythonLabs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select().from(pythonLabs).where(eq(pythonLabs.classId, input.classId));
      }),
    get: protectedProcedure
      .input(z.object({ labId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { pythonLabs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [lab] = await db.select().from(pythonLabs).where(eq(pythonLabs.id, input.labId));
        if (!lab) throw new TRPCError({ code: "NOT_FOUND" });
        return lab;
      }),
    submit: studentProcedure
      .input(z.object({ labId: z.number(), code: z.string(), output: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { labSubmissions } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Upsert - update if already submitted
        const existing = await db.select().from(labSubmissions).where(and(eq(labSubmissions.labId, input.labId), eq(labSubmissions.studentId, ctx.user.id))).limit(1);
        if (existing.length > 0) {
          await db.update(labSubmissions).set({ code: input.code, output: input.output, savedAt: new Date() }).where(eq(labSubmissions.id, existing[0].id));
          return { id: existing[0].id };
        } else {
          const [sub] = await db.insert(labSubmissions).values({ labId: input.labId, studentId: ctx.user.id, code: input.code, output: input.output }).$returningId();
          return { id: sub.id };
        }
      }),
    getMySubmission: studentProcedure
      .input(z.object({ labId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { labSubmissions } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const [sub] = await db.select().from(labSubmissions).where(and(eq(labSubmissions.labId, input.labId), eq(labSubmissions.studentId, ctx.user.id))).limit(1);
        return sub ?? null;
      }),
    getSubmissions: teacherProcedure
      .input(z.object({ labId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { labSubmissions, users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        return db.select({ id: labSubmissions.id, studentId: labSubmissions.studentId, studentName: users.name, code: labSubmissions.code, output: labSubmissions.output, savedAt: labSubmissions.savedAt })
          .from(labSubmissions)
          .leftJoin(users, eq(labSubmissions.studentId, users.id))
          .where(eq(labSubmissions.labId, input.labId));
      }),
    delete: teacherProcedure
      .input(z.object({ labId: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { pythonLabs } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.delete(pythonLabs).where(eq(pythonLabs.id, input.labId));
        return { success: true };
      }),
  }),

  // ─── Student Notes ────────────────────────────────────────────────────────────
  notes: router({
    save: studentProcedure
      .input(z.object({ moduleId: z.number(), blockId: z.number(), noteText: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { studentNotes } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const existing = await db.select().from(studentNotes).where(and(eq(studentNotes.moduleId, input.moduleId), eq(studentNotes.blockId, input.blockId), eq(studentNotes.studentId, ctx.user.id))).limit(1);
        if (existing.length > 0) {
          await db.update(studentNotes).set({ noteText: input.noteText }).where(eq(studentNotes.id, existing[0].id));
          return { id: existing[0].id };
        } else {
          const [note] = await db.insert(studentNotes).values({ moduleId: input.moduleId, blockId: input.blockId, studentId: ctx.user.id, noteText: input.noteText }).$returningId();
          return { id: note.id };
        }
      }),
    getForModule: studentProcedure
      .input(z.object({ moduleId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { studentNotes } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        return db.select().from(studentNotes).where(and(eq(studentNotes.moduleId, input.moduleId), eq(studentNotes.studentId, ctx.user.id)));
      }),
  }),

  // ─── Game History ─────────────────────────────────────────────────────────────
  gameHistory: router({
    list: teacherProcedure
      .input(z.object({ classId: z.number() }))
      .query(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { gameHistory } = await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        return db.select().from(gameHistory).where(and(eq(gameHistory.classId, input.classId), eq(gameHistory.teacherId, ctx.user.id))).orderBy(desc(gameHistory.playedAt));
      }),
    get: teacherProcedure
      .input(z.object({ historyId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { gameHistory } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const [h] = await db.select().from(gameHistory).where(eq(gameHistory.id, input.historyId));
        if (!h) throw new TRPCError({ code: "NOT_FOUND" });
        return h;
      }),
  }),

  // ─── AI Tutor ─────────────────────────────────────────────────────────────────
  aiTutor: router({
    chat: protectedProcedure
      .input(z.object({
        classId: z.number(),
        question: z.string().min(1).max(2000),
        history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { classes, classMaterials, moduleBlocks, learningModules } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        // Get class info
        const [cls] = await db.select().from(classes).where(eq(classes.id, input.classId)).limit(1);
        const subject = cls?.subject ?? "General";
        // Get class materials titles for context
        const materials = await db.select({ title: classMaterials.title, description: classMaterials.description }).from(classMaterials).where(eq(classMaterials.classId, input.classId)).limit(10);
        // Get published module content for context
        const modules = await db.select({ title: learningModules.title, description: learningModules.description }).from(learningModules).where(and(eq(learningModules.classId, input.classId), eq(learningModules.published, true))).limit(5);
        const moduleIds = modules.map((_, i) => i); // placeholder
        // Build context string
        const materialContext = materials.length > 0 ? `\nClass materials available: ${materials.map(m => m.title + (m.description ? ` (${m.description})` : "")).join("; ")}` : "";
        const moduleContext = modules.length > 0 ? `\nLearning modules: ${modules.map(m => m.title).join("; ")}` : "";
        const systemPrompt = `You are an expert AI tutor for the subject: ${subject}. You are helping students in a class called "${cls?.name ?? subject}".
${materialContext}${moduleContext}

Your role:
- Explain concepts clearly and at the right level for school students
- Use examples, analogies, and step-by-step explanations
- Encourage curiosity and deeper thinking
- Ask guiding questions to help students think through problems
- NEVER give direct answers, solutions, or complete homework
- NEVER solve math problems, code challenges, essays, or exam questions
- Instead: Guide students with hints, ask them what they've tried, suggest approaches
- For homework: Ask 'What part are you stuck on?' and help them understand the concept
- Keep responses concise but complete (2-4 paragraphs max unless a detailed explanation is needed)
- Use markdown formatting for clarity (bold key terms, bullet lists, code blocks for CS)
- Always end with a guiding question to help them move forward`;
        const { invokeLLM } = await import("./_core/llm");
        const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...(input.history ?? []).map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user", content: input.question },
        ];
        const result = await invokeLLM({ messages });
        const answer = (result.choices[0].message.content as string) ?? "I couldn't generate a response. Please try again.";
        return { answer, subject };
      }),
  }),

  // ─── Teacher Comments ────────────────────────────────────────────────────────
  teacherComments: router({
    create: teacherProcedure
      .input(z.object({
        classId: z.number(),
        studentId: z.number(),
        comment: z.string().min(1),
        isVisibleToStudent: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { teacherComments } = await import("../drizzle/schema");
        const result = await db.insert(teacherComments).values({
          classId: input.classId,
          teacherId: ctx.user.id,
          studentId: input.studentId,
          comment: input.comment,
          isVisibleToStudent: input.isVisibleToStudent,
        });
        return { success: true };
      }),
    getByStudent: teacherProcedure
      .input(z.object({ classId: z.number(), studentId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { teacherComments } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        return db.select().from(teacherComments)
          .where(and(eq(teacherComments.classId, input.classId), eq(teacherComments.studentId, input.studentId)))
          .orderBy((await import("drizzle-orm")).desc(teacherComments.createdAt));
      }),
  }),

  customNotifications: router({
    send: protectedProcedure
      .input(z.object({
        recipientId: z.number().optional(),
        classId: z.number().optional(),
        title: z.string().min(1),
        message: z.string().min(1),
        type: z.enum(["announcement", "reminder", "alert", "custom"]).default("custom"),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { customNotifications, classEnrollments } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        if (input.recipientId) {
          await db.insert(customNotifications).values({
            senderId: ctx.user.id,
            recipientId: input.recipientId,
            title: input.title,
            message: input.message,
            type: input.type,
          });
        } else if (input.classId) {
          const enrollments = await db.select({ studentId: classEnrollments.studentId })
            .from(classEnrollments)
            .where(eq(classEnrollments.classId, input.classId));
          
          for (const e of enrollments) {
            await db.insert(customNotifications).values({
              senderId: ctx.user.id,
              recipientId: e.studentId,
              classId: input.classId,
              title: input.title,
              message: input.message,
              type: input.type,
            });
          }
        }
        return { success: true };
      }),
    getMyNotifications: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { customNotifications, users } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        
        return db.select({
          id: customNotifications.id,
          senderId: customNotifications.senderId,
          senderName: users.name,
          title: customNotifications.title,
          message: customNotifications.message,
          type: customNotifications.type,
          isRead: customNotifications.isRead,
          createdAt: customNotifications.createdAt,
        })
          .from(customNotifications)
          .innerJoin(users, eq(customNotifications.senderId, users.id))
          .where(eq(customNotifications.recipientId, ctx.user.id))
          .orderBy(desc(customNotifications.createdAt));
      }),
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { customNotifications } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        await db.update(customNotifications)
          .set({ isRead: true })
          .where(eq(customNotifications.id, input.notificationId));
        return { success: true };
      }),
    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { customNotifications } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        
        const result = await db.select({ count: (await import("drizzle-orm")).sql`COUNT(*)` })
          .from(customNotifications)
          .where(and(eq(customNotifications.recipientId, ctx.user.id), eq(customNotifications.isRead, false)));
        
        return Number(result[0]?.count ?? 0);
      }),
  }),
});
export type AppRouter = typeof appRouter;
