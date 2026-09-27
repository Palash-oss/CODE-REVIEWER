import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { FilesService } from '../files/files.service';
import { ParsingService } from '../parsing/parsing.service';
import { AiProviderFactory } from '../ai-providers/ai-provider.factory';
import { AiProviderConfigService } from '../ai-providers/ai-provider-config.service';
import { findSecrets } from '../parsing/static-checks/secret-patterns';
import { findInjectionRisks } from '../parsing/static-checks/injection-patterns';
import { buildSecurityPrompt } from './templates/security.template';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    private filesService: FilesService,
    private parsingService: ParsingService,
    private providerFactory: AiProviderFactory,
    private providerConfigService: AiProviderConfigService,
  ) {}

  async createReview(projectId: string, dto: CreateReviewDto) {
    const config = await this.providerConfigService.getForProject(projectId);
    const provider = this.providerFactory.getProvider(config.providerType);

    const allIssues = [];
    const allSummaries: string[] = [];

    for (const fileId of dto.fileIds) {
      const file = await this.filesService.getFileContent(fileId);
      if (!file) continue;

      const staticFindings = [
        ...findSecrets(file.content),
        ...findInjectionRisks(file.content),
      ].map((f) => `Line ${f.line}: ${f.message}`);

      const prompt =
        dto.templateType === 'security'
          ? buildSecurityPrompt(file.content, staticFindings)
          : buildSecurityPrompt(file.content, staticFindings); // other templates added next batch

      const raw = await provider.chat(
        [{ role: 'user', content: prompt }],
        { baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model },
      );

      const parsed = JSON.parse(raw);
      allSummaries.push(parsed.summary);
      allIssues.push(
        ...parsed.issues.map((i: any) => ({ ...i, file: file.name })),
      );
    }

    const review = this.reviewsRepo.create({
      projectId,
      templateType: dto.templateType,
      targetFiles: dto.fileIds,
      summary: allSummaries.join(' '),
      issues: allIssues,
      recommendations: [], // aggregated in next batch
    });

    return this.reviewsRepo.save(review);
  }
}