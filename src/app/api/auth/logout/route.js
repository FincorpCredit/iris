// src/app/api/auth/logout/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/jwt';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Update user status to offline
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        status: 'OFFLINE',
        lastActiveAt: new Date()
      }
    });

    // Log the logout for audit
    await prisma.auditlog.create({
      data: {
        userId: decoded.userId,
        action: 'LOGOUT',
        resource: 'AUTH',
        resourceId: decoded.userId,
        metadata: JSON.stringify({
          logoutTime: new Date(),
          userAgent: request.headers.get('user-agent') || 'Unknown'
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
