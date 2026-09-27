'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api/client';
import { Project } from '@/lib/api/types';
import { Navbar } from '@/components/navbar';
import { Modal } from '@/components/ui/modal';
import {
  FolderGit2,
  Plus,
  Trash2,
  Calendar,
  ArrowRight,
  Search,
  Code2,
  AlertCircle,
} from 'lucide-react';

export default function ProjectsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // New Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects();
      setProjects(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else {
        fetchProjects();
      }
    }
  }, [authLoading, isAuthenticated, router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreateLoading(true);
    try {
      const newProj = await api.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      setIsModalOpen(false);
      router.push(`/projects/${newProj.id}`);
    } catch (err: any) {
      alert(err?.message || 'Failed to create project.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this project?')) return;

    setDeletingId(projectId);
    try {
      await api.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete project.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent mr-3" />
          Loading projects...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">Code Review Projects</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Select an existing repository workspace or create a new project.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 rounded-md bg-zinc-100 px-4 py-2 text-xs font-mono font-semibold text-zinc-950 shadow hover:bg-white transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>

        {error && (
          <div className="mt-6 flex items-start space-x-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Search bar */}
        {projects.length > 0 && (
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by name..."
              className="w-full rounded-md border border-zinc-800 bg-[#121215] py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
            />
          </div>
        )}

        {/* Projects Grid or Empty State */}
        {projects.length === 0 ? (
          <div className="mt-16 text-center max-w-md mx-auto p-8 rounded-xl border border-dashed border-zinc-800 bg-[#121215]/50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 mb-4">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-200 font-mono">No projects yet</h3>
            <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
              No projects created yet. Initialize your first project to begin reviewing code.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 inline-flex items-center space-x-2 rounded-md bg-zinc-100 px-4 py-2 text-xs font-mono font-semibold text-zinc-950 shadow hover:bg-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Project</span>
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="mt-12 text-center text-xs text-zinc-400 font-mono py-12">
            No projects matched your search query.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="group relative flex flex-col justify-between rounded-lg border border-zinc-800 bg-[#121215] p-5 shadow hover:border-zinc-700 hover:bg-[#18181b] transition-all cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono text-xs">
                        <Code2 className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-zinc-200 transition-colors truncate max-w-[200px] font-mono">
                        {project.name}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      disabled={deletingId === project.id}
                      title="Delete Project"
                      className="p-1 rounded text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-zinc-400 line-clamp-2 leading-relaxed min-h-[32px]">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-1 text-zinc-400 group-hover:text-zinc-200 transition-colors">
                    <span>Open</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. auth-service, payment-gateway"
              className="w-full rounded-md border border-zinc-800 bg-[#09090b] px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the repository and stack..."
              className="w-full rounded-md border border-zinc-800 bg-[#09090b] px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
            />
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-xs font-mono font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading || !name.trim()}
              className="rounded-md bg-zinc-100 px-4 py-2 text-xs font-mono font-semibold text-zinc-950 shadow hover:bg-white disabled:opacity-50"
            >
              {createLoading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
