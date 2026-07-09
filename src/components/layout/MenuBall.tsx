/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, ChevronLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';

const RGB_BORDER =
  'p-[2px] bg-gradient-to-br from-lime-500 via-purple-500 to-cyan-400 shadow-[0_0_24px_-6px_rgba(132,204,22,0.45)]';

export default function MenuBall() {
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const t = useStore((state) => state.t());

  return (
    <button
      id="menu-ball-btn"
      type="button"
      onClick={toggleSidebar}
      title={t.settings}
      className={`fixed top-1/2 -translate-y-1/2 z-50 flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 active:scale-95 ${RGB_BORDER} ${
        sidebarOpen ? 'left-64 -translate-x-1/2 w-8 h-8' : 'left-4 w-12 h-12'
      }`}
    >
      <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center">
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4 text-lime-400" />
        ) : (
          <Menu className="w-5 h-5 text-slate-300 hover:text-lime-400 transition-colors" />
        )}
      </div>
    </button>
  );
}
