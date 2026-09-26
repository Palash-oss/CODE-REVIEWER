import * as AdmZip from 'adm-zip';

export interface ExtractedFile {
  path: string;
  name: string;
  content: string;
}

export function extractZip(buffer: Buffer): ExtractedFile[] {
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const files: ExtractedFile[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    files.push({
      path: entry.entryName,
      name: entry.entryName.split('/').pop() || entry.entryName,
      content: entry.getData().toString('utf8'),
    });
  }

  return files;
}