import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiProviderConfigEntity } from './entities/ai-provider-config.entity';
import { GenericOpenAiCompatibleProvider } from './providers/generic-openai-compatible.provider';
import { AiProviderFactory } from './ai-provider.factory';
import { AiProviderConfigController } from './ai-provider-config.controller';
import { AiProviderConfigService } from './ai-provider-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiProviderConfigEntity])],
  controllers: [AiProviderConfigController],
  providers: [GenericOpenAiCompatibleProvider, AiProviderFactory, AiProviderConfigService],
  exports: [AiProviderFactory, AiProviderConfigService],
})
export class AiProvidersModule {}