import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Terminal, Globe, Folder } from 'lucide-react';
import type { Workspace } from '../types';

interface Step {
  label: string;
  done: boolean;
  type: 'app' | 'link' | 'folder' | 'misc';
}

interface ExecutionOverlayProps {
  workspace: Workspace | null;
  steps: Step[];
  currentStepIndex: number;
}

export const ExecutionOverlay: React.FC<ExecutionOverlayProps> = memo(
  ({ workspace, steps, currentStepIndex }) => {
    if (!workspace) return null;

    const progressPercentage = Math.round(
      (currentStepIndex / steps.length) * 100
    );

    return (
      <AnimatePresence>
        {workspace && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4'>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className='w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 rounded-2xl shadow-3xl text-neutral-900 dark:text-zinc-200 overflow-hidden font-mono'
            >
              <div className='bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='relative flex h-2 w-2'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2 w-2 bg-blue-500'></span>
                  </span>
                  <span className='text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300'>
                    Workspace Automation Pipeline
                  </span>
                </div>
                <span className='text-[10px] text-zinc-500 font-bold uppercase tracking-widest'>
                  {workspace.name}
                </span>
              </div>

              <div className='p-5 space-y-3.5 max-h-80 overflow-y-auto'>
                {steps.map((step, idx) => {
                  const isActive = idx === currentStepIndex;
                  const isDone = idx < currentStepIndex;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 transition-colors duration-200 text-xs ${
                        isActive
                          ? 'text-blue-500 dark:text-blue-400'
                          : isDone
                            ? 'text-zinc-500 line-through decoration-zinc-300 dark:decoration-zinc-800'
                            : 'text-zinc-500'
                      }`}
                    >
                      <div className='mt-0.5 flex-shrink-0'>
                        {isDone ? (
                          <CheckCircle2 className='w-4 h-4 text-emerald-400' />
                        ) : isActive ? (
                          <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin' />
                        ) : (
                          <div className='w-4 h-4 border border-zinc-300 dark:border-zinc-800 rounded-full' />
                        )}
                      </div>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-1.5'>
                          <span className='font-bold flex items-center gap-1'>
                            {step.type === 'app' && (
                              <Terminal className='w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400' />
                            )}
                            {step.type === 'link' && (
                              <Globe className='w-3.5 h-3.5 text-blue-500/80' />
                            )}
                            {step.type === 'folder' && (
                              <Folder className='w-3.5 h-3.5 text-orange-400' />
                            )}
                          </span>
                          <span className='truncate'>{step.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className='bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-850 px-5 py-3 flex items-center justify-between text-[11px] text-zinc-500'>
                <div className='flex items-center gap-1'>
                  <span>Progress:</span>
                  <span className='text-neutral-900 dark:text-zinc-300 font-bold'>
                    {progressPercentage}%
                  </span>
                </div>
                <span>Executing local sandbox routines...</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  }
);
