# Iris Chat Widget System

A production-ready AI-powered chat widget with real-time messaging, conversation memory, and seamless agent handoff capabilities. Built with Next.js, Prisma, Supabase, and OpenRouter AI integration.

## 🚀 Features

### Core Functionality
- **AI-Powered Responses** - Intelligent responses using OpenRouter API with conversation memory
- **Real-time Messaging** - Live chat updates using Supabase real-time subscriptions
- **Conversation Memory** - Persistent conversation sessions with context retention
- **Agent Handoff** - Seamless transition from AI to human agents
- **Multi-channel Support** - Widget, email, phone, and social media integration

### Customer Experience
- **Embeddable Widget** - Easy integration into any website
- **Customizable Themes** - Brand-consistent appearance
- **Mobile Responsive** - Optimized for all device sizes
- **Typing Indicators** - Real-time typing status
- **File Uploads** - Support for images, documents, and media
- **Emoji Support** - Rich text communication
- **Session Persistence** - Conversations resume across page reloads

### Agent Dashboard
- **Real-time Notifications** - Instant alerts for new messages
- **Chat Assignment** - Automatic and manual chat routing
- **Performance Analytics** - Response times and satisfaction metrics
- **Customer Profiles** - Comprehensive customer information
- **Knowledge Base Integration** - AI responses powered by company knowledge

### Technical Features
- **Production Ready** - Scalable architecture with proper error handling
- **Database Optimized** - Efficient schema with proper indexing
- **Real-time Updates** - Supabase integration for live features
- **API First** - RESTful APIs for all functionality
- **Type Safe** - Full TypeScript support
- **Testing Suite** - Comprehensive test coverage

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Supabase account (for real-time features)
- OpenRouter API key (for AI responses)

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd iris-chat-widget
npm install
```

### 2. Environment Configuration

Create a `.env.local` file:

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

# Optional: Email configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 3. Database Setup

```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Seed the database (optional)
npx prisma db seed
```

### 4. Supabase Configuration

Enable real-time on these tables in your Supabase dashboard:
- `message`
- `chat_notification`
- `typing_indicator`
- `customer`
- `conversation_session`

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000/widget-test` to test the widget.

## 🎨 Quick Integration

### Basic HTML Integration

```html
<script type="module">
  import { ChatWidget } from '/path/to/chat-widget.js';
  
  const widget = new ChatWidget({
    apiUrl: '/api/widget',
    theme: {
      primaryColor: '#3b82f6',
      textColor: '#1f2937',
      backgroundColor: '#ffffff'
    },
    position: 'bottom-right'
  });
  
  widget.render();
</script>
```

### React Integration

```jsx
import { ChatWidget } from '@/components/widget/ChatWidget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatWidget
        apiUrl="/api/widget"
        position="bottom-right"
        theme={{
          primaryColor: '#3b82f6',
          textColor: '#1f2937',
          backgroundColor: '#ffffff'
        }}
      />
    </div>
  );
}
```

## 📚 Documentation

- **[API Documentation](./docs/API_DOCUMENTATION.md)** - Complete API reference
- **[Integration Guide](./docs/INTEGRATION_GUIDE.md)** - Detailed integration instructions
- **[Database Schema](./docs/DATABASE_SCHEMA.md)** - Database structure and relationships

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test widget.test.js
npm test api.test.js
```

### Test Widget Functionality

1. Visit `/widget-test` in your browser
2. Test different themes and configurations
3. Try the customer onboarding flow
4. Send messages and verify AI responses
5. Test real-time features with multiple tabs

### API Testing

```bash
# Test widget status
curl -X GET "http://localhost:3000/api/widget/status"

# Test session creation
curl -X POST "http://localhost:3000/api/widget/session" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chat Widget   │    │   Agent Dashboard│    │   API Layer     │
│   (Customer)    │◄──►│   (Agents)      │◄──►│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │   Supabase      │    │   Database      │    │   AI Service    │
         │   (Real-time)   │    │   (PostgreSQL)  │    │   (OpenRouter)  │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Services

- **Widget Service** - Customer-facing chat interface
- **Agent Service** - Agent dashboard and chat management
- **AI Service** - OpenRouter integration with conversation memory
- **Real-time Service** - Supabase subscriptions for live updates
- **Conversation Service** - Session and message management
- **Notification Service** - Real-time alerts and badges

## 🔧 Configuration

### Widget Settings

Configure widget appearance and behavior:

```javascript
const widgetConfig = {
  // Appearance
  theme: {
    primaryColor: '#3b82f6',
    textColor: '#1f2937',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    fontFamily: 'Inter, sans-serif'
  },
  position: 'bottom-right',
  
  // Behavior
  welcomeMessage: 'Hi! How can I help you today?',
  offlineMessage: 'We\'re currently offline...',
  showTypingIndicator: true,
  enableFileUpload: true,
  enableEmojis: true,
  
  // Customer Form
  requireEmail: true,
  requireName: true,
  collectPhone: false,
  customFields: [
    { name: 'company', label: 'Company', type: 'text' }
  ]
};
```

### Business Hours

```javascript
const businessHours = {
  enabled: true,
  timezone: 'America/New_York',
  schedule: {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    // ... other days
  }
};
```

## 📊 Monitoring

### Health Checks

- **System Status**: `/api/widget/status`
- **Database Health**: Connection and response times
- **Real-time Status**: Supabase connection monitoring
- **AI Service**: OpenRouter API availability

### Analytics

Track key metrics:
- Customer satisfaction scores
- Response times (first response, average)
- Message volume and patterns
- Agent performance metrics
- Session duration and completion rates

## 🚀 Deployment

### Production Checklist

- [ ] Configure environment variables
- [ ] Set up production database with proper indexes
- [ ] Enable Supabase real-time features
- [ ] Configure CORS for your domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Test widget on production domain
- [ ] Configure backup and recovery

### Performance Optimization

1. **Database**: Add indexes, connection pooling, query optimization
2. **Caching**: Widget settings, knowledge base content, CDN for assets
3. **Real-time**: Limit subscription scope, clean up expired connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Test Page**: Visit `/widget-test` for interactive testing
- **API Reference**: See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)
- **Issues**: Report bugs and feature requests via GitHub issues

## 🎯 Roadmap

- [ ] Voice message support
- [ ] Video chat integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Chatbot training interface
- [ ] Integration with popular CRM systems
- [ ] Mobile app for agents
- [ ] Advanced routing algorithms
