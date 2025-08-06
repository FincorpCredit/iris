import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/test/messages?chatId=xxx
 * Test endpoint to check if messages are being saved correctly
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json(
        { error: 'chatId is required' },
        { status: 400 }
      );
    }

    // Get messages from database
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            profileImage: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      chatId,
      messageCount: messages.length,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderType: msg.senderType,
        messageType: msg.messageType,
        isFromAI: msg.isFromAI,
        createdAt: msg.createdAt,
        user: msg.user
      }))
    });

  } catch (error) {
    console.error('Test messages error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve test messages',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/test/messages
 * Test endpoint to create a message and see if real-time works
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { chatId, content, senderType = 'AGENT' } = body;

    if (!chatId || !content) {
      return NextResponse.json(
        { error: 'chatId and content are required' },
        { status: 400 }
      );
    }

    // Create test message
    const message = await prisma.message.create({
      data: {
        chatId,
        content,
        senderType,
        messageType: 'TEXT',
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
    console.error('Test message creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create test message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
