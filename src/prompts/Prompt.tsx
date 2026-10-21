import {useEffect, useRef, useState} from 'react';
import {Box, Text, useInput} from 'ink';
import {relayTheme, type FormTheme} from '../theme.js';
import {formatAnswer, validateAnswer} from './format.js';
import {ConfirmInput, MultiSelectInput, NumberInput, SelectInput, TextInput} from './inputs.js';
import type {Field, FieldValue} from './types.js';

export interface PromptProps<F extends Field> {
  field: F;
  /** A value to start from instead of the field's `initial`, such as an earlier answer. */
  initialValue?: FieldValue<F> | undefined;
  /** Called with the answer once it passes validation. */
  onSubmit: (value: FieldValue<F>) => void;
  /** Called when the person presses Esc. */
  onCancel?: () => void;
  /** Only the active prompt reads keys. Defaults to true. */
  isActive?: boolean;
  theme?: FormTheme;
}

type Phase = {name: 'editing'} | {name: 'checking'} | {name: 'done'; value: unknown};

/** The keys a field understands, for a footer beneath the prompt. */
export const keyHints = (field: Field): string => {
  switch (field.kind) {
    case 'text':
    case 'number':
      return 'enter submit · esc cancel';
    case 'confirm':
      return 'y yes · n no · enter submit';
    case 'select':
      return '↑↓ move · enter pick · esc cancel';
    case 'multiselect':
      return '↑↓ move · space toggle · a all · enter submit';
  }
};

/** A question that has been answered, as it stays in the terminal. */
export const AnsweredLine = ({
  field,
  value,
  theme = relayTheme,
}: {
  field: Field;
  value: unknown;
  theme?: FormTheme;
}) => (
  <Text wrap="truncate-end">
    <Text color={theme.success}>✔</Text>
    <Text color={theme.text}> {field.label}</Text>
    <Text color={theme.muted}> · {formatAnswer(field, value)}</Text>
  </Text>
);

/**
 * One question. While active it reads keys and shows its input; once the
 * answer passes validation it collapses to a single answered line.
 */
export const Prompt = <F extends Field>({
  field,
  initialValue,
  onSubmit,
  onCancel,
  isActive = true,
  theme = relayTheme,
}: PromptProps<F>) => {
  const [phase, setPhase] = useState<Phase>({name: 'editing'});
  const [error, setError] = useState<string | undefined>();
  const attempt = useRef(0);
  const editing = phase.name === 'editing';

  useInput(
    (_input, key) => {
      if (key.escape) onCancel?.();
    },
    {isActive: isActive && phase.name !== 'done'},
  );

  const submitted = useRef(false);
  useEffect(() => {
    if (phase.name !== 'done' || submitted.current) return;
    submitted.current = true;
    onSubmit(phase.value as FieldValue<F>);
  }, [phase, onSubmit]);

  const settle = (value: unknown, message: string | undefined): void => {
    setError(message);
    setPhase(message === undefined ? {name: 'done', value} : {name: 'editing'});
  };

  const accept = (value: unknown): void => {
    const current = (attempt.current += 1);
    let result: ReturnType<typeof validateAnswer>;
    try {
      result = validateAnswer(field, value);
    } catch (failure) {
      return settle(value, failure instanceof Error ? failure.message : String(failure));
    }
    if (!(result instanceof Promise)) return settle(value, result);
    setPhase({name: 'checking'});
    result.then(
      (message) => {
        if (attempt.current === current) settle(value, message);
      },
      (failure: unknown) => {
        if (attempt.current !== current) return;
        settle(value, failure instanceof Error ? failure.message : String(failure));
      },
    );
  };

  if (phase.name === 'done')
    return <AnsweredLine field={field} value={phase.value} theme={theme} />;

  const inputProps = {
    initial: initialValue as never,
    isActive: isActive && editing,
    theme,
    onAccept: accept,
    onError: setError,
    onEdit: () => setError(undefined),
  };
  const listed = field.kind === 'select' || field.kind === 'multiselect';
  const input =
    field.kind === 'text' ? (
      <TextInput field={field} {...inputProps} />
    ) : field.kind === 'number' ? (
      <NumberInput field={field} {...inputProps} />
    ) : field.kind === 'confirm' ? (
      <ConfirmInput field={field} {...inputProps} />
    ) : field.kind === 'select' ? (
      <SelectInput field={field} {...inputProps} />
    ) : (
      <MultiSelectInput field={field} {...inputProps} />
    );

  return (
    <Box flexDirection="column">
      <Box gap={1}>
        <Text color={isActive ? theme.accent : theme.muted}>?</Text>
        <Text bold color={theme.text}>
          {field.label}
        </Text>
        {listed ? null : input}
      </Box>
      {listed ? <Box paddingLeft={1}>{input}</Box> : null}
      {phase.name === 'checking' ? (
        <Text color={theme.muted}> Checking…</Text>
      ) : error !== undefined ? (
        <Text color={theme.danger}> ✖ {error}</Text>
      ) : field.hint !== undefined && isActive ? (
        <Text color={theme.muted}> {field.hint}</Text>
      ) : null}
    </Box>
  );
};
