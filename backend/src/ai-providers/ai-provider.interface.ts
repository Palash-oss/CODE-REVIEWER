export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface AiProvider {
  chat(messages: ChatMessage[], config: AiProviderConfig): Promise<string>;
}