-- DropForeignKey
ALTER TABLE "webauthn_credentials" DROP CONSTRAINT "webauthn_credentials_userId_fkey";

-- DropIndex
DROP INDEX "students_nik_key";

-- DropIndex
DROP INDEX "webauthn_credentials_userId_idx";

-- AddForeignKey
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
