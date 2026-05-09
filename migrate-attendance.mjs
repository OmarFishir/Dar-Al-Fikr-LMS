import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'schoolhub',
});

try {
  // First, add the weekNumber column if it doesn't exist
  await connection.execute(`
    ALTER TABLE attendance ADD COLUMN weekNumber INT NOT NULL DEFAULT 1;
  `).catch(() => {
    // Column might already exist, ignore error
  });

  // Migrate data: convert late/excused to attended/absent with notes
  await connection.execute(`
    UPDATE attendance 
    SET status = 'attended', note = CONCAT('late', IF(note IS NOT NULL, ' - ' || note, ''))
    WHERE status = 'late';
  `);

  await connection.execute(`
    UPDATE attendance 
    SET status = 'absent', note = CONCAT('excused', IF(note IS NOT NULL, ' - ' || note, ''))
    WHERE status = 'excused';
  `);

  // Now update the enum
  await connection.execute(`
    ALTER TABLE attendance MODIFY COLUMN status ENUM('attended', 'absent') NOT NULL DEFAULT 'attended';
  `);

  console.log('✅ Attendance migration completed successfully');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
