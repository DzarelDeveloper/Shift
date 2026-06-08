import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Command } from 'lucide-react';
import type { Workspace } from '../types';

interface DockToTrayOverlayProps {
  isVisible: boolean;
  shortcutKey: string;
  launchAtStartup: boolean;
  workspaces: Workspace[];
  onRestore: () => void;
  onLaunchWorkspace: (workspace: Workspace) => void;
}

export const DockToTrayOverlay: React.FC<DockToTrayOverlayProps> = memo(
  ({
    isVisible,
    shortcutKey,
    launchAtStartup,
    workspaces,
    onRestore,
    onLaunchWorkspace,
  }) => {
    if (!isVisible) return null;

    return (
      <div className='fixed inset-0 z-50 bg-[#09090b]/98 backdrop-blur-md flex items-center justify-center p-4'>
        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className='w-full max-w-md bg-zinc-950 border border-zinc-850 rounded-xl p-6 shadow-2xl relative overflow-hidden text-center space-y-6'
        >
          <div className='absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500' />

          <div className='mx-auto w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner relative'>
            <span className='relative flex h-3 w-3 absolute -top-1 -right-1'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-3 w-3 bg-emerald-400'></span>
            </span>
            <Command className='w-7 h-7 text-zinc-400 stroke-[1.5]' />
          </div>

          <div className='space-y-2'>
            <h3 className='text-zinc-100 font-bold text-sm tracking-tight'>
              Docked to System Tray Daemon
            </h3>
            <p className='text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed font-sans'>
              The Workspace Launcher shell has successfully docked to the
              background tray system. The orchestrator is actively listening for
              your hotkeys.
            </p>
          </div>

          <div className='bg-zinc-900/30 rounded-lg p-3 border border-zinc-900/60 font-mono text-[10px] text-zinc-400 grid grid-cols-2 gap-2 text-left'>
            <div>
              <span className='text-zinc-600 block uppercase font-bold'>
                STATUS
              </span>
              <span className='text-emerald-400 font-bold'>
                ● ACTIVE BACKLOG
              </span>
            </div>
            <div>
              <span className='text-zinc-650 block uppercase font-bold'>
                PORT BIND
              </span>
              <span className='text-zinc-300 font-semibold'>
                127.0.0.1:3000
              </span>
            </div>
            <div className='col-span-2 border-t border-zinc-900/40 pt-1.5 flex items-center justify-between'>
              <div>
                <span className='text-zinc-600 block uppercase font-bold'>
                  Summon Shortcut
                </span>
                <span className='text-white font-bold font-mono tracking-wider'>
                  {shortcutKey || 'Ctrl+Alt+Space'}
                </span>
              </div>
              <div>
                <span className='text-zinc-600 block uppercase font-bold text-right'>
                  STARTUP LAUNCH
                </span>
                <span
                  className={`font-mono text-right block ${launchAtStartup ? 'text-emerald-400' : 'text-zinc-500'}`}
                >
                  {launchAtStartup ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>
          </div>

          <div className='text-left space-y-1.5'>
            <span className='text-[9px] uppercase tracking-wider font-bold text-zinc-600 font-mono block'>
              Instantly launch profiles
            </span>
            <div className='grid grid-cols-2 gap-1.5'>
              {workspaces.slice(0, 4).map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    onRestore();
                    onLaunchWorkspace(ws);
                  }}
                  className='text-left p-2 rounded bg-zinc-900 font-mono text-[11px] hover:bg-zinc-850 hover:text-white transition-colors truncate border border-zinc-850/45 text-zinc-400'
                >
                  🚀 {ws.name}
                </button>
              ))}
            </div>
          </div>

          <div className='pt-2'>
            <button
              onClick={onRestore}
              className='w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-lg text-xs tracking-tight transition-all cursor-pointer shadow-sm'
            >
              Restore Interface Shell (Maximize)
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
);
