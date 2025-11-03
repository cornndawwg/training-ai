import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const sessions = await prisma.interviewSession.findMany({
      where: {
        role: {
          companyId: user.companyId
        }
      },
      include: {
        role: true,
        process: true,
        interviewResponses: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching interview sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview sessions' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const { roleId, processId } = body;

    if (!roleId || !processId) {
      return NextResponse.json(
        { error: 'Role ID and Process ID are required' },
        { status: 400 }
      );
    }

    // Verify the role belongs to the user's company
    const role = await prisma.role.findFirst({
      where: {
        id: roleId,
        companyId: user.companyId
      }
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found or access denied' },
        { status: 404 }
      );
    }

    // Verify the process belongs to the user's company
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        companyId: user.companyId
      }
    });

    if (!process) {
      return NextResponse.json(
        { error: 'Process not found or access denied' },
        { status: 404 }
      );
    }

    const session = await prisma.interviewSession.create({
      data: {
        roleId,
        processId,
        status: 'IN_PROGRESS'
      },
      include: {
        role: true,
        process: true
      }
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating interview session:', error);
    return NextResponse.json(
      { error: 'Failed to create interview session' },
      { status: 500 }
    );
  }
});
