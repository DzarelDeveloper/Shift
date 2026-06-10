import { describe, it, expect } from 'vitest';
import {
  createExportData,
  parseImportData,
  checkWorkspaceHealth,
} from '../utils/workspaceUtils';
import { Workspace } from '../types';
import { APP_CONFIG } from '../config/app';

describe('workspaceUtils', () => {
  const dummyWorkspaces: Workspace[] = [
    {
      id: 'ws-1',
      name: 'Test WS',
      description: 'A test workspace',
      applications: [{ name: 'App1', path: '/usr/bin/app1' }],
      websites: [],
      folders: [{ name: 'Folder1', path: '/home/user/docs' }],
      createdAt: '2023-01-01T00:00:00Z',
    },
  ];

  const dummyPreferences = {
    launchAtStartup: true,
    minimizeToTray: false,
    shortcutKey: 'Ctrl+K',
    autoBypassPreview: true,
  };

  describe('createExportData', () => {
    it('should correctly format workspaces and preferences into a JSON string', () => {
      const json = createExportData(dummyWorkspaces, dummyPreferences);
      const parsed = JSON.parse(json);

      expect(parsed.version).toBe(APP_CONFIG.fallbackVersion);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.workspaces).toEqual(dummyWorkspaces);
      expect(parsed.preferences).toEqual(dummyPreferences);
    });
  });

  describe('parseImportData', () => {
    it('should successfully parse valid export data', () => {
      const validData = {
        version: APP_CONFIG.fallbackVersion,
        exportedAt: '2023-01-01T00:00:00Z',
        workspaces: dummyWorkspaces,
        preferences: dummyPreferences,
      };

      const result = parseImportData(JSON.stringify(validData));
      expect(result.workspaces).toHaveLength(1);
      expect(result.workspaces[0].name).toBe('Test WS');
    });

    it('should throw an error on invalid JSON format', () => {
      const invalidData = { missingVersionAndWorkspaces: true };
      expect(() => parseImportData(JSON.stringify(invalidData))).toThrow(
        'Invalid .shift file format'
      );
    });

    it('should throw an error on malformed JSON', () => {
      expect(() => parseImportData('{ bad json ')).toThrow();
    });
  });

  describe('checkWorkspaceHealth', () => {
    it('should return healthy as true when in a non-Tauri environment (fallback)', async () => {
      // Vitest runs in Node/JSDOM, so typeof window !== 'undefined' but '__TAURI__' is not in window
      const result = await checkWorkspaceHealth(dummyWorkspaces[0]);
      expect(result.healthy).toBe(true);
      expect(result.brokenPaths).toHaveLength(0);
    });
  });
});
