/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."SenderType" AS ENUM ('CUSTOMER', 'AGENT', 'AI', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO', 'SYSTEM', 'TYPING');

-- CreateEnum
CREATE TYPE "public"."ChatSource" AS ENUM ('WIDGET', 'EMAIL', 'PHONE', 'SOCIAL', 'API');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('NEW_MESSAGE', 'CHAT_ASSIGNED', 'CHAT_TRANSFERRED', 'CUSTOMER_WAITING', 'CHAT_RESOLVED', 'MENTION', 'SYSTEM_ALERT');

-- AlterTable
ALTER TABLE "public"."chat" ADD COLUMN     "avgResponseTime" INTEGER,
ADD COLUMN     "conversationSessionId" TEXT,
ADD COLUMN     "firstResponseTime" INTEGER,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "lastUnreadMessageId" TEXT,
ADD COLUMN     "messageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "source" "public"."ChatSource" NOT NULL DEFAULT 'WIDGET',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."customer" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" TEXT DEFAULT 'en',
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."message" ADD COLUMN     "aiCompletionTokens" INTEGER,
ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "aiPromptTokens" INTEGER,
ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "conversationSessionId" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "messageType" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "parentMessageId" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "senderType" "public"."SenderType" NOT NULL DEFAULT 'CUSTOMER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."conversation_session" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "aiMessageCount" INTEGER NOT NULL DEFAULT 0,
    "humanMessageCount" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER,
    "customerSatisfaction" INTEGER,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,

    CONSTRAINT "conversation_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customer_profile" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "company" TEXT,
    "jobTitle" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "leadScore" INTEGER DEFAULT 0,
    "totalChats" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "averageResponseTime" INTEGER,
    "lastContactedAt" TIMESTAMP(3),
    "preferredContactTime" TEXT,
    "communicationPrefs" JSONB,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."chat_notification" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."typing_indicator" (
    "id" TEXT NOT NULL,
    "chatId" TEXT,
    "conversationSessionId" TEXT,
    "userId" TEXT,
    "customerId" TEXT,
    "isTyping" BOOLEAN NOT NULL DEFAULT true,
    "lastTypingAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typing_indicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."widget_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hi! How can I help you today?',
    "offlineMessage" TEXT NOT NULL DEFAULT 'We''re currently offline. Leave us a message and we''ll get back to you!',
    "theme" JSONB NOT NULL DEFAULT '{"primaryColor": "#3b82f6", "textColor": "#1f2937", "backgroundColor": "#ffffff"}',
    "position" TEXT NOT NULL DEFAULT 'bottom-right',
    "showAgentPhotos" BOOLEAN NOT NULL DEFAULT true,
    "showTypingIndicator" BOOLEAN NOT NULL DEFAULT true,
    "enableFileUpload" BOOLEAN NOT NULL DEFAULT true,
    "enableEmojis" BOOLEAN NOT NULL DEFAULT true,
    "maxFileSize" INTEGER NOT NULL DEFAULT 10485760,
    "allowedFileTypes" TEXT[] DEFAULT ARRAY['image/*', 'application/pdf', '.doc', '.docx']::TEXT[],
    "businessHours" JSONB,
    "autoAssignment" BOOLEAN NOT NULL DEFAULT true,
    "requireEmail" BOOLEAN NOT NULL DEFAULT true,
    "requireName" BOOLEAN NOT NULL DEFAULT true,
    "collectPhone" BOOLEAN NOT NULL DEFAULT false,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "widget_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_session_sessionToken_key" ON "public"."conversation_session"("sessionToken");

-- CreateIndex
CREATE INDEX "conversation_session_customerId_idx" ON "public"."conversation_session"("customerId");

-- CreateIndex
CREATE INDEX "conversation_session_sessionToken_idx" ON "public"."conversation_session"("sessionToken");

-- CreateIndex
CREATE INDEX "conversation_session_isActive_idx" ON "public"."conversation_session"("isActive");

-- CreateIndex
CREATE INDEX "conversation_session_startedAt_idx" ON "public"."conversation_session"("startedAt");

-- CreateIndex
CREATE INDEX "conversation_session_lastActivityAt_idx" ON "public"."conversation_session"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profile_customerId_key" ON "public"."customer_profile"("customerId");

-- CreateIndex
CREATE INDEX "customer_profile_customerId_idx" ON "public"."customer_profile"("customerId");

-- CreateIndex
CREATE INDEX "customer_profile_company_idx" ON "public"."customer_profile"("company");

-- CreateIndex
CREATE INDEX "customer_profile_industry_idx" ON "public"."customer_profile"("industry");

-- CreateIndex
CREATE INDEX "customer_profile_leadScore_idx" ON "public"."customer_profile"("leadScore");

-- CreateIndex
CREATE INDEX "customer_profile_lastContactedAt_idx" ON "public"."customer_profile"("lastContactedAt");

-- CreateIndex
CREATE INDEX "chat_notification_chatId_idx" ON "public"."chat_notification"("chatId");

-- CreateIndex
CREATE INDEX "chat_notification_userId_idx" ON "public"."chat_notification"("userId");

-- CreateIndex
CREATE INDEX "chat_notification_type_idx" ON "public"."chat_notification"("type");

-- CreateIndex
CREATE INDEX "chat_notification_isRead_idx" ON "public"."chat_notification"("isRead");

-- CreateIndex
CREATE INDEX "chat_notification_createdAt_idx" ON "public"."chat_notification"("createdAt");

-- CreateIndex
CREATE INDEX "typing_indicator_chatId_idx" ON "public"."typing_indicator"("chatId");

-- CreateIndex
CREATE INDEX "typing_indicator_conversationSessionId_idx" ON "public"."typing_indicator"("conversationSessionId");

-- CreateIndex
CREATE INDEX "typing_indicator_userId_idx" ON "public"."typing_indicator"("userId");

-- CreateIndex
CREATE INDEX "typing_indicator_customerId_idx" ON "public"."typing_indicator"("customerId");

-- CreateIndex
CREATE INDEX "typing_indicator_isTyping_idx" ON "public"."typing_indicator"("isTyping");

-- CreateIndex
CREATE INDEX "typing_indicator_expiresAt_idx" ON "public"."typing_indicator"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "widget_settings_name_key" ON "public"."widget_settings"("name");

-- CreateIndex
CREATE INDEX "widget_settings_name_idx" ON "public"."widget_settings"("name");

-- CreateIndex
CREATE INDEX "widget_settings_isEnabled_idx" ON "public"."widget_settings"("isEnabled");

-- CreateIndex
CREATE INDEX "chat_source_idx" ON "public"."chat"("source");

-- CreateIndex
CREATE INDEX "chat_lastMessageAt_idx" ON "public"."chat"("lastMessageAt");

-- CreateIndex
CREATE INDEX "chat_conversationSessionId_idx" ON "public"."chat"("conversationSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "public"."customer"("email");

-- CreateIndex
CREATE INDEX "customer_email_idx" ON "public"."customer"("email");

-- CreateIndex
CREATE INDEX "customer_isOnline_idx" ON "public"."customer"("isOnline");

-- CreateIndex
CREATE INDEX "customer_lastSeenAt_idx" ON "public"."customer"("lastSeenAt");

-- CreateIndex
CREATE INDEX "message_conversationSessionId_idx" ON "public"."message"("conversationSessionId");

-- CreateIndex
CREATE INDEX "message_senderType_idx" ON "public"."message"("senderType");

-- CreateIndex
CREATE INDEX "message_messageType_idx" ON "public"."message"("messageType");

-- CreateIndex
CREATE INDEX "message_isFromAI_idx" ON "public"."message"("isFromAI");

-- CreateIndex
CREATE INDEX "message_isRead_idx" ON "public"."message"("isRead");

-- CreateIndex
CREATE INDEX "message_createdAt_idx" ON "public"."message"("createdAt");

-- CreateIndex
CREATE INDEX "message_parentMessageId_idx" ON "public"."message"("parentMessageId");

-- AddForeignKey
ALTER TABLE "public"."chat" ADD CONSTRAINT "chat_conversationSessionId_fkey" FOREIGN KEY ("conversationSessionId") REFERENCES "public"."conversation_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_session" ADD CONSTRAINT "conversation_session_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customer_profile" ADD CONSTRAINT "customer_profile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_notification" ADD CONSTRAINT "chat_notification_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chat_notification" ADD CONSTRAINT "chat_notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."typing_indicator" ADD CONSTRAINT "typing_indicator_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "public"."chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."typing_indicator" ADD CONSTRAINT "typing_indicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."typing_indicator" ADD CONSTRAINT "typing_indicator_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_conversationSessionId_fkey" FOREIGN KEY ("conversationSessionId") REFERENCES "public"."conversation_session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "public"."message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
