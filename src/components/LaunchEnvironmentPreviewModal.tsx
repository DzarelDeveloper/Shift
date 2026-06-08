import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Terminal, Globe, Folder, CornerDownLeft } from 'lucide-react';
import type { Workspace } from '../types';

interface LaunchEnvironmentPreviewModalProps {
  workspace: Workspace | null;
  autoBypassPreview: boolean;
  setAutoBypassPreview: (value: boolean) => void;
  previewSecondsLeft: number;
  isTimerActive: boolean;
  toggleTimer: () => void;
  onCancel: () => void;
  onLaunch: () => void;
}

export const LaunchEnvironmentPreviewModal: React.FC<LaunchEnvironmentPreviewModalProps> =
  memo(
    ({
      workspace,
      autoBypassPreview,
      setAutoBypassPreview,
      previewSecondsLeft,
      isTimerActive,
      toggleTimer,
      onCancel,
      onLaunch,
    }) => {
      if (!workspace) return null;

      return (
        <AnimatePresence>
          {workspace && (
            <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4'>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className='w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-neutral-900 dark:text-zinc-200 overflow-hidden'
              >
                <div className='bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-850 px-5 py-4 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <span className='p-1 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-amber-500'>
                      <Clock className='w-4 h-4' />
                    </span>
                    <div>
                      <h3 className='font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300'>
                        Launch Environment Preview
                      </h3>
                      <p className='text-[10px] text-zinc-500 font-mono'>
                        Profile: {workspace.name}
                      </p>
                    </div>
                  </div>

                  <div className='text-[11px] font-mono px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-800 flex items-center gap-1.5 leading-none'>
                    <span className='relative flex h-1.5 w-1.5'>
                      <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                      <span className='relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500'></span>
                    </span>
                    <span>Auto-Launch: {previewSecondsLeft}s</span>
                  </div>
                </div>

                <div className='p-5 space-y-5 max-h-[350px] overflow-y-auto'>
                  <p className='text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed'>
                    Review targeted system automation components before
                    restoring the environment:
                  </p>

                  <div className='space-y-1.5'>
                    <div className='text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-500 flex items-center gap-1'>
                      <Terminal className='w-3.5 h-3.5 text-zinc-500' />
                      <span>
                        Applications ({workspace.applications.length})
                      </span>
                    </div>
                    <div className='bg-zinc-100/50 dark:bg-zinc-900/40 rounded-lg p-2.5 border border-zinc-300 dark:border-zinc-900 space-y-1'>
                      {workspace.applications.length > 0 ? (
                        workspace.applications.map((app, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-mono tracking-tight'
                          >
                            <span className='flex items-center gap-1.5 text-neutral-900 dark:text-zinc-200'>
                              <span className='text-emerald-500 font-bold'>
                                ✓
                              </span>
                              <span>{app.name}</span>
                            </span>
                            <span
                              className='text-[10px] text-zinc-500 dark:text-zinc-600 truncate max-w-[200px]'
                              title={app.path}
                            >
                              {app.path}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className='text-[11px] text-zinc-500 italic pl-1 leading-normal'>
                          No apps simulated in this environment
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <div className='text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-500 flex items-center gap-1'>
                      <Globe className='w-3.5 h-3.5 text-zinc-500' />
                      <span>Websites ({workspace.websites.length})</span>
                    </div>
                    <div className='bg-zinc-100/50 dark:bg-zinc-900/40 rounded-lg p-2.5 border border-zinc-300 dark:border-zinc-900 space-y-1'>
                      {workspace.websites.length > 0 ? (
                        workspace.websites.map((site, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-mono tracking-tight'
                          >
                            <span className='flex items-center gap-1.5 text-neutral-900 dark:text-zinc-200'>
                              <span className='text-emerald-500 font-bold'>
                                ✓
                              </span>
                              <span>{site.name}</span>
                            </span>
                            <span
                              className='text-[10px] text-zinc-500 dark:text-zinc-600 truncate max-w-[200px]'
                              title={site.url}
                            >
                              {site.url}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className='text-[11px] text-zinc-600 italic pl-1 leading-normal'>
                          No url redirect endpoints in this environment
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <div className='text-[10px] uppercase font-mono font-bold tracking-wider text-zinc-500 flex items-center gap-1'>
                      <Folder className='w-3.5 h-3.5 text-zinc-500' />
                      <span>Drive Folders ({workspace.folders.length})</span>
                    </div>
                    <div className='bg-zinc-100/50 dark:bg-zinc-900/40 rounded-lg p-2.5 border border-zinc-300 dark:border-zinc-900 space-y-1'>
                      {workspace.folders.length > 0 ? (
                        workspace.folders.map((folder, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-mono tracking-tight'
                          >
                            <span className='flex items-center gap-1.5 text-neutral-900 dark:text-zinc-200'>
                              <span className='text-emerald-500 font-bold'>
                                ✓
                              </span>
                              <span>{folder.name}</span>
                            </span>
                            <span
                              className='text-[10px] text-zinc-500 dark:text-zinc-600 truncate max-w-[200px]'
                              title={folder.path}
                            >
                              {folder.path}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className='text-[11px] text-zinc-500 italic pl-1 leading-normal'>
                          No physical system drive paths configured
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className='bg-zinc-100/60 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-900 px-5 py-2.5 flex items-center justify-between text-xs'>
                  <label className='flex items-center gap-2 cursor-pointer group text-zinc-600 dark:text-zinc-400'>
                    <input
                      type='checkbox'
                      checked={autoBypassPreview}
                      onChange={(e) => setAutoBypassPreview(e.target.checked)}
                      className='rounded bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-805 text-accent focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5'
                    />
                    <span className='group-hover:text-neutral-900 dark:group-hover:text-zinc-200 transition-colors select-none'>
                      Bypass preview in the future
                    </span>
                  </label>

                  <button
                    onClick={toggleTimer}
                    className='text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white border border-zinc-300 dark:border-zinc-900/80'
                  >
                    {isTimerActive ? '⏸ Pause Timer' : '▶ Resume Auto-Launch'}
                  </button>
                </div>

                <div className='bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-850 px-5 py-3 flex items-center justify-end gap-2 text-xs'>
                  <button
                    onClick={onCancel}
                    className='px-4 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white rounded-lg font-semibold transition-all cursor-pointer'
                  >
                    Cancel (Esc)
                  </button>
                  <button
                    onClick={onLaunch}
                    className='px-5 py-1.5 bg-accent hover:opacity-90 text-white font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-md'
                  >
                    <span>Launch Immediately</span>
                    <CornerDownLeft className='w-3.5 h-3.5' />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      );
    }
  );
