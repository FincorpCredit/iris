import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Use a global prisma instance to avoid connection issues
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * POST /api/widget/test-typing
 * Test endpoint to simulate agent typing indicators
 * This is for testing purposes only
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionToken, isTyping = true, agentName = 'Test Agent' } = body;

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

    // Find or create a test agent
    let testAgent = await prisma.user.findFirst({
      where: {
        email: 'test-agent@example.com'
      }
    });

    if (!testAgent) {
      // Create a test agent if it doesn't exist
      const adminRole = await prisma.role.findFirst({
        where: { name: 'ADMIN' }
      });

      if (adminRole) {
        testAgent = await prisma.user.create({
          data: {
            email: 'test-agent@example.com',
            name: agentName,
            passwordHash: 'test-hash', // This is just for testing
            roleId: adminRole.id,
            status: 'ONLINE'
          }
        });
      }
    }

    if (!testAgent) {
      return NextResponse.json(
        { error: 'Could not create test agent' },
        { status: 500 }
      );
    }

    if (isTyping) {
      // Create or update typing indicator for the test agent
      const expiresAt = new Date(Date.now() + 10000); // Expire in 10 seconds

      // First, try to find existing typing indicator
      const existingIndicator = await prisma.typing_indicator.findFirst({
        where: {
          conversationSessionId: session.id,
          userId: testAgent.id,
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
            userId: testAgent.id,
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
          userId: testAgent.id
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Test agent typing indicator ${isTyping ? 'started' : 'stopped'}`,
      typing: {
        isTyping,
        sessionId: session.id,
        agentId: testAgent.id,
        agentName: testAgent.name,
        chatId
      }
    });

  } catch (error) {
    console.error('Test typing indicator error:', error);

    return NextResponse.json(
      {
        error: 'Failed to update test typing indicator',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
