import type {ReactNode} from 'react';
import type {DemoName} from '../cli/options.js';
import {DemoForm} from './DemoForm.js';
import {DemoWizard} from './DemoWizard.js';
import type {DemoProps} from './types.js';

export {DemoForm, demoFields} from './DemoForm.js';
export {DemoWizard, demoSteps} from './DemoWizard.js';
export type {DemoProps} from './types.js';

export const demos: Record<DemoName, (props: DemoProps) => ReactNode> = {
  prompts: DemoForm,
  wizard: DemoWizard,
};
