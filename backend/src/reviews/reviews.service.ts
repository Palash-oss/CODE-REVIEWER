import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { FilesService } from '../files/files.service';
import { AiProviderFactory } from '../ai-providers/ai-provider.factory';
import { AiProviderConfigService } from '../ai-providers/ai-provider-config.service';
import { findSecrets } from '../parsing/static-checks/secret-patterns';
import { findInjectionRisks } from '../parsing/static-checks/injection-patterns';
import { buildSecurityPrompt } from './templates/security.template';
import { buildPerformancePrompt } from './templates/performance.template';
import { buildCodeQualityPrompt } from './templates/code-quality.template';
import { safeParseReviewJson } from './utils/safe-json-parse';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    private filesService: FilesService,
    private providerFactory: AiProviderFactory,
    private providerConfigService: AiProviderConfigService,
  ) {}

  private buildPrompt(type: string, code: string, staticFindings: string[]) {
    if (type === 'security') return buildSecurityPrompt(code, staticFindings);
    if (type === 'performance') return buildPerformancePrompt(code);
    return buildCodeQualityPrompt(code);
  }

  async createReview(projectId: string, dto: CreateReviewDto) {
    const config = await this.providerConfigService.getForProject(projectId);
    const provider = this.providerFactory.getProvider(config.providerType);

    const allIssues = [];
    const allSummaries: string[] = [];
    const allRecommendations: string[] = [];

    for (const fileId of dto.fileIds) {
      const file = await this.filesService.getFileContent(fileId);
      if (!file) continue;

      const staticFindings = [
        ...findSecrets(file.content),
        ...findInjectionRisks(file.content),
      ].map((f) => `Line ${f.line}: ${f.message}`);

      const prompt = this.buildPrompt(dto.templateType, file.content, staticFindings);
      const raw = await provider.chat(
        [{ role: 'user', content: prompt }],
        { baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model },
      );

      const parsed = safeParseReviewJson(raw);
      allSummaries.push(parsed.summary);
      allRecommendations.push(...parsed.recommendations);
      allIssues.push(...parsed.issues.map((i: any) => ({ ...i, file: file.name })));
    }

    const review = this.reviewsRepo.create({
      projectId,
      templateType: dto.templateType,
      targetFiles: dto.fileIds,
      summary: allSummaries.join(' '),
      issues: allIssues,
      recommendations: [...new Set(allRecommendations)],
    });

    return this.reviewsRepo.save(review);
  }

  findAllForProject(projectId: string) {
    return this.reviewsRepo.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  findOne(id: string) {
    return this.reviewsRepo.findOne({ where: { id } });
  }

  search(projectId: string, query: string) {
    return this.reviewsRepo.find({
      where: { projectId, summary: ILike(`%${query}%`) },
      order: { createdAt: 'DESC' },
    });
  }
}