import React, { useState, useEffect, useCallback } from 'react';

export function useDataStore<T>(
  filename: string,
  defaultValue: T,
  options = { autoSave: true, parseRawApp: false }
) {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (typeof window === 'undefined' || !('__TAURI__' in window)) {
      // Fallback for browser testing
      try {
        const item = window.localStorage.getItem(filename);
        if (item) {
          setData(JSON.parse(item));
        }
      } catch (e) {
        console.error(`[DataStore] LocalStorage load failed for ${filename}:`, e);
      }
      setIsLoaded(true);
      return;
    }

    try {
      const { appDataDir } = await import('@tauri-apps/api/path');
      const { readTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');

      const dirPath = await appDataDir();
      
      // Ensure directory exists
      const dirExists = await exists(dirPath);
      if (!dirExists) {
        await mkdir(dirPath, { recursive: true });
      }

      const filePath = `${dirPath}/${filename}`;
      const fileExists = await exists(filePath);

      if (fileExists) {
        const content = await readTextFile(filePath);
        try {
          const parsed = JSON.parse(content);
          setData(parsed);
          console.log(`[${filename.split('.')[0]} Loaded] successfully`);
        } catch (parseError) {
          console.error(`[DataStore] JSON parse error for ${filename}, falling back to default:`, parseError);
          setData(defaultValue); // Fallback on corruption
        }
      } else {
        setData(defaultValue);
      }
    } catch (e) {
      console.error(`[DataStore] Load failed for ${filename}:`, e);
      setError(e as Error);
    } finally {
      setIsLoaded(true);
    }
  }, [filename, defaultValue]);

  const saveData = useCallback(
    async (newDataOrUpdater: React.SetStateAction<T>) => {
      let newData: T;
      setData((prev) => {
        newData = typeof newDataOrUpdater === 'function' ? (newDataOrUpdater as (prevState: T) => T)(prev) : newDataOrUpdater;
        return newData;
      });

      // Wait for next tick so newData is evaluated
      await new Promise(resolve => setTimeout(resolve, 0));

      if (typeof window === 'undefined' || !('__TAURI__' in window)) {
        window.localStorage.setItem(filename, JSON.stringify(newData));
        return;
      }

      try {
        const { appDataDir } = await import('@tauri-apps/api/path');
        const { writeTextFile, exists, mkdir } = await import('@tauri-apps/plugin-fs');

        const dirPath = await appDataDir();
        
        // Ensure directory exists
        const dirExists = await exists(dirPath);
        if (!dirExists) {
          await mkdir(dirPath, { recursive: true });
        }

        const filePath = `${dirPath}/${filename}`;
        await writeTextFile(filePath, JSON.stringify(newData, null, 2));
        console.log(`[${filename.split('.')[0]} Saved] successfully`);
      } catch (e) {
        console.error(`[DataStore] Save failed for ${filename}:`, e);
      }
    },
    [filename]
  );

  // Auto load on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto save on data change if enabled
  useEffect(() => {
    if (isLoaded && options.autoSave) {
      if (typeof window === 'undefined' || !('__TAURI__' in window)) {
        window.localStorage.setItem(filename, JSON.stringify(data));
        return;
      }

      import('@tauri-apps/api/path').then(({ appDataDir }) => {
        import('@tauri-apps/plugin-fs').then(({ writeTextFile }) => {
          appDataDir().then((dirPath) => {
            const filePath = `${dirPath}/${filename}`;
            writeTextFile(filePath, JSON.stringify(data, null, 2)).catch(e => {
              console.error(`[DataStore] Auto-save failed for ${filename}:`, e);
            });
          });
        });
      });
    }
  }, [data, isLoaded, options.autoSave, filename]);

  return { data, setData: saveData, isLoaded, error };
}
