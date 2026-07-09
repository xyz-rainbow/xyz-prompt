/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, Clipboard } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Prompt } from '../../types';

interface EditPromptPopupProps {
  prompt: Prompt;
  onClose: () => void;
}

export default function EditPromptPopup({ prompt, onClose }: EditPromptPopupProps) {
  const t = useStore((state) => state.t());
  const updatePrompt = useStore((state) => state.updatePrompt);

  const [title, setTitle] = useState(prompt.title);
  const [content, setContent] = useState(prompt.content);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      setError(t.language === 'es' ? 'Error al actualizar el prompt' : 'Failed to update the prompt');
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
    } catch (err) {
      setError(t.addPrompt.clipboardError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020203]/70 backdrop-blur-md animate-fade-in">
      <div 
        id="edit-prompt-modal"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-5 bg-white/[0.02]">
          <h3 className="font-display text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-sm shadow-fuchsia-500/50"></span>
            {t.language === 'es' ? 'Editar Prompt' : 'Edit Prompt'}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleUpdate} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-300 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300 text-sm animate-fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{t.language === 'es' ? 'Prompt actualizado con éxito' : 'Prompt updated successfully!'}</span>
            </div>
          )}

          {/* Manual Input Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.addPrompt.titleLabel}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.addPrompt.titlePlaceholder}
                className="w-full rounded-lg border border-white/10 bg-[#050507]/40 p-2.5 text-slate-200 text-sm focus:border-fuchsia-500/50 focus:outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.addPrompt.contentLabel}</label>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-fuchsia-400 transition-colors cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  {t.addPrompt.clipboardPaste}
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.addPrompt.contentPlaceholder}
                rows={7}
                className="w-full rounded-lg border border-white/10 bg-[#050507]/40 p-3 text-slate-200 text-sm font-mono focus:border-fuchsia-500/50 focus:outline-none transition-colors resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 hover:bg-white/5 px-5 py-2 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
            >
              {t.language === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 px-5 py-2 text-slate-100 text-sm font-semibold border border-white/10 shadow-lg cursor-pointer transition-all"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></div>
              )}
              {t.language === 'es' ? 'Actualizar' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
