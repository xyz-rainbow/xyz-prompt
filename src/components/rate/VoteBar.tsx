/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { VoteType } from '../../types';

interface VoteBarProps {
  promptId: string;
  mode: 'pages' | 'versus';
  onVote?: (type: VoteType | null) => void;
  onSelect?: () => void;
  isSelected?: boolean;
}

export default function VoteBar({ promptId, mode, onVote, onSelect, isSelected }: VoteBarProps) {
  const t = useStore((state) => state.t());
  const language = useStore((state) => state.language);
  const votes = useStore((state) => state.votes);
  const addVote = useStore((state) => state.addVote);

  const currentVote = votes.find((vote) => vote.promptId === promptId && vote.mode === mode)?.type ?? null;

  const handleVoteClick = async (type: VoteType) => {
    const nextVote = currentVote === type ? null : type;
    await addVote(promptId, type, mode);
    onVote?.(nextVote);
  };

  const likeLabel = language === 'es' ? 'Favorable' : 'Like';
  const dislikeLabel = language === 'es' ? 'Desfavorable' : 'Dislike';
  const votedLabel = language === 'es' ? 'Tu voto' : 'Your vote';

  return (
    <div className="flex flex-col items-center gap-2">
      {currentVote && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
          {votedLabel}:{' '}
          <span className={currentVote === 'like' ? 'text-lime-400' : 'text-purple-400'}>
            {currentVote === 'like' ? likeLabel : dislikeLabel}
          </span>
        </span>
      )}

      <div className="flex items-center justify-center gap-6 py-2 px-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-xl max-w-sm mx-auto w-full">
        <button
          type="button"
          onClick={() => handleVoteClick('like')}
          title={
            currentVote === 'like'
              ? language === 'es'
                ? 'Quitar voto favorable'
                : 'Remove like'
              : likeLabel
          }
          aria-pressed={currentVote === 'like'}
          className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
            currentVote === 'like'
              ? 'bg-lime-500/20 border-lime-500/60 shadow-[0_0_16px_rgba(132,204,22,0.25)] scale-105'
              : currentVote === 'dislike'
                ? 'border-transparent opacity-45 hover:opacity-70 hover:bg-lime-500/10 hover:border-lime-500/20'
                : 'border-transparent hover:bg-lime-500/10 hover:border-lime-500/30'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className={`w-7 h-7 transition-transform ${
              currentVote === 'like'
                ? 'text-lime-300 drop-shadow-[0_0_10px_rgba(163,230,53,0.55)]'
                : 'text-lime-400 group-hover:scale-110 group-active:scale-95 drop-shadow-[0_0_6px_rgba(163,230,53,0.35)]'
            }`}
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

        <button
          type="button"
          onClick={() => handleVoteClick('dislike')}
          title={
            currentVote === 'dislike'
              ? language === 'es'
                ? 'Quitar voto desfavorable'
                : 'Remove dislike'
              : dislikeLabel
          }
          aria-pressed={currentVote === 'dislike'}
          className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
            currentVote === 'dislike'
              ? 'bg-purple-500/20 border-purple-500/60 shadow-[0_0_16px_rgba(168,85,247,0.25)] scale-105'
              : currentVote === 'like'
                ? 'border-transparent opacity-45 hover:opacity-70 hover:bg-purple-500/10 hover:border-purple-500/20'
                : 'border-transparent hover:bg-purple-500/10 hover:border-purple-500/30'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className={`w-7 h-7 transition-transform ${
              currentVote === 'dislike'
                ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(168,85,247,0.55)]'
                : 'text-purple-400 group-hover:scale-110 group-active:scale-95 drop-shadow-[0_0_6px_rgba(168,85,247,0.35)]'
            }`}
            fill="currentColor"
          >
            <polygon points="12,21 2,3 22,3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
