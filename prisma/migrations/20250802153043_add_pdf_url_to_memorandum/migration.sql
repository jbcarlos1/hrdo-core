-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'APPROVER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Division" AS ENUM ('MANAGEMENT', 'RECRUITMENT', 'PLANNING_RESEARCH', 'DEVELOPMENT_BENEFITS');

-- CreateEnum
CREATE TYPE "Section" AS ENUM ('EXECUTIVE', 'ADMINISTRATIVE', 'RECRUITMENT_SELECTION', 'APPOINTMENT', 'PLANNING_RESEARCH', 'MONITORING_EVALUATION', 'INFORMATION_MANAGEMENT', 'PROJECTS', 'SCHOLARSHIP', 'TRAINING', 'BENEFITS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "division" "Division" NOT NULL DEFAULT 'MANAGEMENT',
    "section" "Section" NOT NULL DEFAULT 'ADMINISTRATIVE',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwoFactorConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memorandum" (
    "id" TEXT NOT NULL,
    "memoNumber" TEXT NOT NULL,
    "addressee" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "senderUnit" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "keywords" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Memorandum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SenderUnit" (
    "id" TEXT NOT NULL,
    "unitCode" TEXT NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "SenderUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addressee" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,

    CONSTRAINT "Addressee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sender" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,

    CONSTRAINT "Sender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_email_token_key" ON "VerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "PasswordResetToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_token_key" ON "TwoFactorToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_email_token_key" ON "TwoFactorToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorConfirmation_userId_key" ON "TwoFactorConfirmation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Memorandum_memoNumber_key" ON "Memorandum"("memoNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SenderUnit_unitCode_key" ON "SenderUnit"("unitCode");

-- CreateIndex
CREATE UNIQUE INDEX "SenderUnit_unit_key" ON "SenderUnit"("unit");

-- CreateIndex
CREATE UNIQUE INDEX "Addressee_recipient_key" ON "Addressee"("recipient");

-- CreateIndex
CREATE UNIQUE INDEX "Sender_fullName_key" ON "Sender"("fullName");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactorConfirmation" ADD CONSTRAINT "TwoFactorConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
