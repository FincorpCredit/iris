import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { realtimeService } from '@/lib/realtime-service';

// Use a global prisma instance to avoid connection issues
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * POST /api/widget/typing
 * Update typing indicator status
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionToken, isTyping = true } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token is required' },
        { status: 400 }
      );
    }

    // Find session
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

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const chatId = session.chats.length > 0 ? session.chats[0].id : null;

    if (isTyping) {
      // Create or update typing indicator
      const expiresAt = new Date(Date.now() + 10000); // Expire in 10 seconds

      // First, try to find existing typing indicator
      const existingIndicator = await prisma.typing_indicator.findFirst({
        where: {
          conversationSessionId: session.id,
          customerId: session.customerId,
          isTyping: true
        }
      });

      if (existingIndicator) {
        // Update existing indicator
        await prisma.typing_indicator.update({
          where: {
            id: existingIndicator.id
          },
          data: {
            lastTypingAt: new Date(),
            expiresAt
          }
        });
      } else {
        // Create new indicator
        await prisma.typing_indicator.create({
          data: {
            chatId,
            conversationSessionId: session.id,
            customerId: session.customerId,
            isTyping: true,
            lastTypingAt: new Date(),
            expiresAt
          }
        });
      }
    } else {
      // Remove typing indicator
      await prisma.typing_indicator.deleteMany({
        where: {
          conversationSessionId: session.id,
          customerId: session.customerId
        }
      });
    }

    // Broadcast typing status via real-time if available
    try {
      if (realtimeService.isConnected && chatId) {
        await realtimeService.broadcastTypingIndicator(
          chatId,
          isTyping,
          'CUSTOMER',
          session.customerId
        );
      }
    } catch (error) {
      console.warn('Real-time typing broadcast failed:', error.message);
    }

    return NextResponse.json({
      success: true,
      typing: {
        isTyping,
        sessionId: session.id,
        customerId: session.customerId,
        chatId
      }
    });

  } catch (error) {
    console.error('Typing indicator error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update typing indicator',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/widget/typing?sessionToken=xxx
 * Get current typing indicators for a session
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get('sessionToken');

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

    // Clean up expired typing indicators first
    try {
      await prisma.typing_indicator.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    } catch (cleanupError) {
      console.warn('Failed to cleanup expired typing indicators:', cleanupError);
      // Continue execution even if cleanup fails
    }

    // Get active typing indicators for this session (only show agent typing to customers)
    const typingIndicators = await prisma.typing_indicator.findMany({
      where: {
        conversationSessionId: session.id,
        isTyping: true,
        userId: { not: null }, // Only show agent typing indicators
        expiresAt: {
          gt: new Date()
        }
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

    const formattedIndicators = typingIndicators.map(indicator => ({
      id: indicator.id,
      userType: 'AGENT', // These are always agents since we filtered for userId not null
      userId: indicator.userId,
      customerId: indicator.customerId,
      user: indicator.user,
      lastTypingAt: indicator.lastTypingAt,
      expiresAt: indicator.expiresAt
    }));

    return NextResponse.json({
      success: true,
      typingIndicators: formattedIndicators,
      hasTypingUsers: formattedIndicators.length > 0
    });

  } catch (error) {
    console.error('Get typing indicators error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get typing indicators',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/widget/typing
 * Clear typing indicator for a session
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get('sessionToken');

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

    // Remove all typing indicators for this session
    await prisma.typing_indicator.deleteMany({
      where: {
        conversationSessionId: session.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Typing indicators cleared'
    });

  } catch (error) {
    console.error('Clear typing indicators error:', error);

    return NextResponse.json(
      {
        error: 'Failed to clear typing indicators',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
