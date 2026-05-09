CREATE TABLE `classMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileType` varchar(64),
	`category` enum('book','slides','notes','other') NOT NULL DEFAULT 'other',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`studentId` int NOT NULL,
	`answers` json NOT NULL,
	`score` float,
	`maxScore` float,
	`status` enum('in_progress','submitted','graded') NOT NULL DEFAULT 'submitted',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`submittedAt` timestamp,
	`gradedAt` timestamp,
	CONSTRAINT `quizAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`questionText` text NOT NULL,
	`questionType` enum('mcq','true_false','short_answer','long_answer') NOT NULL,
	`options` json,
	`correctAnswer` text,
	`points` float NOT NULL DEFAULT 1,
	`orderIndex` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `quizQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` timestamp,
	`timeLimit` int,
	`published` boolean NOT NULL DEFAULT false,
	`autoGrade` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentPoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`studentId` int NOT NULL,
	`teacherId` int NOT NULL,
	`points` int NOT NULL,
	`comment` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studentPoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `classes` ADD `parentId` int;--> statement-breakpoint
ALTER TABLE `classes` ADD `gradeLevel` varchar(64);