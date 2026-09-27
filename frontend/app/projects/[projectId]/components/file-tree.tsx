'use client';

import React, { useState, useRef } from 'react';
import { TreeNode } from '@/lib/api/types';
import {
  Folder,
  FolderOpen,
  FileCode,
  Upload,
  ChevronRight,
  ChevronDown,
  FileText,
  FileJson,
  Loader2,
} from 'lucide-react';

interface FileTreeProps {
  tree: TreeNode[];
  selectedPath: string | null;
  onSelectFile: (file: { path: string; name: string; id?: string }) => void;
  onUploadZip: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function FileTree({
  tree,
  selectedPath,
  onSelectFile,
  onUploadZip,
  isUploading,
}: FileTreeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUploadZip(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e11] select-none text-xs border-r border-zinc-800">
      {/* Upload Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <span className="font-semibold text-zinc-300 tracking-tight font-mono text-[11px] uppercase">
          Explorer
        </span>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".zip"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload Repository ZIP"
            className="flex items-center space-x-1.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700 px-2.5 py-1 text-xs font-mono hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" />
                <span>Upload ZIP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="p-4 text-center text-zinc-400 font-mono text-xs">
            <p className="leading-relaxed">
              No codebase uploaded. Upload a .zip archive of your repository above to populate the file tree.
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {tree.map((node) => (
              <TreeItem
                key={node.path}
                node={node}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                depth={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getFileIcon(fileName: string) {
  if (fileName.endsWith('.json')) return <FileJson className="h-3.5 w-3.5 text-yellow-500 shrink-0" />;
  if (fileName.endsWith('.md')) return <FileText className="h-3.5 w-3.5 text-zinc-400 shrink-0" />;
  if (
    fileName.endsWith('.ts') ||
    fileName.endsWith('.tsx') ||
    fileName.endsWith('.js') ||
    fileName.endsWith('.jsx') ||
    fileName.endsWith('.py') ||
    fileName.endsWith('.go')
  ) {
    return <FileCode className="h-3.5 w-3.5 text-zinc-300 shrink-0" />;
  }
  return <FileCode className="h-3.5 w-3.5 text-zinc-500 shrink-0" />;
}

interface TreeItemProps {
  node: TreeNode;
  selectedPath: string | null;
  onSelectFile: (file: { path: string; name: string; id?: string }) => void;
  depth: number;
}

function TreeItem({ node, selectedPath, onSelectFile, depth }: TreeItemProps) {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = node.type === 'folder' || !!node.children;
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile({ path: node.path, name: node.name, id: node.id });
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        className={`flex items-center space-x-1.5 py-1 px-2 rounded cursor-pointer transition-colors ${
          isSelected
            ? 'bg-zinc-800 text-white font-medium border-l-2 border-zinc-200'
            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
        }`}
      >
        {isFolder ? (
          <>
            <span className="text-zinc-500 hover:text-zinc-300">
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </span>
            {isOpen ? (
              <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            ) : (
              <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            )}
            <span className="truncate font-mono text-[11px] text-zinc-200">{node.name}</span>
          </>
        ) : (
          <>
            <span className="w-3" />
            {getFileIcon(node.name)}
            <span className="truncate font-mono text-[11px]">{node.name}</span>
          </>
        )}
      </div>

      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
