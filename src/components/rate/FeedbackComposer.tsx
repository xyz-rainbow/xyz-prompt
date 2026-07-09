/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MessageSquare, Send, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface FeedbackComposerProps {
  promptId: string;
  mode: 'pages' | 'versus' | 'metrics';
  onCompleted?: () => void;
}

export default function FeedbackComposer({ promptId, mode, onCompleted }: FeedbackComposerProps) {
  const t = useStore((state) => state.t());
  const addFeedback = useStore((state) => state.addFeedback);

  const [feedbackText, setFeedbackText] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setSaving(true);
    try {
      await addFeedback(promptId, feedbackText.trim(), mode);
      setFeedbackText('');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onCompleted) {
          onCompleted();
        }
      }, 1500);
    } catch (err) {
      console.error('Error saving feedback:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto rounded-2xl border border-lime-500/20 bg-white/[0.03] p-4 space-y-3 shadow-2xl backdrop-blur-md animate-fade-in"
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-lime-400">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>{t.versusMode.addFeedbackToSelected || 'Write Feedback for Selected Prompt'}</span>
      </div>

      <div className="flex gap-2.5">
        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder={t.pagesMode.placeholderFeedback}
          rows={2}
          disabled={saving || success}
          className="flex-grow rounded-xl border border-white/10 bg-[#050507]/40 p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-lime-500/50 focus:outline-none transition-colors resize-none leading-relaxed"
        />

        <button
          type="submit"
          disabled={saving || success || !feedbackText.trim()}
          className={`flex items-center justify-center rounded-xl p-3 shrink-0 self-end transition-all border border-white/10 shadow cursor-pointer ${
            success
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-100'
              : 'bg-gradient-to-r from-lime-500 to-purple-600 hover:from-lime-400 hover:to-purple-500 disabled:from-white/5 disabled:to-white/5 disabled:text-slate-600 text-slate-100 font-semibold'
          }`}
          title={t.pagesMode.submitFeedback}
        >
          {success ? (
            <Check className="w-5 h-5 animate-bounce" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {success && (
        <p className="text-[11px] font-medium text-emerald-400 text-right font-mono animate-pulse">
          {t.pagesMode.feedbackSubmitted}
        </p>
      )}
    </form>
  );
}
