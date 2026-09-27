'use client';

import React, { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { SeverityLevel } from '@/lib/api/types';
import { FileCode, FileQuestion } from 'lucide-react';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeViewerProps {
  filePath: string | null;
  content: string | null;
  highlightLine?: { line: number; severity: SeverityLevel } | null;
}

export function CodeViewer({ filePath, content, highlightLine }: CodeViewerProps) {
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    if (!editorRef.current || !highlightLine?.line) return;

    const editor = editorRef.current;
    const lineNumber = highlightLine.line;

    editor.revealLineInCenter(lineNumber);

    const gutterClass = `monaco-highlight-gutter-${highlightLine.severity || 'high'}`;
    const newDecorations = [
      {
        range: {
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'monaco-highlight-line',
          linesDecorationsClassName: gutterClass,
        },
      },
    ];

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [highlightLine]);

  const detectLanguage = (path: string | null): string => {
    if (!path) return 'plaintext';
    if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
    if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
    if (path.endsWith('.py')) return 'python';
    if (path.endsWith('.go')) return 'go';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.html')) return 'html';
    if (path.endsWith('.css')) return 'css';
    if (path.endsWith('.md')) return 'markdown';
    if (path.endsWith('.sql')) return 'sql';
    if (path.endsWith('.sh') || path.endsWith('.bash')) return 'shell';
    if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
    return 'plaintext';
  };

  const lineCount = content ? content.split('\n').length : 0;
  const language = detectLanguage(filePath);

  if (!filePath || content === null) {
    return (
      <div className="flex flex-col h-full bg-[#09090b] items-center justify-center text-zinc-500 p-8 text-center select-none font-mono">
        <FileQuestion className="h-10 w-10 text-zinc-600 mb-3" />
        <h3 className="text-sm font-semibold text-zinc-300">No file selected</h3>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">
          Select any file from the explorer on the left to inspect its syntax-highlighted code.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#09090b] border-r border-zinc-800">
      {/* File status bar */}
      <div className="h-9 px-4 border-b border-zinc-800 bg-[#121215] flex items-center justify-between text-xs font-mono select-none">
        <div className="flex items-center space-x-2 text-zinc-300 truncate">
          <FileCode className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <span className="truncate">{filePath}</span>
        </div>

        <div className="flex items-center space-x-3 text-zinc-500 text-[11px] shrink-0">
          <span>{lineCount} lines</span>
          <span>•</span>
          <span className="uppercase text-zinc-400">{language}</span>
          <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700">
            READ-ONLY
          </span>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 w-full h-full relative">
        <Editor
          height="100%"
          language={language}
          value={content}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            domReadOnly: true,
            minimap: { enabled: true, maxColumn: 80 },
            scrollBeyondLastLine: false,
            fontSize: 13,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            automaticLayout: true,
            renderWhitespace: 'selection',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            wordWrap: 'on',
            folding: true,
            glyphMargin: true,
          }}
        />
      </div>
    </div>
  );
}
