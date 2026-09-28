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
  Sparkles,
  Terminal,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

interface SettingsPageProps {
  params: Promise<{ projectId: string }>;
}

const PROVIDER_PRESETS: Record<
  ProviderType,
  { defaultBaseUrl: string; defaultModel: string; keyRequired: boolean; hint: string }
> = {
  gemini: {
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
    keyRequired: true,
    hint: 'Google Gemini (Free tier available). Get your free API key at aistudio.google.com',
  },
  ollama: {
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    keyRequired: false,
    hint: 'Local Ollama instance. No API key needed. Runs locally on port 11434 (e.g. ollama run llama3).',
  },
  'lm-studio': {
    defaultBaseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    keyRequired: false,
    hint: 'Local LM Studio server. Start local server in LM Studio on port 1234. No key needed.',
  },
  openai: {
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    keyRequired: true,
    hint: 'Official OpenAI cloud API. Requires a funded OpenAI account (sk-... key).',
  },
  generic: {
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    keyRequired: true,
    hint: 'Any OpenAI-compatible API endpoint (Groq, OpenRouter, DeepSeek, Together AI).',
  },
};

export default function SettingsPage({ params }: SettingsPageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [providerType, setProviderType] = useState<ProviderType>('gemini');
  const [baseUrl, setBaseUrl] = useState(PROVIDER_PRESETS.gemini.defaultBaseUrl);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(PROVIDER_PRESETS.gemini.defaultModel);
  const [showKey, setShowKey] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

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
          setProviderType(config.providerType || 'gemini');
          setBaseUrl(config.baseUrl || PROVIDER_PRESETS[config.providerType]?.defaultBaseUrl || PROVIDER_PRESETS.gemini.defaultBaseUrl);
          setApiKey(config.apiKey || '');
          setModel(config.model || PROVIDER_PRESETS[config.providerType]?.defaultModel || PROVIDER_PRESETS.gemini.defaultModel);
        }
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: err?.message || 'Failed to load settings.' });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const handleProviderTypeChange = (type: ProviderType) => {
    setProviderType(type);
    setBaseUrl(PROVIDER_PRESETS[type].defaultBaseUrl);
    setModel(PROVIDER_PRESETS[type].defaultModel);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    const preset = PROVIDER_PRESETS[providerType];
    if (preset.keyRequired && !apiKey.trim()) {
      setStatusMessage({
        type: 'error',
        text: `An API key is required for ${providerType.toUpperCase()}.`,
      });
      setSaving(false);
      return;
    }

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

  const labelMap: Record<ProviderType, { title: string; subtitle: string }> = {
    gemini: { title: 'Gemini', subtitle: 'Free Tier' },
    ollama: { title: 'Ollama', subtitle: 'Local / 0 Key' },
    'lm-studio': { title: 'LM Studio', subtitle: 'Local / 0 Key' },
    openai: { title: 'OpenAI', subtitle: 'Paid API' },
    generic: { title: 'Groq / Other', subtitle: 'Cloud API' },
  };

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
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
              <Cpu className="h-5 w-5 text-zinc-300" />
              <span>AI Provider Configuration</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Connect this project to local LLMs (Ollama, LM Studio) or free/paid cloud providers (Gemini, Groq, OpenAI).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-800 text-zinc-200 text-xs font-mono hover:bg-zinc-700 transition-colors"
          >
            <HelpCircle className="h-3.5 w-3.5 text-zinc-300" />
            <span>{showGuide ? 'Hide Guide' : 'Connection Guide'}</span>
          </button>
        </div>

        {/* Quick Connection Help Guide */}
        {showGuide && (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-[#121215] p-5 font-mono text-xs text-zinc-300 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>How to Connect Each AI Model</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3 rounded border border-zinc-800 bg-[#09090b] space-y-1.5">
                <span className="font-bold text-white block">1. Google Gemini (Free Cloud)</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  1. Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-zinc-200 underline">aistudio.google.com</a> and click "Create API key".
                  <br />2. Click <strong>Gemini</strong> button above.
                  <br />3. Paste your <code className="text-zinc-300">AIzaSy...</code> key and click Save.
                </p>
              </div>

              <div className="p-3 rounded border border-zinc-800 bg-[#09090b] space-y-1.5">
                <span className="font-bold text-white block">2. Ollama (100% Free & Local)</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  1. Download from <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-zinc-200 underline">ollama.com</a>.
                  <br />2. Run in terminal: <code className="text-zinc-300">ollama run llama3</code> or <code className="text-zinc-300">ollama run qwen2.5-coder</code>.
                  <br />3. Click <strong>Ollama</strong> button above. Leave API key blank and click Save.
                </p>
              </div>

              <div className="p-3 rounded border border-zinc-800 bg-[#09090b] space-y-1.5">
                <span className="font-bold text-white block">3. LM Studio (Local GUI)</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  1. Download from <a href="https://lmstudio.ai" target="_blank" rel="noreferrer" className="text-zinc-200 underline">lmstudio.ai</a> and load any model.
                  <br />2. Go to "Local Server" tab and click <strong>Start Server</strong> (port 1234).
                  <br />3. Click <strong>LM Studio</strong> button above. Leave key blank and click Save.
                </p>
              </div>

              <div className="p-3 rounded border border-zinc-800 bg-[#09090b] space-y-1.5">
                <span className="font-bold text-white block">4. Groq (Free Cloud Llama 3.3 70B)</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  1. Get free key at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-zinc-200 underline">console.groq.com</a>.
                  <br />2. Click <strong>Groq / Other</strong> button above.
                  <br />3. Paste your <code className="text-zinc-300">gsk_...</code> key and click Save.
                </p>
              </div>
            </div>
          </div>
        )}

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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {(['gemini', 'ollama', 'lm-studio', 'openai', 'generic'] as ProviderType[]).map((type) => {
                const isSelected = providerType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleProviderTypeChange(type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-mono transition-all ${
                      isSelected
                        ? 'border-zinc-300 bg-zinc-800 text-white font-bold shadow-sm'
                        : 'border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span>{labelMap[type].title}</span>
                    <span className="text-[10px] text-zinc-500 mt-1">
                      {labelMap[type].subtitle}
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
                  placeholder="https://generativelanguage.googleapis.com/v1beta/openai"
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
                  placeholder="gemini-2.5-flash"
                  className="w-full rounded-md border border-zinc-800 bg-[#09090b] py-2 pl-9 pr-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
              </div>

              {providerType === 'gemini' && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
                  <span className="text-zinc-500">Popular:</span>
                  {['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModel(m)}
                      className={`px-2 py-0.5 rounded border transition-colors ${
                        model === m
                          ? 'border-zinc-400 bg-zinc-800 text-white'
                          : 'border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              {providerType === 'ollama' && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
                  <span className="text-zinc-500">Popular:</span>
                  {['llama3', 'qwen2.5-coder', 'codellama', 'deepseek-coder'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModel(m)}
                      className={`px-2 py-0.5 rounded border transition-colors ${
                        model === m
                          ? 'border-zinc-400 bg-zinc-800 text-white'
                          : 'border-zinc-800 bg-[#09090b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-zinc-200 mb-1.5 flex items-center justify-between">
                <span>
                  API Key {currentPreset.keyRequired ? '*' : '(Optional for local LLMs)'}
                </span>
                <span className="text-[11px] font-mono text-zinc-500">Sent as Bearer token</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type={showKey ? 'text' : 'password'}
                  required={currentPreset.keyRequired}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    providerType === 'gemini'
                      ? 'AIzaSy...'
                      : providerType === 'openai'
                      ? 'sk-...'
                      : providerType === 'generic'
                      ? 'gsk_... or custom key'
                      : 'None required for local models'
                  }
                  className="w-full rounded-md border border-zinc-800 bg-[#09090b] py-2 pl-9 pr-10 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href={`/projects/${projectId}`}
              className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              &larr; Back to Workspace
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 rounded-md bg-zinc-100 px-5 py-2.5 text-xs font-mono font-semibold text-zinc-950 shadow hover:bg-white focus:outline-none disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
