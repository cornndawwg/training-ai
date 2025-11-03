import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatInterviewAsMarkdown } from '@/lib/interview-markdown';
import { chunkText } from '@/lib/document-parser';
import { generateEmbeddingsForArtifact } from '@/lib/embeddings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> | { sessionId: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const sessionId = resolvedParams.sessionId;

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

    // Fetch session with all related data
    const session = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        role: {
          companyId: user.companyId
        }
      },
      include: {
        role: true,
        process: true,
        interviewResponses: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    // Generate markdown
    const markdown = formatInterviewAsMarkdown(session, {
      includeScreenshots: true,
      screenshotBaseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
    });

    // Create or update knowledge artifact
    const artifactTitle = `Interview: ${session.process?.title || 'Untitled'} - ${session.role.title} - ${new Date(session.startedAt).toLocaleDateString()}`;
    
    let artifact = await prisma.knowledgeArtifact.findFirst({
      where: {
        title: artifactTitle,
        roleId: session.roleId
      }
    });

    if (artifact) {
      // Update existing artifact
      artifact = await prisma.knowledgeArtifact.update({
        where: { id: artifact.id },
        data: {
          content: markdown,
          type: 'MARKDOWN',
          metadata: {
            sessionId: session.id,
            processId: session.processId,
            exportDate: new Date().toISOString()
          }
        }
      });

      // Delete old chunks
      await prisma.knowledgeChunk.deleteMany({
        where: { artifactId: artifact.id }
      });
    } else {
      // Create new artifact
      artifact = await prisma.knowledgeArtifact.create({
        data: {
          title: artifactTitle,
          description: `Exported interview for ${session.process?.title || 'process'}`,
          type: 'MARKDOWN',
          content: markdown,
          roleId: session.roleId,
          metadata: {
            sessionId: session.id,
            processId: session.processId,
            exportDate: new Date().toISOString()
          }
        }
      });
    }

    // Generate chunks
    const chunks = chunkText(markdown, 500, 50);
    const chunkPromises = chunks.map((chunk, index) =>
      prisma.knowledgeChunk.create({
        data: {
          artifactId: artifact.id,
          content: chunk,
          chunkIndex: index,
          tokenCount: chunk.split(/\s+/).length,
          metadata: {
            artifactTitle: artifact.title,
            artifactType: artifact.type,
            sessionId: session.id
          }
        }
      })
    );

    await Promise.all(chunkPromises);

    // Generate embeddings in the background (don't await)
    generateEmbeddingsForArtifact(artifact.id).catch(error => {
      console.error('Error generating embeddings:', error);
    });

    // Return markdown as downloadable file
    const filename = `${artifactTitle.replace(/[^a-z0-9]/gi, '_')}.md`;
    
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error exporting interview:', error);
    return NextResponse.json(
      { error: 'Failed to export interview' },
      { status: 500 }
    );
  }
}
