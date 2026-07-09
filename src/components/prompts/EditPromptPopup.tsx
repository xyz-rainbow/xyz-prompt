/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, AlertCircle, Clipboard } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Prompt } from '../../types';

interface EditPromptPopupProps {
  prompt: Prompt;
  onClose: () => void;
}

export default function EditPromptPopup({ prompt, onClose }: EditPromptPopupProps) {
  const t = useStore((state) => state.t());
  const language = useStore((state) => state.language);
  const updatePrompt = useStore((state) => state.updatePrompt);

  const [title, setTitle] = useState(prompt.title);
  const [content, setContent] = useState(prompt.content);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [loading]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError(t.addPrompt.contentPlaceholder);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await updatePrompt(prompt.id, title.trim(), content.trim());
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {
      setError(language === 'es' ? 'Error al actualizar el prompt' : 'Failed to update the prompt');
    } finally {
      setLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setContent(text);
        if (!title) {
          const words = text.trim().split(/\s+/).slice(0, 4).join(' ');
          setTitle(words + '...');
        }
      } else {
        setError(t.addPrompt.clipboardError);
      }
    } catch {
      setError(t.addPrompt.clipboardError);
    }
  };

  const modalTitle = language === 'es' ? 'Editar Prompt' : 'Edit Prompt';
  const successMessage =
    language === 'es' ? 'Prompt actualizado con éxito' : 'Prompt updated successfully!';
  const updateLabel = language === 'es' ? 'Actualizar' : 'Update';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#020203]/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        id="edit-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-prompt-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-xl sm:max-w-2xl max-h-[min(92dvh,760px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c10]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-5 sm:px-7 sm:py-6">
          <h3
            id="edit-prompt-modal-title"
            className="font-display text-lg font-semibold text-slate-100 flex items-center gap-2.5"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-fuchsia-500 shadow-sm shadow-fuchsia-500/50" />
            {modalTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.addPrompt.cancel}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6 sm:px-7 sm:py-7 custom-scrollbar">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-sm text-rose-300 animate-fade-in">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-300 animate-fade-in">
                <Check className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t.addPrompt.titleLabel}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.addPrompt.titlePlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-[#050507]/60 px-3.5 py-2.5 text-sm text-slate-200 transition-colors focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/20"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {t.addPrompt.contentLabel}
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-fuchsia-400 cursor-pointer"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                    {t.addPrompt.clipboardPaste}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.addPrompt.contentPlaceholder}
                  rows={8}
                  className="min-h-[200px] w-full resize-y rounded-xl border border-white/10 bg-[#050507]/60 px-3.5 py-3 font-mono text-sm leading-relaxed text-slate-200 transition-colors focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/20"
                />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/5 bg-white/[0.02] px-6 py-5 sm:px-7">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 disabled:opacity-50 cursor-pointer"
            >
              {t.addPrompt.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-slate-100 shadow-lg transition-all hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 cursor-pointer"
            >
              {loading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-100 border-t-transparent" />
              )}
              {updateLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
