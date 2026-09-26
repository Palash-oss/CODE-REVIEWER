import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @Req() req: any) {
    return this.projectsService.create(dto, req.user.userId);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.projectsService.findAllForUser(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.findOneForUser(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.projectsService.remove(id, req.user.userId);
  }
}
