'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChatMessage, AiProviderConfig } from '@/lib/api/types';
import { api } from '@/lib/api/client';
import {
  Send,
  Bot,
  User,
  AlertTriangle,
  Loader2,
  Terminal,
} from 'lucide-react';

interface ChatTabProps {
  projectId: string;
  aiConfig: AiProviderConfig | null;
}

export function ChatTab({ projectId, aiConfig }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading || !aiConfig) return;

    setInput('');
    setError(null);

    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: query,
      sessionId: sessionId || '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setIsLoading(true);

    try {
      const res = await api.askChat(projectId, {
        question: query,
        sessionId,
      });

      setSessionId(res.sessionId);
      setMessages((prev) => [...prev, res.message]);
    } catch (err: any) {
      setError(err?.message || 'Failed to get answer from AI provider.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e11] text-xs">
      {/* 1. Missing AI Provider Warning Banner */}
      {!aiConfig && (
        <div className="p-3 border-b border-amber-500/30 bg-amber-500/10 text-amber-200">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px]">
              <p className="font-semibold text-amber-100 font-mono">No AI provider configured</p>
              <p className="text-amber-300">
                Configure Ollama, LM Studio, or OpenAI to chat with your codebase.
              </p>
              <Link
                href={`/projects/${projectId}/settings`}
                className="font-mono text-zinc-100 hover:text-white underline font-medium"
              >
                Go to Settings &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 2. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 select-none">
            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-700">
              <Terminal className="h-5 w-5" />
            </div>
            <h4 className="font-semibold text-zinc-300 text-xs font-mono">No messages yet</h4>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed font-sans">
              No messages in this session. Ask any architectural, security, or implementation question about the repository.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 mb-1 text-[10px] font-mono text-zinc-500 px-1">
                  {isUser ? (
                    <>
                      <span>You</span>
                      <User className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 text-zinc-400" />
                      <span className="text-zinc-300 font-bold">CodeReview Assistant</span>
                    </>
                  )}
                </div>

                <div
                  className={`max-w-[88%] rounded-lg p-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-zinc-800 border border-zinc-700 text-white font-sans rounded-br-none shadow'
                      : 'bg-[#121215] border border-zinc-800 text-zinc-200 font-sans rounded-bl-none shadow whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-zinc-400 text-xs font-mono p-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-300" />
            <span>Searching AST context & thinking...</span>
          </div>
        )}

        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-red-300 text-xs font-mono">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Footer */}
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 bg-[#121215]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !aiConfig}
            placeholder={
              aiConfig
                ? 'Ask a question about the repository...'
                : 'Configure AI provider in Settings first...'
            }
            className="w-full rounded-md border border-zinc-800 bg-[#09090b] py-2 pl-3 pr-10 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 font-mono"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !aiConfig}
            className="absolute right-1.5 p-1.5 rounded bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-40 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
