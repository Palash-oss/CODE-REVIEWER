export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface User {
  userId: string;
  email: string;
  name?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  id?: string;
  children?: TreeNode[];
}

export interface FileEntity {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  projectId: string;
}

export type ProviderType = 'openai' | 'lm-studio' | 'ollama' | 'gemini' | 'generic';

export interface AiProviderConfig {
  id?: string;
  providerType: ProviderType;
  baseUrl: string;
  apiKey?: string;
  model: string;
  projectId?: string;
}

export interface ReviewIssue {
  file: string;
  line?: number;
  message: string;
  severity: SeverityLevel;
}

export type ReviewTemplate =
  | 'security'
  | 'performance'
  | 'code-quality'
  | 'architecture'
  | 'test-generator';

export interface Review {
  id: string;
  templateType: ReviewTemplate;
  targetFiles: string[];
  summary: string;
  issues: ReviewIssue[];
  recommendations: string[];
  projectId: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  title?: string;
  projectId: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sessionId: string;
  createdAt: string;
}
