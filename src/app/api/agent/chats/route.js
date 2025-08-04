import { NextResponse } from 'next/server';
import { agentChatService } from '@/lib/agent-chat-service';
import { verifyToken } from '@/lib/jwt';

/**
 * GET /api/agent/chats
 * Get chats assigned to the authenticated agent
 */
export async function GET(request) {
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
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters = {
      status: searchParams.get('status')?.split(',') || ['OPEN', 'IN_PROGRESS', 'WAITING'],
      priority: searchParams.get('priority') || undefined,
      source: searchParams.get('source') || undefined,
      limit: parseInt(searchParams.get('limit')) || 50,
      offset: parseInt(searchParams.get('offset')) || 0
    };

    // Get agent chats
    const chats = await agentChatService.getAgentChats(agentId, filters);

    return NextResponse.json({
      success: true,
      chats,
      total: chats.length,
      filters
    });

  } catch (error) {
    console.error('Agent chats retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve chats',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/chats
 * Assign a chat to the authenticated agent
 */
export async function POST(request) {
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
    const body = await request.json();
    const { chatId, action } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'assign':
        result = await agentChatService.assignChatToAgent(chatId, agentId);
        break;
      
      case 'transfer':
        const { toAgentId, reason } = body;
        if (!toAgentId) {
          return NextResponse.json(
            { error: 'Target agent ID is required for transfer' },
            { status: 400 }
          );
        }
        result = await agentChatService.transferChat(chatId, agentId, toAgentId, reason);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      chat: result,
      action
    });

  } catch (error) {
    console.error('Agent chat action error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform chat action',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
