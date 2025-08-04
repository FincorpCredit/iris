/**
 * API Test Suite
 * Tests for chat widget API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
vi.mock('@prisma/client');
const mockPrisma = {
  customer: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  conversationSession: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  chat: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  message: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn()
  },
  widgetSettings: {
    findUnique: vi.fn(),
    create: vi.fn()
  },
  $queryRaw: vi.fn(),
  $disconnect: vi.fn()
};

PrismaClient.mockImplementation(() => mockPrisma);

// Import API handlers after mocking
import { POST as sessionPOST, GET as sessionGET } from '@/app/api/widget/session/route';
import { POST as messagesPOST, GET as messagesGET } from '@/app/api/widget/messages/route';
import { GET as settingsGET } from '@/app/api/widget/settings/route';
import { GET as statusGET } from '@/app/api/widget/status/route';

describe('Widget API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Management', () => {
    describe('POST /api/widget/session', () => {
      it('creates new session for new customer', async () => {
        const { req } = createMocks({
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '192.168.1.1',
            'user-agent': 'Test Browser'
          },
          body: {
            email: 'test@example.com',
            name: 'John Doe',
            phone: '+1234567890'
          }
        });

        // Mock database responses
        mockPrisma.customer.findUnique.mockResolvedValue(null);
        mockPrisma.customer.create.mockResolvedValue({
          id: 'customer-123',
          email: 'test@example.com',
          name: 'John Doe',
          phone: '+1234567890',
          isOnline: true,
          lastSeenAt: new Date()
        });

        mockPrisma.conversationSession.create.mockResolvedValue({
          id: 'session-123',
          sessionToken: 'token-123',
          customerId: 'customer-123',
          isActive: true,
          startedAt: new Date(),
          lastActivityAt: new Date()
        });

        const response = await sessionPOST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.session.sessionToken).toBe('token-123');
        expect(data.customer.email).toBe('test@example.com');
        expect(data.isNewSession).toBe(true);
      });

      it('returns existing active session', async () => {
        const { req } = createMocks({
          method: 'POST',
          body: {
            email: 'existing@example.com',
            name: 'Jane Doe'
          }
        });

        const existingCustomer = {
          id: 'customer-456',
          email: 'existing@example.com',
          name: 'Jane Doe'
        };

        const existingSession = {
          id: 'session-456',
          sessionToken: 'token-456',
          customerId: 'customer-456',
          isActive: true,
          lastActivityAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        };

        mockPrisma.customer.findUnique.mockResolvedValue(existingCustomer);
        mockPrisma.conversationSession.findFirst.mockResolvedValue(existingSession);
        mockPrisma.customer.update.mockResolvedValue(existingCustomer);

        const response = await sessionPOST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.session.sessionToken).toBe('token-456');
        expect(data.isNewSession).toBe(false);
      });

      it('validates required email field', async () => {
        const { req } = createMocks({
          method: 'POST',
          body: {
            name: 'John Doe'
            // Missing email
          }
        });

        const response = await sessionPOST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Email is required');
      });
    });

    describe('GET /api/widget/session', () => {
      it('retrieves session by token', async () => {
        const { req } = createMocks({
          method: 'GET',
          query: {
            sessionToken: 'token-123'
          }
        });

        const mockSession = {
          id: 'session-123',
          sessionToken: 'token-123',
          isActive: true,
          startedAt: new Date(),
          lastActivityAt: new Date(),
          messageCount: 5,
          customer: {
            id: 'customer-123',
            email: 'test@example.com',
            name: 'John Doe',
            isOnline: true
          }
        };

        mockPrisma.conversationSession.findUnique.mockResolvedValue(mockSession);

        const response = await sessionGET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.session.sessionToken).toBe('token-123');
        expect(data.customer.email).toBe('test@example.com');
      });

      it('returns 404 for invalid session token', async () => {
        const { req } = createMocks({
          method: 'GET',
          query: {
            sessionToken: 'invalid-token'
          }
        });

        mockPrisma.conversationSession.findUnique.mockResolvedValue(null);

        const response = await sessionGET(req);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Session not found');
      });
    });
  });

  describe('Message Management', () => {
    describe('POST /api/widget/messages', () => {
      it('sends message and receives AI response', async () => {
        const { req } = createMocks({
          method: 'POST',
          body: {
            sessionToken: 'token-123',
            message: 'Hello, I need help',
            messageType: 'TEXT'
          }
        });

        const mockSession = {
          id: 'session-123',
          sessionToken: 'token-123',
          customerId: 'customer-123',
          isActive: true,
          customer: {
            id: 'customer-123',
            email: 'test@example.com'
          }
        };

        const mockChat = {
          id: 'chat-123',
          customerId: 'customer-123',
          conversationSessionId: 'session-123',
          status: 'OPEN'
        };

        const mockCustomerMessage = {
          id: 'msg-123',
          content: 'Hello, I need help',
          senderType: 'CUSTOMER',
          isFromAI: false,
          createdAt: new Date()
        };

        const mockAIMessage = {
          id: 'msg-124',
          content: 'Hi! How can I help you today?',
          senderType: 'AI',
          isFromAI: true,
          createdAt: new Date()
        };

        mockPrisma.conversationSession.findUnique.mockResolvedValue(mockSession);
        mockPrisma.chat.findFirst.mockResolvedValue(mockChat);
        mockPrisma.message.create
          .mockResolvedValueOnce(mockCustomerMessage)
          .mockResolvedValueOnce(mockAIMessage);

        // Mock AI service
        vi.doMock('@/lib/ai-service', () => ({
          aiService: {
            generateResponse: vi.fn().mockResolvedValue({
              content: 'Hi! How can I help you today?',
              model: 'test-model',
              tokenUsage: { promptTokens: 10, completionTokens: 5 }
            })
          }
        }));

        const response = await messagesPOST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.messages).toHaveLength(2);
        expect(data.messages[0].content).toBe('Hello, I need help');
        expect(data.messages[1].content).toBe('Hi! How can I help you today?');
        expect(data.messages[1].isFromAI).toBe(true);
      });

      it('validates session token', async () => {
        const { req } = createMocks({
          method: 'POST',
          body: {
            message: 'Hello'
            // Missing sessionToken
          }
        });

        const response = await messagesPOST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session token and message are required');
      });

      it('validates active session', async () => {
        const { req } = createMocks({
          method: 'POST',
          body: {
            sessionToken: 'inactive-token',
            message: 'Hello'
          }
        });

        mockPrisma.conversationSession.findUnique.mockResolvedValue({
          id: 'session-123',
          sessionToken: 'inactive-token',
          isActive: false
        });

        const response = await messagesPOST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Session is not active');
      });
    });

    describe('GET /api/widget/messages', () => {
      it('retrieves conversation history', async () => {
        const { req } = createMocks({
          method: 'GET',
          query: {
            sessionToken: 'token-123',
            limit: '10'
          }
        });

        const mockSession = {
          id: 'session-123',
          sessionToken: 'token-123'
        };

        const mockMessages = [
          {
            id: 'msg-1',
            content: 'Hello',
            senderType: 'CUSTOMER',
            isFromAI: false,
            createdAt: new Date(),
            user: null
          },
          {
            id: 'msg-2',
            content: 'Hi there!',
            senderType: 'AI',
            isFromAI: true,
            createdAt: new Date(),
            user: null
          }
        ];

        mockPrisma.conversationSession.findUnique.mockResolvedValue(mockSession);
        mockPrisma.message.findMany.mockResolvedValue(mockMessages);

        const response = await messagesGET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.messages).toHaveLength(2);
        expect(data.messages[0].content).toBe('Hello');
        expect(data.messages[1].content).toBe('Hi there!');
      });
    });
  });

  describe('Widget Settings', () => {
    describe('GET /api/widget/settings', () => {
      it('returns default settings when none exist', async () => {
        const { req } = createMocks({
          method: 'GET',
          query: {
            name: 'default'
          }
        });

        mockPrisma.widgetSettings.findUnique.mockResolvedValue(null);
        mockPrisma.widgetSettings.create.mockResolvedValue({
          id: 'settings-123',
          name: 'default',
          isEnabled: true,
          welcomeMessage: 'Hi! How can I help you today?',
          theme: {
            primaryColor: '#3b82f6',
            textColor: '#1f2937',
            backgroundColor: '#ffffff'
          }
        });

        const response = await settingsGET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.settings.name).toBe('default');
        expect(data.settings.isEnabled).toBe(true);
        expect(data.settings.welcomeMessage).toBe('Hi! How can I help you today?');
      });

      it('returns existing settings', async () => {
        const { req } = createMocks({
          method: 'GET',
          query: {
            name: 'custom'
          }
        });

        const mockSettings = {
          id: 'settings-456',
          name: 'custom',
          isEnabled: true,
          welcomeMessage: 'Welcome to our custom chat!',
          theme: {
            primaryColor: '#ff0000',
            textColor: '#000000',
            backgroundColor: '#ffffff'
          }
        };

        mockPrisma.widgetSettings.findUnique.mockResolvedValue(mockSettings);

        const response = await settingsGET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.settings.name).toBe('custom');
        expect(data.settings.welcomeMessage).toBe('Welcome to our custom chat!');
        expect(data.settings.theme.primaryColor).toBe('#ff0000');
      });
    });
  });

  describe('System Status', () => {
    describe('GET /api/widget/status', () => {
      it('returns system health status', async () => {
        const { req } = createMocks({
          method: 'GET'
        });

        // Mock database queries for statistics
        mockPrisma.customer.count.mockResolvedValue(100);
        mockPrisma.conversationSession.count.mockResolvedValue(250);
        mockPrisma.chat.count.mockResolvedValue(200);
        mockPrisma.message.count.mockResolvedValue(1500);
        mockPrisma.chat.aggregate.mockResolvedValue({
          _avg: { avgResponseTime: 45 }
        });
        mockPrisma.$queryRaw.mockResolvedValue([{ count: 1 }]);

        const response = await statusGET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.status).toBe('healthy');
        expect(data.services.database.status).toBe('healthy');
        expect(data.statistics.customers.total).toBe(100);
        expect(data.statistics.messages.total).toBe(1500);
      });

      it('handles database connection errors', async () => {
        const { req } = createMocks({
          method: 'GET'
        });

        mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));

        const response = await statusGET(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.status).toBe('unhealthy');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles database errors gracefully', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          email: 'test@example.com',
          name: 'John Doe'
        }
      });

      mockPrisma.customer.findUnique.mockRejectedValue(new Error('Database error'));

      const response = await sessionPOST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create session');
    });

    it('validates request body format', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: 'invalid json'
      });

      const response = await sessionPOST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create session');
    });
  });
});
