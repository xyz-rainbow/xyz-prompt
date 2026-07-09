/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, PlusCircle, Trash2, Globe, Sparkles, DatabaseZap } from 'lucide-react';
import { useStore } from '../../store/useStore';
import AddPromptPopup from '../prompts/AddPromptPopup';

export default function FloatingSidebar() {
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const clearSidebarHoverOpen = useStore((state) => state.clearSidebarHoverOpen);
  const language = useStore((state) => state.language);
  const setLanguage = useStore((state) => state.setLanguage);
  const t = useStore((state) => state.t());

  const prompts = useStore((state) => state.prompts);
  const votes = useStore((state) => state.votes);
  const feedbacks = useStore((state) => state.feedbacks);
  const clearDatabase = useStore((state) => state.clearDatabase);

  const [addOpen, setAddOpen] = useState(false);

  // Stats calculation
  const totalLikes = votes.filter(v => v.type === 'like').length;
  const totalDislikes = votes.filter(v => v.type === 'dislike').length;
  const totalComments = feedbacks.length;

  const handleReset = async () => {
    if (confirm(language === 'es' ? '¿Estás seguro de que deseas vaciar la base de datos local?' : 'Are you sure you want to clear the local database?')) {
      await clearDatabase();
    }
  };

  return (
    <>
      <aside
        id="floating-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0a0a0c]/85 border-r border-white/10 backdrop-blur-2xl flex flex-col justify-between transition-all duration-300 transform shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              {t.sidebar.title}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {t.sidebar.description}
          </p>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Add New Prompt Action */}
          <button
            onClick={() => {
              clearSidebarHoverOpen();
              setAddOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 text-slate-100 py-3 text-sm font-semibold shadow-md shadow-indigo-950/40 border border-white/10 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            {t.sidebar.addPrompt}
          </button>

          {/* Quick Stats Grid */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              {t.sidebar.quickStats}
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <span className="block text-[10px] text-slate-400 truncate">{t.sidebar.totalPrompts}</span>
                <span className="block text-lg font-bold text-slate-100 font-mono mt-0.5">{prompts.length}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <span className="block text-[10px] text-slate-400 truncate">{t.language === 'es' ? 'Favorable' : 'Likes'}</span>
                <span className="block text-lg font-bold text-emerald-400 font-mono mt-0.5">+{totalLikes}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <span className="block text-[10px] text-slate-400 truncate">{t.language === 'es' ? 'Desfavorable' : 'Dislikes'}</span>
                <span className="block text-lg font-bold text-rose-400 font-mono mt-0.5">-{totalDislikes}</span>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3">
                <span className="block text-[10px] text-slate-400 truncate">{t.language === 'es' ? 'Comentarios' : 'Comments'}</span>
                <span className="block text-lg font-bold text-indigo-400 font-mono mt-0.5">{totalComments}</span>
              </div>
            </div>
          </div>

          {/* Settings Section (In-sidebar quick lang swap) */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              {t.language}
            </h3>
            <div className="flex gap-1.5 rounded-lg bg-white/5 p-1 border border-white/10">
              <button
                onClick={() => setLanguage('es')}
                className={`flex-1 text-center py-1.5 text-xs font-medium rounded cursor-pointer transition-colors ${
                  language === 'es' ? 'bg-white/10 text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Español
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 text-center py-1.5 text-xs font-medium rounded cursor-pointer transition-colors ${
                  language === 'en' ? 'bg-white/10 text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Quick Instructions list */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-400 leading-relaxed space-y-2">
            <p className="font-medium text-slate-300">{t.language === 'es' ? 'Consejo Rápido' : 'Quick Guide'}</p>
            <p>{t.sidebar.shortcutInfo}</p>
            <p className="text-[11px] text-slate-500">
              {t.language === 'es' 
                ? 'Sube múltiples prompts importando archivos MD o Word.' 
                : 'Upload multiple prompt files importing Markdown or Word.'}
            </p>
          </div>
        </div>

        {/* Footer Area */}
        <div className="p-4 border-t border-white/5 bg-white/[0.01] space-y-3">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5 text-rose-400 py-2 text-xs font-medium cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t.language === 'es' ? 'Vaciar IndexedDB' : 'Clear IndexedDB'}
          </button>
          <div className="text-[10px] text-slate-500 text-center font-mono">
            {t.sidebar.allRightsReserved} &copy; 2026
          </div>
        </div>
      </aside>

      {/* Add New Prompt Modal overlay */}
      {addOpen && (
        <AddPromptPopup onClose={() => setAddOpen(false)} />
      )}
    </>
  );
}
