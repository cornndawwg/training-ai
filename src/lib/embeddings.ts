import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');
  }
}

export async function generateEmbeddingsForChunk(chunkId: string): Promise<void> {
  try {
    const chunk = await prisma.knowledgeChunk.findUnique({
      where: { id: chunkId }
    });

    if (!chunk) {
      throw new Error('Chunk not found');
    }

    // Generate embedding
    const embedding = await generateEmbedding(chunk.content);

    // Store in database with pgvector
    await prisma.$executeRaw`
      INSERT INTO embeddings (id, "chunkId", vector, model, "createdAt")
      VALUES (gen_random_uuid()::text, ${chunkId}, ${JSON.stringify(embedding)}::vector, 'text-embedding-3-small', NOW())
      ON CONFLICT ("chunkId") DO UPDATE SET
        vector = ${JSON.stringify(embedding)}::vector,
        model = 'text-embedding-3-small'
    `;

  } catch (error) {
    console.error('Error generating embeddings for chunk:', error);
    throw error;
  }
}

export async function generateEmbeddingsForArtifact(artifactId: string): Promise<void> {
  try {
    const chunks = await prisma.knowledgeChunk.findMany({
      where: { artifactId }
    });

    for (const chunk of chunks) {
      await generateEmbeddingsForChunk(chunk.id);
    }

  } catch (error) {
    console.error('Error generating embeddings for artifact:', error);
    throw error;
  }
}
