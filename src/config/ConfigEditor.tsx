import {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {FormFrame} from '../frame/index.js';
import {formatAnswer, Prompt, type Field} from '../prompts/index.js';
import {relayTheme, type FormTheme} from '../theme.js';
import {
  diffValues,
  fitsField,
  getValue,
  setValue,
  unsetValue,
  type ConfigChange,
  type ConfigValues,
} from './values.js';

export interface ConfigEditorProps {
  title: string;
  /** Shown beside the title, usually the file path. */
  subtitle?: string;
  /** One field per editable setting. A dotted name such as `server.port` edits a nested value. */
  fields: readonly Field[];
  /** The document as it was loaded. Keys without a field are kept as they are. */
  values: ConfigValues;
  onSave: (values: ConfigValues, changes: ConfigChange[]) => void;
  /** Called when the person leaves without saving, after confirming any discarded changes. */
  onQuit: () => void;
  isActive?: boolean;
  theme?: FormTheme;
}

type Mode =
  {name: 'list'} | {name: 'edit'} | {name: 'quit'} | {name: 'saved'; changes: ConfigChange[]};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`;

const ValueText = ({field, value, theme}: {field: Field; value: unknown; theme: FormTheme}) => {
  if (value === undefined) {
    return field.initial === undefined ? (
      <Text color={theme.muted}>not set</Text>
    ) : (
      <Text color={theme.muted}>{formatAnswer(field, field.initial)} (default)</Text>
    );
  }
  if (!fitsField(field, value)) {
    return <Text color={theme.warning}>{JSON.stringify(value)} (invalid)</Text>;
  }
  return <Text color={theme.text}>{formatAnswer(field, value)}</Text>;
};

const describe = (field: Field, value: unknown): string =>
  value === undefined
    ? 'default'
    : fitsField(field, value)
      ? formatAnswer(field, value)
      : JSON.stringify(value);

/**
 * A list of settings that can be edited one at a time and saved together. Each
 * setting is edited with the prompt for its field, so it is validated the same
 * way as in a setup flow.
 */
export const ConfigEditor = ({
  title,
  subtitle,
  fields,
  values: original,
  onSave,
  onQuit,
  isActive = true,
  theme = relayTheme,
}: ConfigEditorProps) => {
  const [values, setValues] = useState(original);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>({name: 'list'});
  const changes = diffValues(fields, original, values);
  const selected = fields[index];
  const labelWidth = Math.max(0, ...fields.map((field) => field.label.length));

  const save = (): void => {
    setMode({name: 'saved', changes});
    onSave(values, changes);
  };

  useInput(
    (input, key) => {
      if (key.upArrow || input === 'k')
        return setIndex((index - 1 + fields.length) % fields.length);
      if (key.downArrow || input === 'j') return setIndex((index + 1) % fields.length);
      if (key.home) return setIndex(0);
      if (key.end) return setIndex(fields.length - 1);
      if (key.return && selected !== undefined) return setMode({name: 'edit'});
      if ((key.delete || key.backspace) && selected !== undefined) {
        return setValues(unsetValue(values, selected.name));
      }
      if (input === 'r' && selected !== undefined) {
        const before = getValue(original, selected.name);
        return setValues(
          before === undefined
            ? unsetValue(values, selected.name)
            : setValue(values, selected.name, before),
        );
      }
      if (input === 's') return save();
      if (input === 'q' || key.escape) {
        if (changes.length === 0) return onQuit();
        setMode({name: 'quit'});
      }
    },
    {isActive: isActive && mode.name === 'list'},
  );

  if (mode.name === 'saved') {
    return (
      <FormFrame title={title} theme={theme} {...(subtitle === undefined ? {} : {subtitle})}>
        {mode.changes.length === 0 ? (
          <Text color={theme.muted}>No changes.</Text>
        ) : (
          mode.changes.map((change) => {
            const field = fields.find((candidate) => candidate.name === change.name);
            return field === undefined ? null : (
              <Text key={change.name} wrap="truncate-end">
                <Text color={theme.success}>✔</Text>
                <Text color={theme.text}> {field.label}</Text>
                <Text color={theme.muted}>
                  {' '}
                  · {describe(field, change.before)} → {describe(field, change.after)}
                </Text>
              </Text>
            );
          })
        )}
      </FormFrame>
    );
  }

  const footer =
    mode.name === 'edit' ? (
      <Text color={theme.muted}>enter save value · esc stop editing</Text>
    ) : mode.name === 'quit' ? undefined : (
      <Box flexDirection="column">
        <Text color={theme.muted} wrap="truncate-end">
          {selected?.hint ?? selected?.name ?? ''}
        </Text>
        <Text color={theme.muted}>
          ↑↓ move · enter edit · del default · r revert · s save · q quit
        </Text>
      </Box>
    );

  return (
    <FormFrame
      title={title}
      subtitle={
        changes.length > 0 ? plural(changes.length, 'unsaved change') : (subtitle ?? 'saved')
      }
      theme={theme}
      footer={footer}
    >
      {fields.map((field, row) => {
        const value = getValue(values, field.name);
        const highlighted = row === index;
        if (highlighted && mode.name === 'edit') {
          return (
            <Prompt
              key={field.name}
              field={field}
              initialValue={fitsField(field, value) ? (value as never) : undefined}
              onSubmit={(next) => {
                setValues(setValue(values, field.name, next));
                setMode({name: 'list'});
              }}
              onCancel={() => setMode({name: 'list'})}
              isActive={isActive}
              theme={theme}
            />
          );
        }
        const changed = changes.some((change) => change.name === field.name);
        return (
          <Text key={field.name} wrap="truncate-end">
            <Text color={theme.focus}>{highlighted && mode.name === 'list' ? '›' : ' '}</Text>
            <Text color={theme.warning}>{changed ? '●' : ' '}</Text>
            <Text color={highlighted ? theme.focus : theme.text}>
              {' '}
              {field.label.padEnd(labelWidth)}
            </Text>
            <Text> </Text>
            <ValueText field={field} value={value} theme={theme} />
          </Text>
        );
      })}
      {mode.name === 'quit' ? (
        <Prompt
          field={{
            kind: 'confirm',
            name: 'discard',
            label: `Discard ${plural(changes.length, 'unsaved change')}?`,
          }}
          onSubmit={(discard) => (discard ? onQuit() : setMode({name: 'list'}))}
          onCancel={() => setMode({name: 'list'})}
          isActive={isActive}
          theme={theme}
        />
      ) : null}
    </FormFrame>
  );
};
