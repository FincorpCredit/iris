import { NextResponse } from 'next/server';
import { agentChatService } from '@/lib/agent-chat-service';
import { verifyToken } from '@/lib/jwt';

/**
 * GET /api/agent/chats/[chatId]/messages
 * Get messages for a specific chat
 */
export async function GET(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const agentId = decoded.userId;
    const { chatId } = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;

    // Get chat messages
    const messages = await agentChatService.getChatMessages(chatId, agentId, limit, offset);

    return NextResponse.json({
      success: true,
      messages,
      chatId,
      total: messages.length
    });

  } catch (error) {
    console.error('Chat messages retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve messages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/chats/[chatId]/messages
 * Send a message as an agent
 */
export async function POST(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const agentId = decoded.userId;
    const { chatId } = await params;
    const body = await request.json();
    const { content, messageType = 'TEXT' } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Send message
    const message = await agentChatService.sendAgentMessage(
      chatId,
      agentId,
      content.trim(),
      messageType
    );

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderType: message.senderType,
        messageType: message.messageType,
        isFromAI: message.isFromAI,
        createdAt: message.createdAt,
        user: message.user
      }
    });

  } catch (error) {
    console.error('Send agent message error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/agent/chats/[chatId]/messages
 * Mark messages as read
 */
export async function PUT(request, { params }) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const agentId = decoded.userId;
    const chatId = params.chatId;
    const body = await request.json();
    const { messageIds } = body;

    // Mark messages as read
    await agentChatService.markMessagesAsRead(chatId, agentId, messageIds);

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
  }
}
