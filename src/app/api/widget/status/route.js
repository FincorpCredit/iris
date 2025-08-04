import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { realtimeService } from '@/lib/realtime-service';

const prisma = new PrismaClient();

/**
 * GET /api/widget/status
 * Get widget system status and health check
 */
export async function GET(request) {
  try {
    const startTime = Date.now();

    // Test database connection
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // Test real-time service
    let realtimeStatus = 'disabled';
    let realtimeInfo = null;
    try {
      if (!realtimeService.isConnected) {
        await realtimeService.initialize();
      }
      realtimeInfo = realtimeService.getConnectionStatus();
      realtimeStatus = realtimeInfo.isConnected ? 'healthy' : 'unhealthy';
    } catch (error) {
      realtimeStatus = 'unhealthy';
      console.error('Real-time service health check failed:', error);
    }

    // Get system statistics
    const stats = await getSystemStats();

    const totalResponseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        },
        realtime: {
          status: realtimeStatus,
          info: realtimeInfo
        },
        ai: {
          status: process.env.OPENROUTER_API_KEY ? 'configured' : 'not_configured',
          model: process.env.AI_MODEL || 'not_set'
        }
      },
      statistics: stats,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        status: 'unhealthy',
        error: 'System health check failed',
        timestamp: new Date().toISOString(),
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Get system statistics
 */
async function getSystemStats() {
  try {
    const [
      totalCustomers,
      activeCustomers,
      totalSessions,
      activeSessions,
      totalChats,
      openChats,
      totalMessages,
      todayMessages,
      avgResponseTime
    ] = await Promise.all([
      // Total customers
      prisma.customer.count(),
      
      // Active customers (online in last 30 minutes)
      prisma.customer.count({
        where: {
          lastSeenAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000)
          }
        }
      }),
      
      // Total conversation sessions
      prisma.conversation_session.count(),

      // Active sessions
      prisma.conversation_session.count({
        where: {
          isActive: true,
          lastActivityAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000)
          }
        }
      }),
      
      // Total chats
      prisma.chat.count({
        where: { deleted: false }
      }),
      
      // Open chats
      prisma.chat.count({
        where: {
          status: {
            in: ['OPEN', 'IN_PROGRESS', 'WAITING']
          },
          deleted: false
        }
      }),
      
      // Total messages
      prisma.message.count({
        where: { deletedAt: null }
      }),
      
      // Today's messages
      prisma.message.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          },
          deletedAt: null
        }
      }),
      
      // Average response time (simplified calculation)
      prisma.chat.aggregate({
        _avg: {
          avgResponseTime: true
        },
        where: {
          avgResponseTime: {
            not: null
          }
        }
      })
    ]);

    return {
      customers: {
        total: totalCustomers,
        active: activeCustomers
      },
      sessions: {
        total: totalSessions,
        active: activeSessions
      },
      chats: {
        total: totalChats,
        open: openChats
      },
      messages: {
        total: totalMessages,
        today: todayMessages
      },
      performance: {
        avgResponseTime: avgResponseTime._avg.avgResponseTime || 0
      }
    };

  } catch (error) {
    console.error('Error getting system stats:', error);
    return {
      customers: { total: 0, active: 0 },
      sessions: { total: 0, active: 0 },
      chats: { total: 0, open: 0 },
      messages: { total: 0, today: 0 },
      performance: { avgResponseTime: 0 }
    };
  }
}

/**
 * POST /api/widget/status
 * Perform system maintenance tasks
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    let result = {};

    switch (action) {
      case 'cleanup_expired_sessions':
        const expiredSessions = await prisma.conversation_session.updateMany({
          where: {
            isActive: true,
            lastActivityAt: {
              lt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes
            }
          },
          data: {
            isActive: false,
            endedAt: new Date()
          }
        });
        result = { expiredSessions: expiredSessions.count };
        break;

      case 'cleanup_expired_typing':
        const expiredTyping = await prisma.typing_indicator.deleteMany({
          where: {
            expiresAt: {
              lt: new Date()
            }
          }
        });
        result = { expiredTypingIndicators: expiredTyping.count };
        break;

      case 'update_customer_status':
        const offlineCustomers = await prisma.customer.updateMany({
          where: {
            isOnline: true,
            lastSeenAt: {
              lt: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
            }
          },
          data: {
            isOnline: false
          }
        });
        result = { customersSetOffline: offlineCustomers.count };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Maintenance action error:', error);
    
    return NextResponse.json(
      { 
        error: 'Maintenance action failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
