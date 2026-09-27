import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { FilesModule } from '../files/files.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review]), FilesModule, AiProvidersModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}