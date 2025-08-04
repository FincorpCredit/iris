// src/app/api/auth/login/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyPassword, isCodeExpired } from '@/lib/auth-utils';
import { generateTokenPair } from '@/lib/jwt';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { email, password, code } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!password && !code) {
      return NextResponse.json(
        { error: 'Password or code is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
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

    let isValidAuth = false;

    // Handle password authentication
    if (password) {
      isValidAuth = await verifyPassword(password, user.passwordHash);
    }
    
    // Handle code authentication
    if (code && user.authPreference === 'CODE') {
      if (!user.tempCode || !user.tempCodeExpiry) {
        return NextResponse.json(
          { error: 'No valid code found. Please request a new code.' },
          { status: 401 }
        );
      }

      if (isCodeExpired(user.tempCodeExpiry)) {
        return NextResponse.json(
          { error: 'Code has expired. Please request a new code.' },
          { status: 401 }
        );
      }

      if (user.tempCode === code) {
        isValidAuth = true;
        
        // Clear the used code
        await prisma.user.update({
          where: { id: user.id },
          data: {
            tempCode: null,
            tempCodeExpiry: null
          }
        });
      }
    }

    if (!isValidAuth) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT tokens
    const tokens = generateTokenPair(user);

    // Update last active time
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: new Date(),
        status: 'ONLINE'
      }
    });

    // Log the login for audit
    await prisma.auditlog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resource: 'AUTH',
        resourceId: user.id,
        metadata: JSON.stringify({
          loginTime: new Date(),
          authMethod: code ? 'CODE' : 'PASSWORD',
          userAgent: request.headers.get('user-agent') || 'Unknown'
        })
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
      message: 'Login successful',
      user: userData,
      tokens: tokens,
      mustChangePassword: user.mustChangePassword
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
