import { and, desc, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Assignment,
  Class,
  ClassEnrollment,
  ClassMaterial,
  InsertAssignment,
  InsertClass,
  InsertClassEnrollment,
  InsertClassMaterial,
  InsertMessage,
  InsertNotification,
  InsertQuiz,
  InsertQuizAttempt,
  InsertQuizQuestion,
  InsertStudentPoint,
  InsertSubmission,
  InsertUser,
  InsertWeeklyPlan,
  InsertZoomMeeting,
  Message,
  Notification,
  Quiz,
  QuizAttempt,
  QuizQuestion,
  StudentPoint,
  Submission,
  User,
  WeeklyPlan,
  ZoomMeeting,
  assignments,
  classEnrollments,
  classMaterials,
  classes,
  messages,
  notifications,
  quizAttempts,
  quizQuestions,
  quizzes,
  studentPoints,
  submissions,
  users,
  weeklyPlans,
  zoomMeetings,
  gameSessions,
  gamePlayers,
  gameAnswers,
  GameSession,
  InsertGameSession,
  GamePlayer,
  InsertGamePlayer,
  GameAnswer,
  InsertGameAnswer,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerEmail) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserRole(userId: number, role: User["role"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function listStudents(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "student"));
}

export async function listTeachers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.role, "teacher"));
}

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function createClass(data: InsertClass) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(classes).values(data).$returningId();
  return result;
}

export async function getClassById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
  return result[0];
}

export async function getClassesByTeacher(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(classes).where(eq(classes.teacherId, teacherId)).orderBy(desc(classes.createdAt));
}

export async function getClassesByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  const enrolled = await db
    .select({ classId: classEnrollments.classId })
    .from(classEnrollments)
    .where(eq(classEnrollments.studentId, studentId));
  if (enrolled.length === 0) return [];
  const classIds = enrolled.map((e) => e.classId);
  return db
    .select()
    .from(classes)
    .where(sql`${classes.id} IN (${sql.join(classIds.map((id) => sql`${id}`), sql`, `)})`)
    .orderBy(desc(classes.createdAt));
}

export async function getClassByInviteCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(classes).where(eq(classes.inviteCode, code)).limit(1);
  return result[0];
}

export async function enrollStudent(data: InsertClassEnrollment) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db
    .select()
    .from(classEnrollments)
    .where(and(eq(classEnrollments.classId, data.classId), eq(classEnrollments.studentId, data.studentId)))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(classEnrollments).values(data);
}

export async function getEnrollmentsByClass(classId: number): Promise<ClassEnrollment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(classEnrollments).where(eq(classEnrollments.classId, classId));
}

export async function getStudentsInClass(classId: number): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  const enrollments = await db
    .select({ studentId: classEnrollments.studentId })
    .from(classEnrollments)
    .where(eq(classEnrollments.classId, classId));
  if (enrollments.length === 0) return [];
  const ids = enrollments.map((e) => e.studentId);
  return db
    .select()
    .from(users)
    .where(sql`${users.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`);
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function createAssignment(data: InsertAssignment) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(assignments).values(data).$returningId();
  return result;
}

export async function getAssignmentById(id: number): Promise<Assignment | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(assignments).where(eq(assignments.id, id)).limit(1);
  return result[0];
}

export async function getAssignmentsByClass(classId: number): Promise<Assignment[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(assignments)
    .where(and(eq(assignments.classId, classId), eq(assignments.published, true)))
    .orderBy(desc(assignments.createdAt));
}

export async function getAssignmentsByTeacher(teacherId: number): Promise<Assignment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assignments).where(eq(assignments.teacherId, teacherId)).orderBy(desc(assignments.createdAt));
}

export async function updateAssignment(id: number, data: Partial<InsertAssignment>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(assignments).set(data).where(eq(assignments.id, id));
}

export async function deleteAssignment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(assignments).where(eq(assignments.id, id));
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export async function createSubmission(data: InsertSubmission) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(submissions).values(data).$returningId();
  return result;
}

export async function getSubmissionById(id: number): Promise<Submission | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
  return result[0];
}

export async function getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId)).orderBy(desc(submissions.submittedAt));
}

export async function getSubmissionByStudentAndAssignment(studentId: number, assignmentId: number): Promise<Submission | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.studentId, studentId), eq(submissions.assignmentId, assignmentId)))
    .limit(1);
  return result[0];
}

export async function getSubmissionsByStudent(studentId: number): Promise<Submission[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(submissions).where(eq(submissions.studentId, studentId)).orderBy(desc(submissions.submittedAt));
}

export async function gradeSubmission(id: number, grade: number, feedback: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(submissions).set({ grade, feedback, status: "graded", gradedAt: new Date() }).where(eq(submissions.id, id));
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(messages).values(data).$returningId();
  return result;
}

export async function getMessagesByUser(userId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(or(eq(messages.senderId, userId), eq(messages.recipientId, userId)))
    .orderBy(desc(messages.createdAt));
}

export async function getThreadMessages(threadId: string): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.threadId, threadId)).orderBy(messages.createdAt);
}

export async function markMessageRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
}

export async function markThreadRead(threadId: string, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(messages)
    .set({ isRead: true })
    .where(and(eq(messages.threadId, threadId), eq(messages.recipientId, userId)));
}

export async function getUnreadMessageCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(and(eq(messages.recipientId, userId), eq(messages.isRead, false)));
  return result[0]?.count ?? 0;
}

// ─── Weekly Plans ─────────────────────────────────────────────────────────────

export async function createWeeklyPlan(data: InsertWeeklyPlan) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(weeklyPlans).values(data).$returningId();
  return result;
}

export async function getWeeklyPlansByClass(classId: number): Promise<WeeklyPlan[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(weeklyPlans)
    .where(and(eq(weeklyPlans.classId, classId), eq(weeklyPlans.published, true)))
    .orderBy(desc(weeklyPlans.weekStart));
}

export async function getWeeklyPlansByTeacher(teacherId: number): Promise<WeeklyPlan[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklyPlans).where(eq(weeklyPlans.teacherId, teacherId)).orderBy(desc(weeklyPlans.weekStart));
}

export async function updateWeeklyPlan(id: number, data: Partial<InsertWeeklyPlan>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(weeklyPlans).set(data).where(eq(weeklyPlans.id, id));
}

// ─── Zoom Meetings ────────────────────────────────────────────────────────────

export async function createZoomMeeting(data: InsertZoomMeeting) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(zoomMeetings).values(data).$returningId();
  return result;
}

export async function getZoomMeetingsByClass(classId: number): Promise<ZoomMeeting[]> {
  const db = await getDb();
  if (!db) return [];
  // Auto-filter: only return meetings scheduled in the future (or within last 30 min)
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  return db.select().from(zoomMeetings)
    .where(and(eq(zoomMeetings.classId, classId), sql`${zoomMeetings.scheduledAt} >= ${cutoff}`))    
    .orderBy(zoomMeetings.scheduledAt);
}

export async function getZoomMeetingsByTeacher(teacherId: number): Promise<ZoomMeeting[]> {
  const db = await getDb();
  if (!db) return [];
  // Auto-filter: only return meetings scheduled in the future (or within last 30 min)
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  return db.select().from(zoomMeetings)
    .where(and(eq(zoomMeetings.teacherId, teacherId), sql`${zoomMeetings.scheduledAt} >= ${cutoff}`))    
    .orderBy(zoomMeetings.scheduledAt);
}

export async function getUpcomingMeetingsForStudent(studentId: number): Promise<ZoomMeeting[]> {
  const db = await getDb();
  if (!db) return [];
  const enrolled = await db
    .select({ classId: classEnrollments.classId })
    .from(classEnrollments)
    .where(eq(classEnrollments.studentId, studentId));
  if (enrolled.length === 0) return [];
  const classIds = enrolled.map((e) => e.classId);
  return db
    .select()
    .from(zoomMeetings)
    .where(
      and(
        sql`${zoomMeetings.classId} IN (${sql.join(classIds.map((id) => sql`${id}`), sql`, `)})`,
        sql`${zoomMeetings.scheduledAt} >= NOW()`
      )
    )
    .orderBy(zoomMeetings.scheduledAt);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotificationsByUser(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count ?? 0;
}

// ─── Quizzes ──────────────────────────────────────────────────────────────────


export async function createQuiz(data: InsertQuiz) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(quizzes).values(data).$returningId();
  return result;
}
export async function getQuizById(id: number): Promise<Quiz | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
  return result[0];
}
export async function getQuizzesByClass(classId: number): Promise<Quiz[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes).where(and(eq(quizzes.classId, classId), eq(quizzes.published, true))).orderBy(desc(quizzes.createdAt));
}
export async function getQuizzesByTeacher(teacherId: number): Promise<Quiz[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizzes).where(eq(quizzes.teacherId, teacherId)).orderBy(desc(quizzes.createdAt));
}
export async function updateQuiz(id: number, data: Partial<InsertQuiz>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(quizzes).set(data).where(eq(quizzes.id, id));
}
export async function deleteQuiz(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, id));
  await db.delete(quizzes).where(eq(quizzes.id, id));
}

// ─── Quiz Questions ───────────────────────────────────────────────────────────
export async function createQuizQuestion(data: InsertQuizQuestion) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(quizQuestions).values(data).$returningId();
  return result;
}
export async function getQuestionsByQuiz(quizId: number): Promise<QuizQuestion[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizQuestions).where(eq(quizQuestions.quizId, quizId)).orderBy(quizQuestions.orderIndex);
}
export async function deleteQuizQuestion(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(quizQuestions).where(eq(quizQuestions.id, id));
}
export async function replaceQuizQuestions(quizId: number, questions: InsertQuizQuestion[]) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(quizQuestions).where(eq(quizQuestions.quizId, quizId));
  if (questions.length > 0) {
    await db.insert(quizQuestions).values(questions);
  }
}

// ─── Quiz Attempts ────────────────────────────────────────────────────────────
export async function createQuizAttempt(data: InsertQuizAttempt) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(quizAttempts).values(data).$returningId();
  return result;
}
export async function getAttemptByStudentAndQuiz(studentId: number, quizId: number): Promise<QuizAttempt | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(quizAttempts).where(and(eq(quizAttempts.studentId, studentId), eq(quizAttempts.quizId, quizId))).limit(1);
  return result[0];
}
export async function getAttemptsByQuiz(quizId: number): Promise<QuizAttempt[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizAttempts).where(eq(quizAttempts.quizId, quizId));
}
export async function updateQuizAttempt(id: number, data: Partial<InsertQuizAttempt>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(quizAttempts).set(data).where(eq(quizAttempts.id, id));
}

// ─── Class Materials ──────────────────────────────────────────────────────────
export async function createClassMaterial(data: InsertClassMaterial) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(classMaterials).values(data).$returningId();
  return result;
}
export async function getMaterialsByClass(classId: number): Promise<ClassMaterial[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(classMaterials).where(eq(classMaterials.classId, classId)).orderBy(desc(classMaterials.createdAt));
}
export async function deleteClassMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(classMaterials).where(eq(classMaterials.id, id));
}

// ─── Student Points ───────────────────────────────────────────────────────────
export async function addStudentPoints(data: InsertStudentPoint) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(studentPoints).values(data);
}
export async function getPointsByClassAndStudent(classId: number, studentId: number): Promise<StudentPoint[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studentPoints).where(and(eq(studentPoints.classId, classId), eq(studentPoints.studentId, studentId))).orderBy(desc(studentPoints.createdAt));
}
export async function getPointsSummaryByClass(classId: number): Promise<{ studentId: number; total: number }[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select({ studentId: studentPoints.studentId, total: sql<number>`SUM(${studentPoints.points})` })
    .from(studentPoints)
    .where(eq(studentPoints.classId, classId))
    .groupBy(studentPoints.studentId);
  return result.map(r => ({ studentId: r.studentId, total: Number(r.total) }));
}

export async function getAttemptsByStudent(studentId: number): Promise<QuizAttempt[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizAttempts).where(eq(quizAttempts.studentId, studentId));
}

export async function getSubClassesByParent(parentId: number): Promise<Class[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(classes).where(eq(classes.parentId, parentId));
}

// ─── Game Sessions ─────────────────────────────────────────────────────────────
export async function createGameSession(data: InsertGameSession): Promise<GameSession> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gameSessions).values(data);
  const result = await db.select().from(gameSessions).where(eq(gameSessions.joinCode, data.joinCode!)).limit(1);
  return result[0]!;
}

export async function getGameSessionByCode(code: string): Promise<GameSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gameSessions).where(eq(gameSessions.joinCode, code)).limit(1);
  return result[0];
}

export async function getGameSessionById(id: number): Promise<GameSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gameSessions).where(eq(gameSessions.id, id)).limit(1);
  return result[0];
}

export async function joinGameSession(data: InsertGamePlayer): Promise<GamePlayer> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gamePlayers).values(data);
  const result = await db.select().from(gamePlayers)
    .where(and(eq(gamePlayers.sessionId, data.sessionId!), eq(gamePlayers.userId, data.userId!)))
    .limit(1);
  return result[0]!;
}

export async function getGamePlayers(sessionId: number): Promise<GamePlayer[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gamePlayers).where(eq(gamePlayers.sessionId, sessionId));
}

export async function getPlayerBySessionAndUser(sessionId: number, userId: number): Promise<GamePlayer | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(gamePlayers)
    .where(and(eq(gamePlayers.sessionId, sessionId), eq(gamePlayers.userId, userId)))
    .limit(1);
  return result[0];
}

export async function submitGameAnswer(data: InsertGameAnswer): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(gameAnswers).values(data);
  // Update player score
  if (data.pointsEarned && data.pointsEarned > 0) {
    await db.update(gamePlayers)
      .set({ score: sql`score + ${data.pointsEarned}` })
      .where(eq(gamePlayers.id, data.playerId!));
  }
}

export async function getGameAnswersForQuestion(sessionId: number, questionIndex: number): Promise<GameAnswer[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gameAnswers)
    .where(and(eq(gameAnswers.sessionId, sessionId), eq(gameAnswers.questionIndex, questionIndex)));
}

export async function advanceGameQuestion(sessionId: number, questionIndex: number, status: "question" | "leaderboard"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(gameSessions)
    .set({
      currentQuestion: questionIndex,
      status,
      questionStartedAt: status === "question" ? new Date() : undefined,
    })
    .where(eq(gameSessions.id, sessionId));
}

export async function finishGameSession(sessionId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(gameSessions)
    .set({ status: "finished" })
    .where(eq(gameSessions.id, sessionId));
  // Save game history
  try {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, sessionId)).limit(1);
    if (!session) return;
    const players = await db.select({ id: gamePlayers.id, userId: gamePlayers.userId, nickname: gamePlayers.nickname, score: gamePlayers.score })
      .from(gamePlayers).where(eq(gamePlayers.sessionId, sessionId));
    const questions = await db.select({ id: quizQuestions.id }).from(quizQuestions).where(eq(quizQuestions.quizId, session.quizId));
    // Get quiz title
    const [quiz] = await db.select({ title: quizzes.title }).from(quizzes).where(eq(quizzes.id, session.quizId)).limit(1);
    // Sort by score desc for ranking
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const results = sorted.map((p, i) => ({ studentId: p.userId, name: p.nickname, score: p.score, rank: i + 1 }));
    const { gameHistory } = await import("../drizzle/schema");
    await db.insert(gameHistory).values({
      sessionId,
      classId: session.classId,
      teacherId: session.teacherId,
      title: quiz?.title ?? "Live Game",
      totalQuestions: questions.length,
      playerCount: players.length,
      results: results as any,
    });
  } catch (e) {
    console.error("Failed to save game history:", e);
  }
}
