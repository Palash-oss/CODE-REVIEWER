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
  GitBranch,
  Globe,
  X,
} from 'lucide-react';

interface FileTreeProps {
  tree: TreeNode[];
  selectedPath: string | null;
  onSelectFile: (file: { path: string; name: string; id?: string }) => void;
  onUploadZip: (file: File) => Promise<void>;
  onImportRepo: (repoUrl: string) => Promise<void>;
  isUploading: boolean;
  isImporting: boolean;
}

export function FileTree({
  tree,
  selectedPath,
  onSelectFile,
  onUploadZip,
  onImportRepo,
  isUploading,
  isImporting,
}: FileTreeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUploadZip(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    await onImportRepo(repoUrl.trim());
    setIsRepoModalOpen(false);
    setRepoUrl('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e11] select-none text-xs border-r border-zinc-800">
      {/* Upload & Repo Header */}
      <div className="p-2.5 border-b border-zinc-800 flex items-center justify-between gap-1">
        <span className="font-semibold text-zinc-300 tracking-tight font-mono text-[11px] uppercase">
          Explorer
        </span>

        <div className="flex items-center space-x-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".zip"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isImporting}
            title="Upload Repository ZIP"
            className="flex items-center space-x-1 rounded bg-zinc-800/80 text-zinc-200 border border-zinc-700/80 px-2 py-1 text-[11px] font-mono hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-zinc-300" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Upload className="h-3 w-3 text-zinc-400" />
                <span>ZIP</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsRepoModalOpen(true)}
            disabled={isUploading || isImporting}
            title="Import from Git / GitHub Repository"
            className="flex items-center space-x-1 rounded bg-zinc-800/80 text-zinc-200 border border-zinc-700/80 px-2 py-1 text-[11px] font-mono hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-zinc-300" />
                <span>Cloning...</span>
              </>
            ) : (
              <>
                <GitBranch className="h-3 w-3 text-zinc-400" />
                <span>Git Repo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="p-4 flex flex-col items-center justify-center text-center space-y-3 mt-6">
            <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900/80 flex items-center justify-center text-zinc-400">
              <Folder className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="space-y-1">
              <p className="font-mono text-xs font-semibold text-zinc-300">No Codebase Loaded</p>
              <p className="font-mono text-[11px] text-zinc-500 max-w-[200px] leading-relaxed">
                Add code to begin automated security and quality reviews.
              </p>
            </div>
            <div className="flex flex-col w-full space-y-2 pt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isImporting}
                className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 rounded bg-zinc-100 text-zinc-950 font-mono text-xs font-medium hover:bg-white transition-colors disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .ZIP Archive</span>
              </button>
              <button
                onClick={() => setIsRepoModalOpen(true)}
                disabled={isUploading || isImporting}
                className="w-full flex items-center justify-center space-x-2 py-1.5 px-3 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 font-mono text-xs font-medium hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Clone Git / GitHub Repo</span>
              </button>
            </div>
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

      {/* Git Repository Import Modal */}
      {isRepoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#121215] p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200">
                  <GitBranch className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mono text-sm font-semibold text-white">Import Git Repository</h3>
                  <p className="font-mono text-[11px] text-zinc-400">Clone directly from GitHub or any Git host</p>
                </div>
              </div>
              <button
                onClick={() => setIsRepoModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRepoSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-zinc-300 mb-1.5 font-medium">
                  Repository URL
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="url"
                    required
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/facebook/react.git"
                    className="w-full rounded-md border border-zinc-800 bg-[#09090b] py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                  />
                </div>
                <p className="mt-1.5 font-mono text-[10px] text-zinc-500">
                  Supports any public repository URL ending in .git or standard https://github.com/org/repo
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setIsRepoModalOpen(false)}
                  className="rounded px-3 py-1.5 font-mono text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !repoUrl.trim()}
                  className="flex items-center space-x-1.5 rounded bg-zinc-100 px-4 py-1.5 font-mono text-xs font-semibold text-zinc-950 hover:bg-white transition-colors disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Cloning...</span>
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-3.5 w-3.5" />
                      <span>Clone & Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
