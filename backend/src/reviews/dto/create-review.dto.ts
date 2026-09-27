import { IsArray, IsString, IsIn } from 'class-validator';

export class CreateReviewDto {
  @IsArray()
  fileIds: string[];

  @IsIn(['security', 'performance', 'code-quality'])
  templateType: 'security' | 'performance' | 'code-quality';
}