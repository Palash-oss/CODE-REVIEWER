import { Injectable } from '@nestjs/common';
import { GenericOpenAiCompatibleProvider } from './providers/generic-openai-compatible.provider';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class AiProviderFactory {
  constructor(private genericProvider: GenericOpenAiCompatibleProvider) {}

  getProvider(providerType: string): AiProvider {
    // all current provider types use the same OpenAI-compatible client;
    // this switch exists so a genuinely different provider (e.g. one using
    // a non-chat-completions API) can be added later without touching callers
    switch (providerType) {
      case 'openai':
      case 'lm-studio':
      case 'ollama':
      case 'generic':
      default:
        return this.genericProvider;
    }
  }
}