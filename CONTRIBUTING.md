# Contributing to Harness Coding Protocol

Thank you for your interest in contributing to Harness Coding Protocol! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Assume good intentions

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:
1. Check the issue tracker for existing reports
2. Verify the bug exists in the latest version
3. Collect relevant information (OS, Node version, error messages)

When filing a bug report, include:
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Relevant logs or screenshots

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:
1. Check existing issues and discussions first
2. Provide clear use cases and rationale
3. Consider implementation complexity
4. Be open to feedback and discussion

### Contributing Code

We welcome code contributions! Areas where help is especially appreciated:

- **Detection patterns**: Add support for new frameworks and tools
- **Generators**: Improve configuration generation logic
- **Tests**: Increase test coverage
- **Documentation**: Improve clarity and add examples
- **Bug fixes**: Address open issues

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git
- TypeScript knowledge

### Initial Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/harness-coding-protocol.git
cd harness-coding-protocol

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/harness-coding-protocol.git

# 4. Install dependencies
npm install

# 5. Build the project
npm run build

# 6. Run tests
npm test

# 7. Verify everything works
npm run typecheck
npm run validate -- .
```
