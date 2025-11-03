import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const processes = await prisma.process.findMany({
      where: {
        companyId: user.companyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(processes);
  } catch (error) {
    console.error('Error fetching processes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch processes' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { title, description, questions } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!user.companyId) {
      return NextResponse.json(
        { error: 'User must belong to a company' },
        { status: 400 }
      );
    }

    const process = await prisma.process.create({
      data: {
        title,
        description: description || null,
        companyId: user.companyId,
        questions: questions || []
      }
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    console.error('Error creating process:', error);
    return NextResponse.json(
      { error: 'Failed to create process' },
      { status: 500 }
    );
  }
});
