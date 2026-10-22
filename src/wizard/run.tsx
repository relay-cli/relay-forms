import {runForm, type RunFormOptions} from '../run.js';
import type {FormTheme} from '../theme.js';
import {Wizard, type WizardAnswers, type WizardStep} from './Wizard.js';

export interface RunWizardOptions extends RunFormOptions {
  title: string;
  initialValues?: WizardAnswers;
  review?: boolean;
  theme?: FormTheme;
}

/**
 * Run a multi-step setup flow and resolve with the answers to every step that
 * applied. Rejects with `FormCancelledError` on Ctrl+C or on Esc at the first
 * question.
 */
export const runWizard = <T extends WizardAnswers = WizardAnswers>(
  steps: readonly WizardStep[],
  options: RunWizardOptions,
): Promise<T> =>
  runForm<T>(
    ({submit, cancel}) => (
      <Wizard
        title={options.title}
        steps={steps}
        {...(options.initialValues === undefined ? {} : {initialValues: options.initialValues})}
        {...(options.review === undefined ? {} : {review: options.review})}
        {...(options.theme === undefined ? {} : {theme: options.theme})}
        onSubmit={(answers) => submit(answers as T)}
        onCancel={cancel}
      />
    ),
    options,
  );
