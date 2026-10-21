import {useState} from 'react';
import {Box, Text, useInput} from 'ink';
import type {FormTheme} from '../theme.js';
import {choiceLabel, firstEnabled, isEnabled, moveIndex, windowStart} from './choices.js';
import {editText, textState, type TextState} from './text-editing.js';
import type {ConfirmField, MultiSelectField, NumberField, SelectField, TextField} from './types.js';

/** What every field input receives from `Prompt`. */
export interface InputProps<F, V> {
  field: F;
  initial: V | undefined;
  isActive: boolean;
  theme: FormTheme;
  /** The person pressed Enter on a value. `Prompt` validates it next. */
  onAccept: (value: V) => void;
  /** The value cannot be read, such as letters in a number. */
  onError: (message: string) => void;
  /** The value changed, so any earlier error no longer applies. */
  onEdit: () => void;
}

const LineWithCursor = ({
  state,
  mask,
  placeholder,
  isActive,
  theme,
}: {
  state: TextState;
  mask: boolean;
  placeholder: string | undefined;
  isActive: boolean;
  theme: FormTheme;
}) => {
  const list = Array.from(state.value).map((character) => (mask ? '•' : character));
  if (list.length === 0 && placeholder !== undefined && placeholder !== '') {
    const [first = ' ', ...rest] = Array.from(placeholder);
    return (
      <Text>
        {isActive ? <Text inverse>{first}</Text> : <Text color={theme.muted}>{first}</Text>}
        <Text color={theme.muted}>{rest.join('')}</Text>
      </Text>
    );
  }
  if (!isActive) return <Text color={theme.text}>{list.join('')}</Text>;
  const before = list.slice(0, state.cursor).join('');
  const under = list[state.cursor] ?? ' ';
  const after = list.slice(state.cursor + 1).join('');
  return (
    <Text color={theme.text}>
      {before}
      <Text inverse>{under}</Text>
      {after}
    </Text>
  );
};

export const TextInput = ({
  field,
  initial,
  isActive,
  theme,
  onAccept,
  onEdit,
}: InputProps<TextField, string>) => {
  const [state, setState] = useState(() => textState(initial ?? field.initial ?? ''));
  useInput(
    (input, key) => {
      if (key.return) return onAccept(state.value);
      const next = editText(state, input, key);
      if (next === undefined || next === state) return;
      setState(next);
      onEdit();
    },
    {isActive},
  );
  return (
    <LineWithCursor
      state={state}
      mask={field.mask === true}
      placeholder={field.placeholder}
      isActive={isActive}
      theme={theme}
    />
  );
};

const numberCharacter = /[\d.eE+-]/;

export const NumberInput = ({
  field,
  initial,
  isActive,
  theme,
  onAccept,
  onError,
  onEdit,
}: InputProps<NumberField, number>) => {
  const start = initial ?? field.initial;
  const [state, setState] = useState(() => textState(start === undefined ? '' : String(start)));
  useInput(
    (input, key) => {
      if (key.return) {
        const text = state.value.trim();
        const value = text === '' ? Number.NaN : Number(text);
        return Number.isFinite(value) ? onAccept(value) : onError('Enter a number.');
      }
      const next = editText(state, input, key, (character) => numberCharacter.test(character));
      if (next === undefined || next === state) return;
      setState(next);
      onEdit();
    },
    {isActive},
  );
  return (
    <LineWithCursor
      state={state}
      mask={false}
      placeholder={undefined}
      isActive={isActive}
      theme={theme}
    />
  );
};

export const ConfirmInput = ({
  field,
  initial,
  isActive,
  theme,
  onAccept,
  onEdit,
}: InputProps<ConfirmField, boolean>) => {
  const [value, setValue] = useState(initial ?? field.initial ?? false);
  useInput(
    (input, key) => {
      const letter = input.toLowerCase();
      if (letter === 'y' || letter === 'n') return onAccept(letter === 'y');
      if (key.return) return onAccept(value);
      if (key.leftArrow || key.rightArrow || key.tab || input === ' ') {
        setValue(!value);
        onEdit();
      }
    },
    {isActive},
  );
  const option = (label: string, selected: boolean) =>
    selected ? (
      <Text bold underline color={isActive ? theme.focus : theme.text}>
        {label}
      </Text>
    ) : (
      <Text color={theme.muted}>{label}</Text>
    );
  return (
    <Text>
      {option('Yes', value)}
      <Text color={theme.muted}> / </Text>
      {option('No', !value)}
    </Text>
  );
};

const ChoiceRows = ({
  field,
  index,
  picked,
  isActive,
  theme,
}: {
  field: SelectField | MultiSelectField;
  index: number;
  picked: ReadonlySet<string> | undefined;
  isActive: boolean;
  theme: FormTheme;
}) => {
  const limit = Math.max(1, field.limit ?? 7);
  const start = windowStart(field.options.length, index, limit);
  const visible = field.options.slice(start, start + limit);
  const hiddenAbove = start;
  const hiddenBelow = field.options.length - start - visible.length;
  return (
    <Box flexDirection="column">
      {hiddenAbove > 0 ? <Text color={theme.muted}> ↑ {hiddenAbove} more</Text> : null}
      {visible.map((choice, offset) => {
        const highlighted = isActive && start + offset === index;
        const enabled = isEnabled(choice);
        const color = !enabled ? theme.muted : highlighted ? theme.focus : theme.text;
        const reason = typeof choice.disabled === 'string' ? choice.disabled : undefined;
        return (
          <Text key={choice.value} wrap="truncate-end">
            <Text color={theme.focus}>{highlighted ? '›' : ' '}</Text>
            {picked === undefined ? null : (
              <Text color={picked.has(choice.value) ? theme.success : theme.muted}>
                {' '}
                {picked.has(choice.value) ? '◉' : '◯'}
              </Text>
            )}
            <Text color={color} strikethrough={!enabled}>
              {' '}
              {choiceLabel(choice)}
            </Text>
            {reason !== undefined ? <Text color={theme.muted}> ({reason})</Text> : null}
            {choice.hint !== undefined && highlighted ? (
              <Text color={theme.muted}> · {choice.hint}</Text>
            ) : null}
          </Text>
        );
      })}
      {hiddenBelow > 0 ? <Text color={theme.muted}> ↓ {hiddenBelow} more</Text> : null}
    </Box>
  );
};

const moveKey = (input: string, key: {upArrow: boolean; downArrow: boolean}): 1 | -1 | 0 => {
  if (key.upArrow || input === 'k') return -1;
  if (key.downArrow || input === 'j') return 1;
  return 0;
};

export const SelectInput = ({
  field,
  initial,
  isActive,
  theme,
  onAccept,
  onEdit,
}: InputProps<SelectField, string>) => {
  const [index, setIndex] = useState(() => {
    const preferred = field.options.findIndex((o) => o.value === (initial ?? field.initial));
    return firstEnabled(field.options, Math.max(0, preferred));
  });
  useInput(
    (input, key) => {
      const step = moveKey(input, key);
      if (step !== 0) {
        setIndex(moveIndex(field.options, index, step));
        return onEdit();
      }
      if (key.home) return setIndex(firstEnabled(field.options, 0));
      if (key.end) return setIndex(moveIndex(field.options, 0, -1));
      const choice = field.options[index];
      if (key.return && choice !== undefined && isEnabled(choice)) onAccept(choice.value);
    },
    {isActive},
  );
  return (
    <ChoiceRows field={field} index={index} picked={undefined} isActive={isActive} theme={theme} />
  );
};

export const MultiSelectInput = ({
  field,
  initial,
  isActive,
  theme,
  onAccept,
  onEdit,
}: InputProps<MultiSelectField, string[]>) => {
  const [index, setIndex] = useState(() => firstEnabled(field.options, 0));
  const [picked, setPicked] = useState<ReadonlySet<string>>(
    () => new Set(initial ?? field.initial ?? []),
  );
  useInput(
    (input, key) => {
      const step = moveKey(input, key);
      if (step !== 0) return setIndex(moveIndex(field.options, index, step));
      if (key.home) return setIndex(firstEnabled(field.options, 0));
      if (key.end) return setIndex(moveIndex(field.options, 0, -1));
      if (key.return) {
        return onAccept(field.options.filter((o) => picked.has(o.value)).map((o) => o.value));
      }
      const choice = field.options[index];
      if (input === ' ' && choice !== undefined && isEnabled(choice)) {
        const next = new Set(picked);
        if (next.has(choice.value)) next.delete(choice.value);
        else next.add(choice.value);
        setPicked(next);
        return onEdit();
      }
      if (input === 'a') {
        const enabled = field.options.filter(isEnabled).map((o) => o.value);
        const all = enabled.every((value) => picked.has(value));
        const next = new Set(picked);
        for (const value of enabled) {
          if (all) next.delete(value);
          else next.add(value);
        }
        setPicked(next);
        onEdit();
      }
    },
    {isActive},
  );
  return (
    <ChoiceRows field={field} index={index} picked={picked} isActive={isActive} theme={theme} />
  );
};
