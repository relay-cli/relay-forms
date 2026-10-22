# Relay Forms

Relay Forms builds the setup flows of command-line tools: single prompts, multi-step wizards, and editors for configuration files. Forms render in the normal terminal rather than a full screen, so the answers stay in the scrollback after the flow finishes.

## Try the demo

```sh
npm install
npm run demo
```

The demonstration asks the questions of a project setup flow and prints the answers. To print its first screen without waiting for input:

```sh
npx tsx src/cli.tsx --demo --snapshot
```

## Ask questions

`askAll` asks a list of fields in order and resolves with the answers, keyed by field name. Answered questions stay in the terminal as a summary, and Esc returns to the previous question.

```ts
import {FormCancelledError, askAll, defineFields} from '@relay-cli/forms';

const fields = defineFields([
  {kind: 'text', name: 'name', label: 'Project name', required: true},
  {
    kind: 'select',
    name: 'packageManager',
    label: 'Package manager',
    options: [{value: 'npm'}, {value: 'pnpm'}],
  },
  {kind: 'text', name: 'token', label: 'Registry token', mask: true},
  {kind: 'confirm', name: 'git', label: 'Initialize a git repository?', initial: true},
]);

try {
  const answers = await askAll(fields);
  // answers.packageManager is typed as 'npm' | 'pnpm'
} catch (error) {
  if (error instanceof FormCancelledError) process.exitCode = 130;
  else throw error;
}
```

`ask` asks a single field. Fields can be `text`, `number`, `confirm`, `select`, or `multiselect`, and each can validate its answer, including with an asynchronous check. See [the prompt guide](./docs/prompts.md).

## Multi-step wizards

`runWizard` groups fields into steps. Steps can depend on earlier answers, Esc moves back through questions and steps, and a review screen lets the person change any step before the wizard resolves.

```ts
import {runWizard} from '@relay-cli/forms';

const answers = await runWizard(
  [
    {id: 'project', title: 'Project', fields: [nameField, kindField]},
    {id: 'service', title: 'Service', when: (a) => a.kind === 'service', fields: [portField]},
    {id: 'publish', title: 'Publish', fields: [tokenField, gitField]},
  ],
  {title: 'Create a project'},
);
```

Run `npm run demo -- wizard` to try it. See [the wizard guide](./docs/wizard.md).

## Build your own form

`runForm` renders any Ink component where the cursor is and resolves with the value the component submits. Ctrl+C cancels it, and `runForm` then rejects with `FormCancelledError`. `Prompt`, `PromptList`, and `FormFrame` are ordinary components, so they can be combined with your own.

```tsx
import {FormFrame, PromptList, runForm} from '@relay-cli/forms';

const answers = await runForm<Record<string, unknown>>(({submit, cancel}) => (
  <FormFrame title="Deploy">
    <PromptList fields={fields} onSubmit={submit} onCancel={cancel} />
  </FormFrame>
));
```

## Development

```sh
npm run check
```

Relay Forms requires Node.js 22 or newer. See [the architecture notes](./docs/architecture.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
