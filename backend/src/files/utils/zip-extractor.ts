import * as AdmZip from 'adm-zip';

export interface ExtractedFile {
  path: string;
  name: string;
  content: string;
}

const IGNORED_DIR_PATTERNS = [
  /(^|\/)node_modules\//i,
  /(^|\/)\.git\//i,
  /(^|\/)\.next\//i,
  /(^|\/)dist\//i,
  /(^|\/)build\//i,
  /(^|\/)out\//i,
  /(^|\/)coverage\//i,
  /(^|\/)\.idea\//i,
  /(^|\/)\.vscode\//i,
  /(^|\/)__pycache__\//i,
  /(^|\/)\.venv\//i,
  /(^|\/)venv\//i,
];

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.tiff',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar', '.bz2',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.iso',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp3', '.mp4', '.avi', '.mov', '.webm', '.ogg', '.mkv',
  '.wasm', '.jar', '.class', '.pyc', '.pyd',
]);

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB max per individual file

function isBinary(buffer: Buffer): boolean {
  // Check the first 8000 bytes for null bytes \0
  const length = Math.min(buffer.length, 8000);
  for (let i = 0; i < length; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

function sanitizeUtf8(text: string): string {
  // Remove PostgreSQL-incompatible null characters
  return text.replace(/\0/g, '');
}

export function extractZip(buffer: Buffer): ExtractedFile[] {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const rawFiles: { path: string; name: string; content: string }[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const normalizedPath = entry.entryName.replace(/\\/g, '/').replace(/^\/+/, '');

    // Skip ignored directories
    if (IGNORED_DIR_PATTERNS.some((pattern) => pattern.test(normalizedPath))) {
      continue;
    }

    const name = normalizedPath.split('/').pop() || normalizedPath;
    const ext = '.' + name.split('.').pop()?.toLowerCase();

    // Check extension
    if (BINARY_EXTENSIONS.has(ext)) {
      continue;
    }

    let data: Buffer;
    try {
      data = entry.getData();
    } catch {
      continue;
    }

    if (data.length > MAX_FILE_SIZE) {
      continue;
    }

    // Check for binary buffer content
    if (isBinary(data)) {
      continue;
    }

    const content = sanitizeUtf8(data.toString('utf8'));
    rawFiles.push({
      path: normalizedPath,
      name,
      content,
    });
  }

  // If all files share a common single root folder (like GitHub zip downloads "repo-main/..."), strip it
  if (rawFiles.length > 0) {
    const firstSegment = rawFiles[0].path.split('/')[0];
    const allShareRoot = rawFiles.every(
      (f) => f.path.includes('/') && f.path.split('/')[0] === firstSegment,
    );

    if (allShareRoot) {
      const prefixLength = firstSegment.length + 1;
      return rawFiles.map((f) => ({
        path: f.path.slice(prefixLength),
        name: f.name,
        content: f.content,
      }));
    }
  }

  return rawFiles;
}