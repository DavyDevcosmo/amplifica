-- DropIndex
DROP INDEX "order_items_sellerId_idx";

-- DropIndex
DROP INDEX "products_status_idx";

-- CreateIndex
CREATE INDEX "bundle_items_productId_idx" ON "bundle_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_userId_productId_key" ON "entitlements"("userId", "productId") WHERE ("revokedAt" IS NULL);

