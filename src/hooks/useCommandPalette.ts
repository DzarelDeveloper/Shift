import { useState, useEffect, useRef } from 'react';
import { Workspace, InstalledApp, LauncherItem } from '../types';

interface UseCommandPaletteOptions {
  isOpen: boolean;
  workspaces: Workspace[];
  apps: InstalledApp[];
  onLaunch: (item: LauncherItem) => void;
  onClose: () => void;
}

// Simple fuzzy match function
function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  let textIndex = 0;
  let queryIndex = 0;

  while (
    textIndex < normalizedText.length &&
    queryIndex < normalizedQuery.length
  ) {
    if (normalizedText[textIndex] === normalizedQuery[queryIndex]) {
      queryIndex++;
    }
    textIndex++;
  }

  return queryIndex === normalizedQuery.length;
}

// Calculate match score for sorting
function getMatchScore(text: string, query: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  let score = 0;
  let consecutive = 0;
  let queryIndex = 0;

  for (
    let i = 0;
    i < normalizedText.length && queryIndex < normalizedQuery.length;
    i++
  ) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      score += 1 + consecutive * 2; // Bonus for consecutive matches
      consecutive++;
      queryIndex++;
    } else {
      consecutive = 0;
    }
  }

  // Bonus for matches at the start
  if (normalizedText.startsWith(normalizedQuery)) {
    score += 10;
  }

  return score;
}

export function useCommandPalette({
  isOpen,
  workspaces,
  apps,
  onLaunch,
  onClose,
}: UseCommandPaletteOptions) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter workspace items based on search query with fuzzy search
  const filteredItems: LauncherItem[] = [
    ...workspaces.map((ws) => ({ type: 'workspace' as const, data: ws })),
  ]
    .filter((item) => {
      const ws = item.data;
      return (
        fuzzyMatch(ws.name, query) ||
        fuzzyMatch(ws.description, query) ||
        (ws.shortcut && fuzzyMatch(ws.shortcut, query))
      );
    })
    .sort((a, b) => {
      const scoreA =
        getMatchScore(a.data.name, query) +
        getMatchScore(a.data.description, query);
      const scoreB =
        getMatchScore(b.data.name, query) +
        getMatchScore(b.data.description, query);
      return scoreB - scoreA;
    });

  // Focus input on open and handle open-launcher event
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);

      const isTauriEnv = typeof window !== 'undefined' && '__TAURI__' in window;
      let unlisten: (() => void) | undefined;

      if (isTauriEnv) {
        import('@tauri-apps/api/event').then(({ listen }) => {
          listen('open-launcher', () => {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
          }).then((fn) => {
            unlisten = fn;
          });
        });
      }

      return () => {
        if (unlisten) unlisten();
      };
    }
  }, [isOpen]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const activeElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0 ? (prev + 1) % filteredItems.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredItems.length > 0
            ? (prev - 1 + filteredItems.length) % filteredItems.length
            : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems.length > 0 && selectedIndex < filteredItems.length) {
          onLaunch(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onLaunch, onClose]);

  return {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    inputRef,
    resultsRef,
    filteredItems,
  };
}
