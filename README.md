<p align="center">
  <img src="https://raw.githubusercontent.com/DzarelDeveloper/BloggerImg/refs/heads/main/shift.png" alt="Shift — Restore your workflow in seconds" width="100%">
</p>

<h1 align="center">Shift</h1>

<p align="center">
  <b>Restore your entire workflow in seconds, not minutes.</b><br>
  A cross-platform workspace launcher built for developers, designers, and power users.
</p>

<p align="center">
  <a href="https://github.com/DzarelDeveloper/Shift/releases/latest">
    <img src="https://img.shields.io/github/v/release/DzarelDeveloper/Shift?style=for-the-badge&logo=github&label=Latest%20Release&color=6366f1" alt="Latest Release">
  </a>
  <a href="https://github.com/DzarelDeveloper/Shift/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="MIT License">
  </a>
  <a href="https://github.com/DzarelDeveloper/Shift/actions/workflows/release.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/DzarelDeveloper/Shift/release.yml?style=for-the-badge&logo=githubactions&logoColor=white&label=CI%2FCD" alt="Build Status">
  </a>
  <br>
  <img src="https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-3b82f6?style=for-the-badge&logo=linux&logoColor=white" alt="Platform Support">
  <img src="https://img.shields.io/badge/Built%20with-Tauri%20%26%20React-f97316?style=for-the-badge&logo=tauri&logoColor=white" alt="Built with Tauri & React">
</p>

---

## What is Shift?

**Shift** is a native, lightweight workspace launcher that lets you define collections of apps, websites, and folders — and launch them all at once with a single keyboard shortcut.

Instead of manually reopening every tool after a reboot, meeting, or context switch, Shift restores your full environment in seconds. It lives quietly in your system tray, consuming less than 15 MB of RAM, ready whenever you need it.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🚀 **One-Click Workspace Launch** | Open a full set of apps, browser tabs, and folders simultaneously |
| ⌨️ **Dual Global Shortcuts** | Summon the quick Launcher (`Ctrl+Shift+Space`) or focus the full Dashboard (`Ctrl+Alt+Enter`) from anywhere |
| 🔍 **Raycast-Style Command Bar** | A sleek, floating command palette appears above all windows — no context switching needed |
| 🎯 **Zero-Lag Tray Daemon** | Runs in the background at <15 MB RAM — minimizes to tray on close |
| 🖥️ **Native OS Integration** | Auto-detects installed apps (`.desktop` on Linux, Start Menu on Windows, `/Applications` on macOS) |
| 🧙 **First-Run Setup Wizard** | Step-by-step onboarding for a perfect first experience |
| 🎨 **Theme Engine** | Choose between Light, Dark, or System mode with a custom accent color |
| 📤 **Import / Export** | Backup and share your workspace profiles via `.shift` files |
| 🔄 **Over-The-Air Updates** | Get notified and update the app from within the UI via `tauri-plugin-updater` |
| 🔒 **Single-Instance Guard** | Prevents duplicate windows; re-focuses the existing window if launched twice |

---

## 🎬 How It Works

```
Define  ──►  Configure  ──►  Launch  ──►  Background
  │               │             │              │
  │          Set a global    One click     Minimizes to
  │          shortcut key    or shortcut   system tray
  │                                        <15 MB RAM
  └── Apps, URLs, Folders grouped into one Workspace
```

1. **Create a Workspace** — group the apps, URLs, and folders that belong to a specific context (e.g., "Work", "Side Project", "Gaming").
2. **Set Your Shortcuts** — configure global hotkeys for both the Launcher and Dashboard independently.
3. **Launch Instantly** — press your shortcut from anywhere; Shift opens everything in the right order.
4. **Stay in the Tray** — close the window and Shift keeps running silently, always ready.

---

## 📦 Installation

### 🐧 Linux / 🍎 macOS — Quick Install (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/install.sh | bash
```

#### Update
```bash
curl -fsSL https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/update.sh | bash
```

#### Uninstall
```bash
curl -fsSL https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/uninstall.sh | bash
```

---

### 🪟 Windows — Quick Install (Recommended)

Open **PowerShell as Administrator** and run:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
Invoke-Expression (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/install.ps1" -UseBasicParsing).Content
```

> **Troubleshooting:** If you see `'git' is not recognized`, Git is not installed. Run the following, then re-open PowerShell and try again:
> ```powershell
> winget install --id Git.Git -e --source winget
> ```

#### Update
```powershell
Invoke-Expression (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/update.ps1" -UseBasicParsing).Content
```

#### Uninstall
```powershell
Invoke-Expression (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/DzarelDeveloper/Shift/main/uninstall.ps1" -UseBasicParsing).Content
```

---

### 📥 Manual Download

Download the latest pre-built binary directly from the **[Releases Page](https://github.com/DzarelDeveloper/Shift/releases/latest)**.

| Platform | Format | Notes |
|----------|--------|-------|
| 🐧 Linux | `.AppImage` | Universal — run directly, no install needed |
| 🐧 Linux | `.deb` | For Debian / Ubuntu |
| 🐧 Linux | `.rpm` | For Fedora / RHEL |
| 🪟 Windows | `.exe` (NSIS installer) | Recommended for most users |
| 🍎 macOS | `.dmg` | Universal binary (Intel + Apple Silicon) |

---

## 🛠️ Development

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Rust](https://rustup.rs/) (stable toolchain)
- [Tauri v2 prerequisites](https://tauri.app/start/prerequisites/) for your platform

### Local Setup

```bash
# Clone the repository
git clone https://github.com/DzarelDeveloper/Shift.git
cd Shift

# Install frontend dependencies
npm install

# Start in dev mode (hot-reload for both frontend & backend)
npm run tauri:dev
```

### Build for Production

```bash
npm run tauri:build
```

Output bundles are placed in `src-tauri/target/release/bundle/`.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| UI Styling | Vanilla CSS + Tailwind CSS v4 |
| Animations | Motion (Framer Motion) |
| Backend | Rust + Tauri v2 |
| Native APIs | `tauri-plugin-global-shortcut`, `tauri-plugin-updater`, `tauri-plugin-fs`, `tauri-plugin-autostart` |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m 'feat: add my feature'`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request against `main`

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines, and [DEVELOPMENT.md](DEVELOPMENT.md) for architecture details.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

## 👤 Author

**Muhamad Dzarel Alghifari**
- GitHub: [@DzarelDeveloper](https://github.com/DzarelDeveloper)

---

## 🔗 Links

- [🏠 Releases](https://github.com/DzarelDeveloper/Shift/releases)
- [🐛 Issue Tracker](https://github.com/DzarelDeveloper/Shift/issues)
- [📖 Development Guide](https://github.com/DzarelDeveloper/Shift/blob/main/DEVELOPMENT.md)
- [🤝 Contributing Guide](https://github.com/DzarelDeveloper/Shift/blob/main/CONTRIBUTING.md)
- [🔀 Pull Requests](https://github.com/DzarelDeveloper/Shift/pulls)

---

<p align="center">
  Made with ❤️ using <b>React</b> & <b>Tauri</b>
</p>
