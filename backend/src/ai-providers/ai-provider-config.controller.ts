import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiProviderConfigService } from './ai-provider-config.service';

@Controller('projects/:projectId/ai-provider')
@UseGuards(JwtAuthGuard)
export class AiProviderConfigController {
  constructor(private configService: AiProviderConfigService) {}

  @Post()
  save(@Param('projectId') projectId: string, @Body() body: any) {
    return this.configService.upsert(projectId, body);
  }

  @Get()
  get(@Param('projectId') projectId: string) {
    return this.configService.getForProject(projectId);
  }
}