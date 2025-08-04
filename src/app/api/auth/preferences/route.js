// src/app/api/auth/preferences/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { userId, authPreference } = await request.json();

    // Validate input
    if (!userId || !authPreference) {
      return NextResponse.json(
        { error: 'User ID and authentication preference are required' },
        { status: 400 }
      );
    }

    // Validate authPreference value
    if (!['PASSWORD', 'CODE'].includes(authPreference)) {
      return NextResponse.json(
        { error: 'Invalid authentication preference. Must be PASSWORD or CODE' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user's authentication preference
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        authPreference: authPreference,
        // Clear temporary code data when switching to password auth
        ...(authPreference === 'PASSWORD' && {
          tempCode: null,
          tempCodeExpiry: null
        })
      },
      select: {
        id: true,
        name: true,
        email: true,
        authPreference: true
      }
    });

    // Log the action for audit
    await prisma.auditlog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_AUTH_PREFERENCE',
        resource: 'USER_SETTINGS',
        resourceId: user.id,
        metadata: JSON.stringify({
          oldPreference: user.authPreference,
          newPreference: authPreference
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: `Authentication preference updated to ${authPreference.toLowerCase()}`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating authentication preference:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        authPreference: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Error fetching authentication preferences:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
