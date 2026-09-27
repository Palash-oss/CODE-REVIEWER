import {
  User,
  Project,
  TreeNode,
  FileEntity,
  AiProviderConfig,
  Review,
  ReviewTemplate,
  ChatMessage,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('access_token', token);
      } else {
        localStorage.removeItem('access_token');
      }
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
      } catch {
        // use fallback errorMsg
      }
      throw new Error(errorMsg);
    }

    // Handle 204 No Content or empty bodies
    if (response.status === 204) {
      return null as unknown as T;
    }

    try {
      return await response.json();
    } catch {
      return null as unknown as T;
    }
  }

  // --- Auth API ---
  async register(data: { email: string; password: string; name: string }): Promise<{ access_token: string }> {
    const res = await this.request<{ access_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async login(data: { email: string; password: string }): Promise<{ access_token: string }> {
    const res = await this.request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'GET',
    });
  }

  logout() {
    this.setToken(null);
  }

  // --- Projects API ---
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects', { method: 'GET' });
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`, { method: 'GET' });
  }

  async createProject(data: { name: string; description?: string }): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, { method: 'DELETE' });
  }

  // --- Files API ---
  async uploadZip(projectId: string, file: File): Promise<FileEntity[]> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<FileEntity[]>(`/projects/${projectId}/files/upload`, {
      method: 'POST',
      body: formData,
    });
  }

  async getFileTree(projectId: string): Promise<TreeNode[]> {
    return this.request<TreeNode[]>(`/projects/${projectId}/files/tree`, {
      method: 'GET',
    });
  }

  async getFileContent(projectId: string, fileId: string): Promise<FileEntity> {
    return this.request<FileEntity>(`/projects/${projectId}/files/${fileId}`, {
      method: 'GET',
    });
  }

  // --- AI Provider Config API ---
  async getAiProviderConfig(projectId: string): Promise<AiProviderConfig | null> {
    try {
      return await this.request<AiProviderConfig>(`/projects/${projectId}/ai-provider`, {
        method: 'GET',
      });
    } catch {
      return null;
    }
  }

  async saveAiProviderConfig(
    projectId: string,
    data: {
      providerType: string;
      baseUrl: string;
      apiKey?: string;
      model: string;
    }
  ): Promise<AiProviderConfig> {
    return this.request<AiProviderConfig>(`/projects/${projectId}/ai-provider`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Reviews API ---
  async createReview(
    projectId: string,
    data: { fileIds: string[]; templateType: ReviewTemplate }
  ): Promise<Review> {
    return this.request<Review>(`/projects/${projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReviews(projectId: string, search?: string): Promise<Review[]> {
    const endpoint = search
      ? `/projects/${projectId}/reviews?search=${encodeURIComponent(search)}`
      : `/projects/${projectId}/reviews`;
    return this.request<Review[]>(endpoint, { method: 'GET' });
  }

  async getReview(projectId: string, reviewId: string): Promise<Review> {
    return this.request<Review>(`/projects/${projectId}/reviews/${reviewId}`, {
      method: 'GET',
    });
  }

  // --- Chat API ---
  async askChat(
    projectId: string,
    data: { question: string; sessionId?: string }
  ): Promise<{ sessionId: string; message: ChatMessage }> {
    return this.request<{ sessionId: string; message: ChatMessage }>(
      `/projects/${projectId}/chat/ask`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getChatMessages(projectId: string, sessionId: string): Promise<ChatMessage[]> {
    return this.request<ChatMessage[]>(
      `/projects/${projectId}/chat/${sessionId}/messages`,
      {
        method: 'GET',
      }
    );
  }
}

export const api = new ApiClient();
