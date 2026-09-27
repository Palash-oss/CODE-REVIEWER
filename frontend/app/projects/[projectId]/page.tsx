'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api/client';
import {
  Project,
  TreeNode,
  AiProviderConfig,
  Review,
  ReviewIssue,
  ReviewTemplate,
  SeverityLevel,
} from '@/lib/api/types';
import { Navbar } from '@/components/navbar';
import { FileTree } from './components/file-tree';
import { CodeViewer } from './components/code-viewer';
import { ReviewTab } from './components/review-tab';
import { ChatTab } from './components/chat-tab';
import {
  FolderTree,
  Code2,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface WorkspaceProps {
  params: Promise<{ projectId: string }>;
}

export default function WorkspacePage({ params }: WorkspaceProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [flatFiles, setFlatFiles] = useState<{ id: string; path: string; name: string }[]>([]);
  const [aiConfig, setAiConfig] = useState<AiProviderConfig | null>(null);

  // Active File & Code State
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [highlightLine, setHighlightLine] = useState<{ line: number; severity: SeverityLevel } | null>(null);

  // Right Panel State
  const [activeTab, setActiveTab] = useState<'review' | 'chat'>('review');
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [isReviewRunning, setIsReviewRunning] = useState(false);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Responsive mobile active pane
  const [mobilePane, setMobilePane] = useState<'tree' | 'editor' | 'panel'>('editor');

  const extractFlatFiles = (nodes: TreeNode[]): { id: string; path: string; name: string }[] => {
    let result: { id: string; path: string; name: string }[] = [];
    for (const node of nodes) {
      if (node.type === 'file' && node.id) {
        result.push({ id: node.id, path: node.path, name: node.name });
      }
      if (node.children) {
        result = result.concat(extractFlatFiles(node.children));
      }
    }
    return result;
  };

  const loadWorkspaceData = async () => {
    try {
      setPageLoading(true);
      setError(null);

      const [proj, treeData, config, reviewsData] = await Promise.all([
        api.getProject(projectId),
        api.getFileTree(projectId),
        api.getAiProviderConfig(projectId),
        api.getReviews(projectId),
      ]);

      setProject(proj);
      const safeTree = treeData || [];
      setTree(safeTree);
      setAiConfig(config);

      const flattened = extractFlatFiles(safeTree);
      setFlatFiles(flattened);

      if (reviewsData && reviewsData.length > 0) {
        setActiveReview(reviewsData[0]);
      }

      if (flattened.length > 0 && !selectedFilePath) {
        const first = flattened[0];
        handleSelectFile(first);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize project workspace.');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (projectId) {
        loadWorkspaceData();
      }
    }
  }, [authLoading, isAuthenticated, projectId]);

  const handleSelectFile = async (file: { path: string; name: string; id?: string }) => {
    setSelectedFilePath(file.path);
    setHighlightLine(null);
    setMobilePane('editor');

    if (!file.id) {
      const found = flatFiles.find((f) => f.path === file.path);
      if (!found?.id) return;
      file.id = found.id;
    }

    try {
      const fileEntity = await api.getFileContent(projectId, file.id);
      setSelectedFileContent(fileEntity?.content ?? '');
    } catch (err: any) {
      console.error('Failed to load file content:', err);
      setSelectedFileContent('// Failed to load file content from server.');
    }
  };

  const handleUploadZip = async (file: File) => {
    setIsUploading(true);
    try {
      await api.uploadZip(projectId, file);
      const newTree = await api.getFileTree(projectId);
      const safeTree = newTree || [];
      setTree(safeTree);
      const flattened = extractFlatFiles(safeTree);
      setFlatFiles(flattened);

      if (flattened.length > 0) {
        handleSelectFile(flattened[0]);
      }
    } catch (err: any) {
      alert(`Upload failed: ${err?.message || 'Invalid ZIP format'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunReview = async (fileIds: string[], template: ReviewTemplate) => {
    setIsReviewRunning(true);
    try {
      const result = await api.createReview(projectId, { fileIds, templateType: template });
      setActiveReview(result);
    } catch (err: any) {
      alert(`Review failed: ${err?.message || 'Could not complete analysis'}`);
    } finally {
      setIsReviewRunning(false);
    }
  };

  const handleSelectIssue = async (issue: ReviewIssue) => {
    const targetFile = flatFiles.find(
      (f) => f.name === issue.file || f.path.endsWith(issue.file)
    );

    if (targetFile) {
      if (selectedFilePath !== targetFile.path) {
        setSelectedFilePath(targetFile.path);
        try {
          const fileEntity = await api.getFileContent(projectId, targetFile.id);
          setSelectedFileContent(fileEntity?.content ?? '');
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (issue.line) {
      setHighlightLine({ line: issue.line, severity: issue.severity });
      setMobilePane('editor');
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col">
        <Navbar projectId={projectId} projectName={project?.name} />
        <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent mr-3" />
          Loading workspace components...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#09090b] flex flex-col overflow-hidden text-zinc-100">
      <Navbar projectId={projectId} projectName={project?.name} />

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-red-300 text-xs font-mono flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Responsive mobile/tablet pane switcher */}
      <div className="lg:hidden flex border-b border-zinc-800 bg-[#0e0e11] text-xs font-mono select-none">
        <button
          onClick={() => setMobilePane('tree')}
          className={`flex-1 py-2 flex items-center justify-center space-x-1.5 border-b-2 ${
            mobilePane === 'tree'
              ? 'border-zinc-200 text-white bg-zinc-800/40'
              : 'border-transparent text-zinc-400'
          }`}
        >
          <FolderTree className="h-3.5 w-3.5" />
          <span>Files</span>
        </button>

        <button
          onClick={() => setMobilePane('editor')}
          className={`flex-1 py-2 flex items-center justify-center space-x-1.5 border-b-2 ${
            mobilePane === 'editor'
              ? 'border-zinc-200 text-white bg-zinc-800/40'
              : 'border-transparent text-zinc-400'
          }`}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Code Viewer</span>
        </button>

        <button
          onClick={() => setMobilePane('panel')}
          className={`flex-1 py-2 flex items-center justify-center space-x-1.5 border-b-2 ${
            mobilePane === 'panel'
              ? 'border-zinc-200 text-white bg-zinc-800/40'
              : 'border-transparent text-zinc-400'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Review & Chat</span>
        </button>
      </div>

      {/* Main Three-Pane Desktop Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANE 1: Left File Tree (Fixed ~260px) */}
        <div
          className={`w-full lg:w-64 xl:w-72 shrink-0 flex flex-col ${
            mobilePane === 'tree' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <FileTree
            tree={tree}
            selectedPath={selectedFilePath}
            onSelectFile={handleSelectFile}
            onUploadZip={handleUploadZip}
            isUploading={isUploading}
          />
        </div>

        {/* PANE 2: Center Monaco Editor (Flex-1) */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${
            mobilePane === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <CodeViewer
            filePath={selectedFilePath}
            content={selectedFileContent}
            highlightLine={highlightLine}
          />
        </div>

        {/* PANE 3: Right Tabbed Panel (Fixed ~380px - 440px) */}
        <div
          className={`w-full lg:w-96 xl:w-[440px] shrink-0 flex flex-col bg-[#0e0e11] border-l border-zinc-800 ${
            mobilePane === 'panel' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Tab Headers */}
          <div className="h-9 border-b border-zinc-800 bg-[#121215] flex items-center px-2 space-x-1 select-none">
            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                activeTab === 'review'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-300" />
              <span>Review</span>
              {activeReview?.issues && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 text-[10px] border border-zinc-700">
                  {activeReview.issues.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-zinc-300" />
              <span>Chat</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'review' ? (
              <ReviewTab
                projectId={projectId}
                files={flatFiles}
                aiConfig={aiConfig}
                onRunReview={handleRunReview}
                isLoading={isReviewRunning}
                activeReview={activeReview}
                onSelectIssue={handleSelectIssue}
              />
            ) : (
              <ChatTab projectId={projectId} aiConfig={aiConfig} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
