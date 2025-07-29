The Unified TOML Schema
We will define two primary file types:

Component (*.component.toml): A reusable, configurable unit of context, analogous to a React component.

Workflow (*.workflow.toml): An entrypoint that composes one or more components to achieve a final result. This is what you actually "build."

Here is the detailed structure for a Component file:

1. [component] - Metadata
This block contains essential information identifying the component.

name: A unique, PascalCase identifier.

description: A brief, one-sentence explanation.

version: A semantic version number (e.g., "1.0.0") for good practice.

Ini, TOML

[component]
name = "Instruction"
description = "A simple, reusable instruction."
version = "1.0.0"
2. [props] - Inputs
This defines the component's API. Each key represents a prop that can be passed to the component.

type: The data type ("string", "number", "boolean", "array").

description: A detailed explanation for documentation and IDE hover tips.

required: A boolean indicating if the prop must be provided.

default: A default value to use if the prop is not provided.

Ini, TOML

[props]
# Defines a 'text' prop that is a required string.
[props.text]
  type = "string"
  description = "The instruction text to display."
  required = true

# Defines an optional 'priority' prop with a default value.
[props.priority]
  type = "string"
  description = "The priority of the instruction ('normal' or 'high')."
  required = false
  default = "normal"
3. [use] - Composition
This is how components are imported for composition, just like import in JavaScript. It maps a local name to the path of another component file.

Ini, TOML

[use]
# Maps the local name 'Instruction' to the component file.
# We can now call this component via `use.Instruction(...)` in the template.
Instruction = "./base/instruction.component.toml"
Checklist = "./base/checklist.component.toml"
4. [template] - Agnostic Logic
This is the core, platform-agnostic logic of the component. The content is a Jinja2/Nunjucks-style template string that has access to props and use.

Ini, TOML

[template]
content = """
{{ props.text }}
{% if props.priority == "high" %}
(This is a high-priority instruction!)
{% endif %}
"""
5. [targets] - Platform-Specific Mapping 🎯
This is the crucial addition. This block allows us to embed platform-specific configurations within our agnostic component. The build engine (context build --target cursor) will use this block to translate the component into a platform's native feature.

Ini, TOML

# Contains all platform-specific configurations.
[targets]

  # Configuration for the 'cursor' build target.
  [targets.cursor]
    # This component should map to a Cursor Rule.
    # These keys directly correspond to Cursor's Rule settings.
    always_apply = false
    auto_include = true
    command = "On 'Generate'" # e.g., "On 'Edit'", "On 'Chat'"

  # Configuration for the 'claude' build target.
  [targets.claude]
    # Claude doesn't have "rules", but we might specify API details.
    model = "claude-3-5-sonnet-20240620"
    temperature = 0.5
If a target is not listed (e.g., aider), the build engine will simply use the rendered [template] content as the context.

Complete Examples
Primitive Component: instruction.component.toml
Ini, TOML

# components/base/instruction.component.toml

[component]
name = "Instruction"
description = "A simple, reusable instruction."
version = "1.0.0"

[props.text]
  type = "string"
  description = "The instruction text to display."
  required = true

[props.priority]
  type = "string"
  description = "The priority of the instruction ('normal' or 'high')."
  required = false
  default = "normal"

[template]
content = """
{{- props.text -}}
{% if props.priority == "high" %} (IMPORTANT){% endif %}
"""

[targets]
  [targets.cursor]
    # Hint to Cursor that simple instructions should often be auto-included.
    auto_include = true
Composite Component: code-review.component.toml
This component composes the Instruction and Checklist components.

Ini, TOML

# components/code-review.component.toml

[component]
name = "CodeReview"
description = "Generates a comprehensive context for performing a code review."
version = "1.0.0"

[props.files]
  type = "array"
  description = "An array of file paths to be reviewed."
  required = true

[props.focus]
  type = "array"
  description = "A list of areas to focus on during the review."
  required = false
  default = ["quality", "security", "performance"]

# Import the primitive components needed for composition.
[use]
Instruction = "./base/instruction.component.toml"
Checklist = "./base/checklist.component.toml"

# The template calls the imported components like functions.
[template]
content = """
{{ use.Instruction({
  text: "Please perform a thorough code review on the following files.",
  priority: "high"
}) }}

**Files for Review:**
{% for file in props.files -%}
- `{{ file }}`
{% endfor %}

{{ use.Checklist({
  title: "Main Focus Areas",
  items: props.focus
}) }}
"""

# Define the platform-specific settings for THIS composite component.
[targets]
  [targets.cursor]
    # We want this entire code review context to apply automatically on edits.
    always_apply = true
    command = "On 'Edit'"
Workflow File: my-daily-review.workflow.toml
This is the final, executable file. It has no [component] or [props] block because it's the top-level entrypoint.

Ini, TOML

# workflows/my-daily-review.workflow.toml

[workflow]
name = "Daily PR Review"
description = "The context I use every day for my pull request reviews."

# Import the top-level component you want to use.
[use]
CodeReview = "../components/code-review.component.toml"

# The template calls the component with concrete props.
# This is where the final values are provided.
[template]
content = """
{{ use.CodeReview({
  files: [
    "src/core/engine.ts",
    "src/utils/parser.ts"
  ],
  focus: [
    "clarity",
    "error-handling",
    "maintainability"
  ]
}) }}
"""
When you run context build my-daily-review.workflow.toml --target cursor, the engine will render this entire workflow and then wrap it in a Cursor Rule using the always_apply = true and command = "On 'Edit'" settings from the code-review component.