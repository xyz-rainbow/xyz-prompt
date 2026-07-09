/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

interface MenuPosition {
  top: number;
  left: number;
  width: number;
}

export default function ModeNav() {
  const t = useStore((state) => state.t());
  const activeMode = useStore((state) => state.activeMode);
  const setActiveMode = useStore((state) => state.setActiveMode);

  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const dashboardBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDashboardActive = activeMode === 'pages' || activeMode === 'versus';
  const isControlActive = activeMode === 'metrics';

  const updateMenuPosition = useCallback(() => {
    const btn = dashboardBtnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const width = Math.min(220, window.innerWidth - 32);
    const centeredLeft = rect.left + rect.width / 2 - width / 2;
    const left = Math.min(Math.max(16, centeredLeft), window.innerWidth - width - 16);

    setMenuPosition({
      top: rect.bottom + 8,
      left,
      width,
    });
  }, []);

  useEffect(() => {
    if (!dashboardOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);

    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [dashboardOpen, updateMenuPosition]);

  useEffect(() => {
    if (!dashboardOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (navRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setDashboardOpen(false);
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
    `min-w-0 shrink px-2 py-1.5 text-xs font-semibold rounded-full tracking-wide transition-all cursor-pointer min-[540px]:px-4 sm:px-5 ${
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

  const dashboardMenu =
    dashboardOpen && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={t.modes.dashboard}
            className="fixed z-[100] rounded-2xl border border-white/10 bg-[#12121a]/95 p-2 shadow-2xl backdrop-blur-xl"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              width: menuPosition.width,
            }}
          >
            <div className="grid grid-cols-2 grid-rows-2 gap-2">
              {dashboardTiles.map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  type="button"
                  role="menuitem"
                  onClick={() => selectDashboardMode(mode)}
                  className={tileClass(mode)}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  <span className="text-center leading-tight">{t.modes[mode]}</span>
                </button>
              ))}
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="min-h-[72px] rounded-xl border border-dashed border-white/5 bg-white/[0.01]"
                  aria-hidden
                />
              ))}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={navRef}
        className="relative flex min-w-0 max-w-full shrink bg-white/5 p-0.5 sm:p-1 rounded-full border border-white/10 shadow-lg"
      >
        <button
          ref={dashboardBtnRef}
          type="button"
          onClick={handleDashboardClick}
          title={t.modes.dashboard}
          className={`${pillClass(isDashboardActive)} flex items-center gap-1 sm:gap-1.5`}
          aria-expanded={dashboardOpen}
          aria-haspopup="menu"
        >
          <LayoutDashboard className="h-3.5 w-3.5 shrink-0 opacity-80" />
          <span className="hidden truncate min-[540px]:inline">{t.modes.dashboard}</span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 opacity-60 transition-transform ${dashboardOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <button
          type="button"
          onClick={handleControlClick}
          title={t.modes.control}
          className={`${pillClass(isControlActive)} flex items-center gap-1 sm:gap-1.5`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 opacity-80" />
          <span className="hidden truncate min-[540px]:inline">{t.modes.control}</span>
        </button>
      </div>

      {dashboardMenu}
    </>
  );
}
