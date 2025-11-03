import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createAuthResponse } from '@/lib/auth';
import { RegisterData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: RegisterData = await request.json();
    const { email, password, role, companyName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create or find company - if no company name provided, create a default one
    let company;
    if (companyName) {
      company = await prisma.company.upsert({
        where: { name: companyName },
        update: {},
        create: { name: companyName }
      });
    } else {
      // Create a default company if none provided
      company = await prisma.company.upsert({
        where: { name: 'Default Company' },
        update: {},
        create: { name: 'Default Company' }
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'EMPLOYEE',
        companyId: company.id
      },
      include: { company: true }
    });

    const authResponse = createAuthResponse({
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'EMPLOYEE',
      companyId: user.companyId || undefined
    });

    return NextResponse.json(authResponse, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Return more specific error messages
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }
    
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Return error message if available
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? String(error) : undefined },
      { status: 500 }
    );
  }
}
