import { PrismaClient } from '@prisma/client';
import { realtimeService } from './realtime-service';

const prisma = new PrismaClient();

/**
 * Agent Chat Service
 * Handles chat operations for agents in the dashboard
 */
export class AgentChatService {
  constructor() {
    this.subscriptions = new Map();
  }

  /**
   * Get chats assigned to an agent
   */
  async getAgentChats(agentId, filters = {}) {
    try {
      const {
        status = ['OPEN', 'IN_PROGRESS', 'WAITING'],
        priority,
        source,
        limit = 50,
        offset = 0
      } = filters;

      const whereClause = {
        assignedAgentId: agentId,
        deleted: false
      };

      if (status.length > 0) {
        whereClause.status = { in: status };
      }

      if (priority) {
        whereClause.priority = priority;
      }

      if (source) {
        whereClause.source = source;
      }

      const chats = await prisma.chat.findMany({
        where: whereClause,
        include: {
          customer: {
            include: {
              customer_profile: true
            }
          },
          conversation_session: true,
          message: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              user: {
                select: {
                  name: true,
                  profileImage: true
                }
              }
            }
          },
          _count: {
            select: {
              message: {
                where: {
                  isRead: false,
                  senderType: 'CUSTOMER'
                }
              }
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { lastMessageAt: 'desc' }
        ],
        take: limit,
        skip: offset
      });

      return chats.map(chat => ({
        id: chat.id,
        customerId: chat.customerId,
        customer: {
          id: chat.customer.id,
          name: chat.customer.name,
          email: chat.customer.email,
          phone: chat.customer.phone,
          avatar: chat.customer.avatar,
          isOnline: chat.customer.isOnline,
          lastSeenAt: chat.customer.lastSeenAt,
          profile: chat.customer.customer_profile
        },
        status: chat.status,
        priority: chat.priority,
        source: chat.source,
        tags: chat.tags,
        satisfied: chat.satisfied,
        messageCount: chat.messageCount,
        unreadCount: chat._count.message,
        lastMessage: chat.message[0] ? {
          id: chat.message[0].id,
          content: chat.message[0].content,
          senderType: chat.message[0].senderType,
          isFromAI: chat.message[0].isFromAI,
          createdAt: chat.message[0].createdAt,
          user: chat.message[0].user
        } : null,
        lastMessageAt: chat.lastMessageAt,
        conversationSession: chat.conversation_session ? {
          id: chat.conversation_session.id,
          isActive: chat.conversation_session.isActive,
          startedAt: chat.conversation_session.startedAt
        } : null,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }));

    } catch (error) {
      console.error('Error getting agent chats:', error);
      throw error;
    }
  }

  /**
   * Get unassigned chats (for assignment)
   */
  async getUnassignedChats(filters = {}) {
    try {
      const {
        status = ['OPEN'],
        priority,
        source,
        limit = 20
      } = filters;

      const whereClause = {
        assignedAgentId: null,
        deleted: false,
        status: { in: status }
      };

      if (priority) {
        whereClause.priority = priority;
      }

      if (source) {
        whereClause.source = source;
      }

      const chats = await prisma.chat.findMany({
        where: whereClause,
        include: {
          customer: {
            include: {
              customer_profile: true
            }
          },
          conversation_session: true,
          message: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' } // Oldest first for fairness
        ],
        take: limit
      });

      return chats.map(chat => ({
        id: chat.id,
        customer: {
          id: chat.customer.id,
          name: chat.customer.name,
          email: chat.customer.email,
          phone: chat.customer.phone,
          isOnline: chat.customer.isOnline,
          profile: chat.customer.customer_profile
        },
        status: chat.status,
        priority: chat.priority,
        source: chat.source,
        messageCount: chat.messageCount,
        lastMessage: chat.message[0],
        waitingTime: Date.now() - new Date(chat.createdAt).getTime(),
        createdAt: chat.createdAt
      }));

    } catch (error) {
      console.error('Error getting unassigned chats:', error);
      throw error;
    }
  }

  /**
   * Assign chat to agent
   */
  async assignChatToAgent(chatId, agentId) {
    try {
      const chat = await prisma.chat.update({
        where: { id: chatId },
        data: {
          assignedAgentId: agentId,
          status: 'IN_PROGRESS',
          updatedAt: new Date()
        },
        include: {
          customer: true,
          assignedAgent: {
            select: {
              name: true,
              profileImage: true
            }
          }
        }
      });

      // Create notification for assignment
      await this.createChatNotification(
        chatId,
        agentId,
        'CHAT_ASSIGNED',
        'New chat assigned',
        `Chat with ${chat.customer.name || chat.customer.email} has been assigned to you`
      );

      // Send system message
      await prisma.message.create({
        data: {
          chatId,
          conversationSessionId: chat.conversationSessionId,
          senderType: 'SYSTEM',
          content: `Chat assigned to ${chat.assignedAgent.name}`,
          messageType: 'SYSTEM',
          isFromAI: false
        }
      });

      return chat;

    } catch (error) {
      console.error('Error assigning chat to agent:', error);
      throw error;
    }
  }

  /**
   * Transfer chat to another agent
   */
  async transferChat(chatId, fromAgentId, toAgentId, reason = '') {
    try {
      const chat = await prisma.chat.update({
        where: { 
          id: chatId,
          assignedAgentId: fromAgentId
        },
        data: {
          assignedAgentId: toAgentId,
          updatedAt: new Date()
        },
        include: {
          customer: true,
          assignedAgent: {
            select: {
              name: true,
              profileImage: true
            }
          }
        }
      });

      // Create notifications
      await Promise.all([
        this.createChatNotification(
          chatId,
          toAgentId,
          'CHAT_TRANSFERRED',
          'Chat transferred to you',
          `Chat with ${chat.customer.name || chat.customer.email} has been transferred to you${reason ? `: ${reason}` : ''}`
        ),
        this.createChatNotification(
          chatId,
          fromAgentId,
          'CHAT_TRANSFERRED',
          'Chat transferred',
          `Chat with ${chat.customer.name || chat.customer.email} has been transferred to ${chat.assignedAgent.name}`
        )
      ]);

      // Send system message
      await prisma.message.create({
        data: {
          chatId,
          conversationSessionId: chat.conversationSessionId,
          senderType: 'SYSTEM',
          content: `Chat transferred to ${chat.assignedAgent.name}${reason ? `: ${reason}` : ''}`,
          messageType: 'SYSTEM',
          isFromAI: false
        }
      });

      return chat;

    } catch (error) {
      console.error('Error transferring chat:', error);
      throw error;
    }
  }

  /**
   * Get chat messages for agent
   */
  async getChatMessages(chatId, agentId, limit = 50, offset = 0) {
    try {
      // Verify agent has access to this chat
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          OR: [
            { assignedAgentId: agentId },
            { assignedAgentId: null } // Unassigned chats
          ]
        }
      });

      if (!chat) {
        throw new Error('Chat not found or access denied');
      }

      const messages = await prisma.message.findMany({
        where: {
          chatId,
          deletedAt: null
        },
        include: {
          user: {
            select: {
              name: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset
      });

      return messages.map(message => ({
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        messageType: message.messageType,
        isFromAI: message.isFromAI,
        aiModel: message.aiModel,
        attachments: message.attachments,
        isRead: message.isRead,
        readAt: message.readAt,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
        user: message.user
      }));

    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * Send message as agent
   */
  async sendAgentMessage(chatId, agentId, content, messageType = 'TEXT') {
    try {
      // Verify agent has access to this chat
      const chat = await prisma.chat.findFirst({
        where: {
          id: chatId,
          assignedAgentId: agentId
        }
      });

      if (!chat) {
        throw new Error('Chat not found or access denied');
      }

      const message = await prisma.message.create({
        data: {
          chatId,
          conversationSessionId: chat.conversationSessionId,
          senderId: agentId,
          senderType: 'AGENT',
          content,
          messageType,
          isFromAI: false,
          isRead: true,
          deliveredAt: new Date()
        },
        include: {
          user: {
            select: {
              name: true,
              profileImage: true
            }
          }
        }
      });

      // Update chat statistics
      await this.updateChatStats(chatId);

      // Broadcast new message via real-time
      try {
        if (realtimeService.isConnected) {
          await realtimeService.broadcastNewMessage(message, chatId);
        }
      } catch (error) {
        console.warn('Failed to broadcast agent message:', error.message);
      }

      return message;

    } catch (error) {
      console.error('Error sending agent message:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read by agent
   */
  async markMessagesAsRead(chatId, agentId, messageIds = null) {
    try {
      const whereClause = {
        chatId,
        isRead: false,
        senderType: 'CUSTOMER'
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
      throw error;
    }
  }

  /**
   * Create chat notification
   */
  async createChatNotification(chatId, userId, type, title, message, actionUrl = null) {
    try {
      const notification = await prisma.chat_notification.create({
        data: {
          chatId,
          userId,
          type,
          title,
          message,
          actionUrl,
          isRead: false
        }
      });

      // Broadcast notification via real-time if available
      try {
        if (realtimeService.isConnected) {
          // This would be handled by the real-time service
          // In a production app, you might want to broadcast to specific user channels
        }
      } catch (error) {
        console.warn('Real-time notification broadcast failed:', error.message);
      }

      return notification;

    } catch (error) {
      console.error('Error creating chat notification:', error);
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
   * Subscribe to real-time updates for agent
   */
  subscribeToAgentUpdates(agentId, callback) {
    if (!realtimeService.isConnected) {
      console.warn('Real-time service not available');
      return null;
    }

    const subscriptionKey = `agent_${agentId}`;
    
    // Subscribe to notifications
    const notificationSub = realtimeService.subscribeToChatNotifications(agentId, callback);
    
    this.subscriptions.set(subscriptionKey, notificationSub);
    return subscriptionKey;
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromUpdates(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      realtimeService.unsubscribe(subscription);
      this.subscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Cleanup
   */
  async disconnect() {
    // Unsubscribe from all real-time updates
    for (const [key, subscription] of this.subscriptions) {
      realtimeService.unsubscribe(subscription);
    }
    this.subscriptions.clear();

    // Disconnect from database
    await prisma.$disconnect();
  }
}

// Export singleton instance
export const agentChatService = new AgentChatService();
