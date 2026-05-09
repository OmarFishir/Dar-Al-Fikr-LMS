CREATE TABLE `learningModules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`classId` int NOT NULL,
	`teacherId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`subject` varchar(128),
	`description` text,
	`sourceUrl` text,
	`published` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learningModules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moduleBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`type` enum('text','video','code','heading','image') NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`content` text NOT NULL,
	`language` varchar(32),
	`caption` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moduleBlocks_id` PRIMARY KEY(`id`)
);
