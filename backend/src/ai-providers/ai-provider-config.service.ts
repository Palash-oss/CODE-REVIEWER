import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiProviderConfigEntity } from './entities/ai-provider-config.entity';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AiProviderConfigService {
  constructor(
    @InjectRepository(AiProviderConfigEntity)
    private configRepo: Repository<AiProviderConfigEntity>,
  ) {}

  async upsert(projectId: string, data: Partial<AiProviderConfigEntity>) {
    let config = await this.configRepo.findOne({ where: { projectId } });
    if (config) {
      Object.assign(config, data);
    } else {
      config = this.configRepo.create({ ...data, projectId });
    }
    return this.configRepo.save(config);
  }

  async getForProject(projectId: string): Promise<AiProviderConfigEntity> {
    const config = await this.configRepo.findOne({ where: { projectId } });
    if (config) {
      return config;
    }

    let envKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
    let envModel = process.env.AI_MODEL || (process.env.GEMINI_API_KEY ? 'gemini-1.5-flash' : 'gpt-4o-mini');
    let envBaseUrl = process.env.AI_BASE_URL || (process.env.GEMINI_API_KEY ? 'https://generativelanguage.googleapis.com/v1beta/openai' : 'https://api.openai.com/v1');
    let envType = (process.env.AI_PROVIDER_TYPE as any) || (process.env.GEMINI_API_KEY ? 'gemini' : 'openai');

    // In case .env was edited while the server was running, read directly from .env file
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      try {
        const parsed = dotenv.parse(fs.readFileSync(envPath));
        if (
          parsed.AI_PROVIDER_TYPE === 'gemini' ||
          (parsed.GEMINI_API_KEY && parsed.GEMINI_API_KEY.trim() !== '')
        ) {
          envKey = parsed.GEMINI_API_KEY;
          envType = 'gemini';
          envBaseUrl = parsed.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai';
          envModel = parsed.AI_MODEL || 'gemini-2.5-flash';
        } else if (parsed.OPENAI_API_KEY || parsed.AI_API_KEY) {
          envKey = parsed.OPENAI_API_KEY || parsed.AI_API_KEY;
          envModel = parsed.AI_MODEL || 'gpt-4o-mini';
          envBaseUrl = parsed.AI_BASE_URL || 'https://api.openai.com/v1';
          envType = (parsed.AI_PROVIDER_TYPE as any) || 'openai';
        }
      } catch {
        // ignore parse error
      }
    }

    if (envKey) {
      return {
        id: 'env-default',
        providerType: envType,
        baseUrl: envBaseUrl,
        apiKey: envKey,
        model: envModel,
        projectId,
        project: null as any,
      };
    }

    throw new NotFoundException('No AI provider configured for this project');
  }
}