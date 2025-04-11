-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "imageUri" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scheduledTime" DATETIME NOT NULL,
    "posted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
