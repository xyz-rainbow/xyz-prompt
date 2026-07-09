/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Check, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface FeedbackComposerProps {
  promptId: string;
  mode: 'pages' | 'versus' | 'metrics';
  onCompleted?: () => void;
  onClose?: () => void;
}

export default function FeedbackComposer({ promptId, mode, onCompleted, onClose }: FeedbackComposerProps) {
  const t = useStore((state) => state.t());
  const addFeedback = useStore((state) => state.addFeedback);

  const [feedbackText, setFeedbackText] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!onClose) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onCloseRef.current?.();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onCloseRef.current?.();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, saving]);

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
        onCompleted?.();
      }, 1500);
    } catch (err) {
      console.error('Error saving feedback:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="relative z-20 w-full max-w-xl mx-auto rounded-2xl border border-lime-500/20 bg-white/[0.03] p-4 space-y-3 shadow-2xl backdrop-blur-md animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-lime-400">
          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
          <span>{t.versusMode.addFeedbackToSelected || 'Write Feedback for Selected Prompt'}</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t.addPrompt.cancel}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
          className={`flex shrink-0 items-center justify-center self-end rounded-xl border border-white/10 p-3 shadow transition-all cursor-pointer ${
            success
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-100'
              : 'bg-gradient-to-r from-lime-500 to-purple-600 font-semibold text-slate-100 hover:from-lime-400 hover:to-purple-500 disabled:from-white/5 disabled:to-white/5 disabled:text-slate-600'
          }`}
          title={t.pagesMode.submitFeedback}
        >
          {success ? (
            <Check className="h-5 w-5 animate-bounce" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>

      {success && (
        <p className="animate-pulse text-right font-mono text-[11px] font-medium text-emerald-400">
          {t.pagesMode.feedbackSubmitted}
        </p>
      )}
    </form>
  );
}
