/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface VoteBarProps {
  promptId: string;
  mode: 'pages' | 'versus';
  onVote?: (type: 'like' | 'dislike') => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export default function VoteBar({ promptId, mode, onVote, onSelect, isSelected }: VoteBarProps) {
  const t = useStore((state) => state.t());
  const addVote = useStore((state) => state.addVote);

  const handleVoteClick = async (type: 'like' | 'dislike') => {
    await addVote(promptId, type, mode);
    onVote?.(type);
  };

  return (
    <div className="flex items-center justify-center gap-6 py-2 px-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-xl max-w-sm mx-auto">
      {/* Lime green upward triangle (Like) */}
      <button
        type="button"
        onClick={() => handleVoteClick('like')}
        title={t.language === 'es' ? 'Favorable' : 'Like'}
        className="group relative flex flex-col items-center justify-center p-3 rounded-xl hover:bg-lime-500/10 border border-transparent hover:border-lime-500/30 transition-all duration-300 cursor-pointer"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 text-lime-400 group-hover:scale-110 group-active:scale-95 transition-transform drop-shadow-[0_0_6px_rgba(163,230,53,0.35)]"
          fill="currentColor"
        >
          <polygon points="12,3 22,21 2,21" />
        </svg>
      </button>

      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
            isSelected
              ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/10'
          }`}
        >
          <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          {isSelected ? t.pagesMode.selected : t.pagesMode.selectPrompt}
        </button>
      )}

      {/* Purple downward triangle (Dislike) */}
      <button
        type="button"
        onClick={() => handleVoteClick('dislike')}
        title={t.language === 'es' ? 'Desfavorable' : 'Dislike'}
        className="group relative flex flex-col items-center justify-center p-3 rounded-xl hover:bg-purple-500/10 border border-transparent hover:border-purple-500/30 transition-all duration-300 cursor-pointer"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 text-purple-400 group-hover:scale-110 group-active:scale-95 transition-transform drop-shadow-[0_0_6px_rgba(168,85,247,0.35)]"
          fill="currentColor"
        >
          <polygon points="12,21 2,3 22,3" />
        </svg>
      </button>
    </div>
  );
}
