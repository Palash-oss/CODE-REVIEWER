import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';

@Controller('projects/:projectId/files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @Param('projectId') projectId: string) {
    return this.filesService.uploadZip(file.buffer, projectId);
  }

  @Get('tree')
  getTree(@Param('projectId') projectId: string) {
    return this.filesService.getTree(projectId);
  }

  @Get(':fileId')
  getContent(@Param('fileId') fileId: string) {
    return this.filesService.getFileContent(fileId);
  }
}