# Wizards

A wizard splits a setup flow into steps. Each step asks its fields with `PromptList`, a progress row shows where the person is, and a review screen lists every answer before the wizard submits.

```ts
import {runWizard, type WizardStep} from '@relay-cli/forms';

const steps: WizardStep[] = [
  {
    id: 'project',
    title: 'Project',
    fields: [
      {kind: 'text', name: 'name', label: 'Project name', required: true},
      {
        kind: 'select',
        name: 'kind',
        label: 'Kind',
        options: [{value: 'library'}, {value: 'service'}],
      },
    ],
  },
  {
    id: 'service',
    title: 'Service',
    when: (answers) => answers.kind === 'service',
    fields: [{kind: 'number', name: 'port', label: 'Port', initial: 3000}],
  },
  {
    id: 'publish',
    title: 'Publish',
    fields: (answers) => [
      {kind: 'confirm', name: 'git', label: `Initialize git for ${String(answers.name)}?`},
    ],
  },
];

const answers = await runWizard<{name: string; kind: string; port?: number; git: boolean}>(steps, {
  title: 'Create a project',
});
```

## Steps

| Property      | Meaning                                                       |
| ------------- | ------------------------------------------------------------- |
| `id`          | A stable identifier, unique within the wizard.                |
| `title`       | A short name for the progress row and the review screen.      |
| `description` | One line shown above the step's questions.                    |
| `fields`      | The step's fields, or a function of the answers given so far. |
| `when`        | Skip the step when this returns false.                        |

A step skipped by `when` does not appear in the progress row, and its answers are left out of the result even if they were given before an earlier answer changed.

## Navigation

- Enter accepts the current answer and moves on.
- Esc returns to the previous question. At the first question of a step it returns to the last question of the previous step, with its answers kept. At the very first question it cancels, and `runWizard` rejects with `FormCancelledError`.
- The review screen offers `Yes, continue` and a `Change …` entry for each step. Changing a step asks it again from its first question, with the earlier answers filled in. If the new answers make another step apply, that step is asked before the review screen returns.

Pass `review: false` to submit as soon as the last step is answered, and `initialValues` to start from existing answers, such as a configuration file.

`Wizard` is the component behind `runWizard`, for use inside a larger Ink application.
