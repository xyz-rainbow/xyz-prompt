/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const PANEL_BASE_WIDTH = 320;

export const MIN_PANEL_WIDTH = PANEL_BASE_WIDTH * 0.75;
export const MAX_NAV_PANEL_WIDTH = PANEL_BASE_WIDTH * 1.25;
export const MAX_SETTINGS_SIDEBAR_WIDTH = PANEL_BASE_WIDTH * 2;

export const SETTINGS_SIDEBAR_CHAT_GAP_PX = 16;

export const NAV_PANEL_WIDTH_KEY = 'xyz-prompt-nav-panel-width';
export const SETTINGS_SIDEBAR_WIDTH_KEY = 'xyz-prompt-settings-sidebar-width';

const LAYOUT_HORIZONTAL_PADDING_PX = 48;

function viewportWidth(): number {
  return typeof window !== 'undefined' ? window.innerWidth : 1280;
}

/** Reserva flexible para el contenido central según ancho de pantalla. */
function minMainContentPx(viewport: number): number {
  return Math.max(260, Math.min(480, Math.round(viewport * 0.38)));
}

function maxWidthFromViewport(reservedSidePx: number): number {
  const vw = viewportWidth();
  return vw - reservedSidePx - minMainContentPx(vw) - LAYOUT_HORIZONTAL_PADDING_PX;
}

export function clampNavPanelWidth(
  width: number,
  options?: { settingsSidebarOpen?: boolean; settingsSidebarWidth?: number },
): number {
  const reservedLeft =
    options?.settingsSidebarOpen && options.settingsSidebarWidth
      ? options.settingsSidebarWidth + SETTINGS_SIDEBAR_CHAT_GAP_PX
      : 0;
  const maxFromViewport = maxWidthFromViewport(reservedLeft);
  const maxViewportCap = viewportWidth() * 0.85;
  const maxEffective = Math.min(
    MAX_NAV_PANEL_WIDTH,
    maxViewportCap,
    Math.max(MIN_PANEL_WIDTH, maxFromViewport),
  );
  return Math.min(maxEffective, Math.max(MIN_PANEL_WIDTH, width));
}

export function clampSettingsSidebarWidth(
  width: number,
  options?: { navPanelOpen?: boolean; navPanelWidth?: number },
): number {
  const reservedRight =
    options?.navPanelOpen && options.navPanelWidth ? options.navPanelWidth : 0;
  const maxFromViewport = maxWidthFromViewport(reservedRight);
  const maxEffective = Math.min(
    MAX_SETTINGS_SIDEBAR_WIDTH,
    Math.max(MIN_PANEL_WIDTH, maxFromViewport),
  );
  return Math.min(maxEffective, Math.max(MIN_PANEL_WIDTH, width));
}

export function readStoredPanelWidth(
  key: string,
  clamp: (width: number) => number,
): number {
  if (typeof window === 'undefined') return MIN_PANEL_WIDTH;
  const saved = localStorage.getItem(key);
  if (!saved) return MIN_PANEL_WIDTH;
  const parsed = Number(saved);
  return Number.isFinite(parsed) ? clamp(parsed) : MIN_PANEL_WIDTH;
}

export function persistPanelWidth(key: string, width: number): void {
  localStorage.setItem(key, String(width));
}
