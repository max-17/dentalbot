/*
  Warnings:

  - You are about to drop the column `apartment` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `entrance` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `Location` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "apartment",
DROP COLUMN "entrance",
DROP COLUMN "room";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "imageUrl" DROP NOT NULL,
ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
