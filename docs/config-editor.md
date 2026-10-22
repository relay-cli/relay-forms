# Configuration editor

`editConfig` opens a JSON configuration file as a list of settings. Each setting is described by a field, edited with the same prompt a setup flow would use, and validated the same way. Nothing is written until the person saves.

```ts
import {editConfig, type Field} from '@relay-cli/forms';

const fields: Field[] = [
  {kind: 'text', name: 'name', label: 'Service name', required: true},
  {kind: 'number', name: 'server.port', label: 'Port', initial: 3000, min: 1, max: 65535},
  {
    kind: 'select',
    name: 'log.level',
    label: 'Log level',
    options: [{value: 'info'}, {value: 'debug'}],
  },
  {kind: 'text', name: 'token', label: 'API token', mask: true},
];

const result = await editConfig('./service.json', fields, {mode: 0o600});
if (result.saved) console.log(`Saved ${result.changes.length} changes.`);
```

## Values

- A dotted field name such as `server.port` reads and writes a nested value. Saving creates the objects on the way.
- A setting that is not in the file shows its field's `initial` as `(default)`, or `not set`. Defaults are not written to the file unless the person edits them.
- A stored value that does not fit its field, such as a string where a number belongs or an option that no longer exists, is shown as `(invalid)` with the raw value, and editing it starts from the field's default.
- Keys that no field describes are kept as they are.
- Masked settings never show their value.

## Keys

| Key                 | Action                                                         |
| ------------------- | -------------------------------------------------------------- |
| ↑↓, `j`/`k`         | Move between settings                                          |
| Enter               | Edit the setting. Enter saves the value, Esc abandons the edit |
| Delete or Backspace | Remove the setting so it falls back to its default             |
| `r`                 | Revert the setting to the value it was loaded with             |
| `s`                 | Save every change and close                                    |
| `q` or Esc          | Close, asking first when there are unsaved changes             |

## Files

`loadConfig` reads a missing or empty file as `{}` and refuses a file that is not a JSON object rather than overwriting it. `saveConfig` writes two-space JSON with a trailing newline to a temporary file beside the target and renames it into place. Pass `mode: 0o600` when the file holds secrets; otherwise a replaced file keeps its permissions.

`ConfigEditor` is the component behind `editConfig`. It takes the document and reports `onSave(values, changes)` and `onQuit()`, so it can edit configuration stored anywhere.
