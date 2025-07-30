# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Context Flow** is a CLI framework for "Context Engineering" - composing and managing AI prompt context through reusable components. It's built with TypeScript and oclif, designed to help developers create, version, and share context definitions for AI tools.

The project implements a component-based system where:
- **Components** (`component.toml`) are reusable context building blocks
- **Workflows** (`workflow.toml`) compose components into complete context payloads
- **Providers** (plugins) source data from various systems (@file, @git-diff, etc.)

## Commands

### Development Commands
- `npm run build` - Compile TypeScript to dist/ directory
- `npm run test` - Run Mocha tests
- `npm run lint` - Run ESLint
- `npm run posttest` - Automatically runs lint after tests

### CLI Commands (when built)
- `context init` - Initialize new context project
- `context add <github-url>` - Add component library from Git
- `context pull <component-name>` - Copy component to local project
- `context build [workflow-file]` - Build context payload
- `context serve` - Start development server for Visual Builder
- `context plugin:install <package>` - Install provider plugin
- `context plugin:list` - List installed plugins
- `context plugin:uninstall <package>` - Remove provider plugin

## Architecture

### Core Structure
- `src/index.ts` - Main entry point (exports oclif run)
- `src/commands/` - CLI command implementations
- `bin/run.js` - Executable entry point
- `dist/` - Compiled JavaScript output

### Key Commands Implementation
- **Init** (`src/commands/init.ts`) - Creates project structure (.context/, components/, workflow.toml)
- **Build** (`src/commands/build.ts`) - Processes TOML files and assembles context
- **Add** (`src/commands/add.ts`) - Clones component libraries from Git
- **Plugin commands** (`src/commands/plugin/`) - Manage oclif-based provider plugins

### Configuration Files
- Uses **TOML** format for component/workflow definitions
- **oclif** framework for CLI with plugin architecture
- **ESLint** with oclif config for code quality
- **Mocha + Chai** for testing
- **TypeScript** with Node16 modules and ES2022 target

## Development Notes

### Project Status
- Early development phase - most command functionality is stubbed out with TODO comments
- README.md contains placeholder oclif documentation that doesn't match actual commands
- Core architecture is established but implementation is minimal

### Key Design Patterns
- **Component Composition**: Small, single-purpose components that compose into workflows
- **Plugin Architecture**: oclif-based extensibility for context providers
- **Git-native Distribution**: Components shared via Git, not npm
- **TOML Configuration**: Human-readable config format over YAML/JSON

### Technical Decisions
- **oclif Framework**: Chosen for robust plugin system and CLI best practices
- **TypeScript**: Balance of developer experience and performance
- **ES Modules**: Modern module system (type: "module" in package.json)
- **Node 18+**: Minimum supported version

The project aims to create a "React-like component ecosystem for context" with a focus on developer experience, extensibility, and reusability.

### Workflow

1. When you are pointed to complete task in TASK.md file, you should get the context what the general task is based on which is pointed in the **Based on**: section, and once you complete the task you should mark it as complete with [✅] in the task.md file.

2. You always should do only one task at a time, and always plan and consult with me before you start the task.

3. Always and the task with unit tests, and make sure that all tests are passing.

4. Always and the task with documentation, and make sure that the documentation is up to date.

5. Always and with a summary of the complete task, add it under task-summaries folder
