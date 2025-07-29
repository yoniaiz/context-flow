# Context Flow Examples

This directory contains example component and workflow files demonstrating the Context Flow framework.

## Structure

```
context/
├── components/
│   ├── base/                    # Primitive, reusable components
│   │   ├── instruction.component.toml
│   │   ├── checklist.component.toml
│   │   ├── file-lister.component.toml
│   │   └── code-block.component.toml
│   └── code-review.component.toml  # Composite component
└── workflows/                   # Executable workflow files
    ├── daily-review.workflow.toml
    └── bug-investigation.workflow.toml
```

## Key Examples

### Base Components
- **instruction.component.toml**: Simple text instructions with priority levels
- **checklist.component.toml**: Formatted task lists with multiple styles
- **file-lister.component.toml**: Organized file path displays

### Composite Component
- **code-review.component.toml**: Combines multiple base components for code reviews

### Workflows
- **daily-review.workflow.toml**: Uses the CodeReview component with specific files and settings
- **bug-investigation.workflow.toml**: Composes base components for debugging workflows

## Usage

Build a workflow for your target platform:

```bash
context build workflows/daily-review.workflow.toml --target cursor
context build workflows/bug-investigation.workflow.toml --target claude
```

These examples demonstrate:
- Single responsibility components
- Composition over monolithic files
- Platform-agnostic templates
- Target-specific configurations
