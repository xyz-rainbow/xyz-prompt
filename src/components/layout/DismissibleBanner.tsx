/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle, X, AlertCircle } from 'lucide-react';

type DismissibleBannerProps = {
  variant: 'success' | 'error';
  message: string;
  hint?: string;
  detail?: string;
  dismissLabel: string;
  onDismiss: () => void;
};

export default function DismissibleBanner({
  variant,
  message,
  hint,
  detail,
  dismissLabel,
  onDismiss,
}: DismissibleBannerProps) {
  const isError = variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-xs font-medium animate-fade-in shrink-0 shadow-lg ${
        isError
          ? 'border-rose-500/25 bg-rose-500/10 text-rose-100'
          : 'border-lime-500/20 bg-lime-500/10 text-lime-300'
      }`}
    >
      {isError ? (
        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
      ) : (
        <CheckCircle className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
      )}

      <div className="flex-1 min-w-0 space-y-1">
        <p className="font-semibold leading-snug">{message}</p>
        {hint && <p className={`leading-relaxed ${isError ? 'text-rose-200/80' : 'text-lime-200/80'}`}>{hint}</p>}
        {detail && (
          <p className="font-mono text-[10px] opacity-70 break-words leading-relaxed pt-0.5">{detail}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        className={`shrink-0 rounded-md p-1 transition-colors cursor-pointer ${
          isError
            ? 'text-rose-300/80 hover:text-rose-100 hover:bg-rose-500/20'
            : 'text-lime-300/80 hover:text-lime-100 hover:bg-lime-500/20'
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
