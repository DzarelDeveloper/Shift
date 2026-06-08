# Contributing to Shift

Thank you for considering contributing to Shift! We welcome all contributions that help improve the project.

## How to Contribute

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/<your-username>/Shift.git
   cd Shift
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/<your-feature-name>
   ```
5. **Make your changes** and test them
6. **Check code quality**:
   ```bash
   npm run typecheck
   npm run lint:fix
   npm run format
   npm run test:run
   ```
7. **Commit your changes** with a meaningful message
8. **Push your branch** to your fork
9. **Create a Pull Request**

## Development Setup

### Prerequisites

- Node.js (v18 or later)
- Rust (for Tauri)
- Tauri CLI

### Running Locally

1. **Web mode**:
   ```bash
   npm run dev
   ```
2. **Tauri mode**:
   ```bash
   npm run tauri:dev
   ```

### Scripts

- `npm run dev`: Start Vite dev server (web mode)
- `npm run build`: Build for production
- `npm run tauri:dev`: Start Tauri app in dev mode
- `npm run tauri:build`: Build Tauri app for production
- `npm run typecheck`: Run TypeScript type checking
- `npm run lint`: Run ESLint
- `npm run lint:fix`: Fix ESLint issues
- `npm run format`: Format code with Prettier
- `npm run test`: Run tests in watch mode
- `npm run test:run`: Run tests once

## Code Guidelines

- **Code style**: Follow Prettier and ESLint rules
- **TypeScript**: Use strict type checking, avoid `any`
- **Commits**: Write clear, concise commit messages
- **Tests**: Add tests for new features and bug fixes

## Reporting Issues

When reporting bugs or suggesting features:
- Use a clear, descriptive title
- Describe steps to reproduce
- Include environment info (OS, Shift version)
- For bugs, include error messages
