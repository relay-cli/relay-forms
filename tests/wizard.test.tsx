import React from 'react';
import {render} from 'ink-testing-library';
import {describe, expect, it, vi} from 'vitest';
import {FormCancelledError} from '../src/run.js';
import {
  collectAnswers,
  runWizard,
  visibleSteps,
  Wizard,
  type WizardStep,
} from '../src/wizard/index.js';
import {fakeTerminal, tick} from './helpers.js';

const enter = '\r';
const escape = '\u001B';
const down = '\u001B[B';

const steps: WizardStep[] = [
  {
    id: 'project',
    title: 'Project',
    fields: [
      {kind: 'text', name: 'name', label: 'Name', initial: 'demo'},
      {kind: 'select', name: 'kind', label: 'Kind', options: [{value: 'library'}, {value: 'app'}]},
    ],
  },
  {
    id: 'deploy',
    title: 'Deploy',
    description: 'Where the app runs.',
    when: (answers) => answers.kind === 'app',
    fields: [
      {
        kind: 'select',
        name: 'target',
        label: 'Target',
        options: [{value: 'fly'}, {value: 'docker'}],
      },
    ],
  },
  {
    id: 'extras',
    title: 'Extras',
    fields: (answers) => [
      {kind: 'confirm', name: 'git', label: `Initialize git for ${String(answers.name)}?`},
    ],
  },
];

const press = async (stdin: {write: (data: string) => void}, ...keys: string[]) => {
  for (const key of keys) {
    stdin.write(key);
    await tick();
  }
};

describe('wizard steps', () => {
  it('skips steps whose condition fails and drops their answers', () => {
    const answers = {name: 'demo', kind: 'library', target: 'fly', git: true};
    expect(visibleSteps(steps, answers).map((step) => step.id)).toEqual(['project', 'extras']);
    expect(collectAnswers(steps, answers)).toEqual({name: 'demo', kind: 'library', git: true});
  });
});

describe('Wizard', () => {
  it('shows progress, skips conditional steps, and submits after review', async () => {
    const onSubmit = vi.fn();
    const view = render(<Wizard title="Create" steps={steps} onSubmit={onSubmit} />);
    await tick();
    expect(view.lastFrame()).toContain('› Project · Extras · Review');
    expect(view.lastFrame()).toContain('step 1 of 2');
    await press(view.stdin, enter, enter);
    expect(view.lastFrame()).toContain('✔ Project · › Extras');
    expect(view.lastFrame()).toContain('Initialize git for demo?');
    await press(view.stdin, 'y');
    expect(view.lastFrame()).toContain('Everything look right?');
    expect(view.lastFrame()).toContain('Kind · library');
    await press(view.stdin, enter);
    expect(onSubmit).toHaveBeenCalledWith({name: 'demo', kind: 'library', git: true});
  });

  it('asks a step that a changed answer makes relevant', async () => {
    const onSubmit = vi.fn();
    const view = render(<Wizard title="Create" steps={steps} onSubmit={onSubmit} />);
    await tick();
    await press(view.stdin, enter, enter, 'n');
    // Review: pick "Change Project", keep the name, switch the kind to app.
    await press(view.stdin, down, enter, enter, down, enter);
    expect(view.lastFrame()).toContain('Where the app runs.');
    await press(view.stdin, down, enter);
    expect(view.lastFrame()).toContain('Target · docker');
    await press(view.stdin, enter);
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'demo',
      kind: 'app',
      target: 'docker',
      git: false,
    });
  });

  it('returns to the last question of the previous step on Esc', async () => {
    const view = render(<Wizard title="Create" steps={steps} onSubmit={() => undefined} />);
    await tick();
    await press(view.stdin, 'x', enter, enter);
    expect(view.lastFrame()).toContain('› Extras');
    await press(view.stdin, escape);
    expect(view.lastFrame()).toContain('› Project');
    expect(view.lastFrame()).toContain('✔ Name · demox');
    expect(view.lastFrame()).toContain('? Kind');
  });

  it('submits after the last step when review is off', async () => {
    const onSubmit = vi.fn();
    const view = render(
      <Wizard
        title="Create"
        steps={steps}
        review={false}
        initialValues={{name: 'kept'}}
        onSubmit={onSubmit}
      />,
    );
    await tick();
    await press(view.stdin, enter, enter, 'y');
    expect(onSubmit).toHaveBeenCalledWith({name: 'kept', kind: 'library', git: true});
  });
});

describe('runWizard', () => {
  it('resolves with the answers and leaves a summary in the terminal', async () => {
    const terminal = fakeTerminal();
    const pending = runWizard(steps, {...terminal, title: 'Create', review: false});
    await tick();
    for (const key of [enter, enter, 'y']) {
      terminal.press(key);
      await tick();
    }
    await expect(pending).resolves.toEqual({name: 'demo', kind: 'library', git: true});
    expect(terminal.output()).toContain('Create · done');
  });

  it('cancels on Esc at the first question', async () => {
    const terminal = fakeTerminal();
    const pending = runWizard(steps, {...terminal, title: 'Create'});
    await tick();
    terminal.press(escape);
    await expect(pending).rejects.toBeInstanceOf(FormCancelledError);
  });
});
