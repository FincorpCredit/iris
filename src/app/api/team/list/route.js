// src/app/api/team/list/route.js

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Get all users with their roles
    const users = await prisma.user.findMany({
      where: {
        deleted: false
      },
      include: {
        role: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Prepare user data (exclude sensitive information)
    const userData = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      authPreference: user.authPreference,
      mustChangePassword: user.mustChangePassword,
      profileImage: user.profileImage,
      department: user.department,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt
    }));

    return NextResponse.json({
      success: true,
      users: userData
    });

  } catch (error) {
    console.error('Error fetching team members:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
