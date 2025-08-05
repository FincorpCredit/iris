import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { realtimeService } from '@/lib/realtime-service';

// Use a global prisma instance to avoid connection issues
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * POST /api/widget/typing
 * Broadcast typing indicator status via real-time
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

    // Use chatId if available, otherwise use sessionId as channel identifier
    const channelId = session.chats.length > 0 ? session.chats[0].id : session.id;

    // Initialize and broadcast typing status via real-time
    try {
      // Initialize real-time service if not already connected
      if (!realtimeService.isConnected) {
        await realtimeService.initialize();
      }

      // Only broadcast if real-time service is available
      if (realtimeService.isConnected) {
        await realtimeService.broadcastTypingIndicator(
          channelId,
          isTyping,
          'CUSTOMER',
          session.customerId
        );
      } else {
        console.warn('Real-time service not available, skipping typing broadcast');
      }
    } catch (error) {
      console.error('Real-time typing broadcast failed:', error);
      // Don't return error for typing indicators - it's not critical
      // Just log and continue
    }

    return NextResponse.json({
      success: true,
      typing: {
        isTyping,
        sessionId: session.id,
        customerId: session.customerId,
        channelId
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


