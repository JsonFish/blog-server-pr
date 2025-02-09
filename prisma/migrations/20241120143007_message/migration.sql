/*
  Warnings:

  - You are about to drop the column `chatId` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `isRevoked` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `message` table. All the data in the column will be lost.
  - Added the required column `chat_id` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_chatId_fkey`;

-- DropIndex
DROP INDEX `Message_chatId_createdAt_idx` ON `message`;

-- AlterTable
ALTER TABLE `message` DROP COLUMN `chatId`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `isRevoked`,
    DROP COLUMN `userId`,
    ADD COLUMN `chat_id` INTEGER NOT NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_revoked` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `user_id` VARCHAR(16) NOT NULL;

-- CreateIndex
CREATE INDEX `Message_chat_id_idx` ON `Message`(`chat_id`);

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_chat_id_fkey` FOREIGN KEY (`chat_id`) REFERENCES `unique_chat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
