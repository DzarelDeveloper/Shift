/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Workspace } from '../types';

export function generateWindowsPowershell(workspace: Workspace): string {
  let script = `# ==========================================================\n`;
  script += `# WORKSPACE LAUNCHER AUTOMATION SCRIPT\n`;
  script += `# Workspace: ${workspace.name}\n`;
  script += `# Generated: ${new Date().toLocaleDateString()}\n`;
  script += `# Description: ${workspace.description || 'No description provided.'}\n`;
  script += `# ==========================================================\n\n`;

  script += `Write-Host "🚀 Launching workspace: ${workspace.name}..." -ForegroundColor Cyan\n\n`;

  // Launch Folders
  if (workspace.folders.length > 0) {
    script += `# 📂 --- Launching Folders ---\n`;
    workspace.folders.forEach((folder) => {
      // Escape backslashes for PowerShell or use robust paths
      const escapedPath = folder.path.replace(/\\/g, '\\\\');
      script += `Write-Host "  -> Opening Folder: ${folder.name} (${folder.path})"\n`;
      script += `Start-Process explorer.exe -ArgumentList "${escapedPath}"\n`;
    });
    script += `\n`;
  }

  // Launch Websites
  if (workspace.websites.length > 0) {
    script += `# 🌐 --- Launching Websites ---\n`;
    workspace.websites.forEach((site) => {
      script += `Write-Host "  -> Opening URL: ${site.name} (${site.url})"\n`;
      script += `Start-Process "${site.url}"\n`;
    });
    script += `\n`;
  }

  // Launch Applications
  if (workspace.applications.length > 0) {
    script += `# 💻 --- Launching Applications ---\n`;
    workspace.applications.forEach((app) => {
      const escapedPath = app.path.replace(/\\/g, '\\\\');
      script += `Write-Host "  -> Running App: ${app.name}"\n`;
      script += `try {\n`;
      script += `    Start-Process "${escapedPath}" -ErrorAction Stop\n`;
      script += `} catch {\n`;
      script += `    Write-Host "    ⚠️ Error: Could not launch ${app.name}. Checking generic path..." -ForegroundColor Yellow\n`;
      // Fallback: try starting it by name if path fails
      script += `    try { Start-Process "${app.name.toLowerCase().replace(/\s+/g, '')}" } catch {}\n`;
      script += `}\n`;
    });
    script += `\n`;
  }

  script += `Write-Host "🟢 Workspace Loaded Successfully! Minimize window to keep launcher active." -ForegroundColor Green\n`;
  script += `Start-Sleep -Seconds 3\n`;

  return script;
}

export function generateWindowsBatch(workspace: Workspace): string {
  let script = `@echo off\n`;
  script += `:: ==========================================================\n`;
  script += `:: WORKSPACE LAUNCHER AUTOMATION BATCH SCRIPT\n`;
  script += `:: Workspace: ${workspace.name}\n`;
  script += `:: ==========================================================\n\n`;

  script += `echo 🚀 Launching workspace: ${workspace.name}...\n\n`;

  // Launch Folders
  if (workspace.folders.length > 0) {
    script += `:: 📂 Open Folders\n`;
    workspace.folders.forEach((folder) => {
      script += `echo   -^> Opening Folder: ${folder.name}\n`;
      script += `start "" "${folder.path}"\n`;
    });
    script += `\n`;
  }

  // Launch Websites
  if (workspace.websites.length > 0) {
    script += `:: 🌐 Open Websites\n`;
    workspace.websites.forEach((site) => {
      script += `echo   -^> Opening website: ${site.name}\n`;
      script += `start "" "${site.url}"\n`;
    });
    script += `\n`;
  }

  // Launch Applications
  if (workspace.applications.length > 0) {
    script += `:: 💻 Open Applications\n`;
    workspace.applications.forEach((app) => {
      script += `echo   -^> Launching App: ${app.name}\n`;
      script += `start "" "${app.path}"\n`;
    });
    script += `\n`;
  }

  script += `echo 🟢 Active environment successfully restored!\n`;
  script += `timeout /t 3 >nul\n`;

  return script;
}

export function generateMacosScript(workspace: Workspace): string {
  let script = `#!/bin/bash\n`;
  script += `# ==========================================================\n`;
  script += `# WORKSPACE LAUNCHER AUTOMATION SCRIPT FOR MACOS\n`;
  script += `# Workspace: ${workspace.name}\n`;
  script += `# Generated: ${new Date().toLocaleDateString()}\n`;
  script += `# ==========================================================\n\n`;

  script += `echo "🚀 Restoring workspace: ${workspace.name}..."\n\n`;

  // Launch Folders
  if (workspace.folders.length > 0) {
    script += `# 📂 --- Launching Folders ---\n`;
    workspace.folders.forEach((folder) => {
      // Standardize Unix paths or Windows paths if converted
      let folderPath = folder.path.replace(/\\/g, '/');
      if (folderPath.match(/^[a-zA-Z]:/)) {
        // Mock translate drive letter for desktop demo
        folderPath = '/Users/Shared' + folderPath.substring(2);
      }
      script += `echo "  -> Opening Folder: ${folder.name} (${folderPath})"\n`;
      script += `open "${folderPath}"\n`;
    });
    script += `\n`;
  }

  // Launch Websites
  if (workspace.websites.length > 0) {
    script += `# 🌐 --- Launching Websites ---\n`;
    workspace.websites.forEach((site) => {
      script += `echo "  -> Opening URL: ${site.name} (${site.url})"\n`;
      script += `open "${site.url}"\n`;
    });
    script += `\n`;
  }

  // Launch Applications
  if (workspace.applications.length > 0) {
    script += `# 💻 --- Launching Applications ---\n`;
    workspace.applications.forEach((app) => {
      // macOS uses open -a or raw bundle paths.
      // E.g. open -a "Visual Studio Code"
      let searchName = app.name;
      if (
        searchName.toLowerCase().includes('vs code') ||
        searchName.toLowerCase().includes('vscode')
      ) {
        searchName = 'Visual Studio Code';
      } else if (searchName.toLowerCase().includes('photoshop')) {
        searchName = 'Adobe Photoshop 2024';
      }
      script += `echo "  -> Running App: ${app.name}"\n`;
      script += `open -a "${searchName}" 2>/dev/null || open "${app.path.replace(/\\/g, '/')}" 2>/dev/null || echo "    ⚠️ Could not open ${app.name}"\n`;
    });
    script += `\n`;
  }

  script += `echo "🟢 Workspace loaded successfully."\n`;
  script += `sleep 3\n`;

  return script;
}

export function generateLinuxScript(workspace: Workspace): string {
  let script = `#!/bin/bash\n`;
  script += `# ==========================================================\n`;
  script += `# WORKSPACE LAUNCHER AUTOMATION SCRIPT FOR LINUX\n`;
  script += `# Workspace: ${workspace.name}\n`;
  script += `# ==========================================================\n\n`;

  script += `echo "🚀 Initiating Workspace: ${workspace.name}..."\n\n`;

  // Launch Folders
  if (workspace.folders.length > 0) {
    script += `# 📂 Open Folders with xdg-open\n`;
    workspace.folders.forEach((folder) => {
      let folderPath = folder.path.replace(/\\/g, '/');
      script += `echo "  -> Open folder: ${folder.name}"\n`;
      script += `xdg-open "${folderPath}" &\n`;
    });
    script += `\n`;
  }

  // Launch Websites
  if (workspace.websites.length > 0) {
    script += `# 🌐 Open Websites with default browser\n`;
    workspace.websites.forEach((site) => {
      script += `echo "  -> Open url: ${site.name}"\n`;
      script += `xdg-open "${site.url}" &\n`;
    });
    script += `\n`;
  }

  // Launch Applications
  if (workspace.applications.length > 0) {
    script += `# 💻 Launch Applications\n`;
    workspace.applications.forEach((app) => {
      const appCommand = app.name.toLowerCase().replace(/\s+/g, '-');
      script += `echo "  -> Running binary: ${app.name}"\n`;
      script += `(${appCommand} &) 2>/dev/null || xdg-open "${app.path.replace(/\\/g, '/')}" & 2>/dev/null || echo "    ⚠️ Launch failed" \n`;
    });
    script += `\n`;
  }

  script += `echo "🟢 Restoration complete!"\n`;
  script += `sleep 2\n`;

  return script;
}

export function downloadScript(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
