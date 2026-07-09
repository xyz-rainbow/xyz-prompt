/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useStore } from '../../store/useStore';
import NavigationPanelContent from './NavigationPanelContent';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import {
  MAX_NAV_PANEL_WIDTH,
  MIN_PANEL_WIDTH,
  clampNavPanelWidth,
} from '../../lib/panel-width';

export default function NavigationPanel() {
  const settingsOpen = useStore((state) => state.settingsOpen);
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const settingsSidebarWidth = useStore((state) => state.settingsSidebarWidth);
  const navPanelWidth = useStore((state) => state.navPanelWidth);
  const setNavPanelWidth = useStore((state) => state.setNavPanelWidth);
  const setSettingsOpen = useStore((state) => state.setSettingsOpen);
  const recalcPanelWidths = useStore((state) => state.recalcPanelWidths);
  const language = useStore((state) => state.language);
  const t = useStore((state) => state.t());

  const clampWidth = useCallback(
    (width: number) =>
      clampNavPanelWidth(width, {
        settingsSidebarOpen: sidebarOpen,
        settingsSidebarWidth,
      }),
    [settingsSidebarWidth, sidebarOpen],
  );

  useEffect(() => {
    if (settingsOpen) recalcPanelWidths();
  }, [recalcPanelWidths, settingsOpen, sidebarOpen, settingsSidebarWidth]);

  const { widthTransitionClass, handleProps } = useResizablePanel({
    width: navPanelWidth,
    setWidth: setNavPanelWidth,
    clamp: clampWidth,
    edge: 'left',
    enabled: settingsOpen,
    minWidth: MIN_PANEL_WIDTH,
    maxWidth: clampWidth(MAX_NAV_PANEL_WIDTH),
    resizeLabel: language === 'es' ? 'Redimensionar panel' : 'Resize panel',
  });
  const { lineClassName, ...resizeHandleProps } = handleProps;

  return (
    <>
      {settingsOpen && (
        <button
          type="button"
          aria-label={language === 'es' ? 'Cerrar navegación' : 'Close navigation'}
          className="absolute inset-0 z-20 bg-black/25 backdrop-blur-[1px] cursor-default"
          onClick={() => setSettingsOpen(false)}
        />
      )}

      <aside
        id="navigation-panel"
        aria-hidden={!settingsOpen}
        style={{ width: navPanelWidth, maxWidth: '85vw' }}
        className={`absolute top-0 right-0 bottom-0 z-30 border-l border-white/10 bg-[#0a0a0c]/95 backdrop-blur-2xl flex flex-col min-h-0 min-w-0 shadow-2xl ${widthTransitionClass} ${
          settingsOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        <div {...resizeHandleProps}>
          <div className={lineClassName} />
        </div>

        <div className="flex items-center justify-between shrink-0 px-5 pt-5 pb-4 border-b border-white/5 min-w-0">
          <h3 className="font-display font-semibold text-slate-100 flex items-center gap-2 truncate min-w-0">
            <Menu className="w-4 h-4 text-indigo-400 shrink-0" />
            {t.menu}
          </h3>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 cursor-pointer shrink-0"
            aria-label={language === 'es' ? 'Cerrar' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <NavigationPanelContent />
      </aside>
    </>
  );
}
