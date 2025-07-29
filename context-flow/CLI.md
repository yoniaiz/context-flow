Product Requirements Document: The Context CLI
Author: Gemini
Version: 1.0
Date: July 29, 2025
Status: Draft

1. Introduction
1.1. Document Purpose
This document outlines the product requirements for the Command Line Interface (CLI) of the Context Engineering Framework. It details the features, commands, user flows, and technical specifications necessary for development. The CLI, context-cli, is the primary interface for developers and automation, designed for speed, scriptability, and extensibility.

1.2. Product Vision
The Context CLI aims to be the foundational tool for AI Power Users and Platform Engineers. It will empower them to programmatically define, version, compose, and execute high-fidelity context configurations. By treating context "recipes" as first-class, executable artifacts, the CLI will bring rigor and reusability to the discipline of prompt engineering, enabling developers to pipe precisely assembled context into any LLM-powered tool or workflow.

1.3. Target Audience & Personas
The AI Power User: This developer lives in the terminal. They value speed, efficiency, and the ability to script and automate workflows. They will use the CLI to rapidly iterate on context definitions and integrate them into their existing development toolchains (e.g., piping context to jq, llm, or custom scripts).

The Platform Engineer: This developer is responsible for creating robust, reusable, and version-controlled tools for their organization. They will use the CLI to build standardized context "components" and manage a library of internal providers, ensuring consistency and quality across teams.

2. Core Principles & Requirements
2.1. Guiding Principles
Speed is a Feature: Interactions must be near-instantaneous. Slow commands break a developer's flow state. Performance is a top priority.

Convention over Configuration: The CLI should work out of the box with sensible defaults, while still allowing for deep customization.

Extensibility is Paramount: The plugin architecture is not an afterthought; it is the core of the CLI's design, enabling a vibrant ecosystem of providers.

Developer Experience (DX) is the Product: From the clarity of error messages to the ease of installation, every detail must be crafted to make the developer's life easier.

2.2. Functional Requirements
The CLI must be able to initialize a new Context Engineering project structure.

The CLI must parse .toml configuration files (component.toml, workflow.toml).

The CLI must be able to resolve and execute built-in and third-party context providers.

The CLI must assemble the final context payload and output it to stdout.

The CLI must provide a mechanism to add, update, and manage component libraries from Git repositories.

The CLI must provide a mechanism to install, uninstall, and list third-party provider plugins from npm.

2.3. Non-Functional Requirements
Performance: CLI startup time must be minimized by bundling the application into a single executable file.

Usability: Command names and flags must be intuitive and consistent. Help text (--help) must be comprehensive and clear for every command.

Error Handling: Error messages must be actionable, following the "Context, Error, Mitigation" pattern.

Platform Support: The CLI must be cross-platform, supporting macOS, Windows (WSL), and Linux.

3. CLI Command Specification
The primary executable for the CLI will be context.

3.1. context init
Initializes a new context-aware project in the current directory.

Description: This command sets up the necessary directory structure and configuration files for a new project. It's the first step a user takes.

Actions:

Creates a .context/ directory.

Creates a default workflow.toml file in the root directory.

Creates a components/ directory for user-owned components.

If a .vscode/ directory exists, it updates (or creates) .vscode/settings.json to associate the framework's JSON Schema with *.toml files, enabling IDE autocompletion.

Flags:

--yes or -y: Skip interactive prompts and use default values.

User Flow:

$ mkdir my-new-ai-project && cd my-new-ai-project
$ context init
✔ Initialized context project.
Created .context/
Created components/
Created workflow.toml

3.2. context add <github-url>
Adds a new component library from a Git repository.

Description: Clones a remote repository containing a library of component.toml files into the local project for later use.

Arguments:

github-url: The URL of the Git repository (e.g., github:user/repo-name).

Actions:

Clones the specified repository into .context/libs/<repo-name>.

User Flow:

$ context add github:context-js/official-components
✔ Cloning library...
✔ Added 'official-components' from github:context-js/official-components.

3.3. context pull <component-name>
Copies ("vendors") a component from a library into the local project for modification.

Description: This allows a user to take a component from a downloaded library and make it their own, enabling them to edit and version it directly within their project's source control.

Arguments:

component-name: The name of the component to pull (e.g., RunProjectTests).

Flags:

--lib <library-name>: (Optional) Specify the library to pull from if the component name is ambiguous.

Actions:

Searches all libraries in .context/libs/ for the specified component.

Copies the corresponding component.toml file into the local components/ directory.

User Flow:

$ context pull RepoMap
✔ Pulled 'RepoMap' into your local components/ directory.
You can now edit components/repo-map.component.toml and version it with your project.

3.4. context build
Builds the final context payload and prints it to standard output.

Description: This is the core command of the CLI. It reads a workflow.toml file, resolves all components and providers, assembles the context, and outputs the final string. This allows for easy piping to other tools.

Arguments:

[workflow-file]: (Optional) The path to the workflow file. Defaults to workflow.toml in the current directory.

Flags:

--output <file-path> or -o <file-path>: Write the output to a file instead of stdout.

--watch or -w: Watch for changes in the workflow and component files and rebuild automatically.

User Flow:

# Build and print to console
$ context build

# Pipe the output to another CLI tool
$ context build | llm -s "Refactor this code"

# Build a specific workflow and save to a file
$ context build ./testing.workflow.toml -o context.txt

3.5. context serve
Starts a local development server for the Visual Context Builder.

Description: Launches the Core Engine in a server mode, providing a local API that the Tauri-based Visual Builder can communicate with. This command is typically run in the background during a visual editing session.

Actions:

Starts a local web server.

Uses a fast transpiler (SWC) to prioritize speed and hot-reloading.

Watches the filesystem for changes to .toml files and pushes updates to the connected Visual Builder.

Flags:

--port <port-number>: Specify the port to run the server on. Defaults to a pre-configured port (e.g., 4242).

3.6. context plugin:install <npm-package>
Installs a new Context Provider plugin.

Description: Leverages the oclif plugin system to install a third-party provider from the npm registry.

Arguments:

npm-package: The name of the npm package for the plugin (e.g., @context-providers/jira).

Actions:

Uses npm or yarn to install the package into the oclif plugin directory.

Makes the new provider (e.g., @jira) available for use in .toml files.

User Flow:

$ context plugin:install @context-providers/github
✔ Installing plugin...
✔ Successfully installed '@context-providers/github'.
Provider '@github' is now available.

3.7. context plugin:uninstall <npm-package>
Uninstalls a Context Provider plugin.

Description: Removes a previously installed plugin.

Arguments:

npm-package: The name of the npm package to uninstall.

3.8. context plugin:list
Lists all installed Context Provider plugins.

Description: Shows the user which custom providers they have installed.

4. User Flows
4.1. Flow 1: Initializing a Project and Building a Basic Context
User creates a new project directory: mkdir my-app && cd my-app

User initializes the project: context init

User opens the generated workflow.toml and adds a simple provider call, like @file(./README.md).

User builds the context to see the result: context build

The CLI prints the content of README.md to the console.

4.2. Flow 2: Using a Community Component
User has an initialized project.

User discovers a useful component library for analyzing git history. They add it: context add github:community/git-components

User wants to use the GitDiff component from the library. They edit their workflow.toml to reference it.

User decides they need to customize the GitDiff component. They "eject" it into their local project: context pull GitDiff

User can now edit components/git-diff.component.toml directly.

User runs context build to see the output from their customized local component.

4.3. Flow 3: Extending Functionality with a Plugin
A Platform Engineer wants to pull context from their company's internal issue tracker.

They find (or build) a provider plugin: @acme/context-provider-issues.

They install it into their project: context plugin:install @acme/context-provider-issues

They can now use the @issue(TICKET-123) provider in any of their .toml files.

They build a reusable component, components/issue-details.component.toml, that uses this new provider to format the issue context.

They commit this component to their team's shared component library.

5. Error Handling & DX
5.1. Error Message Philosophy
All errors presented to the user must follow the "Context, Error, Mitigation" pattern. They must be color-coded for readability and provide clear, actionable steps for resolution.

Example:

Error: Failed to build workflow 'main.workflow.toml'.

[Context]
While processing component 'RunProjectTests' defined in './components/run-project-tests.component.toml'.

[Error]
Missing required input: 'framework'.

[Fix]
The 'RunProjectTests' component requires you to specify which testing framework is being used.
Please provide a value for the 'framework' input in 'main.workflow.toml':

  14 |   uses: ./components/run-project-tests.component.toml
  15 |   with:
  16 |     framework = "jest"  <-- Add this line

5.2. IDE Integration (MVP)
The context init command will provide immediate, high-value IDE support by configuring settings.json for VS Code. This provides a rich editing experience with zero extra effort from the user.

File: .vscode/settings.json

{
  "files.associations": {
    "*.toml": "toml"
  },
  "toml.schemas": {
    "https://schemas.context.dev/component.v1.json": "**/components/*.toml",
    "https://schemas.context.dev/workflow.v1.json": "*.workflow.toml"
  }
}
