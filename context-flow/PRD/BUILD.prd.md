Product Requirements Document: The context build Command
Author: Gemini
Version: 1.0
Date: July 29, 2025
Status: Draft

1. Introduction
1.1. Document Purpose
This document provides the detailed product and technical requirements for the context-flow build command, a core function of the Context Engineering Framework's CLI. It specifies the command's functionality, arguments, flags, user flows, and error handling logic.

1.2. Command Vision
The context-flow build command is the engine of the framework. It transforms declarative component.toml and workflow.toml files into a single, cohesive, and usable context payload. Its purpose is to be the final, executable step in the context engineering process, enabling developers to reliably assemble and pipe high-fidelity context into any AI tool, script, or integrated development environment.

1.3. User Persona Focus
The AI Power User: Relies on context-flow build for its scriptability. They will pipe its output directly into other CLI tools (llm, jq, etc.) to create powerful, automated, and repeatable AI-driven workflows in the terminal.

The Platform Engineer: Uses context-flow build within CI/CD pipelines to validate context definitions and to programmatically generate context for automated tasks like code generation or documentation updates.

The Application Developer: Interacts with context-flow build indirectly via the --watch flag or through the Visual Builder, which uses the build engine to provide a real-time preview of the composed context.

2. Core Principles & Requirements
2.1. Guiding Principles
Composability: The build process must correctly interpret and render nested component hierarchies, respecting the defined inputs and outputs of each layer.

Universality: The default output must be raw, unstructured text piped to stdout. This ensures out-of-the-box compatibility with any command-line tool without requiring special configuration.

Target-Awareness: The command must be able to generate structured, platform-specific output when a target (e.g., cursor) is specified, making it deeply integrated with the user's toolchain.

Determinism & Correctness: For a given set of input files and a specific version of the framework, the build output must be identical every time. The process will be validated by the TypeScript compiler to ensure type safety.

2.2. Functional Requirements
The context-flow build command must:

Parse a specified workflow.toml file or default to workflow.toml in the current working directory. This is the entrypoint to the build process.

Validate all parsed TOML files against their respective Zod schemas.

Recursively resolve the full dependency tree of components specified in [use] blocks.

Render component templates in a "bottom-up" order, processing the deepest dependencies first.

Identify and execute all @provider calls within templates, substituting the provider's instruction into the template.

@provider calls generate instruction strings that tell the AI tool what actions to perform at runtime, rather than executing those actions during the build process.

Accept a --target <target-name> flag to specify a final output format.

When a target is specified, find and apply the corresponding [targets.<target-name>] configuration from the component tree.

Implement a "highest-level component wins" rule of precedence if multiple components define a configuration for the same target.

Accept an --output <file-path> or -o <file-path> flag to write the final payload to a file instead of stdout.

Accept a --watch or -w flag to monitor all dependent files for changes and trigger a rebuild automatically.

2.3. Non-Functional Requirements
Performance: The build process, while prioritizing correctness with tsc, must be optimized to feel responsive for common project sizes. File I/O and provider execution should be efficient.

Error Handling: All build-time errors must be reported to the user following the "Context, Error, Mitigation" pattern, providing clear, actionable feedback.

Security: Providers that generate instructions for network access (@url) or filesystem access (@file, @folder) must do so with clear user intent. The command should not execute arbitrary code during build time - providers only generate instruction strings.

3. Command Specification
3.1. Synopsis
context build [workflow-file] [flags]

3.2. Description
The build command reads a workflow file, resolves its component dependencies, executes all context providers, and assembles the final context payload. By default, it prints the result to standard output, allowing it to be seamlessly integrated into toolchains.

3.3. Arguments
[workflow-file] (Optional)

Description: The path to the entrypoint workflow file to build.

Default: If not provided, the CLI will look for a workflow.toml file in the current directory.

3.4. Flags (Options)
--target <target-name>

Description: Specifies the target AI tool or platform. The build process will use this to generate a platform-specific output artifact (e.g., a JSON object for Cursor) based on [targets] configurations in the components. If omitted, the output is raw text.

--output <file-path>, -o <file-path>

Description: Writes the build output to the specified file path instead of printing to standard output.

--watch, -w

Description: Enables watch mode. The command will remain active, monitoring the entrypoint workflow and all of its dependent components and files for changes, triggering a rebuild on each change.

4. The Build Pipeline
The context build command executes a multi-step pipeline to transform TOML files into a final context payload.

Parse Entrypoint: The CLI reads and validates the specified workflow file (e.g., my-review.workflow.toml) using the Zod schema for workflows.

Resolve Dependency Tree: The engine inspects the [use] blocks and recursively loads and parses all referenced component.toml files, building a complete dependency graph.

Recursive Bottom-Up Rendering: The engine renders content from the inside out. If Workflow A uses Component B, and Component B uses Component C, the template for C is rendered first. Its output is then made available to B's template, which is then rendered. This process continues up the tree until the root workflow template is rendered. During this step, all @provider functions generate instruction strings that tell the AI tool what actions to perform.

Target Configuration Resolution: The engine inspects the --target flag. It then traverses the dependency tree to find any [targets.<target-name>] blocks. If multiple definitions exist for the same target, the configuration from the component highest in the call chain takes precedence.

Final Assembly: The engine combines the fully rendered content (from Step 3) and the resolved target configuration (from Step 4) to produce the final output.

If a target is matched: It generates a structured artifact (e.g., JSON) as expected by that target.

If no target is specified or matched: It outputs the raw, fully rendered text content to standard output.

5. User Flows & Use Cases
Flow 1: Piping to an LLM Tool
A developer wants to use a pre-defined workflow to refactor a piece of code.

Bash

$ context-flow build workflows/refactor.workflow.toml | llm -s "Apply the following refactor."
Outcome: The context-flow is built and piped directly to the llm tool as a system prompt.

Flow 2: Generating a Targeted Configuration
A developer wants to populate a context rule for their editor, Cursor.

Bash

$ context-flow build workflows/my-daily-review.workflow.toml --target cursor -o .cursor/rules/daily-review.json
Outcome: The CLI generates a daily-review.json file in the format Cursor expects, including the rendered prompt and specific commands like On 'Edit'.

Flow 3: Real-Time Development
A developer is fine-tuning a complex component and wants to see the output instantly as they edit.

Bash

# In Terminal 1
$ context-flow build --watch

# The developer now edits component.toml or workflow.toml files in their editor.
# Terminal 1 automatically rebuilds and shows the updated output on every save.
Outcome: The developer has a tight feedback loop for iterating on context definitions.

6. Error Handling Scenarios
The context-flow build command must handle failures gracefully using the "Context, Error, Mitigation" pattern.

Scenario: Missing Required Input

Context: While processing component RunProjectTests.

Error: Missing required input: framework.

Mitigation: Show the user the exact lines in their workflow.toml where the input needs to be added.

Scenario: Provider Fails

Context: While generating instructions for provider @file in component GetFileContent.

Error: Invalid file path provided: src/non-existent-file.ts.

Mitigation: Instruct the user to check the file path provided to the @file provider in their TOML configuration. Note that the provider generates instructions for the AI tool to read the file, so the path will be validated when the AI tool executes the instruction.

Scenario: Invalid TOML

Context: While parsing file components/broken.component.toml.

Error: Invalid TOML syntax on line 12: unexpected character.

Mitigation: Advise the user to check the syntax in the specified file and line number. Suggest using a TOML linter.