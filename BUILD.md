The Build Process: How context build Works
The context build command is the engine that transforms your structured TOML files into a final, usable context payload for a specific AI tool. The --target flag is the key that tells the engine how to perform the final assembly.

Let's walk through the command: context build workflows/my-daily-review.workflow.toml --target cursor

The Rendering & Composition Pipeline
The process happens in a few distinct steps:

Parse the Entrypoint: The CLI first reads and validates the specified workflow file (my-daily-review.workflow.toml) using the Zod schema.

Resolve the Dependency Tree: The engine looks at the [use] block and recursively loads all referenced components (CodeReview). It continues this process until all dependent components (Instruction, Checklist) are loaded and parsed. This creates a complete dependency tree for the build.

Recursive Bottom-Up Rendering: The template engine (e.g., Jinja2/Nunjucks) renders the content from the inside out.

In our example, the CodeReview template calls use.Instruction(...) and use.Checklist(...).

The engine first renders the Instruction component's template using the props provided (text, priority). The result is a simple string: "Please perform a thorough code review on the following files. (IMPORTANT)".

It does the same for the Checklist component.

These rendered strings are then substituted back into the CodeReview template, which is then rendered to produce the final, complete text block.

Target Configuration Resolution: The engine now determines the platform-specific configuration. It traverses the dependency tree to find [targets] blocks that match the --target flag (in this case, cursor).

In your example, the code-review.component.toml contains a [targets.cursor] block.

The engine extracts this configuration: always_apply = true and command = "On 'Edit'".

Rule of Precedence: If multiple components in the tree had a [targets.cursor] block, the settings from the highest-level component in the call chain (in this case, CodeReview as called by the workflow) would take precedence. This ensures that the final configuration aligns with the primary goal of the workflow.

Final Assembly for the Target: This is the last step where the rendered content and the target configuration are combined.

For --target cursor: The build command knows how Cursor expects its rules. It will use the resolved configuration and the rendered content to generate a platform-specific artifact. The conceptual output would look like this (e.g., as a JSON object ready for Cursor):

JSON

{
  "ruleName": "Daily PR Review", // from workflow.name
  "always_apply": true,         // from targets.cursor.always_apply
  "command": "On 'Edit'",       // from targets.cursor.command
  "context": [
    {
      "type": "prompt",
      "content": "Please perform a thorough code review on the following files. (IMPORTANT)\n\n**Files for Review:**\n- `src/core/engine.ts`\n- `src/utils/parser.ts`\n\n**Main Focus Areas**\n- [ ] clarity\n- [ ] error-handling\n- [ ] maintainability\n" // The fully rendered template content
    }
  ]
}
For --target generic (or an undeclared target): If you ran the build with a target that isn't defined in any of the component [targets] blocks (e.g., --target aider), the framework follows a default behavior: it simply outputs the raw, fully rendered text content from Step 3. This makes the framework universally useful, as the output can be piped directly into any CLI-based LLM tool.

Shell

$ context build workflows/my-daily-review.workflow.toml --target aider

# --- Output ---
Please perform a thorough code review on the following files. (IMPORTANT)

**Files for Review:**
- `src/core/engine.ts`
- `src/utils/parser.ts`

**Main Focus Areas**
- [ ] clarity
- [ ] error-handling
- [ ] maintainability