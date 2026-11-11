-- CreateEnum
CREATE TYPE "CaptureKind" AS ENUM ('AMP', 'AMP_CAB', 'PEDAL', 'OTHER');

-- AlterEnum
ALTER TYPE "ProductType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "product_revisions" ADD COLUMN     "captureKind" "CaptureKind",
ADD COLUMN     "captureKindOther" TEXT,
ADD COLUMN     "capturedAmp" TEXT,
ADD COLUMN     "includes" TEXT[],
ADD COLUMN     "kindOther" TEXT,
ADD COLUMN     "kinds" "ProductType"[],
ADD COLUMN     "priceCents" INTEGER,
ADD COLUMN     "shortDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "styleOther" TEXT,
ADD COLUMN     "styles" TEXT[],
ADD COLUMN     "youtubeUrl" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "kinds" "ProductType"[],
ADD COLUMN     "shortDescription" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "seller_profiles" ADD COLUMN     "city" TEXT,
ADD COLUMN     "devices" TEXT[],
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "spotifyUrl" TEXT,
ADD COLUMN     "tiktok" TEXT,
ADD COLUMN     "youtube" TEXT;

-- CreateIndex
CREATE INDEX "products_kinds_idx" ON "products" USING GIN ("kinds");
