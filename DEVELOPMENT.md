# 🛠️ Shift Development Guide

Want to contribute or build Shift locally? Follow these steps!

**Author/Creator**: [Muhamad Dzarel Alghifari (DzarelDeveloper)](https://github.com/DzarelDeveloper)
---

## Table of Contents
- [Prerequisites](#prerequisites)
  - [Installing Node.js](#installing-nodejs)
  - [Installing Rust](#installing-rust)
  - [Installing Tauri CLI](#installing-tauri-cli)
- [Installation](#installation)
- [Run in Development](#run-in-development)
  - [Web Only (Without Tauri)](#web-only-without-tauri)
  - [Full Tauri Desktop App](#full-tauri-desktop-app)
- [Code Quality](#code-quality)
  - [Type Checking](#type-checking)
  - [Linting](#linting)
  - [Formatting](#formatting)
  - [Testing](#testing)
- [Build for Production](#build-for-production)
  - [Web Build](#web-build)
  - [Tauri App Build](#tauri-app-build)
- [Project Structure](#project-structure)
- [Debugging Tips](#debugging-tips)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites
To develop Shift, you'll need these tools installed:

### Installing Node.js
Required (v18 or later):
- Download from [nodejs.org](https://nodejs.org/)
- Or use a version manager like `nvm` (recommended)
  ```bash
  # For nvm (Linux/macOS)
  nvm install 20
  nvm use 20
  ```

### Installing Rust
Required for building Tauri backend:
- Follow official guide at [rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
- Check installation:
  ```bash
  rustc --version
  cargo --version
  ```

### Installing Tauri CLI
Optional but recommended:
```bash
npm install -g @tauri-apps/cli
# Or with yarn/pnpm
# yarn global add @tauri-apps/cli
# pnpm add -g @tauri-apps/cli
```

---

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DzarelDeveloper/Shift.git
   cd Shift
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   # Or npm install if you want the latest compatible versions
   ```

---

## Run in Development

### Web Only (Without Tauri)
Good for rapid UI development without needing to build the Rust backend:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Full Tauri Desktop App
Runs the full native desktop application:
```bash
npm run tauri:dev
```
This command will:
- Start the Vite dev server for frontend
- Build and run the Rust backend
- Open the native window

---

## Code Quality

### Type Checking
Check for TypeScript errors:
```bash
npm run typecheck
```

### Linting
Check code for linting issues with ESLint:
```bash
npm run lint
```
Auto-fix fixable issues:
```bash
npm run lint:fix
```

### Formatting
Format code with Prettier to ensure consistent style:
```bash
npm run format
```
Check if code is formatted correctly (without modifying files):
```bash
npm run format -- --check
```

### Testing
Run tests in watch mode for development:
```bash
npm run test
```
Run tests once (ideal for CI):
```bash
npm run test:run
```

---

## Build for Production

### Web Build
Build just the frontend web app:
```bash
npm run build
```
Output will be in the `dist/` directory.

### Tauri App Build
Build the full native desktop application for your platform:
```bash
npm run tauri:build
```
Output will be in `src-tauri/target/release/bundle/`.

---

## Project Structure
```
Shift-main/
├── .github/workflows/    # GitHub Actions CI/CD configs
├── src/
│   ├── components/       # React UI Components
│   ├── hooks/            # Custom React Hooks
│   ├── utils/            # Utility Functions & Helpers
│   ├── data/             # Static Data & Default Configs
│   ├── test/             # Test Setup Files
│   ├── types.ts          # TypeScript Type Definitions
│   ├── App.tsx           # Main App Component
│   ├── main.tsx          # Frontend Entry Point
│   └── index.css         # Global Styles
├── src-tauri/            # Tauri Rust Backend
│   ├── src/main.rs       # Rust Main Entry Point
│   ├── Cargo.toml        # Rust Dependencies
│   ├── tauri.conf.json   # Tauri Configuration
│   └── ...
├── .gitignore            # Git ignore rules
├── .prettierrc           # Prettier config
├── eslint.config.js      # ESLint config
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
├── vitest.config.ts      # Vitest config
├── package.json          # NPM scripts & dependencies
├── README.md             # Main project README
├── CONTRIBUTING.md       # Contributing guide
├── DEVELOPMENT.md        # This file! 😄
└── ...
```

---

## Debugging Tips

### Frontend Debugging (Web/Tauri)
- Use browser DevTools (F12) for React component inspection
- For Tauri, right-click and select "Inspect Element"

### Backend Debugging (Rust)
- Use `println!` or `eprintln!` in Rust code (visible in terminal when running `tauri:dev`)
- Check Tauri logs in the terminal

### Tauri Plugin-Log
Logs sent via the Tauri plugin-log will appear both in the terminal and in browser DevTools Console.

---

## Troubleshooting

### npm install fails
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
- Or use `npm install --legacy-peer-deps` if there are peer dependency conflicts

### Tauri build fails
- Make sure all Rust dependencies are installed:
  ```bash
  cd src-tauri
  cargo check
  ```
- Check that system libraries for Tauri are installed (follow [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

---

Thank you for contributing to Shift! 🙌
- Created by [Muhamad Dzarel Alghifari](https://github.com/DzarelDeveloper)

