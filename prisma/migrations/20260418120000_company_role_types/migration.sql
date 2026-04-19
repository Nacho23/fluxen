-- Reemplazar enum CompanyRole: MEMBER -> FIELD, añadir OPS_ADMIN

CREATE TYPE "CompanyRole_new" AS ENUM ('OWNER', 'ADMIN', 'OPS_ADMIN', 'FIELD');

ALTER TABLE "CompanyMember" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "CompanyMember"
  ALTER COLUMN "role" TYPE "CompanyRole_new"
  USING (
    CASE "role"::text
      WHEN 'MEMBER' THEN 'FIELD'::"CompanyRole_new"
      WHEN 'OWNER' THEN 'OWNER'::"CompanyRole_new"
      WHEN 'ADMIN' THEN 'ADMIN'::"CompanyRole_new"
      ELSE 'FIELD'::"CompanyRole_new"
    END
  );

DROP TYPE "CompanyRole";

ALTER TYPE "CompanyRole_new" RENAME TO "CompanyRole";

ALTER TABLE "CompanyMember" ALTER COLUMN "role" SET DEFAULT 'FIELD'::"CompanyRole";
