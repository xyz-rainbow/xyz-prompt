/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PanelRight, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function NavPanelToggle() {
  const settingsOpen = useStore((state) => state.settingsOpen);
  const setSettingsOpen = useStore((state) => state.setSettingsOpen);
  const t = useStore((state) => state.t());

  return (
    <button
      id="nav-panel-toggle-btn"
      type="button"
      onClick={() => setSettingsOpen(!settingsOpen)}
      title={t.menu}
      className={`relative z-40 flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-md cursor-pointer transition-all duration-300 hover:bg-white/20 ${
        settingsOpen
          ? 'border-indigo-500/50 bg-white/20 text-indigo-400 scale-105'
          : 'hover:border-indigo-500/40 hover:text-indigo-300'
      }`}
    >
      {settingsOpen ? (
        <X className="w-5 h-5 text-indigo-400" />
      ) : (
        <PanelRight className="w-5 h-5 text-slate-200" />
      )}
    </button>
  );
}
