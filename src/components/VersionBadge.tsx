/**
 * src/components/VersionBadge.tsx
 *
 * Reusable badge that displays "Shift v0.7.4".
 * Reads version dynamically from the Tauri runtime via useAppInfo.
 *
 * Usage:
 *   <VersionBadge />                    → "Shift v0.7.4"
 *   <VersionBadge showName={false} />   → "v0.7.4"
 *   <VersionBadge className="..." />    → custom styling
 */

import React from 'react';
import { useAppInfo } from '../hooks/useAppInfo';

interface VersionBadgeProps {
  /** Show app name prefix. Default: true */
  showName?: boolean;
  /** Extra CSS classes */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
}

export function VersionBadge({
  showName = true,
  className = '',
  style,
}: VersionBadgeProps) {
  const { name, version, isLoading } = useAppInfo();

  if (isLoading) {
    return (
      <span
        className={`font-mono animate-pulse opacity-40 ${className}`}
        style={style}
      >
        {showName ? `${name} v…` : 'v…'}
      </span>
    );
  }

  return (
    <span className={`font-mono ${className}`} style={style}>
      {showName ? `${name} v${version}` : `v${version}`}
    </span>
  );
}
