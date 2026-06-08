/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Command,
  Terminal,
  Settings,
  Check,
  ArrowRight,
  Sparkles,
  Keyboard,
  Cpu,
  Globe,
  Folder,
  Code,
  Brush,
  BookOpen,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { Workspace } from '../types';

interface OnboardingWizardProps {
  onComplete: (config: {
    minimizeToTray: boolean;
    launchAtStartup: boolean;
    firstWorkspace: string;
  }) => void;
}

export default function OnboardingWizard({
  onComplete,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [launchAtStartup, setLaunchAtStartup] = useState(true);
  const [selectedWorkspaceType, setSelectedWorkspaceType] = useState<
    'coding' | 'design' | 'study' | 'cyber' | 'custom'
  >('coding');

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    } else {
      onComplete({
        minimizeToTray,
        launchAtStartup,
        firstWorkspace: 'custom',
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div className='fixed inset-0 z-50 bg-[#09090b]/95 backdrop-blur-md flex items-center justify-center p-4'>
      {/* Centered card resembling Raycast / PowerToys utility */}
      <motion.div
        initial={{ y: 8, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className='w-full max-w-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col min-h-[480px] relative text-neutral-900 dark:text-zinc-100'
      >
        {/* Progress header strip */}
        <div className='bg-zinc-100/60 dark:bg-zinc-900/60 px-6 py-3 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between text-xs text-zinc-500 font-mono'>
          <div className='flex items-center gap-2'>
            <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse'></span>
            <span className='font-bold tracking-wider text-zinc-700 dark:text-zinc-400 uppercase'>
              Shift Installer Agent
            </span>
          </div>
          <span>
            Step {step} of {totalSteps}
          </span>
        </div>

        {/* Dynamic content rendering with AnimatePresence */}
        <div className='flex-1 p-8 sm:p-10 flex flex-col justify-center'>
          <AnimatePresence mode='wait'>
            {step === 1 && (
              <motion.div
                key='step1'
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className='space-y-6 text-center'
              >
                <div className='mx-auto w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center shadow-inner'>
                  <Command className='w-8 h-8 text-neutral-900 dark:text-white stroke-[1.5]' />
                </div>

                <div className='space-y-2'>
                  <h1 className='text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-sans'>
                    Welcome to Shift
                  </h1>
                  <p className='text-zinc-600 dark:text-zinc-400 text-sm max-w-sm mx-auto font-sans leading-relaxed'>
                    Restore your workflow in seconds. Instantly summon apps,
                    folders, and browser links with a single shortcut.
                  </p>
                </div>

                <div className='border-t border-zinc-200 dark:border-zinc-900 pt-5 text-center'>
                  <span className='text-[10px] text-zinc-500 block uppercase font-mono font-semibold tracking-widest'>
                    Created by
                  </span>
                  <span className='text-zinc-700 dark:text-zinc-300 font-bold font-sans text-xs block mt-1 tracking-wide'>
                    Muhamad Dzarel Alghifari
                  </span>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key='step2'
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className='space-y-5'
              >
                <div className='space-y-2 text-center sm:text-left'>
                  <span className='text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block'>
                    Environment Setup
                  </span>
                  <h2 className='text-xl font-bold text-neutral-900 dark:text-white tracking-tight'>
                    Background Operation
                  </h2>
                  <p className='text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans'>
                    Shift runs silently in the background as a low-overhead tray
                    daemon for instant summon speeds. Select how the main window
                    behaves when closed.
                  </p>
                </div>

                <div className='grid grid-cols-1 gap-2.5 pt-2'>
                  <button
                    type='button'
                    onClick={() => setMinimizeToTray(true)}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      minimizeToTray
                        ? 'bg-zinc-100 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-700 text-neutral-900 dark:text-white'
                        : 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-800'
                    }`}
                  >
                    <div className='mt-0.5'>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          minimizeToTray
                            ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white'
                            : 'border-zinc-500 dark:border-zinc-700'
                        }`}
                      >
                        {minimizeToTray && (
                          <div className='w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-950' />
                        )}
                      </div>
                    </div>
                    <div>
                      <span className='text-xs font-bold block text-zinc-800 dark:text-zinc-150'>
                        Keep Shift running in background (Recommended)
                      </span>
                      <span className='text-[10.5px] block text-zinc-500 leading-relaxed mt-0.5'>
                        Closing the window minimizes Shift to the system tray.
                        Shortcuts and activation triggers continue to work
                        instantly everywhere.
                      </span>
                    </div>
                  </button>

                  <button
                    type='button'
                    onClick={() => setMinimizeToTray(false)}
                    className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                      !minimizeToTray
                        ? 'bg-zinc-100 dark:bg-zinc-900/60 border-zinc-300 dark:border-zinc-700 text-neutral-900 dark:text-white'
                        : 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-800'
                    }`}
                  >
                    <div className='mt-0.5'>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          !minimizeToTray
                            ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white'
                            : 'border-zinc-500 dark:border-zinc-700'
                        }`}
                      >
                        {!minimizeToTray && (
                          <div className='w-1.5 h-1.5 rounded-full bg-white dark:bg-zinc-950' />
                        )}
                      </div>
                    </div>
                    <div>
                      <span className='text-xs font-bold block text-zinc-800 dark:text-zinc-150'>
                        Exit completely when window is closed
                      </span>
                      <span className='text-[10.5px] block text-zinc-500 leading-relaxed mt-0.5'>
                        Closing the window will terminate the app processes
                        completely. You cannot trigger automated work setups
                        until you relaunch Shift manually.
                      </span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key='step3'
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className='space-y-6 text-center sm:text-left'
              >
                <div className='space-y-2'>
                  <span className='text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block'>
                    Workflow Optimization
                  </span>
                  <h2 className='text-xl font-bold text-neutral-900 dark:text-white tracking-tight'>
                    Launch at Startup
                  </h2>
                  <p className='text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans max-w-md'>
                    Start Shift automatically when your computer starts. Have
                    your environment and custom workspace channels ready to
                    deploy immediately from boot.
                  </p>
                </div>

                <div className='bg-zinc-100/30 dark:bg-zinc-900/30 rounded-xl p-5 border border-zinc-300 dark:border-zinc-900 max-w-md mx-auto sm:mx-0'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5 text-left pr-4'>
                      <span className='text-xs font-bold text-zinc-800 dark:text-zinc-200 block'>
                        Startup Boot Loader
                      </span>
                      <span className='text-[11px] text-zinc-500 block leading-normal'>
                        Toggle to register Shift with your system startup helper
                        daemon.
                      </span>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer flex-shrink-0'>
                      <input
                        type='checkbox'
                        className='sr-only peer'
                        checked={launchAtStartup}
                        onChange={(e) => setLaunchAtStartup(e.target.checked)}
                      />
                      <div className="w-10 h-6 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-600 dark:after:bg-zinc-650 after:border-zinc-400 dark:after:border-zinc-700 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:after:bg-white dark:peer-checked:after:bg-zinc-950"></div>
                    </label>
                  </div>
                </div>

                <div className='p-3.5 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-[#18181b] rounded-lg max-w-md font-mono text-[10px] text-zinc-500 leading-relaxed'>
                  📢{' '}
                  <strong className='text-zinc-700 dark:text-zinc-400'>
                    Daemon Stat:
                  </strong>{' '}
                  Shift consumes &lt; 15MB RAM in the background. It is tailored
                  for low memory overhead and won't affect gaming or
                  compilations.
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key='step4'
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className='space-y-5'
              >
                <div className='space-y-2 text-center sm:text-left'>
                  <span className='text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block'>
                    Summon System
                  </span>
                  <h2 className='text-xl font-bold text-neutral-900 dark:text-white tracking-tight'>
                    Global Shortcut Trigger
                  </h2>
                  <p className='text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans'>
                    Use these global keyboard hotkey sequences to instantly
                    summon the launcher command suggester console over any
                    active application.
                  </p>
                </div>

                {/* Simulated physical keyboard shortcuts */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3 pt-2'>
                  <div className='p-4 rounded-xl bg-zinc-100/30 dark:bg-zinc-900/30 border border-zinc-300 dark:border-zinc-900 text-center space-y-2'>
                    <span className='text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-bold block'>
                      Windows
                    </span>
                    <div className='flex gap-1 items-center justify-center font-mono text-[11px] text-neutral-900 dark:text-zinc-200'>
                      <span className='px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850'>
                        Ctrl
                      </span>
                      <span>+</span>
                      <span className='px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850'>
                        Alt
                      </span>
                      <span>+</span>
                      <span className='px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850'>
                        Space
                      </span>
                    </div>
                  </div>

                  <div className='p-4 rounded-xl bg-zinc-100/30 dark:bg-zinc-900/30 border border-zinc-300 dark:border-zinc-900 text-center space-y-2'>
                    <span className='text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-bold block'>
                      macOS
                    </span>
                    <div className='flex gap-1 items-center justify-center font-mono text-[11px] text-neutral-900 dark:text-zinc-200'>
                      <span className='px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850'>
                        ⌘ Cmd
                      </span>
                      <span>+</span>
                      <span className='px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850'>
                        ⌥ Opt
                      </span>
                      <span>+</span>
                      <span className='px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850'>
                        Space
                      </span>
                    </div>
                  </div>

                  <div className='p-4 rounded-xl bg-zinc-100/30 dark:bg-zinc-900/30 border border-zinc-300 dark:border-zinc-900 text-center space-y-2'>
                    <span className='text-[9px] uppercase tracking-wider font-mono text-zinc-500 font-bold block'>
                      Linux
                    </span>
                    <div className='flex gap-1 items-center justify-center font-mono text-[11px] text-neutral-900 dark:text-zinc-200'>
                      <span className='px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850'>
                        Ctrl
                      </span>
                      <span>+</span>
                      <span className='px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850'>
                        Alt
                      </span>
                      <span>+</span>
                      <span className='px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850'>
                        Space
                      </span>
                    </div>
                  </div>
                </div>

                <p className='text-[11px] text-zinc-500 text-center sm:text-left leading-normal'>
                  💡{' '}
                  <span className='font-semibold text-zinc-700 dark:text-zinc-400'>
                    Customizations:
                  </span>{' '}
                  You can reconfigure the global activation shortcut (e.g., Ctrl
                  + K or Alt + P) anytime in settings.
                </p>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key='step5'
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className='space-y-6 text-center'
              >
                <div className='mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400'>
                  <Check className='w-8 h-8 font-bold' />
                </div>

                <div className='space-y-2'>
                  <h2 className='text-2xl font-bold text-neutral-900 dark:text-white tracking-tight'>
                    Shift Custom Setup Complete!
                  </h2>
                  <p className='text-zinc-600 dark:text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed'>
                    The background daemon is primed. You can now restore
                    development databases, directories, and browser layouts
                    instantly in a high-speed sandbox.
                  </p>
                </div>

                <div className='bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-300 dark:border-zinc-900 rounded-lg p-3.5 max-w-xs mx-auto text-[10px] font-mono text-zinc-700 dark:text-zinc-400 text-left space-y-1'>
                  <div className='flex justify-between'>
                    <span>LAUNCH ENGINE:</span>
                    <span className='text-emerald-500 dark:text-emerald-400 font-bold'>
                      READY
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>SUMMON SEQUENCE:</span>
                    <span className='text-neutral-900 dark:text-zinc-100 font-bold'>
                      ACTIVE
                    </span>
                  </div>
                  <div className='flex justify-between text-zinc-500'>
                    <span>DEVELOPER:</span>
                    <span>Muhamad Dzarel Alghifari</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buttons footer bar */}
        <div className='bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-850 px-6 py-4 flex items-center justify-between'>
          <button
            type='button'
            onClick={handleBack}
            className={`px-4 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-zinc-250 transition-colors ${
              step === 1
                ? 'opacity-0 pointer-events-none'
                : 'hover:bg-white dark:hover:bg-zinc-950'
            }`}
          >
            Back
          </button>

          <button
            type='button'
            onClick={handleNext}
            className='px-5 py-1.5 bg-accent hover:opacity-90 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer'
          >
            <span>
              {step === 4
                ? 'Finish Setup'
                : step === 5
                  ? 'Open Dashboard'
                  : 'Continue'}
            </span>
            <ArrowRight className='w-3.5 h-3.5 text-white' />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
