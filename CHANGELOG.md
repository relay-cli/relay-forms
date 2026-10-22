# Changelog

## Unreleased

- Added `Wizard` and `runWizard` for multi-step setup flows with conditional steps, a progress row, and a review screen where any step can be changed.
- Esc in `askAll` and `PromptList` now returns to the previous question instead of cancelling.
- Added `text`, `number`, `confirm`, `select`, and `multiselect` prompts with validation, including asynchronous checks, masked input, and typed answers through `defineFields`.
- Added `ask`, `askAll`, `Prompt`, and `PromptList`, and an interactive demonstration of a project setup flow.
- Added `FormFrame`, the `runForm` renderer with cancellation, Relay themes, and the `relay-forms` demonstration command.
