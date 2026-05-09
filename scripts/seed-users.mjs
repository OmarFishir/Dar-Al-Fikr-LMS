/**
 * Seed script: creates 5 student accounts + 2 teacher accounts in the database.
 * Run with: node scripts/seed-users.mjs
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DB_URL);

const teachers = [
  { openId: "seed_teacher_001", name: "Ms. Sarah Johnson", email: "sarah.johnson@darAlFikr.edu.sa", role: "teacher" },
  { openId: "seed_teacher_002", name: "Mr. Ahmed Al-Rashid", email: "ahmed.rashid@darAlFikr.edu.sa", role: "teacher" },
];

const students = [
  { openId: "seed_student_001", name: "Lena Khalil", email: "lena.khalil@student.darAlFikr.edu.sa", role: "student" },
  { openId: "seed_student_002", name: "Omar Farouk", email: "omar.farouk@student.darAlFikr.edu.sa", role: "student" },
  { openId: "seed_student_003", name: "Nour Al-Hassan", email: "nour.hassan@student.darAlFikr.edu.sa", role: "student" },
  { openId: "seed_student_004", name: "Yousef Mansour", email: "yousef.mansour@student.darAlFikr.edu.sa", role: "student" },
  { openId: "seed_student_005", name: "Rania Saeed", email: "rania.saeed@student.darAlFikr.edu.sa", role: "student" },
];

const all = [...teachers, ...students];

for (const user of all) {
  await connection.execute(
    `INSERT INTO users (openId, name, email, loginMethod, role, lastSignedIn)
     VALUES (?, ?, ?, 'seed', ?, NOW())
     ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), role = VALUES(role)`,
    [user.openId, user.name, user.email, user.role]
  );
  console.log(`✓ Seeded: ${user.name} (${user.role})`);
}

await connection.end();
console.log("\nAll test users seeded successfully.");
