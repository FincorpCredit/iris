import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { conversationService } from '@/lib/conversation-service';
import { realtimeService } from '@/lib/realtime-service';

const prisma = new PrismaClient();

/**
 * POST /api/widget/session
 * Create or retrieve a conversation session for a customer
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, phone, metadata = {} } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Extract client metadata
    const clientMetadata = {
      ...metadata,
      name,
      phone,
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referrer: request.headers.get('referer') || 'direct'
    };

    // Get or create session
    const { session, customer, isNewSession } = await conversationService.getOrCreateSession(
      email,
      clientMetadata
    );

    // Initialize real-time connection if available
    let realtimeStatus = null;
    try {
      if (!realtimeService.isConnected) {
        await realtimeService.initialize();
      }
      realtimeStatus = realtimeService.getConnectionStatus();
    } catch (error) {
      console.warn('Real-time service initialization failed:', error.message);
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionToken: session.sessionToken,
        isActive: session.isActive,
        startedAt: session.startedAt,
        lastActivityAt: session.lastActivityAt
      },
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        isOnline: customer.isOnline,
        lastSeenAt: customer.lastSeenAt
      },
      isNewSession,
      realtimeStatus
    });

  } catch (error) {
    console.error('Session creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create session',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/widget/session?sessionToken=xxx
 * Retrieve session information
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
      where: { sessionToken },
      include: {
        customer: {
          include: {
            customerProfile: true
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session is still active
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes
    const isExpired = new Date() - new Date(session.lastActivityAt) > sessionTimeout;

    if (isExpired && session.isActive) {
      // Mark session as inactive
      await conversationService.endSession(session.id);
      session.isActive = false;
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionToken: session.sessionToken,
        isActive: session.isActive && !isExpired,
        startedAt: session.startedAt,
        lastActivityAt: session.lastActivityAt,
        messageCount: session.messageCount
      },
      customer: {
        id: session.customer.id,
        email: session.customer.email,
        name: session.customer.name,
        phone: session.customer.phone,
        isOnline: session.customer.isOnline,
        lastSeenAt: session.customer.lastSeenAt
      }
    });

  } catch (error) {
    console.error('Session retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve session',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/widget/session
 * Update session activity or end session
 */
export async function PUT(request) {
  try {
    const body = await request.json();
    const { sessionToken, action, customerSatisfaction } = body;

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

    let updatedSession;

    if (action === 'end') {
      // End session
      updatedSession = await conversationService.endSession(session.id, customerSatisfaction);
    } else {
      // Update activity
      await conversationService.updateSessionActivity(session.id);
      updatedSession = await prisma.conversation_session.findUnique({
        where: { id: session.id }
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        sessionToken: updatedSession.sessionToken,
        isActive: updatedSession.isActive,
        endedAt: updatedSession.endedAt,
        customerSatisfaction: updatedSession.customerSatisfaction
      }
    });

  } catch (error) {
    console.error('Session update error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update session',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
