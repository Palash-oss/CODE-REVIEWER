import { Injectable } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { ParsingService, CodeChunk } from '../parsing/parsing.service';

interface ScoredChunk extends CodeChunk {
  fileName: string;
  score: number;
}

@Injectable()
export class RetrievalService {
  constructor(
    private filesService: FilesService,
    private parsingService: ParsingService,
  ) {}

  async retrieveContext(projectId: string, question: string, topK = 6): Promise<ScoredChunk[]> {
    const files = await this.filesService.getAllForProject(projectId);
    const keywords = this.extractKeywords(question);

    const allChunks: ScoredChunk[] = [];

    for (const file of files) {
      const chunks = this.parsingService.chunkFile(file.name, file.content);
      for (const chunk of chunks) {
        const score = this.scoreChunk(chunk, keywords, file.name);
        if (score > 0) {
          allChunks.push({ ...chunk, fileName: file.path, score });
        }
      }
    }

    return allChunks.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  private extractKeywords(question: string): string[] {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9_ ]/g, ' ')
      .split(' ')
      .filter((w) => w.length > 2);
  }

  private scoreChunk(chunk: CodeChunk, keywords: string[], fileName: string): number {
    const haystack = (chunk.content + ' ' + (chunk.name ?? '') + ' ' + fileName).toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) score += 1;
      if (chunk.name?.toLowerCase().includes(kw)) score += 2; // function/class name match weighted higher
    }
    return score;
  }
}