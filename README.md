# Relay Forms

Relay Forms builds the setup flows of command-line tools: single prompts, multi-step wizards, and editors for configuration files. Forms render in the normal terminal rather than a full screen, so the answers stay in the scrollback after the flow finishes.

## Try the demo

```sh
npm install
npm run demo
```

To print the demonstration without waiting for input:

```sh
npx tsx src/cli.tsx --demo --snapshot
```

## Use it in a tool

`runForm` renders a form where the cursor is and resolves with the value the form submits. Esc and Ctrl+C cancel it, and `runForm` then rejects with `FormCancelledError`.

```tsx
import {Text} from 'ink';
import {FormCancelledError, FormFrame, runForm} from '@relay-cli/forms';

try {
  const answer = await runForm<string>(({submit}) => (
    <FormFrame title="Create project">
      <MyField onSubmit={submit} />
    </FormFrame>
  ));
} catch (error) {
  if (error instanceof FormCancelledError) process.exitCode = 130;
  else throw error;
}
```

## Development

```sh
npm run check
```

Relay Forms requires Node.js 22 or newer. See [the architecture notes](./docs/architecture.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT
