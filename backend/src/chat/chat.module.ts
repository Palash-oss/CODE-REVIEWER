import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { Message } from './entities/message.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { RetrievalService } from './retrieval.service';
import { FilesModule } from '../files/files.module';
import { ParsingModule } from '../parsing/parsing.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, Message]),
    FilesModule,
    ParsingModule,
    AiProvidersModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, RetrievalService],
})
export class ChatModule {}