import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
  float,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "teacher", "student"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Classes ──────────────────────────────────────────────────────────────────
// A class can have a parent (e.g., "Grade 9" parent → "9A", "9B", "9C" children)
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  description: text("description"),
  teacherId: int("teacherId").notNull(),
  inviteCode: varchar("inviteCode", { length: 16 }).notNull().unique(),
  // parentId links a sub-class (9A) to its grade group (Grade 9)
  parentId: int("parentId"),
  gradeLevel: varchar("gradeLevel", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

// ─── Class Enrollments ────────────────────────────────────────────────────────
export const classEnrollments = mysqlTable("classEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
});

export type ClassEnrollment = typeof classEnrollments.$inferSelect;
export type InsertClassEnrollment = typeof classEnrollments.$inferInsert;

// ─── Assignments ──────────────────────────────────────────────────────────────
export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  fileName: varchar("fileName", { length: 255 }),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

// ─── Submissions ──────────────────────────────────────────────────────────────
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  studentId: int("studentId").notNull(),
  text: text("text"),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  fileName: varchar("fileName", { length: 255 }),
  status: mysqlEnum("status", ["submitted", "graded", "late"]).default("submitted").notNull(),
  grade: float("grade"),
  feedback: text("feedback"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  gradedAt: timestamp("gradedAt"),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  threadId: varchar("threadId", { length: 64 }).notNull(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  subject: varchar("subject", { length: 255 }),
  body: text("body").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Weekly Plans ─────────────────────────────────────────────────────────────
export const weeklyPlans = mysqlTable("weeklyPlans", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  weekNumber: int("weekNumber").notNull(),
  weekStart: timestamp("weekStart").notNull(),
  fileUrl: text("fileUrl"),
  fileKey: varchar("fileKey", { length: 512 }),
  fileName: varchar("fileName", { length: 255 }),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WeeklyPlan = typeof weeklyPlans.$inferSelect;
export type InsertWeeklyPlan = typeof weeklyPlans.$inferInsert;

// ─── Zoom Meetings ────────────────────────────────────────────────────────────
export const zoomMeetings = mysqlTable("zoomMeetings", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  zoomLink: text("zoomLink").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  duration: int("duration").default(60),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ZoomMeeting = typeof zoomMeetings.$inferSelect;
export type InsertZoomMeeting = typeof zoomMeetings.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "new_assignment",
    "new_message",
    "grade_update",
    "new_weekly_plan",
    "submission_received",
    "new_meeting",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  linkId: int("linkId"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─── Custom Notifications ─────────────────────────────────────────────────────
export const customNotifications = mysqlTable("customNotifications", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId"),
  classId: int("classId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["announcement", "reminder", "alert", "custom"]).default("custom").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomNotification = typeof customNotifications.$inferSelect;
export type InsertCustomNotification = typeof customNotifications.$inferInsert;

// ─── Quizzes ──────────────────────────────────────────────────────────────────
export const quizzes = mysqlTable("quizzes", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  timeLimit: int("timeLimit"), // in minutes, null = no limit
  published: boolean("published").default(false).notNull(),
  autoGrade: boolean("autoGrade").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = typeof quizzes.$inferInsert;

// ─── Quiz Questions ───────────────────────────────────────────────────────────
// options stored as JSON array of strings for MCQ; null for text answers
export const quizQuestions = mysqlTable("quizQuestions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  questionText: text("questionText").notNull(),
  questionType: mysqlEnum("questionType", ["mcq", "true_false", "short_answer", "long_answer"]).notNull(),
  options: json("options"), // string[] for mcq/true_false
  correctAnswer: text("correctAnswer"), // for mcq/true_false auto-grading
  points: float("points").default(1).notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = typeof quizQuestions.$inferInsert;

// ─── Quiz Attempts ────────────────────────────────────────────────────────────
export const quizAttempts = mysqlTable("quizAttempts", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  studentId: int("studentId").notNull(),
  answers: json("answers").notNull(), // { questionId: answer } map
  score: float("score"), // null until graded
  maxScore: float("maxScore"),
  status: mysqlEnum("status", ["in_progress", "submitted", "graded"]).default("submitted").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  submittedAt: timestamp("submittedAt"),
  gradedAt: timestamp("gradedAt"),
});

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = typeof quizAttempts.$inferInsert;

// ─── Class Materials ──────────────────────────────────────────────────────────
// Teacher uploads books, PDFs, slides for a class or grade
export const classMaterials = mysqlTable("classMaterials", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 64 }), // pdf, pptx, docx, etc.
  category: mysqlEnum("category", ["book", "slides", "notes", "other"]).default("other").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassMaterial = typeof classMaterials.$inferSelect;
export type InsertClassMaterial = typeof classMaterials.$inferInsert;

// ─── Student Points (ClassDojo-style) ─────────────────────────────────────────
export const studentPoints = mysqlTable("studentPoints", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  teacherId: int("teacherId").notNull(),
  points: int("points").notNull(), // positive or negative
  comment: varchar("comment", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudentPoint = typeof studentPoints.$inferSelect;
export type InsertStudentPoint = typeof studentPoints.$inferInsert;

// ─── Live Game Sessions (Kahoot-style) ────────────────────────────────────────
export const gameSessions = mysqlTable("gameSessions", {
  id: int("id").autoincrement().primaryKey(),
  quizId: int("quizId").notNull(),
  teacherId: int("teacherId").notNull(),
  classId: int("classId").notNull(),
  joinCode: varchar("joinCode", { length: 8 }).notNull().unique(),
  status: mysqlEnum("status", ["waiting", "active", "question", "leaderboard", "finished"]).default("waiting").notNull(),
  currentQuestion: int("currentQuestion").default(0).notNull(), // 0-indexed
  questionStartedAt: timestamp("questionStartedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = typeof gameSessions.$inferInsert;

export const gamePlayers = mysqlTable("gamePlayers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  nickname: varchar("nickname", { length: 64 }).notNull(),
  score: int("score").default(0).notNull(),
  streak: int("streak").default(0).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});
export type GamePlayer = typeof gamePlayers.$inferSelect;
export type InsertGamePlayer = typeof gamePlayers.$inferInsert;

export const gameAnswers = mysqlTable("gameAnswers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  playerId: int("playerId").notNull(),
  questionIndex: int("questionIndex").notNull(),
  answer: varchar("answer", { length: 512 }).notNull(),
  isCorrect: boolean("isCorrect").default(false).notNull(),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
});
export type GameAnswer = typeof gameAnswers.$inferSelect;
export type InsertGameAnswer = typeof gameAnswers.$inferInsert;

// ─── Learning Modules (Qubit-style) ──────────────────────────────────────────────────────────────────────────────────
// A module is a structured lesson (imported from a URL or built manually)
export const learningModules = mysqlTable("learningModules", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 128 }),
  description: text("description"),
  sourceUrl: text("sourceUrl"),          // original URL if imported
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LearningModule = typeof learningModules.$inferSelect;
export type InsertLearningModule = typeof learningModules.$inferInsert;

// Each block is a unit of content inside a module
export const moduleBlocks = mysqlTable("moduleBlocks", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  type: mysqlEnum("type", ["text", "video", "code", "heading", "image"]).notNull(),
  orderIndex: int("orderIndex").default(0).notNull(),
  content: text("content").notNull(),    // markdown text / video URL / code snippet / heading text / image URL
  language: varchar("language", { length: 32 }),  // for code blocks: "python", "javascript", etc.
  caption: varchar("caption", { length: 255 }),   // optional caption for video/image
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ModuleBlock = typeof moduleBlocks.$inferSelect;
export type InsertModuleBlock = typeof moduleBlocks.$inferInsert;

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  teacherId: int("teacherId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  status: mysqlEnum("status", ["present", "absent", "late", "excused"]).default("present").notNull(),
  note: varchar("note", { length: 255 }), // Optional comments
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

// ─── Python Labs ──────────────────────────────────────────────────────────────
export const pythonLabs = mysqlTable("pythonLabs", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  instructions: text("instructions"),
  starterCode: text("starterCode"),
  published: boolean("published").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PythonLab = typeof pythonLabs.$inferSelect;
export type InsertPythonLab = typeof pythonLabs.$inferInsert;

export const labSubmissions = mysqlTable("labSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  labId: int("labId").notNull(),
  studentId: int("studentId").notNull(),
  code: text("code").notNull(),
  output: text("output"),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});
export type LabSubmission = typeof labSubmissions.$inferSelect;
export type InsertLabSubmission = typeof labSubmissions.$inferInsert;

// ─── Student Notes (for Reading blocks) ──────────────────────────────────────
export const studentNotes = mysqlTable("studentNotes", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  blockId: int("blockId").notNull(),
  studentId: int("studentId").notNull(),
  noteText: text("noteText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StudentNote = typeof studentNotes.$inferSelect;
export type InsertStudentNote = typeof studentNotes.$inferInsert;

// ─── Game History ─────────────────────────────────────────────────────────────
export const gameHistory = mysqlTable("gameHistory", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  totalQuestions: int("totalQuestions").default(0).notNull(),
  playerCount: int("playerCount").default(0).notNull(),
  results: json("results").notNull(), // [{studentId, name, score, rank}]
  playedAt: timestamp("playedAt").defaultNow().notNull(),
});
export type GameHistory = typeof gameHistory.$inferSelect;
export type InsertGameHistory = typeof gameHistory.$inferInsert;

// ─── Teacher Comments on Students ────────────────────────────────────────────
export const teacherComments = mysqlTable("teacherComments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  studentId: int("studentId").notNull(),
  comment: text("comment").notNull(),
  isVisibleToStudent: boolean("isVisibleToStudent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TeacherComment = typeof teacherComments.$inferSelect;
export type InsertTeacherComment = typeof teacherComments.$inferInsert;
