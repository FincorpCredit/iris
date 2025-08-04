import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * Service for managing conversation sessions and customer interactions
 */
export class ConversationService {
  constructor() {
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes in milliseconds
  }

  /**
   * Create or retrieve a conversation session for a customer
   */
  async getOrCreateSession(customerEmail, metadata = {}) {
    try {
      // Find or create customer
      const customer = await this.findOrCreateCustomer(customerEmail, metadata);
      
      // Check for active session
      let session = await prisma.conversation_session.findFirst({
        where: {
          customerId: customer.id,
          isActive: true,
          lastActivityAt: {
            gte: new Date(Date.now() - this.sessionTimeout)
          }
        }
      });

      // Create new session if none exists or expired
      if (!session) {
        session = await prisma.conversation_session.create({
          data: {
            customerId: customer.id,
            sessionToken: uuidv4(),
            isActive: true,
            startedAt: new Date(),
            lastActivityAt: new Date(),
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            referrer: metadata.referrer
          }
        });
      }

      return {
        session,
        customer,
        isNewSession: !session.id
      };
    } catch (error) {
      console.error('Error getting/creating session:', error);
      throw error;
    }
  }

  /**
   * Find or create customer by email
   */
  async findOrCreateCustomer(email, metadata = {}) {
    try {
      let customer = await prisma.customer.findUnique({
        where: { email },
        include: {
          customer_profile: true
        }
      });

      if (!customer) {
        // Create new customer
        customer = await prisma.customer.create({
          data: {
            email,
            name: metadata.name || null,
            phone: metadata.phone || null,
            timezone: metadata.timezone || 'UTC',
            language: metadata.language || 'en',
            isOnline: true,
            lastSeenAt: new Date(),
            metadata: metadata.customFields || {}
          }
        });

        // Create customer profile if additional info provided
        if (metadata.company || metadata.jobTitle || metadata.industry) {
          await prisma.customer_profile.create({
            data: {
              customerId: customer.id,
              company: metadata.company,
              jobTitle: metadata.jobTitle,
              industry: metadata.industry,
              website: metadata.website,
              location: metadata.location,
              customFields: metadata.profileFields || {}
            }
          });
        }
      } else {
        // Update customer activity
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            isOnline: true,
            lastSeenAt: new Date()
          }
        });
      }

      return customer;
    } catch (error) {
      console.error('Error finding/creating customer:', error);
      throw error;
    }
  }

  /**
   * Update session activity
   */
  async updateSessionActivity(sessionId) {
    try {
      await prisma.conversation_session.update({
        where: { id: sessionId },
        data: {
          lastActivityAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * End a conversation session
   */
  async endSession(sessionId, customerSatisfaction = null) {
    try {
      const session = await prisma.conversation_session.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endedAt: new Date(),
          customerSatisfaction
        }
      });

      // Update customer status to offline if no other active sessions
      const activeSessionsCount = await prisma.conversation_session.count({
        where: {
          customerId: session.customerId,
          isActive: true
        }
      });

      if (activeSessionsCount === 0) {
        await prisma.customer.update({
          where: { id: session.customerId },
          data: {
            isOnline: false
          }
        });
      }

      return session;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Create or get chat for session
   */
  async getOrCreateChat(sessionId, customerId) {
    try {
      // Check for existing open chat in this session
      let chat = await prisma.chat.findFirst({
        where: {
          conversationSessionId: sessionId,
          status: {
            in: ['OPEN', 'IN_PROGRESS', 'WAITING']
          }
        }
      });

      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            customerId,
            conversationSessionId: sessionId,
            status: 'OPEN',
            priority: 'MEDIUM',
            source: 'WIDGET',
            lastMessageAt: new Date()
          }
        });
      }

      return chat;
    } catch (error) {
      console.error('Error getting/creating chat:', error);
      throw error;
    }
  }

  /**
   * Save message to database
   */
  async saveMessage(chatId, conversationSessionId, content, senderType, senderId = null, metadata = {}) {
    try {
      const message = await prisma.message.create({
        data: {
          chatId,
          conversationSessionId,
          senderId,
          senderType,
          content,
          messageType: metadata.messageType || 'TEXT',
          isFromAI: senderType === 'AI',
          aiModel: metadata.aiModel,
          aiPromptTokens: metadata.tokenUsage?.promptTokens,
          aiCompletionTokens: metadata.tokenUsage?.completionTokens,
          attachments: metadata.attachments,
          metadata: metadata.additionalData,
          isRead: senderType === 'CUSTOMER' ? false : true, // Customer messages start as unread
          deliveredAt: new Date()
        }
      });

      // Update chat statistics
      await this.updateChatStats(chatId);
      
      // Update session statistics
      await this.updateSessionStats(conversationSessionId, senderType);

      return message;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Update chat statistics
   */
  async updateChatStats(chatId) {
    try {
      const messageCount = await prisma.message.count({
        where: { chatId }
      });

      const unreadCount = await prisma.message.count({
        where: {
          chatId,
          isRead: false,
          senderType: 'CUSTOMER'
        }
      });

      await prisma.chat.update({
        where: { id: chatId },
        data: {
          messageCount,
          unreadCount,
          lastMessageAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating chat stats:', error);
    }
  }

  /**
   * Update session statistics
   */
  async updateSessionStats(sessionId, senderType) {
    try {
      const totalMessages = await prisma.message.count({
        where: { conversationSessionId: sessionId }
      });

      const aiMessages = await prisma.message.count({
        where: {
          conversationSessionId: sessionId,
          senderType: 'AI'
        }
      });

      const humanMessages = totalMessages - aiMessages;

      await prisma.conversation_session.update({
        where: { id: sessionId },
        data: {
          messageCount: totalMessages,
          aiMessageCount: aiMessages,
          humanMessageCount: humanMessages,
          lastActivityAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(sessionId, limit = 50) {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversationSessionId: sessionId,
          deletedAt: null
        },
        orderBy: {
          createdAt: 'asc'
        },
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              profileImage: true
            }
          }
        }
      });

      return messages;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(chatId, messageIds = null) {
    try {
      const whereClause = {
        chatId,
        isRead: false
      };

      if (messageIds && messageIds.length > 0) {
        whereClause.id = { in: messageIds };
      }

      await prisma.message.updateMany({
        where: whereClause,
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Update chat unread count
      await this.updateChatStats(chatId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    try {
      const expiredSessions = await prisma.conversation_session.updateMany({
        where: {
          isActive: true,
          lastActivityAt: {
            lt: new Date(Date.now() - this.sessionTimeout)
          }
        },
        data: {
          isActive: false,
          endedAt: new Date()
        }
      });

      console.log(`Cleaned up ${expiredSessions.count} expired sessions`);
      return expiredSessions.count;
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const conversationService = new ConversationService();
