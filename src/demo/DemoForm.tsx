import {useState} from 'react';
import {Text} from 'ink';
import {FormFrame} from '../frame/index.js';
import {defineFields, keyHints, PromptList, type Field} from '../prompts/index.js';
import {relayTheme} from '../theme.js';

export const demoFields = defineFields([
  {
    kind: 'text',
    name: 'name',
    label: 'Project name',
    placeholder: 'relay-demo',
    required: true,
    validate: (value) =>
      /^[a-z0-9-]+$/.test(value) ? undefined : 'Use lowercase letters, digits, and dashes.',
  },
  {
    kind: 'select',
    name: 'packageManager',
    label: 'Package manager',
    options: [
      {value: 'npm', hint: 'bundled with Node.js'},
      {value: 'pnpm'},
      {value: 'yarn', disabled: 'not installed'},
    ],
  },
  {
    kind: 'multiselect',
    name: 'features',
    label: 'Features',
    options: [
      {value: 'tests', label: 'Tests'},
      {value: 'lint', label: 'Linting'},
      {value: 'ci', label: 'GitHub Actions'},
    ],
    initial: ['tests', 'lint'],
  },
  {kind: 'number', name: 'port', label: 'Development port', initial: 3000, min: 1024, max: 65535},
  {kind: 'text', name: 'token', label: 'Registry token', mask: true, hint: 'Leave empty to skip.'},
  {kind: 'confirm', name: 'git', label: 'Initialize a git repository?', initial: true},
]);

export interface DemoFormProps {
  /** Read keys. A snapshot renders the first question without waiting. */
  interactive?: boolean;
  onSubmit?: (answers: Record<string, unknown>) => void;
  onCancel?: () => void;
}

/** A project setup flow that shows each kind of prompt. */
export const DemoForm = ({interactive = true, onSubmit, onCancel}: DemoFormProps) => {
  const [current, setCurrent] = useState<Field | undefined>(demoFields[0]);
  return (
    <FormFrame
      title="Relay Forms"
      subtitle="new project"
      footer={
        current === undefined ? undefined : (
          <Text color={relayTheme.muted}>{keyHints(current)} · ctrl+c quit</Text>
        )
      }
    >
      <PromptList
        fields={demoFields}
        isActive={interactive}
        onSubmit={(answers) => {
          setCurrent(undefined);
          onSubmit?.(answers);
        }}
        onAnswer={(_field, _value, next) => setCurrent(next)}
        {...(onCancel === undefined ? {} : {onCancel})}
      />
    </FormFrame>
  );
};
