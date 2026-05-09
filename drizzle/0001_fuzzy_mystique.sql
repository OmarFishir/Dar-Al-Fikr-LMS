CREATE TABLE `assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` timestamp,
	`fileUrl` text,
	`fileKey` varchar(512),
	`fileName` varchar(255),
	`published` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classEnrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`studentId` int NOT NULL,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `classEnrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(255),
	`description` text,
	`teacherId` int NOT NULL,
	`inviteCode` varchar(16) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classes_id` PRIMARY KEY(`id`),
	CONSTRAINT `classes_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`threadId` varchar(64) NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`subject` varchar(255),
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('new_assignment','new_message','grade_update','new_weekly_plan','submission_received','new_meeting') NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text,
	`linkId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assignmentId` int NOT NULL,
	`studentId` int NOT NULL,
	`text` text,
	`fileUrl` text,
	`fileKey` varchar(512),
	`fileName` varchar(255),
	`status` enum('submitted','graded','late') NOT NULL DEFAULT 'submitted',
	`grade` float,
	`feedback` text,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`gradedAt` timestamp,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`weekStart` timestamp NOT NULL,
	`fileUrl` text,
	`fileKey` varchar(512),
	`fileName` varchar(255),
	`published` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklyPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `zoomMeetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`zoomLink` text NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`duration` int DEFAULT 60,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `zoomMeetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','teacher','student') NOT NULL DEFAULT 'user';