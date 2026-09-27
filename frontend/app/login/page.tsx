'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-4 text-zinc-100">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-[#121215] p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 font-mono text-sm font-bold">
            &gt;_
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">CodeReview Assistant</h1>
            <p className="text-xs text-zinc-400">Sign in to your development workspace</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start space-x-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 font-mono">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="w-full rounded-md border border-zinc-800 bg-[#09090b] py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-zinc-800 bg-[#09090b] py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 flex items-center justify-center space-x-2 rounded-md bg-zinc-100 py-2.5 text-xs font-mono font-semibold text-zinc-950 shadow hover:bg-white focus:outline-none disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center space-x-2 font-mono">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-400 font-mono">
          Need an account?{' '}
          <Link href="/register" className="font-medium text-zinc-200 hover:text-white underline underline-offset-4">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
