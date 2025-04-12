/*
  Warnings:

  - You are about to drop the column `imageUri` on the `ScheduledPost` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ScheduledPostImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "imageUri" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    CONSTRAINT "ScheduledPostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ScheduledPost" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduledPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "scheduledTime" DATETIME NOT NULL,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_ScheduledPost" ("createdAt", "id", "posted", "scheduledTime", "title") SELECT "createdAt", "id", "posted", "scheduledTime", "title" FROM "ScheduledPost";
DROP TABLE "ScheduledPost";
ALTER TABLE "new_ScheduledPost" RENAME TO "ScheduledPost";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
