# Prompts

A prompt is one question described by a field. `ask` asks one field, `askAll` asks a list in order, and the `Prompt` and `PromptList` components do the same inside an Ink application.

## Field kinds

| Kind          | Answer     | Keys                                                 | Options                                      |
| ------------- | ---------- | ---------------------------------------------------- | -------------------------------------------- |
| `text`        | `string`   | typing, ←→, Home/End, Ctrl+A/E/U/K/W                 | `initial`, `placeholder`, `mask`, `required` |
| `number`      | `number`   | as `text`, accepting only digits, `.`, `-`, `e`, `+` | `initial`, `min`, `max`, `integer`           |
| `confirm`     | `boolean`  | `y`, `n`, ←→ or Space to switch, Enter               | `initial`                                    |
| `select`      | the value  | ↑↓ or `j`/`k`, Home/End, Enter                       | `options`, `initial`, `limit`                |
| `multiselect` | the values | ↑↓, Space toggles, `a` toggles all, Enter            | `options`, `initial`, `min`, `max`, `limit`  |

Every field has a `name`, a `label`, and an optional `hint` shown beneath the active question. In `askAll` and `PromptList`, Esc returns to the previous question with its answer kept. At the first question Esc cancels, and `ask` and `askAll` then reject with `FormCancelledError`.

Options of `select` and `multiselect` take a `value`, an optional `label` and `hint`, and `disabled`, which may be a string explaining why the option cannot be picked. Lists longer than `limit` (7 by default) scroll.

## Validation

Declared limits such as `required`, `min`, and `max` are checked first. A field's `validate` function runs next and returns a message to show, or `undefined` to accept:

```ts
const name = {
  kind: 'text',
  name: 'name',
  label: 'Project name',
  required: true,
  validate: (value: string) =>
    /^[a-z0-9-]+$/.test(value) ? undefined : 'Use lowercase letters, digits, and dashes.',
} as const;
```

`validate` may return a promise, for example to check a token against an API. The prompt shows `Checking…` until it settles, and a rejected promise is shown as the error message.

## Typed answers

Wrap a field list in `defineFields` to keep its names and option values, and `askAll` returns typed answers:

```ts
const fields = defineFields([
  {kind: 'text', name: 'name', label: 'Name'},
  {
    kind: 'select',
    name: 'pm',
    label: 'Package manager',
    options: [{value: 'npm'}, {value: 'pnpm'}],
  },
]);
const answers = await askAll(fields);
// answers: {name: string; pm: 'npm' | 'pnpm'}
```

`askAll(fields, {initialValues})` starts fields from earlier answers, such as values already in a configuration file.

## Masked values

A `text` field with `mask: true` shows `•` for each character while typing and at most twelve once answered, so the length of a long token is not revealed. See [SECURITY.md](../SECURITY.md) for storing secrets.
