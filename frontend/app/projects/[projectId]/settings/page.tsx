'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api/client';
import { Project, ProviderType } from '@/lib/api/types';
import { Navbar } from '@/components/navbar';
import {
  Cpu,
  Key,
  Globe,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface SettingsPageProps {
  params: Promise<{ projectId: string }>;
}

const PROVIDER_PRESETS: Record<
  ProviderType,
  { defaultBaseUrl: string; defaultModel: string; keyRequired: boolean; hint: string }
> = {
  ollama: {
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    keyRequired: false,
    hint: 'Local Ollama instance. No API key needed. Runs locally on port 11434.',
  },
  'lm-studio': {
    defaultBaseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    keyRequired: false,
    hint: 'Local LM Studio local server. Start local server in LM Studio on port 1234.',
  },
  openai: {
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    keyRequired: true,
    hint: 'Official OpenAI cloud API. Requires a valid sk-... API key.',
  },
  generic: {
    defaultBaseUrl: 'https://api.together.xyz/v1',
    defaultModel: 'deepseek-ai/deepseek-coder-33b-instruct',
    keyRequired: true,
    hint: 'Any OpenAI-compatible API endpoint (Groq, Together AI, DeepSeek, etc.).',
  },
};

export default function SettingsPage({ params }: SettingsPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [providerType, setProviderType] = useState<ProviderType>('ollama');
  const [baseUrl, setBaseUrl] = useState(PROVIDER_PRESETS.ollama.defaultBaseUrl);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(PROVIDER_PRESETS.ollama.defaultModel);
  const [showKey, setShowKey] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      try {
        setLoading(true);
        const [proj, config] = await Promise.all([
          api.getProject(projectId),
          api.getAiProviderConfig(projectId),
        ]);
        setProject(proj);

        if (config) {
          setProviderType(config.providerType || 'ollama');
          setBaseUrl(config.baseUrl || PROVIDER_PRESETS.ollama.defaultBaseUrl);
          setApiKey(config.apiKey || '');
          setModel(config.model || PROVIDER_PRESETS.ollama.defaultModel);
        }
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err?.message || 'Failed to load settings.' });
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      loadData();
    }
  }, [projectId, isAuthenticated]);

  const handleProviderTypeChange = (newType: ProviderType) => {
    setProviderType(newType);
    const preset = PROVIDER_PRESETS[newType];
    setBaseUrl(preset.defaultBaseUrl);
    setModel(preset.defaultModel);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      await api.saveAiProviderConfig(projectId, {
        providerType,
        baseUrl: baseUrl.trim(),
        apiKey: apiKey.trim() || undefined,
        model: model.trim(),
      });
      setStatusMessage({
        type: 'success',
        text: 'AI provider configuration saved successfully. Code reviews and chat are now enabled!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to save AI provider configuration.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col">
        <Navbar projectId={projectId} projectName={project?.name} />
        <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent mr-3" />
          Loading AI provider settings...
        </div>
      </div>
    );
  }

  const currentPreset = PROVIDER_PRESETS[providerType];

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      <Navbar projectId={projectId} projectName={project?.name} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8">
        <div className="flex items-center space-x-3 pb-6 border-b border-zinc-800">
          <Link
            href={`/projects/${projectId}`}
            className="p-1.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              <Cpu className="h-5 w-5 text-zinc-300" />
              <span>AI Provider Configuration</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Connect this project to local LLMs (Ollama, LM Studio) or cloud providers (OpenAI, Groq).
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-6 flex items-start space-x-2.5 rounded-lg border p-4 text-xs font-mono ${
              statusMessage.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* Provider Selection */}
          <div className="rounded-lg border border-zinc-800 bg-[#121215] p-5 shadow">
            <label className="block text-xs font-mono font-semibold text-zinc-200 mb-2">
              Provider Platform
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['ollama', 'lm-studio', 'openai', 'generic'] as ProviderType[]).map((type) => {
                const isSelected = providerType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleProviderTypeChange(type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-mono transition-all ${
                      isSelected
                        ? 'border-zinc-400 bg-zinc-800 text-white font-bold shadow-sm'
                        : 'border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className="capitalize">{type === 'lm-studio' ? 'LM Studio' : type}</span>
                    <span className="text-[10px] text-zinc-500 mt-1">
                      {type === 'ollama' || type === 'lm-studio' ? 'Local / Offline' : 'Cloud API'}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-zinc-400 font-mono bg-zinc-900/60 p-2.5 rounded border border-zinc-800/80">
              {currentPreset.hint}
            </p>
          </div>

          {/* Endpoint Details */}
          <div className="rounded-lg border border-zinc-800 bg-[#121215] p-5 shadow space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
                <span>Base URL *</span>
                <span className="text-[11px] font-mono text-zinc-500">OpenAI-compatible v1 root</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className="w-full rounded-md border border-zinc-800 bg-[#09090b] py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
                <span>Model Identifier *</span>
                <span className="text-[11px] font-mono text-zinc-500">model string passed to provider</span>
              </label>
              <div className="relative">
                <Cpu className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. llama3, gpt-4o-mini, deepseek-coder"
                  className="w-full rounded-md border border-zinc-800 bg-[#09090b] py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
                <span>API Key {currentPreset.keyRequired ? '*' : '(Optional for local LLMs)'}</span>
                <span className="text-[11px] font-mono text-zinc-500">Sent as Bearer token</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type={showKey ? 'text' : 'password'}
                  required={currentPreset.keyRequired}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={currentPreset.keyRequired ? 'sk-...' : 'Leave blank for local Ollama / LM Studio'}
                  className="w-full rounded-md border border-zinc-800 bg-[#09090b] py-2 pl-9 pr-10 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/projects/${projectId}`}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              &larr; Back to Workspace
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 rounded-md bg-zinc-100 px-5 py-2.5 text-xs font-mono font-semibold text-zinc-950 shadow hover:bg-white disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
