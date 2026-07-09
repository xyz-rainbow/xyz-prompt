/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, ChevronLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function MenuBall() {
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const t = useStore((state) => state.t());

  return (
    <button
      id="menu-ball-btn"
      onClick={toggleSidebar}
      title={t.menu}
      className={`fixed top-1/2 -translate-y-1/2 z-50 flex items-center justify-center rounded-full shadow-2xl cursor-pointer transition-all duration-300 ${
        sidebarOpen 
          ? 'left-64 -translate-x-1/2 w-8 h-8 p-[1.5px] bg-gradient-to-tr from-indigo-500 via-purple-500 to-fuchsia-500 active:scale-95' 
          : 'left-4 w-12 h-12 border border-white/10 bg-white/5 text-slate-200 hover:bg-white/15 hover:border-indigo-500/30 active:scale-95 group backdrop-blur-xl'
      }`}
    >
      {sidebarOpen ? (
        <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-indigo-400 animate-pulse" />
        </div>
      ) : (
        <div className="relative w-5 h-5 flex items-center justify-center">
          <Menu className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
        </div>
      )}
    </button>
  );
}
