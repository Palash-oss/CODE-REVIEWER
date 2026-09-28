import { Injectable, BadRequestException } from '@nestjs/common';
import { AiProvider, ChatMessage, AiProviderConfig } from '../ai-provider.interface';

@Injectable()
export class GenericOpenAiCompatibleProvider implements AiProvider {
  async chat(messages: ChatMessage[], config: AiProviderConfig): Promise<string> {
    let res: Response;
    try {
      res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: config.model,
          messages,
        }),
      });
    } catch (networkErr: any) {
      throw new BadRequestException(
        `Failed to reach AI provider at ${config.baseUrl}: ${networkErr?.message || 'Network error'}`,
      );
    }

    if (!res.ok) {
      let errorDetails = `Status ${res.status} (${res.statusText})`;
      try {
        const json = await res.json();
        if (json?.error?.message) {
          errorDetails = json.error.message;
        }
      } catch {
        try {
          const text = await res.text();
          if (text) errorDetails = text;
        } catch {
          // ignore
        }
      }
      throw new BadRequestException(`AI Provider error: ${errorDetails}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
}