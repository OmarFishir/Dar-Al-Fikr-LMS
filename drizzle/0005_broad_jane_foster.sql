CREATE TABLE `attendance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`studentId` int NOT NULL,
	`teacherId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`status` enum('present','absent','late','excused') NOT NULL DEFAULT 'present',
	`note` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attendance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`totalQuestions` int NOT NULL DEFAULT 0,
	`playerCount` int NOT NULL DEFAULT 0,
	`results` json NOT NULL,
	`playedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `labSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`labId` int NOT NULL,
	`studentId` int NOT NULL,
	`code` text NOT NULL,
	`output` text,
	`savedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `labSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pythonLabs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`instructions` text,
	`starterCode` text,
	`published` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pythonLabs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`blockId` int NOT NULL,
	`studentId` int NOT NULL,
	`noteText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentNotes_id` PRIMARY KEY(`id`)
);
