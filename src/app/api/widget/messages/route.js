import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { conversationService } from '@/lib/conversation-service';
import { aiService } from '@/lib/ai-service';
import { realtimeService } from '@/lib/realtime-service';

const prisma = new PrismaClient();

/**
 * POST /api/widget/messages
 * Send a message and get AI response
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionToken, message, messageType = 'TEXT' } = body;

    // Validate required fields
    if (!sessionToken || !message) {
      return NextResponse.json(
        { error: 'Session token and message are required' },
        { status: 400 }
      );
    }

    // Find session
    const session = await prisma.conversation_session.findUnique({
      where: { sessionToken },
      include: {
        customer: true
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!session.isActive) {
      return NextResponse.json(
        { error: 'Session is not active' },
        { status: 400 }
      );
    }

    // Get or create chat for this session
    const chat = await conversationService.getOrCreateChat(session.id, session.customerId);

    // Save customer message
    const customerMessage = await conversationService.saveMessage(
      chat.id,
      session.id,
      message,
      'CUSTOMER',
      null,
      {
        messageType,
        additionalData: {
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    );

    // Generate AI response
    const aiResponse = await aiService.generateResponse(
      message,
      session.id,
      session.customerId
    );

    // Save AI response
    const aiMessage = await conversationService.saveMessage(
      chat.id,
      session.id,
      aiResponse.content,
      'AI',
      null,
      {
        messageType: 'TEXT',
        aiModel: aiResponse.model,
        tokenUsage: aiResponse.tokenUsage,
        additionalData: {
          responseTime: new Date() - new Date(customerMessage.createdAt)
        }
      }
    );

    // Update session activity
    await conversationService.updateSessionActivity(session.id);

    // Broadcast messages via real-time if available
    try {
      if (realtimeService.isConnected) {
        // Note: In a real implementation, you might want to broadcast to agent dashboards
        // This is a placeholder for real-time broadcasting
        await realtimeService.broadcastMessageStatus(customerMessage.id, 'delivered', chat.id);
        await realtimeService.broadcastMessageStatus(aiMessage.id, 'delivered', chat.id);
      }
    } catch (error) {
      console.warn('Real-time broadcast failed:', error.message);
    }

    return NextResponse.json({
      success: true,
      messages: [
        {
          id: customerMessage.id,
          content: customerMessage.content,
          senderType: customerMessage.senderType,
          messageType: customerMessage.messageType,
          createdAt: customerMessage.createdAt,
          isFromAI: false
        },
        {
          id: aiMessage.id,
          content: aiMessage.content,
          senderType: aiMessage.senderType,
          messageType: aiMessage.messageType,
          createdAt: aiMessage.createdAt,
          isFromAI: true,
          aiModel: aiResponse.model,
          tokenUsage: aiResponse.tokenUsage
        }
      ],
      chat: {
        id: chat.id,
        status: chat.status,
        messageCount: chat.messageCount
      }
    });

  } catch (error) {
    console.error('Message sending error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/widget/messages?sessionToken=xxx&limit=50
 * Get conversation history
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get('sessionToken');
    const limit = parseInt(searchParams.get('limit')) || 50;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      );
    }

    // Find session
    const session = await prisma.conversation_session.findUnique({
      where: { sessionToken }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get conversation history
    const messages = await conversationService.getConversationHistory(session.id, limit);

    // Format messages for response
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      senderType: message.senderType,
      messageType: message.messageType,
      isFromAI: message.isFromAI,
      createdAt: message.createdAt,
      isRead: message.isRead,
      user: message.user ? {
        name: message.user.name,
        profileImage: message.user.profileImage
      } : null,
      aiModel: message.aiModel,
      tokenUsage: message.aiPromptTokens ? {
        promptTokens: message.aiPromptTokens,
        completionTokens: message.aiCompletionTokens
      } : null
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
      session: {
        id: session.id,
        messageCount: session.messageCount,
        isActive: session.isActive
      }
    });

  } catch (error) {
    console.error('Message retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve messages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/widget/messages
 * Mark messages as read
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { sessionToken, messageIds } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      );
    }

    // Find session and get chat
    const session = await prisma.conversation_session.findUnique({
      where: { sessionToken },
      include: {
        chats: {
          where: {
            status: {
              in: ['OPEN', 'IN_PROGRESS', 'WAITING']
            }
          },
          take: 1
        }
      }
    });

    if (!session || !session.chats.length) {
      return NextResponse.json(
        { error: 'Active chat not found' },
        { status: 404 }
      );
    }

    const chat = session.chats[0];

    // Mark messages as read
    await conversationService.markMessagesAsRead(chat.id, messageIds);

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to mark messages as read',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
