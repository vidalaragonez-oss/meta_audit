-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "metaAccessToken" TEXT,
    "anthropicApiKey" TEXT,
    "auditPrompt" TEXT DEFAULT 'Você é um especialista em tráfego pago. Analise os seguintes dados do Meta Ads e gere um plano de ação priorizado.',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "report" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
