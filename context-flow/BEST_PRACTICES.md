The Context Engineering Framework is built on the principle of composition. Instead of writing large, monolithic context files, you should create small, reusable, and single-purpose components that you then assemble into a task-specific workflow.

Best Practices for component.toml
A component is a self-contained, reusable piece of context logic. Think of them as functions or UI components.

Embrace Single Responsibility: A component should do one thing well.

Good: A component named Instruction that only formats a piece of instructional text.

Good: A component named FileLister that takes an array of paths and lists them.

Bad: A component that both gives instructions and lists files and provides a checklist. This is better achieved by composing the first two components.

Keep Templates Agnostic: The [template].content block should be generic. It should focus only on structuring the text and logic using its props. Do not put platform-specific instructions (e.g., "This is a Cursor Rule") inside the template. That is the job of the [targets] block.

Define a Clear API with [props]: The [props] section is the public API of your component. Use descriptive names and provide clear description fields. This documentation is automatically used by the IDE extension and Visual Builder to help others understand and use your component.

Compose, Don't Repeat: If you find yourself writing the same template logic in multiple components, extract it into a new, smaller component and import it using the [use] block. Your code-review.component.toml is a perfect example of this, as it composes Instruction and Checklist.

Best Practices for workflow.toml
A workflow is the final, executable entrypoint. It's not meant to be reused by other components. Think of it as the main function in a program.

Be the Entrypoint: A workflow's purpose is to import a top-level component and provide it with concrete values for a specific task.

Provide Concrete Data: This is where the abstract becomes concrete. In your my-daily-review.workflow.toml, you provide the actual file paths and focus areas to the CodeReview component.

Keep Logic Minimal: A workflow's [template].content should be extremely simple, often just a single call to a component defined in its [use] block. All the complex rendering logic should already be encapsulated within the components themselves.

By following this structure, you create a library of robust, reusable context "primitives" that can be easily composed into powerful and highly specific workflows.