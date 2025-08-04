-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ONLINE', 'OFFLINE', 'AWAY', 'BREAK');

-- CreateEnum
CREATE TYPE "public"."ChatStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."AuthPreference" AS ENUM ('PASSWORD', 'CODE');

-- CreateEnum
CREATE TYPE "public"."chat_status" AS ENUM ('OPEN', 'ASSIGNED', 'ESCALATED', 'SATISFIED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."auditlog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "public"."ChatStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "assignedAgentId" TEXT,
    "satisfied" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companyknowledge" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companyknowledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledgetag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "knowledgeId" TEXT NOT NULL,

    CONSTRAINT "knowledgetag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "senderId" TEXT,
    "content" TEXT NOT NULL,
    "isFromAI" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastActiveAt" TIMESTAMP(3),
    "profileImage" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordChangedAt" TIMESTAMP(3),
    "authPreference" "public"."AuthPreference" NOT NULL DEFAULT 'PASSWORD',
    "tempCode" TEXT,
    "tempCodeExpiry" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditlog_userId_idx" ON "public"."auditlog"("userId");

-- CreateIndex
CREATE INDEX "chat_assignedAgentId_idx" ON "public"."chat"("assignedAgentId");

-- CreateIndex
CREATE INDEX "chat_status_idx" ON "public"."chat"("status");

-- CreateIndex
CREATE INDEX "chat_priority_idx" ON "public"."chat"("priority");

-- CreateIndex
CREATE INDEX "chat_customerId_idx" ON "public"."chat"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "companyknowledge_title_key" ON "public"."companyknowledge"("title");

-- CreateIndex
CREATE INDEX "knowledgetag_knowledgeId_idx" ON "public"."knowledgetag"("knowledgeId");

-- CreateIndex
CREATE INDEX "message_chatId_idx" ON "public"."message"("chatId");

-- CreateIndex
CREATE INDEX "message_senderId_idx" ON "public"."message"("senderId");

-- CreateIndex
CREATE UNIQUE INDEX "permission_roleId_resource_action_key" ON "public"."permission"("roleId", "resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "public"."role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "user_roleId_idx" ON "public"."user"("roleId");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "public"."user"("status");

-- AddForeignKey
ALTER TABLE "public"."auditlog" ADD CONSTRAINT "auditlog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat" ADD CONSTRAINT "chat_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat" ADD CONSTRAINT "chat_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledgetag" ADD CONSTRAINT "knowledgetag_knowledgeId_fkey" FOREIGN KEY ("knowledgeId") REFERENCES "public"."companyknowledge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission" ADD CONSTRAINT "permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
