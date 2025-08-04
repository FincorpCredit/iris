import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/jwt';

const prisma = new PrismaClient();

/**
 * GET /api/agent/notifications
 * Get notifications for the authenticated agent
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
    
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const unreadOnly = searchParams.get('unread_only') === 'true';

    // Build where clause
    const whereClause = {
      userId: agentId
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    // Get notifications
    const notifications = await prisma.chat_notification.findMany({
      where: whereClause,
      include: {
        chat: {
          include: {
            customer: {
              select: {
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get unread count
    const unreadCount = await prisma.chat_notification.count({
      where: {
        userId: agentId,
        isRead: false
      }
    });

    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      readAt: notification.readAt,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
      chat: notification.chat ? {
        id: notification.chat.id,
        status: notification.chat.status,
        priority: notification.chat.priority,
        customer: notification.chat.customer
      } : null
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('Notifications retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve notifications',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/agent/notifications
 * Mark notifications as read
 */
export async function PUT(request) {
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
    const { notificationIds, markAllAsRead = false } = body;

    let updateResult;

    if (markAllAsRead) {
      // Mark all notifications as read for this agent
      updateResult = await prisma.chat_notification.updateMany({
        where: {
          userId: agentId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      updateResult = await prisma.chat_notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: agentId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationIds or markAllAsRead must be provided' },
        { status: 400 }
      );
    }

    // Get updated unread count
    const unreadCount = await prisma.chat_notification.count({
      where: {
        userId: agentId,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
      unreadCount,
      message: markAllAsRead 
        ? 'All notifications marked as read' 
        : `${updateResult.count} notifications marked as read`
    });

  } catch (error) {
    console.error('Mark notifications as read error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to mark notifications as read',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/agent/notifications
 * Delete notifications
 */
export async function DELETE(request) {
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
    const notificationIds = searchParams.get('ids')?.split(',') || [];

    if (notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    // Delete notifications
    const deleteResult = await prisma.chat_notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: agentId
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `${deleteResult.count} notifications deleted`
    });

  } catch (error) {
    console.error('Delete notifications error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete notifications',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
