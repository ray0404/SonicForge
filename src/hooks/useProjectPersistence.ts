import { useState, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { logger } from '@/utils/logger';

// Key for IDB
const IDB_PROJECT_KEY = 'current_project_blob';

interface PersistenceState {
  fileHandle: FileSystemFileHandle | null;
  isPersistedToDisk: boolean; // True if saved to actual disk (FS API), False if IDB/Memory
  lastSaved: Date | null;
}

export function useProjectPersistence() {
  const [state, setState] = useState<PersistenceState>({
    fileHandle: null,
    isPersistedToDisk: false,
    lastSaved: null,
  });

  /**
   * Saves data. Tries File System Access first.
   * If not available or fails, falls back to IndexedDB.
   */
  const saveProject = useCallback(async (data: Blob | string) => {
    try {
        // Option 1: Try writing to existing handle if we have one
        if (state.fileHandle) {
            logger.info("Saving to existing file handle...");
            const writable = await state.fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
            setState(prev => ({ ...prev, lastSaved: new Date(), isPersistedToDisk: true }));
            return;
        }

        // Option 2: No handle? Prompt user to pick one (Save As)
        if ('showSaveFilePicker' in window) {
            logger.info("Opening Save File Picker...");
            const handle = await window.showSaveFilePicker({
                suggestedName: 'project.wav', // Default name
                types: [{
                    description: 'Audio Project',
                    accept: { 'audio/wav': ['.wav'] },
                }],
            });

            const writable = await handle.createWritable();
            await writable.write(data);
            await writable.close();

            setState({
                fileHandle: handle,
                isPersistedToDisk: true,
                lastSaved: new Date()
            });
            logger.info("Saved to disk successfully.");
        } else {
            throw new Error("FileSystemAccess API unavailable");
        }

    } catch (err: any) {
        if (err.name === 'AbortError') {
            logger.info("User cancelled save.");
            return;
        }

        // Fallback: IndexedDB
        logger.warn("FileSystem save failed or unavailable. Falling back to IndexedDB.", err);

        await set(IDB_PROJECT_KEY, data);
        setState(prev => ({
            ...prev,
            isPersistedToDisk: false, // Important: User knows this is NOT safe on disk
            lastSaved: new Date()
        }));
        logger.info("Saved to IndexedDB (Browser Storage).");
    }
  }, [state.fileHandle]);

  /**
   * Loads the project. Checks IDB first for auto-restore,
   * or allows user to pick a file.
   */
  const loadProject = useCallback(async (fromDisk = false) => {
      if (fromDisk && 'showOpenFilePicker' in window) {
          try {
             const [handle] = await window.showOpenFilePicker({
                 types: [{ description: 'Audio Project', accept: { 'audio/wav': ['.wav'] } }]
             });
             const file = await handle.getFile();
             // In real app: parse file
             logger.info("Loaded file from disk:", file.name);
             setState({
                 fileHandle: handle,
                 isPersistedToDisk: true,
                 lastSaved: new Date()
             });
             return file;
          } catch (e) {
              logger.warn("Load from disk cancelled/failed", e);
          }
      } else {
          // Load from IDB
          const data = await get(IDB_PROJECT_KEY);
          if (data) {
              logger.info("Restored project from IndexedDB.");
              setState(prev => ({ ...prev, isPersistedToDisk: false }));
              return data;
          }
      }
  }, []);

  return {
    ...state,
    saveProject,
    loadProject
  };
}
