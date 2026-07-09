/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
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

  // Handle manual saving
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
    } catch (err) {
      setError(t.addPrompt.parserError);
    } finally {
      setLoading(false);
    }
  };

  // Handle clipboard paste
  const handlePasteClipboard = async () => {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setContent((prev) => (prev ? prev + '\n\n' + text : text));
        // Simple heuristic: set title if empty
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

  // Process selected or dropped file
  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await parseFileContent(file);
      setTitle(result.title);
      setContent(result.content);
    } catch (err: any) {
      if (err?.message === 'invalidJson') {
        setError(t.addPrompt.invalidJson);
      } else {
        setError(t.addPrompt.parserError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle File Input Change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Drag and Drop handlers
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020203]/70 backdrop-blur-md animate-fade-in">
      <div 
        id="add-prompt-modal"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 p-5 bg-white/[0.02]">
          <h3 className="font-display text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/50"></span>
            {t.addPrompt.title}
          </h3>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-300 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error === 'invalidJson' ? t.addPrompt.invalidJson : (error === 'parserError' ? t.addPrompt.parserError : error)}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-300 text-sm animate-fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{t.addPrompt.successAdded}</span>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.md,.json,.csv,.docx,.pdf"
              className="hidden"
            />
            <Upload className={`w-8 h-8 mb-2 transition-transform ${isDragging ? 'text-indigo-400 scale-110' : 'text-slate-400'}`} />
            <p className="font-medium text-slate-300 text-sm mb-1">{t.addPrompt.uploadFiles}</p>
            <p className="text-xs text-slate-500">{t.addPrompt.dragAndDrop}</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="h-px bg-white/5 grow"></div>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">or paste</span>
            <div className="h-px bg-white/5 grow"></div>
          </div>

          {/* Manual Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">{t.addPrompt.titleLabel}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.addPrompt.titlePlaceholder}
                className="w-full rounded-lg border border-white/10 bg-[#050507]/40 p-2.5 text-slate-200 text-sm focus:border-indigo-500/50 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">{t.addPrompt.contentLabel}</label>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  {t.addPrompt.clipboardPaste}
                </button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.addPrompt.contentPlaceholder}
                rows={5}
                className="w-full rounded-lg border border-white/10 bg-[#050507]/40 p-3 text-slate-200 text-sm font-mono focus:border-indigo-500/50 focus:outline-none transition-colors resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-slate-400 text-sm font-medium hover:text-slate-200 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {t.addPrompt.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50 px-5 py-2 text-slate-100 text-sm font-semibold border border-white/10 shadow-lg cursor-pointer transition-all"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-slate-100 border-t-transparent rounded-full animate-spin"></div>
              )}
              {t.addPrompt.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
