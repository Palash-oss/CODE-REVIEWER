export interface ImportEdge {
  from: string;
  to: string;
}

const IMPORT_PATTERNS = [
  /import\s+.*\s+from\s+['"](.+)['"]/g,   // JS/TS
  /require\(\s*['"](.+)['"]\s*\)/g,        // CommonJS
  /from\s+([\w.]+)\s+import/g,             // Python
  /^import\s+([\w.]+)/gm,                  // Python plain import
  /import\s+['"]([^'"]+)['"]/g,            // Go single import: import "fmt"
  /^\s*['"]([^'"]+)['"]/gm,                // Go grouped import: inside import ( ... )
];

export function extractImports(fileName: string, content: string): ImportEdge[] {
  const edges: ImportEdge[] = [];

  for (const pattern of IMPORT_PATTERNS) {
    let match: RegExpExecArray | null;
    // reset lastIndex since these are reused global regexes
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      edges.push({ from: fileName, to: match[1] });
    }
  }

  return edges;
}