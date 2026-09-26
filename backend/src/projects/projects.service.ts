import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectsRepo: Repository<Project>,
  ) {}

  create(dto: CreateProjectDto, ownerId: string) {
    const project = this.projectsRepo.create({ ...dto, ownerId });
    return this.projectsRepo.save(project);
  }

  findAllForUser(ownerId: string) {
    return this.projectsRepo.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
  }

  async findOneForUser(id: string, ownerId: string) {
    const project = await this.projectsRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException();
    return project;
  }

  async remove(id: string, ownerId: string) {
    await this.findOneForUser(id, ownerId);
    return this.projectsRepo.delete(id);
  }
}