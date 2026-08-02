-- Passkey (WebAuthn) login untuk akun berisiko tinggi (ADMIN) — lihat
-- src/auth/webauthn.service.ts. Tidak ada private key yang pernah disimpan di
-- sini; hanya public key (COSE) untuk verifikasi signature.
CREATE TABLE "webauthn_credentials" (
  "id"           SERIAL PRIMARY KEY,
  "userId"       INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "credentialId" TEXT NOT NULL,
  "publicKey"    BYTEA NOT NULL,
  "counter"      BIGINT NOT NULL DEFAULT 0,
  "transports"   TEXT,
  "deviceLabel"  TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt"   TIMESTAMP(3)
);

CREATE UNIQUE INDEX "webauthn_credentials_credentialId_key" ON "webauthn_credentials"("credentialId");
CREATE INDEX "webauthn_credentials_userId_idx" ON "webauthn_credentials"("userId");
