import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    const question = formData.get('question') as string;
    const response = formData.get('response') as string | null;
    const transcript = formData.get('transcript') as string | null;
    const audioUrl = formData.get('audioUrl') as string | null;
    
    // Handle screenshot uploads
    const screenshotFiles = formData.getAll('screenshots') as File[];
    const screenshotUrls: string[] = [];

    if (!sessionId || !question) {
      return NextResponse.json(
        { error: 'Session ID and question are required' },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user's company
    const session = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        role: {
          companyId: user.companyId
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Save screenshot files if any
    if (screenshotFiles.length > 0) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'screenshots');
      
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error: any) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }

      for (const file of screenshotFiles) {
        if (file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
          const filepath = join(uploadsDir, filename);
          
          await writeFile(filepath, buffer);
          screenshotUrls.push(`/uploads/screenshots/${filename}`);
        }
      }
    }

    const interviewResponse = await prisma.interviewResponse.create({
      data: {
        sessionId,
        question,
        response: response || null,
        transcript: transcript || null,
        audioUrl: audioUrl || null,
        screenshotUrls: screenshotUrls.length > 0 ? screenshotUrls : Prisma.JsonNull
      }
    });

    return NextResponse.json(interviewResponse, { status: 201 });
  } catch (error) {
    console.error('Error creating interview response:', error);
    return NextResponse.json(
      { error: 'Failed to create interview response' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, user: any) => {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const response = formData.get('response') as string | null;
    const transcript = formData.get('transcript') as string | null;
    const audioUrl = formData.get('audioUrl') as string | null;
    
    // Handle screenshot uploads
    const screenshotFiles = formData.getAll('screenshots') as File[];
    let screenshotUrls: string[] = [];

    if (!id) {
      return NextResponse.json(
        { error: 'Response ID is required' },
        { status: 400 }
      );
    }

    // Verify the response belongs to the user's company
    const existingResponse = await prisma.interviewResponse.findFirst({
      where: {
        id,
        session: {
          role: {
            companyId: user.companyId
          }
        }
      }
    });

    if (!existingResponse) {
      return NextResponse.json(
        { error: 'Response not found or access denied' },
        { status: 404 }
      );
    }

    // Get existing screenshots
    const existingScreenshots = existingResponse.screenshotUrls 
      ? (Array.isArray(existingResponse.screenshotUrls) 
          ? existingResponse.screenshotUrls 
          : JSON.parse(existingResponse.screenshotUrls as string))
      : [];

    screenshotUrls = [...existingScreenshots];

    // Save new screenshot files if any
    if (screenshotFiles.length > 0) {
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'screenshots');
      
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error: any) {
        if (error.code !== 'EEXIST') {
          throw error;
        }
      }

      for (const file of screenshotFiles) {
        if (file.size > 0) {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
          const filepath = join(uploadsDir, filename);
          
          await writeFile(filepath, buffer);
          screenshotUrls.push(`/uploads/screenshots/${filename}`);
        }
      }
    }

    const updateData: any = {};
    if (response !== null) updateData.response = response;
    if (transcript !== null) updateData.transcript = transcript;
    if (audioUrl !== null) updateData.audioUrl = audioUrl;
    // Only update screenshotUrls if there are screenshots (existing + new)
    // If empty, keep existing by not updating the field
    if (screenshotUrls.length > 0) {
      updateData.screenshotUrls = screenshotUrls;
    }

    const updatedResponse = await prisma.interviewResponse.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedResponse);
  } catch (error) {
    console.error('Error updating interview response:', error);
    return NextResponse.json(
      { error: 'Failed to update interview response' },
      { status: 500 }
    );
  }
});
