import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use a global prisma instance to avoid connection issues
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * GET /api/conversations/[id]
 * Fetch a single conversation by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Fetch conversation with related data
    const chat = await prisma.chat.findUnique({
      where: { id },
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
      }
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Transform data for frontend
    const lastMessage = chat.message[0];
    
    const transformedConversation = {
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

    return NextResponse.json({
      success: true,
      conversation: transformedConversation
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch conversation',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
