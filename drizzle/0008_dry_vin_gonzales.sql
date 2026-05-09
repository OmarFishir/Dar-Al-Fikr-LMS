CREATE TABLE `customNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int,
	`classId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('announcement','reminder','alert','custom') NOT NULL DEFAULT 'custom',
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customNotifications_id` PRIMARY KEY(`id`)
);
