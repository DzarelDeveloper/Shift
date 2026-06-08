import React, { memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';

interface ToastNotificationProps {
  isVisible: boolean;
  title: string;
  description: string;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = memo(
  ({ isVisible, title, description, onClose }) => {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className='fixed bottom-6 right-6 z-50 w-80 p-4 rounded-xl border bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 shadow-[0_12px_32px_rgba(0,0,0,0.5)] cursor-pointer text-neutral-900 dark:text-zinc-200'
            onClick={onClose}
          >
            <div className='flex items-start gap-3'>
              <div className='mt-0.5 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'>
                <Bell className='w-4 h-4' />
              </div>
              <div className='flex-1 min-w-0'>
                <p className='font-bold text-xs text-neutral-900 dark:text-white truncate'>
                  {title}
                </p>
                <p className='text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug'>
                  {description}
                </p>
              </div>
              <X className='w-3.5 h-3.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex-shrink-0' />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
