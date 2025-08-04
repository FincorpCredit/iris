// src/app/api/auth/refresh/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken, generateTokenPair } from '@/lib/jwt';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Check if user is deleted
    if (user.deleted) {
      return NextResponse.json(
        { error: 'Account has been deactivated' },
        { status: 401 }
      );
    }

    // Generate new token pair
    const tokens = generateTokenPair(user);

    // Update last active time
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: new Date()
      }
    });

    // Prepare user data (exclude sensitive information)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      permissions: user.role.permissions,
      status: user.status,
      authPreference: user.authPreference,
      mustChangePassword: user.mustChangePassword,
      profileImage: user.profileImage,
      department: user.department
    };

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      user: userData,
      tokens: tokens
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
