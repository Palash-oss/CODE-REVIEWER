import { IsArray, IsIn } from 'class-validator';

export class CreateReviewDto {
  @IsArray()
  fileIds: string[];

  @IsIn(['security', 'performance', 'code-quality', 'architecture', 'test-generator'])
  templateType: 'security' | 'performance' | 'code-quality' | 'architecture' | 'test-generator';
}