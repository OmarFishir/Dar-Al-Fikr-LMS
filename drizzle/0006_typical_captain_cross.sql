ALTER TABLE `weeklyPlans` MODIFY COLUMN `content` text;--> statement-breakpoint
ALTER TABLE `weeklyPlans` ADD `weekNumber` int NOT NULL;