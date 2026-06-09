import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

interface UpdateWizardProps {
  version: string;
  onComplete: () => void;
}

export default function UpdateWizard({
  version,
  onComplete,
}: UpdateWizardProps) {
  return (
    <div className='fixed inset-0 z-50 bg-[#09090b]/95 backdrop-blur-md flex items-center justify-center p-4'>
      <motion.div
        initial={{ y: 8, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className='w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-850 rounded-xl shadow-[0_32px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col min-h-[380px] relative text-neutral-900 dark:text-zinc-100'
      >
        <div className='bg-zinc-100/60 dark:bg-zinc-900/60 px-6 py-3 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between text-xs text-zinc-500 font-mono'>
          <div className='flex items-center gap-2'>
            <span className='w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse'></span>
            <span className='font-bold tracking-wider text-zinc-700 dark:text-zinc-400 uppercase'>
              Shift Update Agent
            </span>
          </div>
          <span>v{version}</span>
        </div>

        <div className='flex-1 p-8 flex flex-col justify-center text-center space-y-6'>
          <div className='mx-auto w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400'>
            <Sparkles className='w-8 h-8' />
          </div>

          <div className='space-y-2'>
            <h1 className='text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white'>
              Shift Updated Successfully
            </h1>
            <p className='text-zinc-600 dark:text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed'>
              You are now running version {version}. We've squashed bugs and
              improved performance to make your workspace automation even
              faster.
            </p>
          </div>

          <div className='bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-300 dark:border-zinc-900 rounded-lg p-4 max-w-xs mx-auto text-left space-y-2'>
            <div className='flex items-start gap-2 text-xs'>
              <Check className='w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0' />
              <span className='text-zinc-700 dark:text-zinc-300'>
                Faster workspace launching
              </span>
            </div>
            <div className='flex items-start gap-2 text-xs'>
              <Check className='w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0' />
              <span className='text-zinc-700 dark:text-zinc-300'>
                UI & navigation improvements
              </span>
            </div>
            <div className='flex items-start gap-2 text-xs'>
              <Check className='w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0' />
              <span className='text-zinc-700 dark:text-zinc-300'>
                Better settings management
              </span>
            </div>
          </div>
        </div>

        <div className='bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-850 px-6 py-4 flex items-center justify-end'>
          <button
            onClick={onComplete}
            className='px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer'
          >
            <span>Continue to App</span>
            <ArrowRight className='w-3.5 h-3.5' />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
