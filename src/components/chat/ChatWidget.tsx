'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import {
  Bot,
  ChevronUp,
  MessageSquare,
  Send,
  Sparkles,
  User,
  X,
  RotateCcw,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "What is the status of my reported problem?",
  "How does corporate escrow funding work?",
  "What are the requirements to submit an issue?",
  "How do universities claim projects?",
];

/** Extract visible text from a v7 UIMessage's parts array. */
function getTextFromParts(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('\n');
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
  } = useChat();

  const isLoading = status === 'submitted' || status === 'streaming';

  // Restore open/closed state from sessionStorage on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedState = sessionStorage.getItem('civic_chat_widget_open');
      if (savedState === 'true') {
        setIsOpen(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Update sessionStorage when state changes
  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem('civic_chat_widget_open', String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isLoading) return;
    setInput('');
    try {
      await sendMessage({ text: query });
    } catch (e) {
      console.error('Chat error:', e);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSend();
  };

  // Auto-scroll message feed
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  if (!isMounted) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start font-sans">
      {/* Expanded Chat Panel */}
      {isOpen && (
        <div
          className="mb-3 flex h-[520px] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
          style={{
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), 0 0 25px rgba(59, 130, 246, 0.15)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md">
                <Bot className="h-4 w-4 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Civic Assistant</h3>
                <p className="text-[11px] text-slate-400">Scoped Platform AI & Status</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  title="Clear conversation"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleOpen}
                title="Minimize chat"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-3 text-slate-400">
                <div className="mb-3 rounded-full bg-blue-500/10 p-3 ring-1 ring-blue-500/20">
                  <Sparkles className="h-6 w-6 text-blue-400" />
                </div>
                <h4 className="text-sm font-medium text-slate-200">How can I help you today?</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Ask about your problem reports, claimed university projects, or how the platform works.
                </p>

                {/* Quick prompt suggestions */}
                <div className="mt-4 flex flex-col gap-1.5 w-full text-left">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => void handleSend(prompt)}
                      className="rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-blue-500/40 hover:bg-slate-800 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const messageText = getTextFromParts(m);

                if (!messageText && m.role === 'assistant' && isLoading) return null;

                return (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role !== 'user' && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600/30 text-blue-400 ring-1 ring-blue-500/30">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                          : 'border border-slate-800/80 bg-slate-800/70 text-slate-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{messageText || (m.role === 'assistant' ? 'Processing...' : '')}</div>
                    </div>

                    {m.role === 'user' && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-slate-400">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-slate-400">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-600/30 text-blue-400 ring-1 ring-blue-500/30">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center space-x-1.5 rounded-2xl border border-slate-800 bg-slate-800/50 px-3.5 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400"></span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-300">
                {error.message?.includes('401') || error.message?.includes('Unauthorized')
                  ? 'Please sign in to check the status of your reported problems and use the assistant.'
                  : (error.message || 'Failed to send message. Please ensure you are logged in.')}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleFormSubmit}
            className="border-t border-slate-800 bg-slate-900/90 p-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your issues or platform..."
              className="flex-1 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3.5 py-2 text-xs text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-600/30"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Collapsed Bar / Trigger Button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        className="group flex items-center space-x-2.5 rounded-full border border-slate-700/80 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition-all duration-200 hover:border-blue-500/60 hover:bg-slate-800 hover:shadow-blue-500/10 active:scale-95"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
          <MessageSquare className="h-3 w-3" />
        </div>
        <span>Chat</span>
        <div
          className="transition-transform duration-300 ease-in-out"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronUp className="h-3.5 w-3.5 text-slate-400 group-hover:text-white" />
        </div>
      </button>
    </div>
  );
}
