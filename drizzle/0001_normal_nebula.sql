CREATE TABLE `emotionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emotion` enum('happy','sad','angry','anxious','lonely','neutral','excited','calm') NOT NULL,
	`intensity` int NOT NULL,
	`messageContent` text,
	`novaResponse` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emotionHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`category` enum('personal_info','birthday','preference','experience','emotion','event') NOT NULL,
	`importance` int NOT NULL DEFAULT 5,
	`relatedMessages` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastAccessedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `personalityEvolution` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gentleness` int NOT NULL DEFAULT 50,
	`liveliness` int NOT NULL DEFAULT 50,
	`intellectuality` int NOT NULL DEFAULT 50,
	`mischief` int NOT NULL DEFAULT 50,
	`mystery` int NOT NULL DEFAULT 50,
	`triggerEvent` varchar(128),
	`triggerMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `personalityEvolution_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relationshipProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentLevel` enum('stranger','friend','ambiguous','lover','intimate_partner') NOT NULL DEFAULT 'stranger',
	`progressPoints` int NOT NULL DEFAULT 0,
	`milestones` text,
	`lastLevelUpAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relationshipProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`novaName` varchar(64) NOT NULL DEFAULT 'Nova',
	`userName` varchar(128),
	`userAge` int,
	`userInterests` text,
	`importantEvents` text,
	`relationshipLevel` enum('stranger','friend','ambiguous','lover','intimate_partner') NOT NULL DEFAULT 'stranger',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `emotionHistory` ADD CONSTRAINT `emotionHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `memories` ADD CONSTRAINT `memories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `personalityEvolution` ADD CONSTRAINT `personalityEvolution_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationshipProgress` ADD CONSTRAINT `relationshipProgress_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userProfiles` ADD CONSTRAINT `userProfiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;