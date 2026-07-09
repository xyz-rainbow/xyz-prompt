/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileText, GitCompare, LayoutDashboard, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { AppMode } from '../../types';

const DASHBOARD_MODES = ['pages', 'versus'] as const;
type DashboardMode = (typeof DASHBOARD_MODES)[number];

const dashboardTiles: {
  mode: DashboardMode;
  icon: typeof FileText;
}[] = [
  { mode: 'pages', icon: FileText },
  { mode: 'versus', icon: GitCompare },
];

export default function ModeNav() {
  const t = useStore((state) => state.t());
  const activeMode = useStore((state) => state.activeMode);
  const setActiveMode = useStore((state) => state.setActiveMode);

  const [dashboardOpen, setDashboardOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const isDashboardActive = activeMode === 'pages' || activeMode === 'versus';
  const isControlActive = activeMode === 'metrics';

  useEffect(() => {
    if (!dashboardOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setDashboardOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [dashboardOpen]);

  const selectDashboardMode = (mode: DashboardMode) => {
    setActiveMode(mode);
    setDashboardOpen(false);
  };

  const handleControlClick = () => {
    setActiveMode('metrics');
    setDashboardOpen(false);
  };

  const handleDashboardClick = () => {
    if (!isDashboardActive) {
      setActiveMode('pages');
    }
    setDashboardOpen((open) => !open);
  };

  const pillClass = (active: boolean) =>
    `px-4 sm:px-5 py-1.5 text-xs font-semibold rounded-full tracking-wide transition-all cursor-pointer ${
      active
        ? 'bg-white/10 text-lime-300 shadow-lg border border-white/10'
        : 'text-white/50 hover:text-white'
    }`;

  const tileClass = (mode: AppMode) =>
    `flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-[11px] font-semibold transition-all cursor-pointer min-h-[72px] ${
      activeMode === mode
        ? 'border-lime-500/40 bg-lime-500/10 text-lime-300 shadow-md'
        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white'
    }`;

  return (
    <div ref={navRef} className="relative flex bg-white/5 p-1 rounded-full border border-white/10 shadow-lg">
      <button
        type="button"
        onClick={handleDashboardClick}
        className={`${pillClass(isDashboardActive)} flex items-center gap-1.5`}
        aria-expanded={dashboardOpen}
        aria-haspopup="true"
      >
        <LayoutDashboard className="w-3.5 h-3.5 shrink-0 opacity-80" />
        {t.modes.dashboard}
        <ChevronDown
          className={`w-3 h-3 shrink-0 opacity-60 transition-transform ${dashboardOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <button type="button" onClick={handleControlClick} className={`${pillClass(isControlActive)} flex items-center gap-1.5`}>
        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 opacity-80" />
        {t.modes.control}
      </button>

      {dashboardOpen && (
        <div className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-[220px] rounded-2xl border border-white/10 bg-[#12121a]/95 p-2 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-2 grid-rows-2 gap-2">
            {dashboardTiles.map(({ mode, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => selectDashboardMode(mode)}
                className={tileClass(mode)}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-80" />
                <span className="text-center leading-tight">{t.modes[mode]}</span>
              </button>
            ))}
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`placeholder-${index}`}
                className="rounded-xl border border-dashed border-white/5 bg-white/[0.01] min-h-[72px]"
                aria-hidden
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
