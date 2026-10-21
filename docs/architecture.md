# Architecture

Relay Forms renders setup flows inline, below the command that started them, instead of taking over the screen.

1. `runForm` renders a form at the cursor and resolves with the value it submits. Ctrl+C and SIGTERM cancel the form, and `runForm` rejects with `FormCancelledError`.
2. `FormFrame` draws the title, a ruled body, and a footer for key hints.

Each part is a plain Ink component, so a form can also be rendered inside a larger Ink application.
