'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Review,
  ReviewIssue,
  ReviewTemplate,
  AiProviderConfig,
} from '@/lib/api/types';
import { SeverityBadge } from '@/components/ui/severity-badge';
import {
  Play,
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileCode,
  CheckSquare,
  Square,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ReviewTabProps {
  projectId: string;
  files: { id: string; path: string; name: string }[];
  aiConfig: AiProviderConfig | null;
  onRunReview: (fileIds: string[], template: ReviewTemplate) => Promise<void>;
  isLoading: boolean;
  activeReview: Review | null;
  onSelectIssue: (issue: ReviewIssue) => void;
}

export function ReviewTab({
  projectId,
  files,
  aiConfig,
  onRunReview,
  isLoading,
  activeReview,
  onSelectIssue,
}: ReviewTabProps) {
  const [template, setTemplate] = useState<ReviewTemplate>('security');
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);

  React.useEffect(() => {
    if (files.length > 0 && selectedFileIds.length === 0) {
      setSelectedFileIds(files.map((f) => f.id));
    }
  }, [files]);

  const toggleFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleAll = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map((f) => f.id));
    }
  };

  const handleStartReview = () => {
    if (selectedFileIds.length === 0) return;
    onRunReview(selectedFileIds, template);
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e11] overflow-y-auto p-4 space-y-5 text-xs">
      {/* 1. Missing AI Provider Warning Banner */}
      {!aiConfig && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-200">
          <div className="flex items-start space-x-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-100 font-mono">No AI provider configured</p>
              <p className="text-[11px] text-amber-300 leading-relaxed font-sans">
                An active AI provider (OpenAI, Ollama, LM Studio) is required to run reviews or chat with the codebase.
              </p>
              <Link
                href={`/projects/${projectId}/settings`}
                className="inline-flex items-center space-x-1 font-mono text-[11px] text-zinc-100 hover:text-white underline font-medium pt-1"
              >
                <span>Configure AI Provider</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Review Controls Card */}
      <div className="rounded-lg border border-zinc-800 bg-[#121215] p-4 space-y-4">
        {/* Template Selector */}
        <div>
          <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
            Analysis Template
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTemplate('security')}
              className={`flex flex-col items-center justify-center p-2.5 rounded border transition-all ${
                template === 'security'
                  ? 'border-red-500/80 bg-red-500/10 text-red-300 font-semibold'
                  : 'border-zinc-800 bg-[#09090b] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldAlert className="h-4 w-4 mb-1 text-red-400" />
              <span className="font-mono">Security</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplate('performance')}
              className={`flex flex-col items-center justify-center p-2.5 rounded border transition-all ${
                template === 'performance'
                  ? 'border-orange-500/80 bg-orange-500/10 text-orange-300 font-semibold'
                  : 'border-zinc-800 bg-[#09090b] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className="h-4 w-4 mb-1 text-orange-400" />
              <span className="font-mono">Performance</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplate('code-quality')}
              className={`flex flex-col items-center justify-center p-2.5 rounded border transition-all ${
                template === 'code-quality'
                  ? 'border-zinc-400 bg-zinc-800 text-white font-semibold'
                  : 'border-zinc-800 bg-[#09090b] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 mb-1 text-zinc-300" />
              <span className="font-mono">Quality</span>
            </button>
          </div>
        </div>

        {/* File Selection Accordion */}
        <div>
          <div className="flex items-center justify-between pb-1">
            <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Target Files ({selectedFileIds.length}/{files.length})
            </label>
            <button
              type="button"
              onClick={() => setShowFilePicker(!showFilePicker)}
              className="text-[11px] font-mono text-zinc-300 hover:text-white flex items-center space-x-1"
            >
              <span>{showFilePicker ? 'Collapse' : 'Customize'}</span>
              {showFilePicker ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {showFilePicker && (
            <div className="mt-2 rounded border border-zinc-800 bg-[#09090b] p-2 space-y-1 max-h-44 overflow-y-auto font-mono text-[11px]">
              <div
                onClick={toggleAll}
                className="flex items-center space-x-2 p-1.5 rounded hover:bg-zinc-800/60 cursor-pointer font-medium text-zinc-200 pb-1.5 border-b border-zinc-800"
              >
                {selectedFileIds.length === files.length ? (
                  <CheckSquare className="h-3.5 w-3.5 text-zinc-200" />
                ) : (
                  <Square className="h-3.5 w-3.5 text-zinc-600" />
                )}
                <span>Select All Files</span>
              </div>

              {files.map((f) => {
                const checked = selectedFileIds.includes(f.id);
                return (
                  <div
                    key={f.id}
                    onClick={() => toggleFile(f.id)}
                    className="flex items-center space-x-2 p-1 rounded hover:bg-zinc-800/40 cursor-pointer text-zinc-300"
                  >
                    {checked ? (
                      <CheckSquare className="h-3.5 w-3.5 text-zinc-200 shrink-0" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    )}
                    <span className="truncate">{f.path}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Run Button */}
        <button
          type="button"
          onClick={handleStartReview}
          disabled={isLoading || !aiConfig || selectedFileIds.length === 0}
          className="w-full flex items-center justify-center space-x-2 rounded-md bg-zinc-100 py-2.5 text-xs font-mono font-semibold text-zinc-950 shadow hover:bg-white focus:outline-none disabled:opacity-40 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing AST & Slices...</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run {template.toUpperCase()} Review</span>
            </>
          )}
        </button>
      </div>

      {/* 3. Review Results Section */}
      {activeReview ? (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="rounded-lg border border-zinc-800 bg-[#121215] p-4">
            <h3 className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Review Summary
            </h3>
            <p className="text-xs text-zinc-200 leading-relaxed font-sans">
              {activeReview.summary}
            </p>
          </div>

          {/* Issues List with Staggered Entrance Motion */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Detected Issues ({activeReview.issues?.length || 0})</span>
              </h3>
            </div>

            {!activeReview.issues || activeReview.issues.length === 0 ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 font-mono">
                Clean bill of health! Zero vulnerabilities or code smells detected for the selected files.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeReview.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectIssue(issue)}
                    style={{ animationDelay: `${idx * 40}ms` }}
                    className="animate-issue-enter group rounded-md border border-zinc-800 bg-[#121215] p-3 text-xs hover:border-zinc-700 hover:bg-[#18181b] transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center space-x-1.5 font-mono text-zinc-300 truncate max-w-[220px]">
                        <FileCode className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate text-white font-medium">{issue.file}</span>
                        {issue.line && (
                          <span className="text-zinc-400 shrink-0 font-bold">
                            :L{issue.line}
                          </span>
                        )}
                      </div>
                      <SeverityBadge severity={issue.severity} />
                    </div>

                    <p className="mt-2 text-zinc-300 font-sans leading-relaxed">
                      {issue.message}
                    </p>

                    <div className="mt-2 flex items-center justify-end text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300">
                      <span>Click to view line in editor &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations List */}
          {activeReview.recommendations && activeReview.recommendations.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-[#121215] p-4">
              <h3 className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
                <span>Recommendations</span>
              </h3>
              <ul className="space-y-2">
                {activeReview.recommendations.map((rec, idx) => (
                  <li
                    key={idx}
                    className="rounded bg-[#09090b] border border-zinc-800 p-2.5 text-xs text-zinc-300 flex items-start space-x-2"
                  >
                    <span className="font-mono text-zinc-400 font-bold shrink-0">{idx + 1}.</span>
                    <span className="leading-relaxed font-sans">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-500 font-mono text-xs">
          Select files and run a review above to inspect code health.
        </div>
      )}
    </div>
  );
}
