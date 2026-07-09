/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useStore } from '../../store/useStore';
import SettingsSidebarContent from './SettingsSidebarContent';
import { useResizablePanel } from '../../hooks/useResizablePanel';
import {
  MAX_SETTINGS_SIDEBAR_WIDTH,
  MIN_PANEL_WIDTH,
  clampSettingsSidebarWidth,
} from '../../lib/panel-width';

export default function FloatingSidebar() {
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const settingsOpen = useStore((state) => state.settingsOpen);
  const navPanelWidth = useStore((state) => state.navPanelWidth);
  const settingsSidebarWidth = useStore((state) => state.settingsSidebarWidth);
  const setSettingsSidebarWidth = useStore((state) => state.setSettingsSidebarWidth);
  const setSettingsSidebarResizing = useStore((state) => state.setSettingsSidebarResizing);
  const recalcPanelWidths = useStore((state) => state.recalcPanelWidths);
  const language = useStore((state) => state.language);
  const t = useStore((state) => state.t());

  const clampWidth = useCallback(
    (width: number) =>
      clampSettingsSidebarWidth(width, {
        navPanelOpen: settingsOpen,
        navPanelWidth,
      }),
    [navPanelWidth, settingsOpen],
  );

  useEffect(() => {
    if (sidebarOpen) recalcPanelWidths();
  }, [recalcPanelWidths, sidebarOpen, settingsOpen, navPanelWidth]);

  const { widthTransitionClass, handleProps, isResizing } = useResizablePanel({
    width: settingsSidebarWidth,
    setWidth: setSettingsSidebarWidth,
    clamp: clampWidth,
    edge: 'right',
    enabled: sidebarOpen,
    minWidth: MIN_PANEL_WIDTH,
    maxWidth: clampWidth(MAX_SETTINGS_SIDEBAR_WIDTH),
    resizeLabel: language === 'es' ? 'Redimensionar panel de ajustes' : 'Resize settings panel',
  });
  const { lineClassName, ...resizeHandleProps } = handleProps;

  useEffect(() => {
    setSettingsSidebarResizing(isResizing);
    return () => setSettingsSidebarResizing(false);
  }, [isResizing, setSettingsSidebarResizing]);

  return (
    <aside
      id="floating-sidebar"
      style={{ width: settingsSidebarWidth }}
      className={`fixed top-3 bottom-3 left-0 z-40 transform ${widthTransitionClass} ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`}
    >
      <div className="rgb-border-sidebar rgb-border-glow h-full w-full">
        <div className="rgb-border-sidebar-inner">
          <div {...resizeHandleProps}>
            <div className={lineClassName} />
          </div>

          <div className="flex min-w-0 shrink-0 items-center border-t border-b border-white/10 bg-white/[0.03] px-3 pb-3 pt-4">
            <h2 className="font-display font-semibold text-slate-100 flex items-center gap-2 truncate min-w-0">
              <Settings className="w-4 h-4 text-fuchsia-400 shrink-0" />
              {t.settings}
            </h2>
          </div>

          <SettingsSidebarContent />
        </div>
      </div>
    </aside>
  );
}
