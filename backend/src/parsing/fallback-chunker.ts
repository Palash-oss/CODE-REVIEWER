import { CodeChunk } from './parsing.service';

const LINES_PER_CHUNK = 60;

export function chunkPlainText(content: string): CodeChunk[] {
  const lines = content.split('\n');
  const chunks: CodeChunk[] = [];

  for (let i = 0; i < lines.length; i += LINES_PER_CHUNK) {
    const slice = lines.slice(i, i + LINES_PER_CHUNK);
    chunks.push({
      content: slice.join('\n'),
      startLine: i + 1,
      endLine: Math.min(i + LINES_PER_CHUNK, lines.length),
      type: 'block',
    });
  }

  return chunks;
}
