import { NextResponse } from 'next/server';
import { agentChatService } from '@/lib/agent-chat-service';
import { verifyToken } from '@/lib/jwt';

/**
 * GET /api/agent/chats/unassigned
 * Get unassigned chats available for assignment
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

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters = {
      status: searchParams.get('status')?.split(',') || ['OPEN'],
      priority: searchParams.get('priority') || undefined,
      source: searchParams.get('source') || undefined,
      limit: parseInt(searchParams.get('limit')) || 20
    };

    // Get unassigned chats
    const chats = await agentChatService.getUnassignedChats(filters);

    // Calculate waiting times and priority scores
    const enrichedChats = chats.map(chat => ({
      ...chat,
      waitingTimeFormatted: formatWaitingTime(chat.waitingTime),
      priorityScore: calculatePriorityScore(chat)
    }));

    return NextResponse.json({
      success: true,
      chats: enrichedChats,
      total: enrichedChats.length,
      filters
    });

  } catch (error) {
    console.error('Unassigned chats retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve unassigned chats',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Format waiting time in human-readable format
 */
function formatWaitingTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calculate priority score for sorting
 */
function calculatePriorityScore(chat) {
  let score = 0;
  
  // Priority weight
  switch (chat.priority) {
    case 'URGENT':
      score += 100;
      break;
    case 'HIGH':
      score += 75;
      break;
    case 'MEDIUM':
      score += 50;
      break;
    case 'LOW':
      score += 25;
      break;
  }
  
  // Waiting time weight (more urgent as time passes)
  const waitingHours = chat.waitingTime / (1000 * 60 * 60);
  score += Math.min(waitingHours * 10, 50); // Cap at 50 points for waiting time
  
  // Message count weight (more messages = more engaged customer)
  score += Math.min(chat.messageCount * 2, 20); // Cap at 20 points for message count
  
  return Math.round(score);
}
