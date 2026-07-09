/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../store/useStore';

type BrandMarkProps = {
  size?: 'sm' | 'md';
  showSubtitle?: boolean;
};

const sizeConfig = {
  sm: {
    icon: 'w-8 h-8',
    title: 'text-sm',
    subtitle: 'text-[10px] hidden sm:block',
  },
  md: {
    icon: 'w-9 h-9',
    title: 'text-xl',
    subtitle: 'text-xs',
  },
} as const;

export default function BrandMark({ size = 'sm', showSubtitle = false }: BrandMarkProps) {
  const t = useStore((state) => state.t());
  const cfg = sizeConfig[size];

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <img
        src="/favicon.png"
        alt=""
        aria-hidden="true"
        className={`${cfg.icon} rounded-lg object-cover shrink-0 shadow-md border border-white/10`}
      />
      <div className="min-w-0">
        <span
          className={`font-display font-semibold ${cfg.title} tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-lime-400 via-lime-300 to-purple-400 block truncate`}
        >
          xyz-prompt
        </span>
        {showSubtitle && (
          <span className={`${cfg.subtitle} text-slate-400 block truncate leading-snug mt-0.5`}>
            {t.subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
