# Architecture

Relay Forms renders setup flows inline, below the command that started them, instead of taking over the screen.

1. `runForm` renders a form at the cursor and resolves with the value it submits. Ctrl+C and SIGTERM cancel the form, and `runForm` rejects with `FormCancelledError`.
2. `FormFrame` draws the title, a ruled body, and a footer for key hints.
3. A field describes one question. `Prompt` reads keys for it, validates the answer, and then collapses to a single answered line. `PromptList` asks fields in order. `ask` and `askAll` wrap both in `runForm`. See [prompts](./prompts.md).
4. `Wizard` groups fields into steps, decides which steps apply from the answers so far, and ends with a review screen. `runWizard` wraps it in `runForm`. See [wizards](./wizard.md).
5. `ConfigEditor` lists settings described by fields over a configuration document, edits one at a time with `Prompt`, and reports the changes on save. `editConfig` loads and saves a JSON file around it. See [the configuration editor](./config-editor.md).

The editing rules for text and lists are plain functions (`editText`, and the helpers in `src/prompts/choices.ts`), so they are tested without rendering. Each component is a plain Ink component, so a form can also be rendered inside a larger Ink application.
