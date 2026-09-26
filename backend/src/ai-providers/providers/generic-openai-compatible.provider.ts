import { Injectable } from '@nestjs/common';
import { AiProvider, ChatMessage, AiProviderConfig } from '../ai-provider.interface';

@Injectable()
export class GenericOpenAiCompatibleProvider implements AiProvider {
  async chat(messages: ChatMessage[], config: AiProviderConfig): Promise<string> {
    const res = await fetch(`${config.baseUrl}/chat/completions`, {
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

    if (!res.ok) {
      throw new Error(`AI provider request failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
}