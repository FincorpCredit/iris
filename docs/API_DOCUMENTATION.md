# Chat Widget API Documentation

## Overview

The Chat Widget API provides comprehensive endpoints for managing customer conversations, AI responses, and real-time chat functionality. The system is built with production-ready features including conversation memory, real-time updates, and notification management.

## Base URL

```
/api/widget
```

## Authentication

Most widget endpoints are public and don't require authentication. Agent endpoints require Bearer token authentication.

```
Authorization: Bearer <token>
```

## Widget Endpoints

### Session Management

#### Create/Get Session
```http
POST /api/widget/session
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "metadata": {
    "company": "Acme Corp",
    "initialMessage": "I need help with my account",
    "customFields": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "session-uuid",
    "sessionToken": "unique-token",
    "isActive": true,
    "startedAt": "2025-01-01T00:00:00Z",
    "lastActivityAt": "2025-01-01T00:00:00Z"
  },
  "customer": {
    "id": "customer-uuid",
    "email": "customer@example.com",
    "name": "John Doe",
    "isOnline": true
  },
  "isNewSession": true,
  "realtimeStatus": {
    "isConnected": true,
    "activeSubscriptions": 0
  }
}
```

#### Get Session
```http
GET /api/widget/session?sessionToken=<token>
```

#### Update Session
```http
PUT /api/widget/session
```

**Request Body:**
```json
{
  "sessionToken": "unique-token",
  "action": "end",
  "customerSatisfaction": 5
}
```

### Messaging

#### Send Message
```http
POST /api/widget/messages
```

**Request Body:**
```json
{
  "sessionToken": "unique-token",
  "message": "Hello, I need help",
  "messageType": "TEXT"
}
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg-uuid",
      "content": "Hello, I need help",
      "senderType": "CUSTOMER",
      "isFromAI": false,
      "createdAt": "2025-01-01T00:00:00Z"
    },
    {
      "id": "ai-msg-uuid",
      "content": "Hi! How can I help you today?",
      "senderType": "AI",
      "isFromAI": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "aiModel": "deepseek/deepseek-r1-distill-llama-70b",
      "tokenUsage": {
        "promptTokens": 150,
        "completionTokens": 25
      }
    }
  ]
}
```

#### Get Messages
```http
GET /api/widget/messages?sessionToken=<token>&limit=50
```

#### Mark Messages as Read
```http
PUT /api/widget/messages
```

### Typing Indicators

#### Update Typing Status
```http
POST /api/widget/typing
```

**Request Body:**
```json
{
  "sessionToken": "unique-token",
  "isTyping": true
}
```

#### Get Typing Indicators
```http
GET /api/widget/typing?sessionToken=<token>
```

### Widget Settings

#### Get Widget Settings
```http
GET /api/widget/settings?name=default
```

**Response:**
```json
{
  "success": true,
  "settings": {
    "id": "settings-uuid",
    "name": "default",
    "isEnabled": true,
    "welcomeMessage": "Hi! How can I help you today?",
    "offlineMessage": "We're currently offline...",
    "theme": {
      "primaryColor": "#3b82f6",
      "textColor": "#1f2937",
      "backgroundColor": "#ffffff",
      "borderRadius": "12px"
    },
    "position": "bottom-right",
    "showAgentPhotos": true,
    "showTypingIndicator": true,
    "enableFileUpload": true,
    "enableEmojis": true,
    "requireEmail": true,
    "requireName": true,
    "isWithinBusinessHours": true,
    "currentMessage": "Hi! How can I help you today?"
  }
}
```

### System Status

#### Get System Status
```http
GET /api/widget/status
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "responseTime": 45,
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 12
    },
    "realtime": {
      "status": "healthy",
      "info": {
        "isConnected": true,
        "activeSubscriptions": 5
      }
    },
    "ai": {
      "status": "configured",
      "model": "deepseek/deepseek-r1-distill-llama-70b"
    }
  },
  "statistics": {
    "customers": {
      "total": 1250,
      "active": 45
    },
    "sessions": {
      "total": 3200,
      "active": 12
    },
    "chats": {
      "total": 2800,
      "open": 8
    },
    "messages": {
      "total": 15600,
      "today": 234
    }
  }
}
```

## Agent Endpoints

### Chat Management

#### Get Agent Chats
```http
GET /api/agent/chats?status=OPEN,IN_PROGRESS&priority=HIGH&limit=50
Authorization: Bearer <token>
```

#### Assign/Transfer Chat
```http
POST /api/agent/chats
Authorization: Bearer <token>
```

**Request Body (Assign):**
```json
{
  "chatId": "chat-uuid",
  "action": "assign"
}
```

**Request Body (Transfer):**
```json
{
  "chatId": "chat-uuid",
  "action": "transfer",
  "toAgentId": "agent-uuid",
  "reason": "Specialist required"
}
```

#### Get Unassigned Chats
```http
GET /api/agent/chats/unassigned?priority=HIGH&limit=20
Authorization: Bearer <token>
```

### Agent Messaging

#### Get Chat Messages
```http
GET /api/agent/chats/{chatId}/messages?limit=50
Authorization: Bearer <token>
```

#### Send Agent Message
```http
POST /api/agent/chats/{chatId}/messages
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "I'll help you with that right away!",
  "messageType": "TEXT"
}
```

#### Mark Messages as Read
```http
PUT /api/agent/chats/{chatId}/messages
Authorization: Bearer <token>
```

### Notifications

#### Get Notifications
```http
GET /api/agent/notifications?unread_only=true&limit=50
Authorization: Bearer <token>
```

#### Mark Notifications as Read
```http
PUT /api/agent/notifications
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "notificationIds": ["notif-1", "notif-2"],
  "markAllAsRead": false
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information (development only)"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Real-time Features

### Supabase Integration

The system uses Supabase for real-time features. Enable real-time on these tables:

1. `message` - For live chat messages
2. `chat_notification` - For instant notifications
3. `typing_indicator` - For typing status
4. `customer` - For online status
5. `conversation_session` - For session updates

### Real-time Events

#### Message Updates
```javascript
// Subscribe to chat messages
const subscription = supabase
  .channel(`chat_messages_${chatId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'message',
    filter: `chatId=eq.${chatId}`
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

#### Notification Updates
```javascript
// Subscribe to notifications
const subscription = supabase
  .channel(`notifications_${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_notification',
    filter: `userId=eq.${userId}`
  }, (payload) => {
    console.log('New notification:', payload.new);
  })
  .subscribe();
```

## Rate Limiting

- Widget endpoints: 100 requests per minute per IP
- Agent endpoints: 1000 requests per minute per user
- Message sending: 10 messages per minute per session

## Webhooks

Configure webhooks for external integrations:

```http
POST /api/webhooks/chat
```

Events:
- `chat.created`
- `chat.assigned`
- `chat.resolved`
- `message.received`
- `customer.waiting`

## SDK Integration

### JavaScript Widget

```html
<script src="/widget/iris-chat-widget.js"></script>
<script>
  IrisChatWidget.init({
    apiUrl: '/api/widget',
    theme: {
      primaryColor: '#3b82f6'
    },
    position: 'bottom-right'
  });
</script>
```

### React Component

```jsx
import { ChatWidget } from '@/components/widget/ChatWidget';

function App() {
  return (
    <ChatWidget
      apiUrl="/api/widget"
      theme={{
        primaryColor: '#3b82f6',
        textColor: '#1f2937',
        backgroundColor: '#ffffff'
      }}
      position="bottom-right"
    />
  );
}
```
