-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "metaAccessToken" TEXT,
    "anthropicApiKey" TEXT,
    "auditPrompt" TEXT DEFAULT 'Você é um especialista em tráfego pago. Analise os seguintes dados do Meta Ads e gere um plano de ação priorizado.',
    "maxCpl" REAL NOT NULL DEFAULT 80,
    "maxFrequency" REAL NOT NULL DEFAULT 3.5,
    "minCtr" REAL NOT NULL DEFAULT 0.5,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("anthropicApiKey", "auditPrompt", "id", "metaAccessToken", "updatedAt") SELECT "anthropicApiKey", "auditPrompt", "id", "metaAccessToken", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
