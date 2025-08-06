import { NextResponse } from 'next/server';

// POST /api/conversations/[id]/messages/read - Mark messages as read
export async function POST(request, { params }) {
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
