'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Code2, History, Settings, LogOut, Terminal } from 'lucide-react';

interface NavbarProps {
  projectName?: string;
  projectId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ projectName, projectId }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isReviewsActive = projectId && pathname?.includes(`/projects/${projectId}/reviews`);
  const isSettingsActive = projectId && pathname?.includes(`/projects/${projectId}/settings`);
  const isWorkspaceActive = projectId && pathname === `/projects/${projectId}`;

  return (
    <header className="h-12 border-b border-zinc-800 bg-[#0e0e11] px-4 flex items-center justify-between select-none">
      {/* Left: Branding & Project context */}
      <div className="flex items-center space-x-4">
        <NextLink
          href="/projects"
          className="flex items-center space-x-2 text-zinc-100 hover:text-white transition-colors"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-xs font-bold">
            &gt;_
          </div>
          <span className="font-semibold text-sm tracking-tight text-zinc-100">CodeReview</span>
        </NextLink>

        {projectId && (
          <div className="flex items-center space-x-2 text-xs text-zinc-400 font-mono">
            <span className="text-zinc-600">/</span>
            <NextLink
              href="/projects"
              className="hover:text-zinc-200 transition-colors"
            >
              projects
            </NextLink>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200 font-medium truncate max-w-[180px]">
              {projectName || projectId}
            </span>
          </div>
        )}
      </div>

      {/* Middle: Project Section Tabs */}
      {projectId && (
        <nav className="flex items-center space-x-1">
          <NextLink
            href={`/projects/${projectId}`}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
              isWorkspaceActive
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Workspace</span>
          </NextLink>

          <NextLink
            href={`/projects/${projectId}/reviews`}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
              isReviewsActive
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>History</span>
          </NextLink>

          <NextLink
            href={`/projects/${projectId}/settings`}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
              isSettingsActive
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            <span>AI Provider</span>
          </NextLink>
        </nav>
      )}

      {/* Right: User and Logout */}
      <div className="flex items-center space-x-3">
        {user ? (
          <>
            <span className="text-xs text-zinc-400 hidden sm:inline-block font-mono">
              {user.email}
            </span>
            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center space-x-1 rounded px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors border border-transparent hover:border-zinc-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </>
        ) : (
          <NextLink
            href="/login"
            className="text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Sign In
          </NextLink>
        )}
      </div>
    </header>
  );
};
