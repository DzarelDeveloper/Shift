/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Terminal,
  Globe,
  Folder,
  CornerDownLeft,
  X,
  Sparkles,
  Command,
  FileCode2,
  Palette,
  BarChart3,
  Shield,
  Settings,
  AppWindow,
} from 'lucide-react';
import logoUrl from '../assets/logo.png';
import { Workspace, InstalledApp, LauncherItem } from '../types';
import { useCommandPalette } from '../hooks/useCommandPalette';

interface LauncherPanelProps {
  isOpen: boolean;
  onClose: () => void;
  workspaces: Workspace[];
  apps: InstalledApp[];
  onLaunch: (item: LauncherItem) => void;
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
}

const getModeIcon = (modeId: string) => {
  switch (modeId) {
    case 'coding':
      return <FileCode2 className='w-5 h-5' />;
    case 'cyber':
      return <Shield className='w-5 h-5' />;
    case 'design':
      return <Palette className='w-5 h-5' />;
    case 'marketing':
      return <BarChart3 className='w-5 h-5' />;
    case 'ai-assistant':
      return <Sparkles className='w-5 h-5' />;
    case 'settings':
      return <Settings className='w-5 h-5' />;
    default:
      return <Command className='w-5 h-5' />;
  }
};

export default function LauncherPanel({
  isOpen,
  onClose,
  workspaces,
  apps,
  onLaunch,
  onOpenDashboard,
  onOpenSettings,
}: LauncherPanelProps) {
  const {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    inputRef,
    resultsRef,
    filteredItems,
  } = useCommandPalette({
    isOpen,
    workspaces,
    apps,
    onLaunch,
    onClose,
  });

  React.useEffect(() => {
    if (isOpen) {
      console.log(`[Search Results Count]: ${filteredItems.length}`);
    }
  }, [filteredItems.length, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id='launcher-modal-root'
          className='fixed inset-0 z-50 flex items-start justify-center pt-24 px-4'
        >
      {/* Absolute Backdrop with extreme blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className='absolute inset-0 backdrop-blur-sm'
        style={{
          backgroundColor:
            'color-mix(in srgb, var(--text-color) 75%, transparent)',
        }}
      />

      {/* Main Core Center Console */}
      <motion.div
        initial={{ y: -10, opacity: 0, scale: 0.99 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 10, opacity: 0, scale: 0.99 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className='relative w-full max-w-2xl rounded-lg overflow-hidden flex flex-col h-[380px]'
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          borderWidth: '1px',
          color: 'var(--text-color)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        }}
      >
        {/* Modern Search Row */}
        <div
          className='flex items-center gap-3 px-4 py-3 border-b'
          style={{
            borderColor:
              'color-mix(in srgb, var(--border-color) 60%, transparent)',
            backgroundColor:
              'color-mix(in srgb, var(--card-bg) 50%, transparent)',
          }}
        >
          <Command
            className='w-4 h-4 flex-shrink-0'
            style={{ color: 'var(--text-color)', opacity: 0.6 }}
          />
          <span
            className='font-mono font-semibold text-base select-none'
            style={{ color: 'var(--text-color)', opacity: 0.7 }}
          >
            &gt;
          </span>
          <input
            id='launcher-input-search'
            ref={inputRef}
            type='text'
            placeholder='Search workspace or app (e.g. coding, chrome)'
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            className='flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm py-0.5 font-medium'
            style={{ color: 'var(--text-color)' }}
          />
          <button
            onClick={onClose}
            className='px-2 py-1 flex items-center gap-1.5 rounded transition-colors text-[10px] font-mono'
            style={{
              color: 'var(--text-color)',
              opacity: 0.6,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                'color-mix(in srgb, var(--card-bg) 100%, transparent)';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.opacity = '0.6';
            }}
          >
            <span>ESC</span>
            <X className='w-3.5 h-3.5' />
          </button>
        </div>

        {/* Search Results Area */}
        <div ref={resultsRef} className='flex-1 overflow-y-auto p-2'>
          {filteredItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.type === 'workspace' ? item.data.id : item.data.id}
                onClick={() => onLaunch(item)}
                onMouseEnter={(e) => {
                  setSelectedIndex(index);
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--card-bg) 50%, transparent)';
                  }
                }}
                className='flex items-center justify-between px-3 py-2.5 rounded cursor-pointer transition-all'
                style={{
                  backgroundColor: isSelected
                    ? 'color-mix(in srgb, var(--card-bg) 100%, transparent)'
                    : 'transparent',
                  color: isSelected
                    ? 'var(--text-color)'
                    : 'color-mix(in srgb, var(--text-color) 70%, transparent)',
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className='flex items-start gap-3 min-w-0 flex-1'>
                  <div
                    className='mt-0.5 p-1 rounded border'
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--card-bg)'
                        : 'color-mix(in srgb, var(--card-bg) 50%, transparent)',
                      borderColor: 'var(--border-color)',
                      color: isSelected
                        ? 'var(--text-color)'
                        : 'color-mix(in srgb, var(--text-color) 70%, transparent)',
                    }}
                  >
                    {item.type === 'workspace' ? (
                      getModeIcon(item.data.id)
                    ) : (
                      <img src={logoUrl} alt="Shift Logo" className="w-5 h-5 object-cover" />
                    )}
                  </div>
                  <div className='min-w-0 pr-2'>
                    <p className='font-semibold text-xs flex items-center gap-2'>
                      <span
                        style={{
                          color: isSelected
                            ? 'var(--text-color)'
                            : 'var(--text-color)',
                        }}
                      >
                        {item.type === 'workspace'
                          ? item.data.name
                          : item.data.name}
                      </span>
                      <span
                        className='text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded font-mono font-medium border'
                        style={{
                          backgroundColor: 'var(--card-bg)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-color)',
                          opacity: 0.6,
                        }}
                      >
                        {item.type === 'workspace' ? 'Workspace' : 'App'}
                      </span>
                      {item.type === 'workspace' && item.data.shortcut && (
                        <span
                          className='text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded font-mono font-medium border'
                          style={{
                            backgroundColor: 'var(--card-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--text-color)',
                            opacity: 0.6,
                          }}
                        >
                          {item.data.shortcut}
                        </span>
                      )}
                    </p>
                    <p
                      className='text-xs mt-0.5 description truncate font-mono tracking-tight'
                      style={{ color: 'var(--text-color)', opacity: 0.6 }}
                    >
                      {item.type === 'workspace'
                        ? item.data.description ||
                          'Deploy this layout automation profile.'
                        : item.data.path}
                    </p>

                    {/* Meta labels for workspace */}
                    {item.type === 'workspace' && (
                      <div className='flex gap-4 items-center mt-1.5 flex-wrap font-mono text-[10px]'>
                        {item.data.applications.length > 0 && (
                          <span
                            className='inline-flex items-center gap-1'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          >
                            <Terminal className='w-3 h-3 text-emerald-500' />
                            <span>
                              {item.data.applications.length} App
                              {item.data.applications.length > 1 ? 's' : ''}
                            </span>
                          </span>
                        )}
                        {item.data.websites.length > 0 && (
                          <span
                            className='inline-flex items-center gap-1'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          >
                            <Globe className='w-3 h-3 text-cyan-500' />
                            <span>
                              {item.data.websites.length} Link
                              {item.data.websites.length > 1 ? 's' : ''}
                            </span>
                          </span>
                        )}
                        {item.data.folders.length > 0 && (
                          <span
                            className='inline-flex items-center gap-1'
                            style={{ color: 'var(--text-color)', opacity: 0.6 }}
                          >
                            <Folder className='w-3 h-3 text-orange-500' />
                            <span>
                              {item.data.folders.length} Folder
                              {item.data.folders.length > 1 ? 's' : ''}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Action hotkey cue */}
                <div className='flex items-center gap-2 flex-shrink-0'>
                  {isSelected ? (
                    <motion.span
                      initial={{ opacity: 0, x: -3 }}
                      animate={{ opacity: 1, x: 0 }}
                      className='text-[11px] flex items-center gap-1 px-2 py-1 rounded border font-medium font-mono'
                      style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-color)',
                      }}
                    >
                      <span>Press Enter</span>
                      <CornerDownLeft className='w-3 h-3' />
                    </motion.span>
                  ) : (
                    <span
                      className='text-[10px] font-mono'
                      style={{ color: 'var(--text-color)', opacity: 0.6 }}
                    >
                      {item.type === 'workspace' ? 'Launch' : 'Open'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && (
            <div
              className='flex flex-col items-center justify-center py-12 text-center'
              style={{ color: 'var(--text-color)', opacity: 0.6 }}
            >
              <Command className='w-6 h-6 mb-2' style={{ opacity: 0.3 }} />
              <p className='text-xs font-semibold mb-3'>
                {workspaces.length === 0 ? 'Welcome to Shift' : 'No items found'}
              </p>
              <div className='flex gap-2 items-center'>
                <button
                  onClick={onOpenDashboard}
                  className='px-3 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-opacity'
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-color)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <AppWindow className='w-3 h-3' />
                  <span>Open Dashboard</span>
                </button>
                <button
                  onClick={onOpenSettings}
                  className='px-3 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-opacity'
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-color)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <Settings className='w-3 h-3' />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info strip */}
        <div
          className='border-t px-4 py-2.5 flex items-center justify-between text-[10px] select-none'
          style={{
            borderColor:
              'color-mix(in srgb, var(--border-color) 60%, transparent)',
            backgroundColor:
              'color-mix(in srgb, var(--card-bg) 50%, transparent)',
            color: 'var(--text-color)',
            opacity: 0.6,
          }}
        >
          <div className='flex items-center gap-3'>
            <span>
              Use{' '}
              <kbd
                className='font-mono px-1 py-0.5 rounded'
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  borderWidth: '1px',
                  color: 'var(--text-color)',
                }}
              >
                ↑↓
              </kbd>{' '}
              view
            </span>
            <span>•</span>
            <span>
              <kbd
                className='font-mono px-1 py-0.5 rounded'
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)',
                  borderWidth: '1px',
                  color: 'var(--text-color)',
                }}
              >
                Enter
              </kbd>{' '}
              launch
            </span>
          </div>
          <button
            onClick={onOpenSettings}
            className='flex items-center gap-1.5 font-medium font-mono px-2 py-1 rounded transition-colors cursor-pointer'
            style={{ color: 'var(--text-color)', opacity: 0.6 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--card-bg) 100%, transparent)';
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.opacity = '0.6';
            }}
          >
            <Settings className='w-3 h-3' />
            <span>Settings</span>
          </button>
        </div>
      </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
