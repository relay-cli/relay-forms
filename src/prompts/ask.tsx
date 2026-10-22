import {useEffect, useRef, useState} from 'react';
import {Box} from 'ink';
import {runForm, type RunFormOptions} from '../run.js';
import {relayTheme, type FormTheme} from '../theme.js';
import {AnsweredLine, Prompt} from './Prompt.js';
import type {Answers, Field, FieldValue} from './types.js';

export interface AskOptions extends RunFormOptions {
  theme?: FormTheme;
}

/**
 * Ask one question in the terminal and resolve with the answer. Rejects with
 * `FormCancelledError` when the person presses Esc or Ctrl+C.
 */
export const ask = <F extends Field>(
  field: F,
  options: AskOptions & {initialValue?: FieldValue<F>} = {},
): Promise<FieldValue<F>> =>
  runForm<FieldValue<F>>(
    ({submit, cancel}) => (
      <Prompt
        field={field}
        initialValue={options.initialValue}
        onSubmit={submit}
        onCancel={cancel}
        theme={options.theme ?? relayTheme}
      />
    ),
    options,
  );

export interface PromptListProps {
  fields: readonly Field[];
  /** Answers to start each field from, keyed by field name. */
  initialValues?: Readonly<Record<string, unknown>>;
  /**
   * Start at the last field, showing the earlier ones as answered from
   * `initialValues`, such as when returning to a step of a wizard.
   */
  resume?: boolean;
  onSubmit: (answers: Record<string, unknown>) => void;
  /** Called after each answer with the field asked next, if any. */
  onAnswer?: (field: Field, value: unknown, next: Field | undefined) => void;
  /** Called on Esc at the first field. Esc at a later field returns to the one before. */
  onCancel?: () => void;
  isActive?: boolean;
  theme?: FormTheme;
}

const startIndex = (
  fields: readonly Field[],
  values: Readonly<Record<string, unknown>>,
  resume: boolean,
): number => {
  if (!resume) return 0;
  const missing = fields.findIndex((field) => !(field.name in values));
  return missing === -1 ? Math.max(0, fields.length - 1) : missing;
};

/** Fields asked one after another, with earlier answers kept above the current one. */
export const PromptList = ({
  fields,
  initialValues = {},
  resume = false,
  onSubmit,
  onAnswer,
  onCancel,
  isActive = true,
  theme = relayTheme,
}: PromptListProps) => {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({...initialValues}));
  const [index, setIndex] = useState(() => startIndex(fields, initialValues, resume));
  const current = fields[index];

  const submitted = useRef(false);
  useEffect(() => {
    if (fields.length > 0 || submitted.current) return;
    submitted.current = true;
    onSubmit({});
  }, [fields, onSubmit]);

  return (
    <Box flexDirection="column">
      {fields.slice(0, index).map((field) => (
        <AnsweredLine key={field.name} field={field} value={values[field.name]} theme={theme} />
      ))}
      {current === undefined ? null : (
        <Prompt
          key={current.name}
          field={current}
          initialValue={values[current.name] as never}
          onSubmit={(value) => {
            const next = {...values, [current.name]: value};
            setValues(next);
            onAnswer?.(current, value, fields[index + 1]);
            if (index + 1 < fields.length) return setIndex(index + 1);
            setIndex(fields.length);
            onSubmit(Object.fromEntries(fields.map((field) => [field.name, next[field.name]])));
          }}
          onCancel={() => (index > 0 ? setIndex(index - 1) : onCancel?.())}
          isActive={isActive}
          theme={theme}
        />
      )}
    </Box>
  );
};

/**
 * Ask several questions in order and resolve with every answer, keyed by field
 * name. Wrap the list in `defineFields` to type the answers.
 */
export const askAll = <const Fields extends readonly Field[]>(
  fields: Fields,
  options: AskOptions & {initialValues?: Partial<Answers<Fields>>} = {},
): Promise<Answers<Fields>> =>
  runForm<Answers<Fields>>(
    ({submit, cancel}) => (
      <PromptList
        fields={fields}
        initialValues={options.initialValues ?? {}}
        onSubmit={(answers) => submit(answers as Answers<Fields>)}
        onCancel={cancel}
        theme={options.theme ?? relayTheme}
      />
    ),
    options,
  );
