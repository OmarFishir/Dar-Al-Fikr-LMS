CREATE TABLE `gameAnswers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`playerId` int NOT NULL,
	`questionIndex` int NOT NULL,
	`answer` varchar(512) NOT NULL,
	`isCorrect` boolean NOT NULL DEFAULT false,
	`pointsEarned` int NOT NULL DEFAULT 0,
	`answeredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameAnswers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gamePlayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`nickname` varchar(64) NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`streak` int NOT NULL DEFAULT 0,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gamePlayers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameSessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quizId` int NOT NULL,
	`teacherId` int NOT NULL,
	`classId` int NOT NULL,
	`joinCode` varchar(8) NOT NULL,
	`status` enum('waiting','active','question','leaderboard','finished') NOT NULL DEFAULT 'waiting',
	`currentQuestion` int NOT NULL DEFAULT 0,
	`questionStartedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gameSessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `gameSessions_joinCode_unique` UNIQUE(`joinCode`)
);
