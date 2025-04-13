/*
  Warnings:

  - You are about to drop the column `appPassword` on the `Credential` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Credential` table. All the data in the column will be lost.
  - Added the required column `password` to the `Credential` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Credential" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "handle" TEXT NOT NULL,
    "password" TEXT NOT NULL
);
INSERT INTO "new_Credential" ("handle", "id") SELECT "handle", "id" FROM "Credential";
DROP TABLE "Credential";
ALTER TABLE "new_Credential" RENAME TO "Credential";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
