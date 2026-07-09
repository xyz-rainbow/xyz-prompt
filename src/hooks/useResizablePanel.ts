/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

type ResizeEdge = 'left' | 'right';

interface UseResizablePanelOptions {
  width: number;
  setWidth: (width: number) => void;
  clamp: (width: number) => number;
  edge: ResizeEdge;
  enabled: boolean;
  minWidth: number;
  maxWidth: number;
  resizeLabel: string;
}

interface ResizeHandleProps {
  role: 'separator';
  'aria-orientation': 'vertical';
  'aria-label': string;
  'aria-valuemin': number;
  'aria-valuemax': number;
  'aria-valuenow': number;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  className: string;
  lineClassName: string;
}

interface UseResizablePanelResult {
  isResizing: boolean;
  handleProps: ResizeHandleProps;
  widthTransitionClass: string;
}

export function useResizablePanel({
  width,
  setWidth,
  clamp,
  edge,
  enabled,
  minWidth,
  maxWidth,
  resizeLabel,
}: UseResizablePanelOptions): UseResizablePanelResult {
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const clampRef = useRef(clamp);
  const setWidthRef = useRef(setWidth);
  const edgeRef = useRef(edge);

  clampRef.current = clamp;
  setWidthRef.current = setWidth;
  edgeRef.current = edge;

  const handleResizeStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = { startX: e.clientX, startWidth: width };
      setIsResizing(true);
    },
    [enabled, width],
  );

  useEffect(() => {
    if (!isResizing) return;

    const onPointerMove = (e: PointerEvent) => {
      if (!resizeRef.current) return;
      const delta =
        edgeRef.current === 'left'
          ? resizeRef.current.startX - e.clientX
          : e.clientX - resizeRef.current.startX;
      setWidthRef.current(clampRef.current(resizeRef.current.startWidth + delta));
    };

    const onPointerEnd = () => {
      resizeRef.current = null;
      setIsResizing(false);
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerEnd);
    window.addEventListener('pointercancel', onPointerEnd);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
    };
  }, [isResizing]);

  const edgePositionClass =
    edge === 'left'
      ? 'absolute left-0 top-0 bottom-0 -translate-x-1/2'
      : 'absolute right-0 top-0 bottom-0 translate-x-1/2';

  return {
    isResizing,
    widthTransitionClass: isResizing ? '' : 'transition-[transform,width] duration-300 ease-out',
    handleProps: {
      role: 'separator',
      'aria-orientation': 'vertical',
      'aria-label': resizeLabel,
      'aria-valuemin': minWidth,
      'aria-valuemax': maxWidth,
      'aria-valuenow': width,
      onPointerDown: handleResizeStart,
      className: `${edgePositionClass} z-[60] w-3 cursor-col-resize touch-none group ${
        enabled ? '' : 'pointer-events-none'
      }`,
      lineClassName: `absolute inset-y-0 left-1/2 -translate-x-1/2 w-px transition-colors ${
        isResizing ? 'bg-indigo-400/80' : 'bg-white/0 group-hover:bg-indigo-400/50'
      }`,
    },
  };
}
