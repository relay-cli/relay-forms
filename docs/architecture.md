# Architecture

Relay Forms renders setup flows inline, below the command that started them, instead of taking over the screen.

1. `runForm` renders a form at the cursor and resolves with the value it submits. Ctrl+C and SIGTERM cancel the form, and `runForm` rejects with `FormCancelledError`.
2. `FormFrame` draws the title, a ruled body, and a footer for key hints.
3. A field describes one question. `Prompt` reads keys for it, validates the answer, and then collapses to a single answered line. `PromptList` asks fields in order. `ask` and `askAll` wrap both in `runForm`. See [prompts](./prompts.md).

The editing rules for text and lists are plain functions (`editText`, and the helpers in `src/prompts/choices.ts`), so they are tested without rendering. Each component is a plain Ink component, so a form can also be rendered inside a larger Ink application.
