-- CreateTable
CREATE TABLE "InstallationState" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'UNCONFIGURED',
    "bootstrapCodeHash" TEXT,
    "bootstrapCodeExpiresAt" DATETIME,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "consumedAt" DATETIME,
    "configuredAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- A instalação limpa nasce explicitamente aguardando o bootstrap.
INSERT INTO "InstallationState" ("id", "status", "createdAt", "updatedAt")
VALUES (1, 'UNCONFIGURED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
