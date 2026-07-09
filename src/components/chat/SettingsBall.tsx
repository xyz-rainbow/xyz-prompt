/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, X } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function SettingsBall() {
  const settingsOpen = useStore((state) => state.settingsOpen);
  const setSettingsOpen = useStore((state) => state.setSettingsOpen);
  const t = useStore((state) => state.t());

  return (
    <button
      id="settings-ball-btn"
      onClick={() => setSettingsOpen(!settingsOpen)}
      title={t.settings}
      className={`relative z-40 flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-md cursor-pointer transition-all duration-300 hover:bg-white/20 ${
        settingsOpen 
          ? 'border-fuchsia-500/50 bg-white/20 text-fuchsia-400 rotate-90 scale-105' 
          : 'hover:border-white/40 hover:text-fuchsia-300 hover:rotate-45'
      }`}
    >
      {settingsOpen ? (
        <X className="w-5 h-5 text-fuchsia-400" />
      ) : (
        <Settings className="w-5 h-5 text-slate-200" />
      )}
    </button>
  );
}
