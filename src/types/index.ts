export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  title: string;
  description?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Process {
  id: string;
  title: string;
  description?: string;
  companyId: string;
  questions?: ProcessQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessQuestion {
  id: string;
  question: string;
  required: boolean;
  order: number;
}

export interface InterviewSession {
  id: string;
  roleId: string;
  role: Role;
  processId?: string;
  process?: Process;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  interviewResponses?: InterviewResponse[];
}

export interface InterviewResponse {
  id: string;
  sessionId: string;
  question: string;
  response?: string;
  transcript?: string;
  audioUrl?: string;
  screenshotUrls?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeArtifact {
  id: string;
  title: string;
  description?: string;
  type: 'MARKDOWN' | 'PDF' | 'DOC' | 'DOCX' | 'TXT' | 'CSV' | 'XLSX' | 'HTML' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'OTHER';
  fileUrl?: string;
  content?: string;
  metadata?: any;
  roleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KnowledgeChunk {
  id: string;
  artifactId: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  metadata?: any;
  createdAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE';
  companyName?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
}
