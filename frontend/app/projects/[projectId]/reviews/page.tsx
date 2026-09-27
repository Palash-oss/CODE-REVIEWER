'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api/client';
import { Project, Review, ReviewIssue } from '@/lib/api/types';
import { Navbar } from '@/components/navbar';
import { SeverityBadge } from '@/components/ui/severity-badge';
import {
  History,
  Search,
  Calendar,
  FileCode,
  ShieldAlert,
  Zap,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import Link from 'next/link';

interface ReviewsPageProps {
  params: Promise<{ projectId: string }>;
}

export default function ReviewsHistoryPage({ params }: ReviewsPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadReviews = async (searchQuery?: string) => {
    try {
      setLoading(true);
      const data = await api.getReviews(projectId, searchQuery);
      setReviews(data || []);
      if (data && data.length > 0 && !selectedReview) {
        setSelectedReview(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      if (!projectId) return;
      try {
        const proj = await api.getProject(projectId);
        setProject(proj);
      } catch (err) {
        console.error(err);
      }
      loadReviews();
    }

    if (isAuthenticated) {
      init();
    }
  }, [projectId, isAuthenticated]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReviews(search);
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'security':
        return <ShieldAlert className="h-4 w-4 text-red-400" />;
      case 'performance':
        return <Zap className="h-4 w-4 text-orange-400" />;
      case 'code-quality':
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    }
  };

  const getSeverityCounts = (issues: ReviewIssue[]) => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const issue of issues || []) {
      if (counts[issue.severity] !== undefined) {
        counts[issue.severity]++;
      }
    }
    return counts;
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <Navbar projectId={projectId} projectName={project?.name} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <Link
              href={`/projects/${projectId}`}
              className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                <History className="h-5 w-5 text-zinc-300" />
                <span>Review History</span>
              </h1>
              <p className="text-xs text-zinc-400">
                Browse, search, and inspect past automated code reviews for this repository.
              </p>
            </div>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search findings (e.g. injection, password)..."
              className="w-full sm:w-72 rounded-md border border-zinc-800 bg-[#121215] py-1.5 pl-8 pr-16 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300 hover:bg-zinc-700"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Master-Detail Layout */}
        <div className="mt-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
          {/* Left Column: Reviews List */}
          <div className="lg:col-span-4 flex flex-col space-y-2 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
            {loading ? (
              <div className="py-12 text-center text-xs font-mono text-zinc-400 flex items-center justify-center">
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent mr-2" />
                Loading history...
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-800 p-6 text-center text-xs text-zinc-400">
                <p>No reviews found matching criteria.</p>
                <Link
                  href={`/projects/${projectId}`}
                  className="mt-3 inline-block font-mono text-zinc-200 hover:underline"
                >
                  Run a review in Workspace &rarr;
                </Link>
              </div>
            ) : (
              reviews.map((rev) => {
                const isSelected = selectedReview?.id === rev.id;
                const counts = getSeverityCounts(rev.issues);

                return (
                  <div
                    key={rev.id}
                    onClick={() => setSelectedReview(rev)}
                    className={`rounded-lg border p-4 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-500 bg-[#18181b] shadow-md'
                        : 'border-zinc-800 bg-[#121215] hover:border-zinc-700 hover:bg-[#18181b]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTemplateIcon(rev.templateType)}
                        <span className="font-semibold capitalize text-zinc-100 font-mono">
                          {rev.templateType} Review
                        </span>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 text-zinc-500 ${isSelected ? 'text-zinc-200' : ''}`} />
                    </div>

                    <p className="mt-2 text-zinc-400 line-clamp-2 leading-relaxed">
                      {rev.summary}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Severity pill summary */}
                      <div className="flex items-center space-x-1">
                        {counts.critical > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
                            {counts.critical}C
                          </span>
                        )}
                        {counts.high > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-bold">
                            {counts.high}H
                          </span>
                        )}
                        {counts.medium > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-yellow-500/20 text-yellow-400 font-bold">
                            {counts.medium}M
                          </span>
                        )}
                        {counts.critical === 0 && counts.high === 0 && counts.medium === 0 && (
                          <span className="text-emerald-400 font-medium">0 issues</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Review Detail */}
          <div className="lg:col-span-8 rounded-lg border border-zinc-800 bg-[#121215] p-6 overflow-y-auto max-h-[calc(100vh-180px)]">
            {selectedReview ? (
              <div className="space-y-6">
                {/* Review Header */}
                <div className="pb-4 border-b border-zinc-800 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      {getTemplateIcon(selectedReview.templateType)}
                      <h2 className="text-base font-bold text-white capitalize font-mono">
                        {selectedReview.templateType} Review Report
                      </h2>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-xs font-mono text-zinc-400">
                      <span>ID: {selectedReview.id.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>{new Date(selectedReview.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>{selectedReview.targetFiles?.length || 0} files analyzed</span>
                    </div>
                  </div>

                  <Link
                    href={`/projects/${projectId}`}
                    className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-mono text-zinc-200 hover:bg-zinc-700 transition-colors"
                  >
                    Open in Workspace &rarr;
                  </Link>
                </div>

                {/* Summary Box */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 font-mono">
                    Executive Summary
                  </h3>
                  <div className="rounded-md border border-zinc-800 bg-[#09090b] p-4 text-xs text-zinc-300 leading-relaxed font-sans">
                    {selectedReview.summary || 'No summary provided.'}
                  </div>
                </div>

                {/* Issues List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      <span>Detected Issues ({selectedReview.issues?.length || 0})</span>
                    </h3>
                  </div>

                  {!selectedReview.issues || selectedReview.issues.length === 0 ? (
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 font-mono">
                      Clean bill of health! Zero vulnerabilities or code smells detected for the selected files.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedReview.issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className="rounded-md border border-zinc-800 bg-[#09090b] p-3 text-xs"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                            <div className="flex items-center space-x-2 font-mono text-zinc-300">
                              <FileCode className="h-3.5 w-3.5 text-zinc-500" />
                              <span className="font-medium text-white">{issue.file}</span>
                              {issue.line && (
                                <span className="text-zinc-500">
                                  :L{issue.line}
                                </span>
                              )}
                            </div>
                            <SeverityBadge severity={issue.severity} />
                          </div>
                          <p className="mt-2 text-zinc-300 leading-relaxed font-sans">
                            {issue.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {selectedReview.recommendations && selectedReview.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
                      <span>Recommended Actions</span>
                    </h3>
                    <ul className="space-y-2">
                      {selectedReview.recommendations.map((rec, idx) => (
                        <li
                          key={idx}
                          className="rounded-md border border-zinc-800 bg-[#09090b] p-3 text-xs text-zinc-300 flex items-start space-x-2"
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
              <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                Select a review from the left to inspect detailed findings.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
