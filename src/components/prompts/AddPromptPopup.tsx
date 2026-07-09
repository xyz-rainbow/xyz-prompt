/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, DragEvent, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Clipboard, Check, X, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { parseFileContent } from '../../services/fileParser';

interface AddPromptPopupProps {
  onClose: () => void;
}

export default function AddPromptPopup({ onClose }: AddPromptPopupProps) {
  const t = useStore((state) => state.t());
  const addPrompt = useStore((state) => state.addPrompt);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError(t.addPrompt.contentPlaceholder);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await addPrompt(title.trim(), content.trim(), 'manual');
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch {
      setError(t.addPrompt.parserError);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setContent((prev) => (prev ? prev + '\n\n' + text : text));
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

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await parseFileContent(file);
      setTitle(result.title);
      setContent(result.content);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'invalidJson') {
        setError(t.addPrompt.invalidJson);
      } else {
        setError(t.addPrompt.parserError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#020203]/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        id="add-prompt-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-prompt-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-xl sm:max-w-2xl max-h-[min(92dvh,760px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c10]/95 shadow-2xl shadow-black/50 backdrop-blur-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-5 sm:px-7 sm:py-6">
          <h3
            id="add-prompt-modal-title"
            className="font-display text-lg font-semibold text-slate-100 flex items-center gap-2.5"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50" />
            {t.addPrompt.title}
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

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-7 sm:py-7 custom-scrollbar">
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-sm text-rose-300 animate-fade-in">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {error === 'invalidJson'
                    ? t.addPrompt.invalidJson
                    : error === 'parserError'
                      ? t.addPrompt.parserError
                      : error}
                </span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm text-emerald-300 animate-fade-in">
                <Check className="h-4 w-4 shrink-0" />
                <span>{t.addPrompt.successAdded}</span>
              </div>
            )}

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-7 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.md,.json,.csv,.docx,.pdf"
                className="hidden"
              />
              <Upload
                className={`mb-3 h-9 w-9 transition-transform ${
                  isDragging ? 'scale-110 text-indigo-400' : 'text-slate-400'
                }`}
              />
              <p className="mb-1.5 text-sm font-medium text-slate-300">{t.addPrompt.uploadFiles}</p>
              <p className="max-w-sm text-xs leading-relaxed text-slate-500">{t.addPrompt.dragAndDrop}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px grow bg-white/5" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">or paste</span>
              <div className="h-px grow bg-white/5" />
            </div>

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
                  className="w-full rounded-xl border border-white/10 bg-[#050507]/60 px-3.5 py-2.5 text-sm text-slate-200 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
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
                    className="flex shrink-0 items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-indigo-400 cursor-pointer"
                  >
                    <Clipboard className="h-3.5 w-3.5" />
                    {t.addPrompt.clipboardPaste}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.addPrompt.contentPlaceholder}
                  rows={6}
                  className="min-h-[160px] w-full resize-y rounded-xl border border-white/10 bg-[#050507]/60 px-3.5 py-3 font-mono text-sm leading-relaxed text-slate-200 transition-colors focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
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
              {t.addPrompt.save}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
