import { NextResponse } from 'next/server';

// Sample messages data for development
const sampleMessages = {
  '1': [
    {
      id: 'msg-1-1',
      content: 'I need help with my account setup. Can someone assist me?',
      senderType: 'CUSTOMER',
      messageType: 'TEXT',
      createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      user: { name: 'Customer' }
    },
    {
      id: 'msg-1-2',
      content: 'I\'ve been waiting for 45 minutes now. Is anyone available?',
      senderType: 'CUSTOMER',
      messageType: 'TEXT',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: { name: 'Customer' }
    },
    {
      id: 'msg-1-3',
      content: 'Hello! I can help you with your account setup. Let me take a look at your account.',
      senderType: 'AGENT',
      messageType: 'TEXT',
      isFromAI: false,
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      user: { name: 'Agent Smith', profileImage: null }
    }
  ],
  '2': [
    {
      id: 'msg-2-1',
      content: 'I was charged twice for my subscription. Please help.',
      senderType: 'CUSTOMER',
      messageType: 'TEXT',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Customer' }
    },
    {
      id: 'msg-2-2',
      content: 'I can see the duplicate charge on your account. Let me process a refund for you right away.',
      senderType: 'AGENT',
      messageType: 'TEXT',
      isFromAI: false,
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Agent Johnson', profileImage: null }
    }
  ],
  '3': [
    {
      id: 'msg-3-1',
      content: 'The app keeps crashing when I try to upload files.',
      senderType: 'CUSTOMER',
      messageType: 'TEXT',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Customer' }
    },
    {
      id: 'msg-3-2',
      content: 'I understand the issue. Can you tell me what type of files you\'re trying to upload and what device you\'re using?',
      senderType: 'AGENT',
      messageType: 'TEXT',
      isFromAI: false,
      createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(),
      user: { name: 'Agent Davis', profileImage: null }
    }
  ]
};

// GET /api/conversations/[id]/messages - Fetch messages for a conversation
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get messages for this conversation
    const messages = sampleMessages[id] || [];
    
    // Apply pagination
    const paginatedMessages = messages.slice(offset, offset + limit);
    const hasMore = offset + limit < messages.length;

    return NextResponse.json({
      success: true,
      messages: paginatedMessages,
      hasMore,
      total: messages.length
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Send a new message
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, messageType = 'TEXT', senderType = 'AGENT' } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Create new message
    const newMessage = {
      id: `msg-${id}-${Date.now()}`,
      content: content.trim(),
      senderType,
      messageType,
      createdAt: new Date().toISOString(),
      user: { 
        name: senderType === 'AGENT' ? 'Agent' : 'Customer',
        profileImage: null 
      }
    };

    // Add to sample messages (in a real app, this would save to database)
    if (!sampleMessages[id]) {
      sampleMessages[id] = [];
    }
    sampleMessages[id].push(newMessage);

    // Simulate AI response for customer messages
    if (senderType === 'CUSTOMER') {
      setTimeout(() => {
        const aiResponse = {
          id: `msg-${id}-${Date.now()}-ai`,
          content: 'Thank you for your message. I\'m processing your request and will get back to you shortly.',
          senderType: 'AGENT',
          messageType: 'TEXT',
          isFromAI: true,
          createdAt: new Date().toISOString(),
          user: { 
            name: 'AI Assistant',
            profileImage: null 
          }
        };
        sampleMessages[id].push(aiResponse);
      }, 1000);
    }

    return NextResponse.json({
      success: true,
      messageId: newMessage.id,
      message: newMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PUT /api/conversations/[id]/messages/read - Mark messages as read
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { messageIds } = body;

    if (!Array.isArray(messageIds)) {
      return NextResponse.json(
        { success: false, error: 'messageIds must be an array' },
        { status: 400 }
      );
    }

    // In a real app, this would update the database
    // For now, we'll just return success
    console.log(`Marking messages as read for conversation ${id}:`, messageIds);

    return NextResponse.json({
      success: true,
      markedAsRead: messageIds.length
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
