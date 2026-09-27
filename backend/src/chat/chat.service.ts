import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { Message } from './entities/message.entity';
import { RetrievalService } from './retrieval.service';
import { AiProviderFactory } from '../ai-providers/ai-provider.factory';
import { AiProviderConfigService } from '../ai-providers/ai-provider-config.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatSession) private sessionsRepo: Repository<ChatSession>,
    @InjectRepository(Message) private messagesRepo: Repository<Message>,
    private retrievalService: RetrievalService,
    private providerFactory: AiProviderFactory,
    private providerConfigService: AiProviderConfigService,
  ) {}

  async getOrCreateSession(projectId: string, sessionId?: string) {
    if (sessionId) {
      const existing = await this.sessionsRepo.findOne({ where: { id: sessionId } });
      if (existing) return existing;
    }
    const session = this.sessionsRepo.create({ projectId });
    return this.sessionsRepo.save(session);
  }

  async ask(projectId: string, question: string, sessionId?: string) {
    const session = await this.getOrCreateSession(projectId, sessionId);

    await this.messagesRepo.save(
      this.messagesRepo.create({ sessionId: session.id, role: 'user', content: question }),
    );

    const context = await this.retrievalService.retrieveContext(projectId, question);
    const contextBlock = context
      .map((c) => `File: ${c.fileName} (${c.name ?? c.type}, lines ${c.startLine}-${c.endLine})\n${c.content}`)
      .join('\n\n---\n\n');

    const config = await this.providerConfigService.getForProject(projectId);
    const provider = this.providerFactory.getProvider(config.providerType);

    const answer = await provider.chat(
      [
        {
          role: 'system',
          content: `You answer questions about a codebase using the provided context. If the context doesn't contain the answer, say so rather than guessing.\n\nContext:\n${contextBlock}`,
        },
        { role: 'user', content: question },
      ],
      { baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model },
    );

    const assistantMessage = await this.messagesRepo.save(
      this.messagesRepo.create({ sessionId: session.id, role: 'assistant', content: answer }),
    );

    return { sessionId: session.id, message: assistantMessage };
  }

  getMessages(sessionId: string) {
    return this.messagesRepo.find({ where: { sessionId }, order: { createdAt: 'ASC' } });
  }
}