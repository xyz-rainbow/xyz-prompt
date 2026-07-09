/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import FloatingSidebar from './components/layout/FloatingSidebar';
import MenuBall from './components/layout/MenuBall';
import ChatShell from './components/layout/ChatShell';

const EDGE_OPEN_PX = 15;
const SIDEBAR_WIDTH_PX = 256; // w-64
const CLOSE_MARGIN_PX = 24;
const HOVER_CLOSE_DELAY_MS = 150;

export default function App() {
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const sidebarOpenedByHover = useStore((state) => state.sidebarOpenedByHover);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const openSidebarByHover = useStore((state) => state.openSidebarByHover);
  const closeSidebarIfHoverOpened = useStore((state) => state.closeSidebarIfHoverOpened);
  const refreshFromDb = useStore((state) => state.refreshFromDb);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync data cache from IndexedDB on startup
  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  // Global Keyboard Shortcuts (Ctrl+B toggles sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  // Hover edge: open on left edge; close when leaving sidebar zone (hover-open only)
  useEffect(() => {
    const clearCloseTimer = () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarOpen && e.clientX < EDGE_OPEN_PX) {
        clearCloseTimer();
        openSidebarByHover();
        return;
      }

      if (!sidebarOpenedByHover || !sidebarOpen) {
        clearCloseTimer();
        return;
      }

      const inSidebarZone = e.clientX <= SIDEBAR_WIDTH_PX + CLOSE_MARGIN_PX;
      if (inSidebarZone) {
        clearCloseTimer();
        return;
      }

      if (!closeTimerRef.current) {
        closeTimerRef.current = setTimeout(() => {
          closeSidebarIfHoverOpened();
          closeTimerRef.current = null;
        }, HOVER_CLOSE_DELAY_MS);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearCloseTimer();
    };
  }, [sidebarOpen, sidebarOpenedByHover, openSidebarByHover, closeSidebarIfHoverOpened]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-slate-100 flex font-sans animate-rgb-bg selection:bg-lime-500/30 selection:text-lime-200">
      
      {/* Absolute Blurred Background Glow Spheres */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none z-0" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 20% 30%, #84cc16 0%, transparent 40%), radial-gradient(circle at 80% 70%, #a855f7 0%, transparent 40%), radial-gradient(circle at 50% 50%, #7c3aed 0%, transparent 50%)', 
          filter: 'blur(80px)' 
        }}
      />

      {/* Floating Left Navigation Drawer */}
      <FloatingSidebar />

      {/* Menu toggler ball left-aligned */}
      <MenuBall />

      {/* Main Container Wrapper — márgenes verticales simétricos */}
      <main 
        id="app-main-content"
        className={`flex-grow min-h-dvh flex flex-col items-center px-4 sm:px-6 md:px-10 py-6 transition-all duration-300 relative z-10 ${
          sidebarOpen ? 'md:pl-72' : ''
        }`}
      >
        <div className="w-full max-w-4xl flex-1 flex flex-col min-h-0 max-h-[calc(100dvh-3rem)]">
          <ChatShell />
        </div>
      </main>
    </div>
  );
}
