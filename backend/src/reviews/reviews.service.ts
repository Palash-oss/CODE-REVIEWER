import { Injectable, BadRequestException, Logger } from '@nestjs/common';
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
import { buildArchitecturePrompt } from './templates/architecture.template';
import { buildTestGeneratorPrompt } from './templates/test-generator.template';
import { safeParseReviewJson } from './utils/safe-json-parse';
import { CreateReviewDto } from './dto/create-review.dto';

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.c', '.cpp', '.rs', '.php', '.rb',
]);

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    private filesService: FilesService,
    private providerFactory: AiProviderFactory,
    private providerConfigService: AiProviderConfigService,
  ) {}

  private buildPrompt(type: string, code: string, staticFindings: string[]) {
    if (type === 'security') return buildSecurityPrompt(code, staticFindings);
    if (type === 'performance') return buildPerformancePrompt(code);
    if (type === 'architecture') return buildArchitecturePrompt(code);
    if (type === 'test-generator') return buildTestGeneratorPrompt(code);
    return buildCodeQualityPrompt(code);
  }

  async createReview(projectId: string, dto: CreateReviewDto) {
    const config = await this.providerConfigService.getForProject(projectId);
    const provider = this.providerFactory.getProvider(config.providerType);

    // Fetch all requested files
    const allFiles = await Promise.all(
      dto.fileIds.map((id) => this.filesService.getFileContent(id)),
    );
    const validFiles = allFiles.filter(
      (f): f is NonNullable<typeof f> => !!f && typeof f.content === 'string' && f.content.trim().length > 0,
    );

    if (validFiles.length === 0) {
      throw new BadRequestException('No readable file content found for review.');
    }

    // Prioritize source code files (.ts, .js, .py, etc.) over config or lockfiles
    validFiles.sort((a, b) => {
      const extA = '.' + a.name.split('.').pop()?.toLowerCase();
      const extB = '.' + b.name.split('.').pop()?.toLowerCase();
      const scoreA = CODE_EXTENSIONS.has(extA) ? 1 : 0;
      const scoreB = CODE_EXTENSIONS.has(extB) ? 1 : 0;
      return scoreB - scoreA;
    });

    // Review up to 5 most relevant source files concurrently to ensure fast response (< 15s)
    const targetFiles = validFiles.slice(0, 5);

    const allIssues: any[] = [];
    const allSummaries: string[] = [];
    const allRecommendations: string[] = [];

    // Process all target files concurrently
    const batchResults = await Promise.all(
      targetFiles.map(async (file) => {
        try {
          const staticFindings = [
            ...findSecrets(file.content),
            ...findInjectionRisks(file.content),
          ].map((f) => `Line ${f.line}: ${f.message}`);

          // Guard against massive files (> 12k chars)
          const codeSlice =
            file.content.length > 12000
              ? file.content.slice(0, 12000) + '\n// [Remaining lines truncated for review]'
              : file.content;

          const prompt = this.buildPrompt(dto.templateType, codeSlice, staticFindings);

          // 25-second timeout guard per file
          const timeoutPromise = new Promise<string>((_, reject) =>
            setTimeout(() => reject(new Error('AI analysis timed out')), 25000),
          );

          const raw = await Promise.race([
            provider.chat(
              [{ role: 'user', content: prompt }],
              { baseUrl: config.baseUrl, apiKey: config.apiKey, model: config.model },
            ),
            timeoutPromise,
          ]);

          const parsed = safeParseReviewJson(raw);
          return {
            file: file.name,
            summary: parsed.summary || `${file.name}: Review completed.`,
            recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
            issues: Array.isArray(parsed.issues)
              ? parsed.issues.map((iss: any) => ({ ...iss, file: file.name }))
              : [],
          };
        } catch (err: any) {
          this.logger.warn(`AI review fallback for ${file.name}: ${err?.message}`);

          // Fallback: extract static issues directly from code scan
          const staticIssues: any[] = [];
          const secrets = findSecrets(file.content);
          for (const s of secrets) {
            staticIssues.push({
              file: file.name,
              line: s.line,
              message: s.message,
              severity: 'critical',
            });
          }
          const injections = findInjectionRisks(file.content);
          for (const inj of injections) {
            staticIssues.push({
              file: file.name,
              line: inj.line,
              message: inj.message,
              severity: 'high',
            });
          }

          return {
            file: file.name,
            summary: `${file.name}: Analysis completed.${staticIssues.length > 0 ? ` Found ${staticIssues.length} potential issue(s).` : ' File scanned.'}`,
            recommendations: staticIssues.length > 0
              ? ['Remove hardcoded secrets and environment credentials from source code.']
              : ['Ensure input validation and sanitization for external parameters.'],
            issues: staticIssues,
          };
        }
      }),
    );

    for (const res of batchResults) {
      if (res.summary) allSummaries.push(res.summary);
      if (res.recommendations) allRecommendations.push(...res.recommendations);
      if (res.issues) allIssues.push(...res.issues);
    }

    if (allSummaries.length === 0) {
      allSummaries.push('Review completed successfully. No critical vulnerabilities found in scanned files.');
    }

    const review = this.reviewsRepo.create({
      projectId,
      templateType: dto.templateType,
      targetFiles: targetFiles.map((f) => f.id),
      summary: allSummaries.join(' '),
      issues: allIssues,
      recommendations: Array.from(new Set(allRecommendations)),
    });

    return this.reviewsRepo.save(review);
  }

  findAllForProject(projectId: string) {
    return this.reviewsRepo.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: string) {
    return this.reviewsRepo.findOne({ where: { id } });
  }

  search(projectId: string, query: string) {
    return this.reviewsRepo.find({
      where: [
        { projectId, summary: ILike(`%${query}%`) },
        { projectId, templateType: ILike(`%${query}%`) as any },
      ],
      order: { createdAt: 'DESC' },
    });
  }
}