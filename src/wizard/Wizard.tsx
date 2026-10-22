import {useEffect, useRef, useState} from 'react';
import {Box, Text} from 'ink';
import {FormFrame} from '../frame/index.js';
import {AnsweredLine, Prompt, PromptList, type Field} from '../prompts/index.js';
import {relayTheme, type FormTheme} from '../theme.js';

export type WizardAnswers = Record<string, unknown>;

export interface WizardStep {
  /** A stable identifier, unique within the wizard. */
  id: string;
  /** A short name shown in the progress row and on the review screen. */
  title: string;
  /** One line shown above the step's questions. */
  description?: string;
  /** The step's questions, or a function of the answers given so far. */
  fields: readonly Field[] | ((answers: WizardAnswers) => readonly Field[]);
  /** Skip the step when this returns false. Answers to skipped steps are dropped. */
  when?: (answers: WizardAnswers) => boolean;
}

export interface WizardProps {
  title: string;
  steps: readonly WizardStep[];
  /** Answers to start from, such as an existing configuration. */
  initialValues?: WizardAnswers;
  /** Show every answer and ask for confirmation before submitting. Defaults to true. */
  review?: boolean;
  onSubmit: (answers: WizardAnswers) => void;
  /** Called on Esc at the first question of the first step. */
  onCancel?: () => void;
  isActive?: boolean;
  theme?: FormTheme;
}

const REVIEW = Symbol('review');
const DONE = Symbol('done');
type Position = {step: string; resume: boolean} | typeof REVIEW | typeof DONE;

export const stepFields = (step: WizardStep, answers: WizardAnswers): readonly Field[] =>
  typeof step.fields === 'function' ? step.fields(answers) : step.fields;

/** The steps that apply to a set of answers, in order. */
export const visibleSteps = (steps: readonly WizardStep[], answers: WizardAnswers): WizardStep[] =>
  steps.filter((step) => step.when?.(answers) ?? true);

/** Keep only the answers to fields of steps that still apply. */
export const collectAnswers = (
  steps: readonly WizardStep[],
  answers: WizardAnswers,
): WizardAnswers => {
  const result: WizardAnswers = {};
  for (const step of visibleSteps(steps, answers)) {
    for (const field of stepFields(step, answers)) {
      if (field.name in answers) result[field.name] = answers[field.name];
    }
  }
  return result;
};

const Progress = ({
  steps,
  completed,
  current,
  review,
  theme,
}: {
  steps: readonly WizardStep[];
  completed: ReadonlySet<string>;
  current: string | undefined;
  review: boolean;
  theme: FormTheme;
}) => {
  const items = steps.map((step) => ({
    key: step.id,
    title: step.title,
    state: step.id === current ? 'current' : completed.has(step.id) ? 'done' : 'todo',
  }));
  if (review)
    items.push({key: '', title: 'Review', state: current === undefined ? 'current' : 'todo'});
  return (
    <Text wrap="truncate-end">
      {items.map((item, index) => (
        <Text key={item.key}>
          {index === 0 ? '' : <Text color={theme.rule}> · </Text>}
          {item.state === 'done' ? (
            <Text color={theme.success}>✔ {item.title}</Text>
          ) : item.state === 'current' ? (
            <Text bold color={theme.accent}>
              › {item.title}
            </Text>
          ) : (
            <Text color={theme.muted}>{item.title}</Text>
          )}
        </Text>
      ))}
    </Text>
  );
};

const Summary = ({
  steps,
  answers,
  theme,
}: {
  steps: readonly WizardStep[];
  answers: WizardAnswers;
  theme: FormTheme;
}) => (
  <Box flexDirection="column">
    {visibleSteps(steps, answers).map((step) => (
      <Box key={step.id} flexDirection="column">
        <Text color={theme.muted}>{step.title}</Text>
        {stepFields(step, answers).map((field) => (
          <AnsweredLine key={field.name} field={field} value={answers[field.name]} theme={theme} />
        ))}
      </Box>
    ))}
  </Box>
);

const SUBMIT = '\u0000submit';

/**
 * A setup flow split into steps. Each step asks its questions with
 * `PromptList`; Esc returns to the previous question or step, and the review
 * screen lets the person change any step before submitting.
 */
export const Wizard = ({
  title,
  steps,
  initialValues = {},
  review = true,
  onSubmit,
  onCancel,
  isActive = true,
  theme = relayTheme,
}: WizardProps) => {
  const [answers, setAnswers] = useState<WizardAnswers>(initialValues);
  const [completed, setCompleted] = useState<ReadonlySet<string>>(new Set());
  const [position, setPosition] = useState<Position>(() => {
    const first = visibleSteps(steps, initialValues)[0];
    return first === undefined ? (review ? REVIEW : DONE) : {step: first.id, resume: false};
  });

  const visible = visibleSteps(steps, answers);
  const finish = (nextAnswers: WizardAnswers, nextCompleted: ReadonlySet<string>): void => {
    const pending = visibleSteps(steps, nextAnswers).find((step) => !nextCompleted.has(step.id));
    if (pending !== undefined) setPosition({step: pending.id, resume: false});
    else setPosition(review ? REVIEW : DONE);
  };

  const submitted = useRef(false);
  useEffect(() => {
    if (position !== DONE || submitted.current) return;
    submitted.current = true;
    onSubmit(collectAnswers(steps, answers));
  }, [position, steps, answers, onSubmit]);

  const back = (from: number): void => {
    const previous = visible[from - 1];
    if (previous === undefined) return onCancel?.();
    const nextCompleted = new Set(completed);
    nextCompleted.delete(previous.id);
    setCompleted(nextCompleted);
    setPosition({step: previous.id, resume: true});
  };

  let body;
  let current: string | undefined;
  let subtitle: string;
  if (position === DONE) {
    subtitle = 'done';
    body = <Summary steps={steps} answers={answers} theme={theme} />;
  } else if (position === REVIEW) {
    subtitle = 'review';
    body = (
      <Box key="review" flexDirection="column">
        <Summary steps={steps} answers={answers} theme={theme} />
        <Prompt
          field={{
            kind: 'select',
            name: SUBMIT,
            label: 'Everything look right?',
            options: [
              {value: SUBMIT, label: 'Yes, continue'},
              ...visible.map((step) => ({value: step.id, label: `Change ${step.title}`})),
            ],
          }}
          onSubmit={(choice) => {
            if (choice === SUBMIT) return setPosition(DONE);
            const nextCompleted = new Set(completed);
            nextCompleted.delete(choice);
            setCompleted(nextCompleted);
            setPosition({step: choice, resume: false});
          }}
          onCancel={() => back(visible.length)}
          isActive={isActive}
          theme={theme}
        />
      </Box>
    );
  } else {
    const index = Math.max(
      0,
      visible.findIndex((step) => step.id === position.step),
    );
    const step = visible[index];
    current = step?.id;
    subtitle = `step ${index + 1} of ${visible.length}`;
    body =
      step === undefined ? null : (
        <Box flexDirection="column">
          {step.description === undefined ? null : (
            <Text color={theme.muted}>{step.description}</Text>
          )}
          <PromptList
            key={`${step.id}:${String(position.resume)}`}
            fields={stepFields(step, answers)}
            initialValues={answers}
            resume={position.resume}
            onSubmit={(stepAnswers) => {
              const nextAnswers = {...answers, ...stepAnswers};
              const nextCompleted = new Set(completed).add(step.id);
              setAnswers(nextAnswers);
              setCompleted(nextCompleted);
              finish(nextAnswers, nextCompleted);
            }}
            onCancel={() => back(index)}
            isActive={isActive}
            theme={theme}
          />
        </Box>
      );
  }

  return (
    <FormFrame
      title={title}
      subtitle={subtitle}
      theme={theme}
      footer={
        position === DONE ? undefined : (
          <Text color={theme.muted}>enter continue · esc back · ctrl+c cancel</Text>
        )
      }
    >
      {position === DONE ? null : (
        <Progress
          steps={visible}
          completed={completed}
          current={current}
          review={review}
          theme={theme}
        />
      )}
      {body}
    </FormFrame>
  );
};
