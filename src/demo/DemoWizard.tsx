import {Wizard, type WizardStep} from '../wizard/index.js';
import {demoFields} from './DemoForm.js';
import type {DemoProps} from './types.js';

const field = (name: string) => {
  const found = demoFields.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`No demonstration field named ${name}`);
  return found;
};

export const demoSteps: WizardStep[] = [
  {
    id: 'project',
    title: 'Project',
    fields: [
      field('name'),
      {
        kind: 'select',
        name: 'kind',
        label: 'What are you building?',
        options: [
          {value: 'library', label: 'A library'},
          {value: 'service', label: 'A web service'},
        ],
      },
    ],
  },
  {
    id: 'tooling',
    title: 'Tooling',
    fields: [field('packageManager'), field('features')],
  },
  {
    id: 'service',
    title: 'Service',
    description: 'Only asked for web services.',
    when: (answers) => answers.kind === 'service',
    fields: [field('port')],
  },
  {
    id: 'publish',
    title: 'Publish',
    fields: (answers) => [
      field('token'),
      {
        kind: 'confirm',
        name: 'git',
        label: `Initialize a git repository for ${String(answers.name)}?`,
        initial: true,
      },
    ],
  },
];

/** The project setup flow split into steps, with a review screen. */
export const DemoWizard = ({interactive = true, onSubmit, onCancel}: DemoProps) => (
  <Wizard
    title="Relay Forms"
    steps={demoSteps}
    isActive={interactive}
    onSubmit={onSubmit ?? (() => undefined)}
    {...(onCancel === undefined ? {} : {onCancel})}
  />
);
