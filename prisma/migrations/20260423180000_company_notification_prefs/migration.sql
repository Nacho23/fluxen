ALTER TABLE "Company"
ADD COLUMN "notificationEmailEvents" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "notificationInAppEvents" JSONB NOT NULL DEFAULT '{}';
