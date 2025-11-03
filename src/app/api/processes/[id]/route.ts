import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const processId = resolvedParams.id;

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

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

    return NextResponse.json(process);
  } catch (error) {
    console.error('Error fetching process:', error);
    return NextResponse.json(
      { error: 'Failed to fetch process' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const processId = resolvedParams.id;

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, questions } = body;

    const existingProcess = await prisma.process.findFirst({
      where: {
        id: processId,
        companyId: user.companyId
      }
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: 'Process not found or access denied' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (questions !== undefined) updateData.questions = questions;

    const updatedProcess = await prisma.process.update({
      where: { id: processId },
      data: updateData
    });

    return NextResponse.json(updatedProcess);
  } catch (error) {
    console.error('Error updating process:', error);
    return NextResponse.json(
      { error: 'Failed to update process' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const processId = resolvedParams.id;

    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const existingProcess = await prisma.process.findFirst({
      where: {
        id: processId,
        companyId: user.companyId
      }
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: 'Process not found or access denied' },
        { status: 404 }
      );
    }

    await prisma.process.delete({
      where: { id: processId }
    });

    return NextResponse.json({ message: 'Process deleted successfully' });
  } catch (error) {
    console.error('Error deleting process:', error);
    return NextResponse.json(
      { error: 'Failed to delete process' },
      { status: 500 }
    );
  }
}
