/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store/useStore';
import FloatingSidebar from './components/layout/FloatingSidebar';
import MenuBall from './components/layout/MenuBall';
import ChatShell from './components/layout/ChatShell';

const EDGE_OPEN_PX = 15;
const CLOSE_MARGIN_PX = 24;
const HOVER_CLOSE_DELAY_MS = 150;

function useMdUp(): boolean {
  const [isMdUp, setIsMdUp] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsMdUp(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isMdUp;
}

export default function App() {
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const sidebarOpenedByHover = useStore((state) => state.sidebarOpenedByHover);
  const settingsSidebarWidth = useStore((state) => state.settingsSidebarWidth);
  const settingsSidebarResizing = useStore((state) => state.settingsSidebarResizing);
  const recalcPanelWidths = useStore((state) => state.recalcPanelWidths);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const openSidebarByHover = useStore((state) => state.openSidebarByHover);
  const closeSidebarIfHoverOpened = useStore((state) => state.closeSidebarIfHoverOpened);
  const setSidebarOpen = useStore((state) => state.setSidebarOpen);
  const refreshFromDb = useStore((state) => state.refreshFromDb);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const language = useStore((state) => state.language);
  const isMdUp = useMdUp();

  useEffect(() => {
    refreshFromDb();
  }, [refreshFromDb]);

  useEffect(() => {
    const onWindowResize = () => recalcPanelWidths();
    window.addEventListener('resize', onWindowResize);
    return () => window.removeEventListener('resize', onWindowResize);
  }, [recalcPanelWidths]);

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

      const inSidebarZone = e.clientX <= settingsSidebarWidth + CLOSE_MARGIN_PX;
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
  }, [
    sidebarOpen,
    sidebarOpenedByHover,
    settingsSidebarWidth,
    openSidebarByHover,
    closeSidebarIfHoverOpened,
  ]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-slate-100 flex font-sans animate-rgb-bg selection:bg-lime-500/30 selection:text-lime-200">
      <div
        className="absolute inset-0 opacity-40 pointer-events-none z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, #84cc16 0%, transparent 40%), radial-gradient(circle at 80% 70%, #a855f7 0%, transparent 40%), radial-gradient(circle at 50% 50%, #7c3aed 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />

      <FloatingSidebar />

      <MenuBall />

      <main
        id="app-main-content"
        style={sidebarOpen && isMdUp ? { paddingLeft: settingsSidebarWidth } : undefined}
        className={`flex-grow min-h-dvh flex flex-col items-center px-4 sm:px-6 md:px-10 py-6 relative z-10 ${
          sidebarOpen ? 'pointer-events-none' : ''
        } ${
          settingsSidebarResizing
            ? 'transition-[opacity,transform,color,background-color] duration-300 ease-out'
            : 'transition-all duration-300 ease-out'
        }`}
      >
        <div className="w-full max-w-4xl flex-1 flex flex-col min-h-0 max-h-[calc(100dvh-3rem)]">
          <ChatShell />
        </div>
      </main>

      {sidebarOpen && (
        <button
          type="button"
          aria-label={language === 'es' ? 'Cerrar ajustes' : 'Close settings'}
          className="fixed inset-0 cursor-default bg-black/25 backdrop-blur-[1px]"
          style={{ zIndex: 38 }}
          onClick={() => {
            if (!settingsSidebarResizing) setSidebarOpen(false);
          }}
        />
      )}
    </div>
  );
}
