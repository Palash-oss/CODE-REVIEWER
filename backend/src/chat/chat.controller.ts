import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('projects/:projectId/chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('ask')
  ask(
    @Param('projectId') projectId: string,
    @Body() body: { question: string; sessionId?: string },
  ) {
    return this.chatService.ask(projectId, body.question, body.sessionId);
  }

  @Get(':sessionId/messages')
  getMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.getMessages(sessionId);
  }
}