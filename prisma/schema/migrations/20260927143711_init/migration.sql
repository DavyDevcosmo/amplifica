-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_buyerId_fkey";

-- DropIndex
DROP INDEX "entitlements_userId_productId_key";

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "buyerId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "downloads_userId_idx" ON "downloads"("userId");

-- CreateIndex
CREATE INDEX "downloads_productFileId_idx" ON "downloads"("productFileId");

-- CreateIndex
CREATE INDEX "entitlements_userId_productId_idx" ON "entitlements"("userId", "productId");

-- CreateIndex
CREATE INDEX "entitlements_productId_idx" ON "entitlements"("productId");

-- CreateIndex
CREATE INDEX "notifications_productId_idx" ON "notifications"("productId");

-- CreateIndex
CREATE INDEX "notifications_orderId_idx" ON "notifications"("orderId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "product_revisions_reviewedById_idx" ON "product_revisions"("reviewedById");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
