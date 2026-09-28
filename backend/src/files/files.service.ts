import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileEntity } from './entities/file.entity';
import { extractZip } from './utils/zip-extractor';
import { buildTree } from './utils/tree-builder';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  'coverage',
  '.idea',
  '.vscode',
  '__pycache__',
  '.venv',
  'venv',
]);

const BINARY_EXTS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.tiff',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.dat',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.avi', '.mov', '.webm', '.wasm',
]);

function walkDirectory(dirPath: string, baseDir: string = dirPath): { path: string; name: string; content: string }[] {
  const results: { path: string; name: string; content: string }[] = [];
  if (!fs.existsSync(dirPath)) return results;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      results.push(...walkDirectory(fullPath, baseDir));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTS.has(ext)) continue;

      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.size > 2 * 1024 * 1024) continue; // Skip files > 2MB

      try {
        const buf = fs.readFileSync(fullPath);
        const len = Math.min(buf.length, 8000);
        let isBin = false;
        for (let i = 0; i < len; i++) {
          if (buf[i] === 0) {
            isBin = true;
            break;
          }
        }
        if (isBin) continue;

        const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        const content = buf.toString('utf8').replace(/\0/g, '');
        results.push({
          path: relPath,
          name: entry.name,
          content,
        });
      } catch {
        // ignore unreadable files
      }
    }
  }

  return results;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    @InjectRepository(FileEntity) private filesRepo: Repository<FileEntity>,
  ) {}

  async uploadZip(buffer: Buffer, projectId: string) {
    const extracted = extractZip(buffer);
    if (extracted.length === 0) {
      throw new BadRequestException('No readable code files found in the uploaded ZIP archive.');
    }

    // Clean up existing files for this project before saving new files
    await this.filesRepo.delete({ projectId });
    return this.saveEntitiesInBatches(extracted, projectId);
  }

  async importRepo(repoUrl: string, projectId: string) {
    if (!repoUrl || typeof repoUrl !== 'string') {
      throw new BadRequestException('A valid repository URL is required.');
    }
    const cleanUrl = repoUrl.trim();
    if (
      !cleanUrl.startsWith('http://') &&
      !cleanUrl.startsWith('https://') &&
      !cleanUrl.startsWith('git@')
    ) {
      throw new BadRequestException('Invalid Git URL. Must start with https://, http://, or git@');
    }

    const tempDir = path.join(
      os.tmpdir(),
      `review-repo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    );

    try {
      this.logger.log(`Cloning ${cleanUrl} into ${tempDir}...`);
      await execAsync(`git clone --depth 1 "${cleanUrl}" "${tempDir}"`, {
        timeout: 60000,
        windowsHide: true,
      });

      const extracted = walkDirectory(tempDir);
      if (extracted.length === 0) {
        throw new BadRequestException('No supported source code files found in the repository.');
      }

      await this.filesRepo.delete({ projectId });
      return await this.saveEntitiesInBatches(extracted, projectId);
    } catch (err: any) {
      this.logger.error(`Git clone failed: ${err?.message}`);
      throw new BadRequestException(
        `Failed to clone repository: ${err?.message || 'Please check repository URL and public accessibility.'}`,
      );
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // ignore temp cleanup error
      }
    }
  }

  private async saveEntitiesInBatches(
    files: { path: string; name: string; content: string }[],
    projectId: string,
  ) {
    const entities = files.map((f) =>
      this.filesRepo.create({
        path: f.path,
        name: f.name,
        content: f.content,
        type: 'file',
        projectId,
      }),
    );

    const BATCH_SIZE = 100;
    const results: FileEntity[] = [];
    for (let i = 0; i < entities.length; i += BATCH_SIZE) {
      const batch = entities.slice(i, i + BATCH_SIZE);
      const saved = await this.filesRepo.save(batch);
      results.push(...saved);
    }
    return results;
  }

  async getTree(projectId: string) {
    const files = await this.filesRepo.find({ where: { projectId } });
    return buildTree(files.map((f) => ({ path: f.path, id: f.id })));
  }

  getFileContent(fileId: string) {
    return this.filesRepo.findOne({ where: { id: fileId } });
  }

  getAllForProject(projectId: string) {
    return this.filesRepo.find({ where: { projectId } });
  }
}