/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ChatMessage } from '../../types';

interface OutputListProps {
  messages: ChatMessage[];
  loading?: boolean;
}

export default function OutputList({ messages, loading }: OutputListProps) {
  const t = useStore((state) => state.t());

  if (messages.length === 0 && !loading) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2 max-h-[180px] overflow-y-auto pr-1 mb-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex gap-2 rounded-xl border p-3 text-xs leading-relaxed ${
            msg.role === 'user'
              ? 'border-lime-500/20 bg-lime-500/5 text-slate-200'
              : 'border-purple-500/20 bg-purple-500/5 text-slate-300'
          }`}
        >
          <span className="shrink-0 mt-0.5">
            {msg.role === 'user' ? (
              <User className="w-3.5 h-3.5 text-lime-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            )}
          </span>
          <pre className="whitespace-pre-wrap break-words font-sans flex-1">{msg.content}</pre>
        </div>
      ))}
      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-300 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>{t.chat.thinking}</span>
        </div>
      )}
    </div>
  );
}
