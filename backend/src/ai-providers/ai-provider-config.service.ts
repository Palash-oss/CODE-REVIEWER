import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiProviderConfigEntity } from './entities/ai-provider-config.entity';

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

  async getForProject(projectId: string) {
    const config = await this.configRepo.findOne({ where: { projectId } });
    if (!config) throw new NotFoundException('No AI provider configured for this project');
    return config;
  }
}