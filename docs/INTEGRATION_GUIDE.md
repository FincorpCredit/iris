# Chat Widget Integration Guide

## Overview

This guide will help you integrate the Iris Chat Widget into your website or application. The widget provides AI-powered customer support with real-time messaging, conversation memory, and seamless handoff to human agents.

## Quick Start

### 1. Basic HTML Integration

Add the widget to any HTML page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
</head>
<body>
    <!-- Your website content -->
    
    <!-- Chat Widget -->
    <div id="iris-chat-widget"></div>
    
    <script type="module">
        import { ChatWidget } from '/path/to/chat-widget.js';
        
        // Initialize the widget
        const widget = new ChatWidget({
            container: '#iris-chat-widget',
            apiUrl: 'https://your-domain.com/api/widget',
            theme: {
                primaryColor: '#3b82f6',
                textColor: '#1f2937',
                backgroundColor: '#ffffff'
            },
            position: 'bottom-right'
        });
        
        widget.render();
    </script>
</body>
</html>
```

### 2. React Integration

For React applications:

```jsx
import React from 'react';
import { ChatWidget } from '@/components/widget/ChatWidget';

function App() {
  return (
    <div className="App">
      {/* Your app content */}
      
      <ChatWidget
        apiUrl="/api/widget"
        widgetName="default"
        position="bottom-right"
        theme={{
          primaryColor: '#3b82f6',
          textColor: '#1f2937',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif'
        }}
      />
    </div>
  );
}

export default App;
```

### 3. Next.js Integration

For Next.js applications:

```jsx
// pages/_app.js or app/layout.js
import { ChatWidget } from '@/components/widget/ChatWidget';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <ChatWidget
        apiUrl="/api/widget"
        position="bottom-right"
      />
    </>
  );
}
```

## Configuration Options

### Widget Settings

```javascript
const widgetConfig = {
  // API Configuration
  apiUrl: '/api/widget',              // Widget API endpoint
  widgetName: 'default',              // Widget configuration name
  
  // Appearance
  position: 'bottom-right',           // bottom-right, bottom-left, top-right, top-left
  theme: {
    primaryColor: '#3b82f6',          // Main brand color
    textColor: '#1f2937',             // Text color
    backgroundColor: '#ffffff',        // Background color
    borderRadius: '12px',             // Border radius
    fontFamily: 'Inter, sans-serif'   // Font family
  },
  
  // Behavior
  autoOpen: false,                    // Auto-open widget on page load
  showWelcomeMessage: true,           // Show welcome message
  enableNotifications: true,          // Enable browser notifications
  enableTypingIndicators: true,       // Show typing indicators
  enableFileUpload: true,             // Allow file uploads
  enableEmojis: true,                 // Show emoji picker
  
  // Customer Form
  requireName: true,                  // Require customer name
  requireEmail: true,                 // Require customer email
  collectPhone: false,                // Collect phone number
  customFields: [                     // Additional form fields
    {
      name: 'company',
      label: 'Company',
      type: 'text',
      required: false
    }
  ],
  
  // Callbacks
  onSessionStart: (session) => {      // Called when session starts
    console.log('Session started:', session);
  },
  onMessageSent: (message) => {       // Called when message is sent
    console.log('Message sent:', message);
  },
  onMessageReceived: (message) => {   // Called when message is received
    console.log('Message received:', message);
  },
  onSessionEnd: (session) => {        // Called when session ends
    console.log('Session ended:', session);
  }
};
```

### Predefined Themes

```javascript
// Light theme (default)
const lightTheme = {
  primaryColor: '#3b82f6',
  textColor: '#1f2937',
  backgroundColor: '#ffffff'
};

// Dark theme
const darkTheme = {
  primaryColor: '#6366f1',
  textColor: '#f9fafb',
  backgroundColor: '#1f2937'
};

// Brand themes
const greenTheme = {
  primaryColor: '#10b981',
  textColor: '#1f2937',
  backgroundColor: '#ffffff'
};

const purpleTheme = {
  primaryColor: '#8b5cf6',
  textColor: '#1f2937',
  backgroundColor: '#ffffff'
};
```

## Advanced Integration

### Custom Styling

Override widget styles with CSS:

```css
/* Widget container */
.iris-chat-widget {
  font-family: 'Your Font', sans-serif;
}

/* Chat button */
.iris-chat-widget .chat-button {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Chat window */
.iris-chat-widget .chat-window {
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

/* Message bubbles */
.iris-chat-widget .message-customer {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
}

.iris-chat-widget .message-agent {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
}
```

### Event Handling

Listen to widget events:

```javascript
// Initialize widget with event handlers
const widget = new ChatWidget({
  // ... configuration
  
  onSessionStart: (session) => {
    // Track session start
    analytics.track('Chat Session Started', {
      sessionId: session.id,
      customerId: session.customer.id
    });
  },
  
  onMessageSent: (message) => {
    // Track customer messages
    analytics.track('Chat Message Sent', {
      messageId: message.id,
      content: message.content,
      sessionId: message.sessionId
    });
  },
  
  onMessageReceived: (message) => {
    // Handle AI responses
    if (message.isFromAI) {
      console.log('AI Response:', message.content);
    }
  },
  
  onSessionEnd: (session) => {
    // Track session completion
    analytics.track('Chat Session Ended', {
      sessionId: session.id,
      duration: session.duration,
      messageCount: session.messageCount,
      satisfaction: session.customerSatisfaction
    });
  }
});
```

### Custom Customer Data

Pass additional customer information:

```javascript
// Set customer context
widget.setCustomerContext({
  userId: 'user-123',
  email: 'customer@example.com',
  name: 'John Doe',
  company: 'Acme Corp',
  plan: 'premium',
  customFields: {
    accountType: 'business',
    region: 'north-america',
    lastPurchase: '2024-12-01'
  }
});

// Update context dynamically
widget.updateCustomerContext({
  currentPage: window.location.pathname,
  timeOnPage: Date.now() - pageLoadTime
});
```

## Server-Side Setup

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"

# AI Configuration
OPENROUTER_API_KEY="your-openrouter-api-key"
AI_MODEL="deepseek/deepseek-r1-distill-llama-70b"

# Authentication
JWT_SECRET="your-jwt-secret"
AUTH_SECRET="your-auth-secret"

# Supabase (for real-time features)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"

# Email (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Database Setup

1. Run Prisma migrations:
```bash
npx prisma migrate deploy
```

2. Seed the database:
```bash
npx prisma db seed
```

3. Enable Supabase real-time on these tables:
   - `message`
   - `chat_notification`
   - `typing_indicator`
   - `customer`
   - `conversation_session`

### Widget Settings Configuration

Configure widget settings via API:

```javascript
// Update widget settings
fetch('/api/widget/settings', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + adminToken
  },
  body: JSON.stringify({
    name: 'default',
    welcomeMessage: 'Welcome to our support chat!',
    theme: {
      primaryColor: '#your-brand-color'
    },
    businessHours: {
      enabled: true,
      timezone: 'America/New_York',
      schedule: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        // ... other days
      }
    }
  })
});
```

## Testing

### Widget Test Page

Visit `/widget-test` to test the widget functionality:

1. **Appearance Testing**
   - Try different themes and positions
   - Test responsive design
   - Verify custom styling

2. **Functionality Testing**
   - Customer onboarding flow
   - Message sending and receiving
   - AI responses
   - Typing indicators
   - Session persistence

3. **Real-time Testing**
   - Open multiple browser tabs
   - Test cross-tab synchronization
   - Verify notification delivery

### API Testing

Use the provided test endpoints:

```bash
# Test widget status
curl -X GET "http://localhost:3000/api/widget/status"

# Test session creation
curl -X POST "http://localhost:3000/api/widget/session" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Test message sending
curl -X POST "http://localhost:3000/api/widget/messages" \
  -H "Content-Type: application/json" \
  -d '{"sessionToken":"your-token","message":"Hello"}'
```

## Deployment

### Production Checklist

- [ ] Configure environment variables
- [ ] Set up database with proper indexes
- [ ] Enable Supabase real-time features
- [ ] Configure CORS for your domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Test widget on your production domain
- [ ] Configure backup and recovery

### Performance Optimization

1. **Database Optimization**
   - Add indexes on frequently queried columns
   - Set up connection pooling
   - Configure query optimization

2. **Caching**
   - Cache widget settings
   - Cache knowledge base content
   - Use CDN for static assets

3. **Real-time Optimization**
   - Limit subscription scope
   - Clean up expired connections
   - Monitor subscription counts

## Troubleshooting

### Common Issues

1. **Widget not appearing**
   - Check console for JavaScript errors
   - Verify API endpoint accessibility
   - Check CORS configuration

2. **Messages not sending**
   - Verify session token validity
   - Check API endpoint responses
   - Confirm database connectivity

3. **Real-time features not working**
   - Verify Supabase configuration
   - Check real-time table permissions
   - Monitor connection status

4. **AI responses failing**
   - Verify OpenRouter API key
   - Check AI model availability
   - Monitor token usage

### Debug Mode

Enable debug mode for detailed logging:

```javascript
const widget = new ChatWidget({
  // ... configuration
  debug: true,
  logLevel: 'verbose'
});
```

## Support

For additional support:

1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review the [Database Schema](./DATABASE_SCHEMA.md)
3. Visit the test page at `/widget-test`
4. Check browser console for errors
5. Monitor server logs for API issues
