-- CreateEnum
CREATE TYPE "AgendaEventSource" AS ENUM ('MANUAL', 'QUOTATION');

-- CreateEnum
CREATE TYPE "AgendaAttendanceStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "AgendaEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "source" "AgendaEventSource" NOT NULL DEFAULT 'MANUAL',
    "quotationId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgendaEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgendaEvent_quotationId_key" ON "AgendaEvent"("quotationId");

-- CreateIndex
CREATE INDEX "AgendaEvent_companyId_startAt_idx" ON "AgendaEvent"("companyId", "startAt");

-- AddForeignKey
ALTER TABLE "AgendaEvent" ADD CONSTRAINT "AgendaEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgendaEvent" ADD CONSTRAINT "AgendaEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AgendaEvent" ADD CONSTRAINT "AgendaEvent_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AgendaAttendance" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AgendaAttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgendaAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgendaAttendance_eventId_userId_key" ON "AgendaAttendance"("eventId", "userId");

-- CreateIndex
CREATE INDEX "AgendaAttendance_eventId_idx" ON "AgendaAttendance"("eventId");

-- CreateIndex
CREATE INDEX "AgendaAttendance_userId_idx" ON "AgendaAttendance"("userId");

-- AddForeignKey
ALTER TABLE "AgendaAttendance" ADD CONSTRAINT "AgendaAttendance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "AgendaEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgendaAttendance" ADD CONSTRAINT "AgendaAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
