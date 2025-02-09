/*
  Warnings:

  - You are about to drop the column `activeStatus` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `auditStatus` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `coverImage` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `isPublic` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `article` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `tag` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tag` table. All the data in the column will be lost.
  - The primary key for the `tagmap` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `articleId` on the `tagmap` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `tagmap` table. All the data in the column will be lost.
  - Added the required column `author_id` to the `article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `article` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `article_id` to the `tagmap` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tag_id` to the `tagmap` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `article` DROP FOREIGN KEY `article_categoryId_fkey`;

-- DropForeignKey
ALTER TABLE `tagmap` DROP FOREIGN KEY `tagmap_articleId_fkey`;

-- DropForeignKey
ALTER TABLE `tagmap` DROP FOREIGN KEY `tagmap_tagId_fkey`;

-- DropIndex
DROP INDEX `article_authorId_isPublic_idx` ON `article`;

-- AlterTable
ALTER TABLE `article` DROP COLUMN `activeStatus`,
    DROP COLUMN `auditStatus`,
    DROP COLUMN `authorId`,
    DROP COLUMN `categoryId`,
    DROP COLUMN `coverImage`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `isDeleted`,
    DROP COLUMN `isPublic`,
    DROP COLUMN `publishedAt`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `active_status` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `audit_status` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `author_id` VARCHAR(16) NOT NULL,
    ADD COLUMN `category_id` INTEGER NULL,
    ADD COLUMN `cover_image` VARCHAR(255) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `is_draft` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `is_public` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `published_at` DATETIME(3) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    MODIFY `title` VARCHAR(255) NULL,
    MODIFY `content` TEXT NULL;

-- AlterTable
ALTER TABLE `category` DROP COLUMN `createdAt`,
    DROP COLUMN `isDeleted`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `tag` DROP COLUMN `createdAt`,
    DROP COLUMN `isDeleted`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `tagmap` DROP PRIMARY KEY,
    DROP COLUMN `articleId`,
    DROP COLUMN `tagId`,
    ADD COLUMN `article_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `tag_id` INTEGER NOT NULL,
    ADD PRIMARY KEY (`article_id`, `tag_id`);

-- CreateIndex
CREATE INDEX `article_author_id_is_public_idx` ON `article`(`author_id`, `is_public`);

-- AddForeignKey
ALTER TABLE `article` ADD CONSTRAINT `article_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagmap` ADD CONSTRAINT `tagmap_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tagmap` ADD CONSTRAINT `tagmap_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
