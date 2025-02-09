/*
  Warnings:

  - You are about to drop the column `articleId` on the `articlelike` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `articlelike` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `articlelike` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `articlelike` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `articlelike` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `commentlike` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `commentlike` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `commentlike` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,article_id]` on the table `ArticleLike` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `article_id` to the `ArticleLike` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `ArticleLike` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `ArticleLike` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `CommentLike` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `ArticleLike_articleId_isActive_idx` ON `articlelike`;

-- DropIndex
DROP INDEX `ArticleLike_userId_articleId_key` ON `articlelike`;

-- DropIndex
DROP INDEX `ArticleLike_userId_idx` ON `articlelike`;

-- DropIndex
DROP INDEX `CommentLike_comment_id_isActive_idx` ON `commentlike`;

-- DropIndex
DROP INDEX `CommentLike_user_id_isActive_idx` ON `commentlike`;

-- AlterTable
ALTER TABLE `articlelike` DROP COLUMN `articleId`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `isActive`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `userId`,
    ADD COLUMN `article_id` CHAR(16) NOT NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `user_id` CHAR(16) NOT NULL;

-- AlterTable
ALTER TABLE `commentlike` DROP COLUMN `createdAt`,
    DROP COLUMN `isActive`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE INDEX `ArticleLike_article_id_is_active_idx` ON `ArticleLike`(`article_id`, `is_active`);

-- CreateIndex
CREATE INDEX `ArticleLike_user_id_idx` ON `ArticleLike`(`user_id`);

-- CreateIndex
CREATE UNIQUE INDEX `ArticleLike_user_id_article_id_key` ON `ArticleLike`(`user_id`, `article_id`);

-- CreateIndex
CREATE INDEX `CommentLike_comment_id_is_active_idx` ON `CommentLike`(`comment_id`, `is_active`);

-- CreateIndex
CREATE INDEX `CommentLike_user_id_is_active_idx` ON `CommentLike`(`user_id`, `is_active`);
