import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { extractZip } from './utils/zip-extractor';
import { buildTree } from './utils/tree-builder';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity) private filesRepo: Repository<FileEntity>,
  ) {}

  async uploadZip(buffer: Buffer, projectId: string) {
    const extracted = extractZip(buffer);
    const entities = extracted.map((f) =>
      this.filesRepo.create({
        path: f.path,
        name: f.name,
        content: f.content,
        type: 'file',
        projectId,
      }),
    );
    return this.filesRepo.save(entities);
  }

  async getTree(projectId: string) {
    const files = await this.filesRepo.find({ where: { projectId } });
    return buildTree(files.map((f) => ({ path: f.path, id: f.id })));
  }

  getFileContent(fileId: string) {
    return this.filesRepo.findOne({ where: { id: fileId } });
  }
}