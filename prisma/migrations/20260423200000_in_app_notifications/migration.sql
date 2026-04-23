CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "eventKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InAppNotification_userId_companyId_readAt_idx" ON "InAppNotification"("userId", "companyId", "readAt");
CREATE INDEX "InAppNotification_userId_companyId_createdAt_idx" ON "InAppNotification"("userId", "companyId", "createdAt");

ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
