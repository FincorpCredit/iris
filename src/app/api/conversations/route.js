import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use a global prisma instance to avoid connection issues
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * GET /api/conversations
 * Fetch all conversations with their latest messages and assignment status
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const status = searchParams.get('status'); // 'assigned', 'unattended', 'all'

    // Build where clause based on status filter
    let whereClause = {
      deleted: false,
      status: {
        in: ['OPEN', 'IN_PROGRESS', 'WAITING'] // Active conversation statuses
      }
    };

    if (status === 'unattended') {
      whereClause.assignedAgentId = null; // AI-handled conversations
    } else if (status === 'assigned') {
      whereClause.assignedAgentId = { not: null }; // Agent-assigned conversations
    }
    // 'all' or no status filter shows everything

    // Fetch conversations with related data
    const conversations = await prisma.chat.findMany({
      where: whereClause,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            isOnline: true,
            lastSeenAt: true
          }
        },
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            status: true
          }
        },
        conversationSession: {
          select: {
            id: true,
            sessionToken: true,
            aiMessageCount: true,
            humanMessageCount: true,
            lastActivityAt: true
          }
        },
        message: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderType: true,
            isFromAI: true
          }
        }
      },
      orderBy: [
        { lastMessageAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Transform data for frontend
    const transformedConversations = conversations.map(chat => {
      const lastMessage = chat.message[0];
      
      return {
        id: chat.id,
        chatId: chat.id,
        conversationId: chat.conversationSessionId,
        name: chat.customer?.name || chat.customer?.email || 'Unknown Customer',
        email: chat.customer?.email,
        avatar: chat.customer?.avatar,
        lastMessage: lastMessage?.content || 'No messages yet',
        lastMessageAt: lastMessage?.createdAt || chat.createdAt,
        timestamp: lastMessage?.createdAt || chat.createdAt,
        unreadCount: chat.unreadCount || 0,
        isOnline: chat.customer?.isOnline || false,
        status: chat.status,
        priority: chat.priority,
        source: chat.source,
        assignedAgentId: chat.assignedAgentId,
        assignedAgent: chat.assignedAgent ? {
          id: chat.assignedAgent.id,
          name: chat.assignedAgent.name,
          email: chat.assignedAgent.email,
          profileImage: chat.assignedAgent.profileImage,
          status: chat.assignedAgent.status,
          isCurrentUser: false // TODO: Set based on current user
        } : null,
        aiEnabled: true, // TODO: Get from chat metadata or session
        messageCount: chat.messageCount || 0,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        // Legacy fields for compatibility
        agentType: chat.assignedAgentId ? 'human' : 'ai',
        assignedToMe: false, // TODO: Set based on current user
        assignedToOther: !!chat.assignedAgentId
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.chat.count({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      conversations: transformedConversations,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch conversations',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
