# Database Schema Documentation

## Overview

The chat widget system uses a comprehensive database schema designed for production-ready customer support with AI integration, real-time features, and conversation memory.

## Core Tables

### customer
Stores customer information and online status.

```sql
CREATE TABLE customer (
    id                    VARCHAR PRIMARY KEY DEFAULT uuid(),
    name                  VARCHAR,
    email                 VARCHAR UNIQUE NOT NULL,
    phone                 VARCHAR,
    avatar                VARCHAR,
    timezone              VARCHAR DEFAULT 'UTC',
    language              VARCHAR DEFAULT 'en',
    lastSeenAt            TIMESTAMP,
    isOnline              BOOLEAN DEFAULT false,
    metadata              JSON,
    createdAt             TIMESTAMP DEFAULT now(),
    updatedAt             TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customer_email ON customer(email);
CREATE INDEX idx_customer_isOnline ON customer(isOnline);
CREATE INDEX idx_customer_lastSeenAt ON customer(lastSeenAt);
```

**Key Features:**
- Unique email constraint for customer identification
- Online status tracking with last seen timestamp
- Flexible metadata field for custom customer data
- Timezone and language preferences

### conversation_session
Manages conversation sessions with memory and analytics.

```sql
CREATE TABLE conversation_session (
    id                    VARCHAR PRIMARY KEY DEFAULT uuid(),
    customerId            VARCHAR NOT NULL REFERENCES customer(id),
    sessionToken          VARCHAR UNIQUE NOT NULL,
    isActive              BOOLEAN DEFAULT true,
    startedAt             TIMESTAMP DEFAULT now(),
    endedAt               TIMESTAMP,
    lastActivityAt        TIMESTAMP DEFAULT now(),
    messageCount          INTEGER DEFAULT 0,
    aiMessageCount        INTEGER DEFAULT 0,
    humanMessageCount     INTEGER DEFAULT 0,
    averageResponseTime   INTEGER,
    customerSatisfaction  INTEGER,
    tags                  VARCHAR[],
    metadata              JSON,
    ipAddress             VARCHAR,
    userAgent             VARCHAR,
    referrer              VARCHAR
);

-- Indexes
CREATE INDEX idx_session_customerId ON conversation_session(customerId);
CREATE INDEX idx_session_sessionToken ON conversation_session(sessionToken);
CREATE INDEX idx_session_isActive ON conversation_session(isActive);
CREATE INDEX idx_session_startedAt ON conversation_session(startedAt);
CREATE INDEX idx_session_lastActivityAt ON conversation_session(lastActivityAt);
```

**Key Features:**
- Session-based conversation management
- Activity tracking and timeout handling
- Performance metrics (response times, message counts)
- Customer satisfaction scoring
- Session metadata for analytics

### chat
Enhanced chat management with priority and source tracking.

```sql
CREATE TABLE chat (
    id                    VARCHAR PRIMARY KEY DEFAULT uuid(),
    customerId            VARCHAR NOT NULL REFERENCES customer(id),
    status                ChatStatus DEFAULT 'OPEN',
    priority              Priority DEFAULT 'MEDIUM',
    assignedAgentId       VARCHAR REFERENCES user(id),
    satisfied             BOOLEAN DEFAULT false,
    deleted               BOOLEAN DEFAULT false,
    source                ChatSource DEFAULT 'WIDGET',
    tags                  VARCHAR[],
    lastMessageAt         TIMESTAMP,
    firstResponseTime     INTEGER,
    avgResponseTime       INTEGER,
    messageCount          INTEGER DEFAULT 0,
    unreadCount           INTEGER DEFAULT 0,
    lastUnreadMessageId   VARCHAR,
    conversationSessionId VARCHAR REFERENCES conversation_session(id),
    metadata              JSON,
    createdAt             TIMESTAMP DEFAULT now(),
    updatedAt             TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_chat_customerId ON chat(customerId);
CREATE INDEX idx_chat_assignedAgentId ON chat(assignedAgentId);
CREATE INDEX idx_chat_status ON chat(status);
CREATE INDEX idx_chat_priority ON chat(priority);
CREATE INDEX idx_chat_source ON chat(source);
CREATE INDEX idx_chat_lastMessageAt ON chat(lastMessageAt);
CREATE INDEX idx_chat_conversationSessionId ON chat(conversationSessionId);
```

**Key Features:**
- Multi-channel support (widget, email, phone, social)
- Priority-based routing
- Performance tracking (response times)
- Unread message counting
- Agent assignment and transfer

### message
Comprehensive message storage with AI integration.

```sql
CREATE TABLE message (
    id                    VARCHAR PRIMARY KEY DEFAULT uuid(),
    chatId                VARCHAR NOT NULL REFERENCES chat(id),
    conversationSessionId VARCHAR REFERENCES conversation_session(id),
    senderId              VARCHAR REFERENCES user(id),
    senderType            SenderType DEFAULT 'CUSTOMER',
    content               TEXT NOT NULL,
    messageType           MessageType DEFAULT 'TEXT',
    isFromAI              BOOLEAN DEFAULT false,
    aiModel               VARCHAR,
    aiPromptTokens        INTEGER,
    aiCompletionTokens    INTEGER,
    attachments           JSON,
    metadata              JSON,
    isRead                BOOLEAN DEFAULT false,
    readAt                TIMESTAMP,
    deliveredAt           TIMESTAMP,
    failedAt              TIMESTAMP,
    retryCount            INTEGER DEFAULT 0,
    parentMessageId       VARCHAR REFERENCES message(id),
    editedAt              TIMESTAMP,
    deletedAt             TIMESTAMP,
    createdAt             TIMESTAMP DEFAULT now(),
    updatedAt             TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_message_chatId ON message(chatId);
CREATE INDEX idx_message_conversationSessionId ON message(conversationSessionId);
CREATE INDEX idx_message_senderId ON message(senderId);
CREATE INDEX idx_message_senderType ON message(senderType);
CREATE INDEX idx_message_messageType ON message(messageType);
CREATE INDEX idx_message_isFromAI ON message(isFromAI);
CREATE INDEX idx_message_isRead ON message(isRead);
CREATE INDEX idx_message_createdAt ON message(createdAt);
CREATE INDEX idx_message_parentMessageId ON message(parentMessageId);
```

**Key Features:**
- Multi-type message support (text, image, file, audio, video)
- AI integration with token usage tracking
- Message threading support
- Delivery and read status tracking
- Soft delete capability

## Support Tables

### customer_profile
Extended customer information and analytics.

```sql
CREATE TABLE customer_profile (
    id                    VARCHAR PRIMARY KEY DEFAULT uuid(),
    customerId            VARCHAR UNIQUE NOT NULL REFERENCES customer(id),
    company               VARCHAR,
    jobTitle              VARCHAR,
    industry              VARCHAR,
    website               VARCHAR,
    location              VARCHAR,
    notes                 TEXT,
    leadScore             INTEGER DEFAULT 0,
    totalChats            INTEGER DEFAULT 0,
    totalMessages         INTEGER DEFAULT 0,
    averageResponseTime   INTEGER,
    lastContactedAt       TIMESTAMP,
    preferredContactTime  VARCHAR,
    communicationPrefs    JSON,
    customFields          JSON,
    createdAt             TIMESTAMP DEFAULT now(),
    updatedAt             TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customer_profile_customerId ON customer_profile(customerId);
CREATE INDEX idx_customer_profile_company ON customer_profile(company);
CREATE INDEX idx_customer_profile_industry ON customer_profile(industry);
CREATE INDEX idx_customer_profile_leadScore ON customer_profile(leadScore);
CREATE INDEX idx_customer_profile_lastContactedAt ON customer_profile(lastContactedAt);
```

### chat_notification
Real-time notification system for agents.

```sql
CREATE TABLE chat_notification (
    id          VARCHAR PRIMARY KEY DEFAULT uuid(),
    chatId      VARCHAR NOT NULL REFERENCES chat(id),
    userId      VARCHAR NOT NULL REFERENCES user(id),
    type        NotificationType NOT NULL,
    title       VARCHAR NOT NULL,
    message     VARCHAR NOT NULL,
    isRead      BOOLEAN DEFAULT false,
    readAt      TIMESTAMP,
    actionUrl   VARCHAR,
    metadata    JSON,
    createdAt   TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notification_chatId ON chat_notification(chatId);
CREATE INDEX idx_notification_userId ON chat_notification(userId);
CREATE INDEX idx_notification_type ON chat_notification(type);
CREATE INDEX idx_notification_isRead ON chat_notification(isRead);
CREATE INDEX idx_notification_createdAt ON chat_notification(createdAt);
```

### typing_indicator
Real-time typing status tracking.

```sql
CREATE TABLE typing_indicator (
    id                    VARCHAR PRIMARY KEY DEFAULT uuid(),
    chatId                VARCHAR REFERENCES chat(id),
    conversationSessionId VARCHAR REFERENCES conversation_session(id),
    userId                VARCHAR REFERENCES user(id),
    customerId            VARCHAR REFERENCES customer(id),
    isTyping              BOOLEAN DEFAULT true,
    lastTypingAt          TIMESTAMP DEFAULT now(),
    expiresAt             TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_typing_chatId ON typing_indicator(chatId);
CREATE INDEX idx_typing_conversationSessionId ON typing_indicator(conversationSessionId);
CREATE INDEX idx_typing_userId ON typing_indicator(userId);
CREATE INDEX idx_typing_customerId ON typing_indicator(customerId);
CREATE INDEX idx_typing_isTyping ON typing_indicator(isTyping);
CREATE INDEX idx_typing_expiresAt ON typing_indicator(expiresAt);
```

### widget_settings
Configurable widget appearance and behavior.

```sql
CREATE TABLE widget_settings (
    id                    VARCHAR PRIMARY KEY DEFAULT uuid(),
    name                  VARCHAR UNIQUE DEFAULT 'default',
    isEnabled             BOOLEAN DEFAULT true,
    welcomeMessage        VARCHAR DEFAULT 'Hi! How can I help you today?',
    offlineMessage        VARCHAR DEFAULT 'We''re currently offline...',
    theme                 JSON DEFAULT '{"primaryColor": "#3b82f6", "textColor": "#1f2937", "backgroundColor": "#ffffff"}',
    position              VARCHAR DEFAULT 'bottom-right',
    showAgentPhotos       BOOLEAN DEFAULT true,
    showTypingIndicator   BOOLEAN DEFAULT true,
    enableFileUpload      BOOLEAN DEFAULT true,
    enableEmojis          BOOLEAN DEFAULT true,
    maxFileSize           INTEGER DEFAULT 10485760,
    allowedFileTypes      VARCHAR[] DEFAULT ARRAY['image/*', 'application/pdf', '.doc', '.docx'],
    businessHours         JSON,
    autoAssignment        BOOLEAN DEFAULT true,
    requireEmail          BOOLEAN DEFAULT true,
    requireName           BOOLEAN DEFAULT true,
    collectPhone          BOOLEAN DEFAULT false,
    customFields          JSON,
    createdAt             TIMESTAMP DEFAULT now(),
    updatedAt             TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_widget_settings_name ON widget_settings(name);
CREATE INDEX idx_widget_settings_isEnabled ON widget_settings(isEnabled);
```

## Enums

### SenderType
```sql
CREATE TYPE SenderType AS ENUM (
    'CUSTOMER',
    'AGENT', 
    'AI',
    'SYSTEM'
);
```

### MessageType
```sql
CREATE TYPE MessageType AS ENUM (
    'TEXT',
    'IMAGE',
    'FILE',
    'AUDIO',
    'VIDEO',
    'SYSTEM',
    'TYPING'
);
```

### ChatSource
```sql
CREATE TYPE ChatSource AS ENUM (
    'WIDGET',
    'EMAIL',
    'PHONE',
    'SOCIAL',
    'API'
);
```

### NotificationType
```sql
CREATE TYPE NotificationType AS ENUM (
    'NEW_MESSAGE',
    'CHAT_ASSIGNED',
    'CHAT_TRANSFERRED',
    'CUSTOMER_WAITING',
    'CHAT_RESOLVED',
    'MENTION',
    'SYSTEM_ALERT'
);
```

## Supabase Real-time Configuration

Enable real-time on these tables for live updates:

```sql
-- Enable real-time for message updates
ALTER PUBLICATION supabase_realtime ADD TABLE message;

-- Enable real-time for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE chat_notification;

-- Enable real-time for typing indicators
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicator;

-- Enable real-time for customer status
ALTER PUBLICATION supabase_realtime ADD TABLE customer;

-- Enable real-time for session updates
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_session;
```

## Performance Considerations

### Indexing Strategy
- Primary indexes on foreign keys for joins
- Composite indexes for common query patterns
- Partial indexes for filtered queries (e.g., active sessions)

### Partitioning
Consider partitioning large tables by date:
```sql
-- Partition messages by month
CREATE TABLE message_y2025m01 PARTITION OF message
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Cleanup Jobs
Regular maintenance tasks:
```sql
-- Clean up expired typing indicators
DELETE FROM typing_indicator WHERE expiresAt < NOW();

-- Archive old messages (older than 1 year)
DELETE FROM message WHERE createdAt < NOW() - INTERVAL '1 year';

-- Clean up inactive sessions
UPDATE conversation_session 
SET isActive = false, endedAt = NOW()
WHERE isActive = true 
AND lastActivityAt < NOW() - INTERVAL '30 minutes';
```

## Migration Commands

```bash
# Generate migration
npx prisma migrate dev --name enhanced_chat_widget_schema

# Deploy to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```
