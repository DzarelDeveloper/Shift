/**
 * src/components/AppInfoCard.tsx
 *
 * Reusable card-style component that shows the full application metadata:
 *   Name, Version, Description, Author, Website.
 *
 * Used in the About tab and any future page that needs app information.
 *
 * Usage:
 *   <AppInfoCard />
 *   <AppInfoCard compact />
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useAppInfo } from '../hooks/useAppInfo';

interface AppInfoCardProps {
  /** Compact single-row mode (for sidebars / footers). Default: false */
  compact?: boolean;
  /** Extra CSS classes on the root element */
  className?: string;
}

export function AppInfoCard({ compact = false, className = '' }: AppInfoCardProps) {
  const { name, version, description, author, website, isLoading } = useAppInfo();

  if (compact) {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        <span
          className='text-sm font-bold tracking-tight'
          style={{ color: 'var(--text-color)' }}
        >
          {name}
        </span>
        <span
          className='text-[10px] font-medium font-mono'
          style={{ color: 'var(--text-color)', opacity: 0.5 }}
        >
          {isLoading ? 'v…' : `v${version}`}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <h4
          className='font-extrabold text-lg'
          style={{ color: 'var(--text-color)' }}
        >
          {name}
        </h4>
        <p
          className='text-[11px] font-mono mt-1'
          style={{ color: 'var(--text-color)', opacity: 0.6 }}
        >
          {isLoading ? 'Loading version…' : `Version ${version}`}
        </p>
        <p
          className='text-sm mt-2 leading-relaxed'
          style={{ color: 'var(--text-color)', opacity: 0.8 }}
        >
          {description}
        </p>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px]'>
        {/* Author */}
        <div
          className='p-3 rounded-xl border'
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'color-mix(in srgb, var(--border-color) 60%, transparent)',
          }}
        >
          <span
            className='block font-mono text-[10px] mb-1'
            style={{ color: 'var(--text-color)', opacity: 0.6 }}
          >
            CREATED BY
          </span>
          <span
            className='font-semibold text-sm'
            style={{ color: 'var(--text-color)' }}
          >
            {author}
          </span>
        </div>

        {/* Version */}
        <div
          className='p-3 rounded-xl border'
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'color-mix(in srgb, var(--border-color) 60%, transparent)',
          }}
        >
          <span
            className='block font-mono text-[10px] mb-1'
            style={{ color: 'var(--text-color)', opacity: 0.6 }}
          >
            VERSION
          </span>
          <span
            className='font-semibold text-sm font-mono'
            style={{ color: 'var(--text-color)' }}
          >
            {isLoading ? '…' : version}
          </span>
        </div>

        {/* Website */}
        <div
          className='p-3 rounded-xl border'
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'color-mix(in srgb, var(--border-color) 60%, transparent)',
          }}
        >
          <span
            className='block font-mono text-[10px] mb-1'
            style={{ color: 'var(--text-color)', opacity: 0.6 }}
          >
            REPOSITORY
          </span>
          <a
            href={website}
            target='_blank'
            rel='noopener noreferrer'
            className='font-semibold text-xs flex items-center gap-1 hover:opacity-80 transition-opacity'
            style={{ color: 'var(--accent-color)' }}
          >
            GitHub
            <ExternalLink className='w-3 h-3' />
          </a>
        </div>
      </div>
    </div>
  );
}
