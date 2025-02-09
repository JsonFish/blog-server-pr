/*
  Warnings:

  - You are about to drop the `collection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `collection` DROP FOREIGN KEY `Collection_userId_fkey`;

-- DropTable
DROP TABLE `collection`;

-- CreateTable
CREATE TABLE `ArticleCollection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` CHAR(16) NOT NULL,
    `article_id` CHAR(16) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `ArticleCollection_user_id_article_id_is_deleted_idx`(`user_id`, `article_id`, `is_deleted`),
    UNIQUE INDEX `ArticleCollection_user_id_article_id_key`(`user_id`, `article_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
