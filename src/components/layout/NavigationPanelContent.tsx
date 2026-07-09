/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database } from 'lucide-react';
import { useStore } from '../../store/useStore';
import BrandMark from './BrandMark';
import PromptOperationsSection from '../prompts/PromptOperationsSection';

export default function NavigationPanelContent() {
  const clearSidebarHoverOpen = useStore((state) => state.clearSidebarHoverOpen);
  const language = useStore((state) => state.language);
  const t = useStore((state) => state.t());

  const prompts = useStore((state) => state.prompts);
  const votes = useStore((state) => state.votes);
  const feedbacks = useStore((state) => state.feedbacks);

  const totalLikes = votes.filter((v) => v.type === 'like').length;
  const totalDislikes = votes.filter((v) => v.type === 'dislike').length;
  const totalComments = feedbacks.length;

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 py-4 space-y-6 custom-scrollbar min-w-0 w-full">
        <div className="pb-2 border-b border-white/5">
          <BrandMark size="md" showSubtitle />
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">{t.sidebar.description}</p>
        </div>

        <PromptOperationsSection accent="indigo" onBeforeAction={clearSidebarHoverOpen} />

        <div className="space-y-3">
          <h3 className="text-[10px] font-mono font-semibold tracking-widest text-slate-500 uppercase flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            {t.sidebar.quickStats}
          </h3>

          <div className="grid grid-cols-2 gap-2.5 min-w-0">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 min-w-0">
              <span className="block text-[10px] text-slate-400 truncate">{t.sidebar.totalPrompts}</span>
              <span className="block text-lg font-bold text-slate-100 font-mono mt-0.5">{prompts.length}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 min-w-0">
              <span className="block text-[10px] text-slate-400 truncate">{language === 'es' ? 'Favorable' : 'Likes'}</span>
              <span className="block text-lg font-bold text-emerald-400 font-mono mt-0.5">+{totalLikes}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 min-w-0">
              <span className="block text-[10px] text-slate-400 truncate">{language === 'es' ? 'Desfavorable' : 'Dislikes'}</span>
              <span className="block text-lg font-bold text-rose-400 font-mono mt-0.5">-{totalDislikes}</span>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 min-w-0">
              <span className="block text-[10px] text-slate-400 truncate">{language === 'es' ? 'Comentarios' : 'Comments'}</span>
              <span className="block text-lg font-bold text-indigo-400 font-mono mt-0.5">{totalComments}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-400 leading-relaxed space-y-2">
          <p className="font-medium text-slate-300">{language === 'es' ? 'Consejo Rápido' : 'Quick Guide'}</p>
          <p>{t.sidebar.shortcutInfo}</p>
          <p className="text-[11px] text-slate-500">
            {language === 'es'
              ? 'Sube múltiples prompts importando archivos MD o Word.'
              : 'Upload multiple prompt files importing Markdown or Word.'}
          </p>
        </div>
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-white/5 bg-white/[0.01] min-w-0 w-full">
        <div className="text-[10px] text-slate-500 text-center font-mono">
          {t.sidebar.allRightsReserved} &copy; 2026
        </div>
      </div>
    </>
  );
}
