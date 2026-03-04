CREATE TABLE `reaction` (
	`id` text PRIMARY KEY NOT NULL,
	`messageId` text NOT NULL,
	`userId` text NOT NULL,
	`emoji` text NOT NULL,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`messageId`) REFERENCES `message`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reaction_unique` ON `reaction` (`messageId`,`userId`,`emoji`);--> statement-breakpoint
ALTER TABLE `channel` ADD `archived` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `message` ADD `replyToId` text REFERENCES message(id);--> statement-breakpoint
ALTER TABLE `message` ADD `forwardedFromChannelId` text REFERENCES channel(id);--> statement-breakpoint
ALTER TABLE `message` ADD `forwardedFromUserId` text REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `user` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `user` ADD `profileImage` text;--> statement-breakpoint
ALTER TABLE `user` ADD `websiteUrl` text;--> statement-breakpoint
ALTER TABLE `user` ADD `githubUrl` text;--> statement-breakpoint
ALTER TABLE `user` ADD `twitterUrl` text;