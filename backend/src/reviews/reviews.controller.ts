import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('projects/:projectId/reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  create(@Param('projectId') projectId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(projectId, dto);
  }

  @Get()
  findAll(@Param('projectId') projectId: string, @Query('search') search?: string) {
    if (search) return this.reviewsService.search(projectId, search);
    return this.reviewsService.findAllForProject(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }
}