import React from 'react';
import {render} from 'ink-testing-library';
import {describe, expect, expectTypeOf, it, vi} from 'vitest';
import {ask, askAll, defineFields, Prompt, PromptList, type Field} from '../src/prompts/index.js';
import {FormCancelledError} from '../src/run.js';
import {fakeTerminal, tick} from './helpers.js';

const enter = '\r';
const escape = '\u001B';
const down = '\u001B[B';
const backspace = '\u007F';

const press = async (stdin: {write: (data: string) => void}, ...keys: string[]) => {
  for (const key of keys) {
    stdin.write(key);
    await tick();
  }
};

describe('Prompt', () => {
  it('edits text and collapses to the answer once accepted', async () => {
    const onSubmit = vi.fn();
    const field: Field = {kind: 'text', name: 'name', label: 'Project name', initial: 'demo'};
    const view = render(<Prompt field={field} onSubmit={onSubmit} />);
    await tick();
    expect(view.lastFrame()).toContain('? Project name demo');
    await press(view.stdin, backspace, 'x', enter);
    expect(onSubmit).toHaveBeenCalledWith('demx');
    expect(view.lastFrame()).toContain('✔ Project name · demx');
  });

  it('shows a validation message and keeps the prompt open', async () => {
    const onSubmit = vi.fn();
    const field: Field = {
      kind: 'text',
      name: 'name',
      label: 'Name',
      validate: (value) => (value.length < 3 ? 'Use at least 3 characters.' : undefined),
    };
    const view = render(<Prompt field={field} onSubmit={onSubmit} />);
    await tick();
    await press(view.stdin, 'ab', enter);
    expect(view.lastFrame()).toContain('✖ Use at least 3 characters.');
    expect(onSubmit).not.toHaveBeenCalled();
    await press(view.stdin, 'c');
    expect(view.lastFrame()).not.toContain('✖');
    await press(view.stdin, enter);
    expect(onSubmit).toHaveBeenCalledWith('abc');
  });

  it('shows progress while an asynchronous check runs', async () => {
    let finish: (message: string | undefined) => void = () => undefined;
    const onSubmit = vi.fn();
    const field: Field = {
      kind: 'text',
      name: 'token',
      label: 'Token',
      validate: () =>
        new Promise<string | undefined>((resolve) => {
          finish = resolve;
        }),
    };
    const view = render(<Prompt field={field} onSubmit={onSubmit} />);
    await tick();
    await press(view.stdin, 'abc', enter);
    expect(view.lastFrame()).toContain('Checking…');
    finish('The registry rejected this token.');
    await tick();
    expect(view.lastFrame()).toContain('✖ The registry rejected this token.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('masks secret text', async () => {
    const field: Field = {kind: 'text', name: 'token', label: 'Token', mask: true};
    const view = render(<Prompt field={field} onSubmit={() => undefined} />);
    await tick();
    await press(view.stdin, 'hunter2');
    expect(view.lastFrame()).not.toContain('hunter2');
    expect(view.lastFrame()).toContain('•••••••');
  });

  it('reads numbers and rejects text that is not one', async () => {
    const onSubmit = vi.fn();
    const field: Field = {kind: 'number', name: 'port', label: 'Port', max: 9999};
    const view = render(<Prompt field={field} onSubmit={onSubmit} />);
    await tick();
    await press(view.stdin, enter);
    expect(view.lastFrame()).toContain('Enter a number.');
    await press(view.stdin, '12345', enter);
    expect(view.lastFrame()).toContain('Enter 9999 or less.');
    await press(view.stdin, backspace, enter);
    expect(onSubmit).toHaveBeenCalledWith(1234);
  });

  it('answers a confirmation with y or n', async () => {
    const onSubmit = vi.fn();
    const field: Field = {kind: 'confirm', name: 'git', label: 'Initialize git?'};
    const view = render(<Prompt field={field} onSubmit={onSubmit} />);
    await tick();
    await press(view.stdin, 'y');
    expect(onSubmit).toHaveBeenCalledWith(true);
    expect(view.lastFrame()).toContain('Initialize git? · Yes');
  });

  it('picks one option, skipping disabled ones', async () => {
    const onSubmit = vi.fn();
    const field: Field = {
      kind: 'select',
      name: 'pm',
      label: 'Package manager',
      options: [{value: 'npm'}, {value: 'yarn', disabled: 'not installed'}, {value: 'pnpm'}],
    };
    const view = render(<Prompt field={field} onSubmit={onSubmit} />);
    await tick();
    expect(view.lastFrame()).toContain('yarn (not installed)');
    await press(view.stdin, down, enter);
    expect(onSubmit).toHaveBeenCalledWith('pnpm');
  });

  it('toggles several options and enforces a minimum', async () => {
    const onSubmit = vi.fn();
    const field: Field = {
      kind: 'multiselect',
      name: 'features',
      label: 'Features',
      options: [{value: 'lint'}, {value: 'test'}, {value: 'docs'}],
      min: 1,
    };
    const view = render(<Prompt field={field} onSubmit={onSubmit} />);
    await tick();
    await press(view.stdin, enter);
    expect(view.lastFrame()).toContain('Pick at least 1.');
    await press(view.stdin, ' ', down, down, ' ', enter);
    expect(onSubmit).toHaveBeenCalledWith(['lint', 'docs']);
  });

  it('scrolls a long list', async () => {
    const field: Field = {
      kind: 'select',
      name: 'region',
      label: 'Region',
      limit: 3,
      options: Array.from({length: 10}, (_, index) => ({value: `region-${index}`})),
    };
    const view = render(<Prompt field={field} onSubmit={() => undefined} />);
    await tick();
    expect(view.lastFrame()).toContain('↓ 7 more');
    await press(view.stdin, down, down, down);
    expect(view.lastFrame()).toContain('↑ 2 more');
    expect(view.lastFrame()).toContain('› region-3');
  });

  it('calls onCancel on Esc', async () => {
    const onCancel = vi.fn();
    const field: Field = {kind: 'text', name: 'n', label: 'N'};
    const view = render(<Prompt field={field} onSubmit={() => undefined} onCancel={onCancel} />);
    await tick();
    await press(view.stdin, escape);
    await tick();
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('ask', () => {
  it('resolves with the answer and leaves it in the terminal', async () => {
    const terminal = fakeTerminal();
    const answer = ask({kind: 'confirm', name: 'ok', label: 'Continue?', initial: true}, terminal);
    await tick();
    terminal.press(enter);
    await expect(answer).resolves.toBe(true);
    expect(terminal.output()).toContain('Continue? · Yes');
  });

  it('rejects when cancelled', async () => {
    const terminal = fakeTerminal();
    const answer = ask({kind: 'text', name: 'n', label: 'Name'}, terminal);
    await tick();
    terminal.press(escape);
    await expect(answer).rejects.toBeInstanceOf(FormCancelledError);
  });
});

describe('askAll', () => {
  it('asks each field in order and types the answers', async () => {
    const fields = defineFields([
      {kind: 'text', name: 'name', label: 'Name'},
      {
        kind: 'select',
        name: 'pm',
        label: 'Package manager',
        options: [{value: 'npm'}, {value: 'pnpm'}],
      },
      {kind: 'confirm', name: 'git', label: 'Git?'},
    ]);
    const terminal = fakeTerminal();
    const pending = askAll(fields, {...terminal, initialValues: {name: 'demo'}});
    await tick();
    for (const key of [enter, down, enter, 'n']) {
      terminal.press(key);
      await tick();
    }
    const answers = await pending;
    expect(answers).toEqual({name: 'demo', pm: 'pnpm', git: false});
    expectTypeOf(answers).toEqualTypeOf<{name: string; pm: 'npm' | 'pnpm'; git: boolean}>();
  });
});

describe('PromptList', () => {
  it('returns to the previous question on Esc, keeping its answer', async () => {
    const fields: Field[] = [
      {kind: 'text', name: 'first', label: 'First'},
      {kind: 'text', name: 'second', label: 'Second'},
    ];
    const onSubmit = vi.fn();
    const view = render(<PromptList fields={fields} onSubmit={onSubmit} />);
    await tick();
    await press(view.stdin, 'a', enter, escape);
    expect(view.lastFrame()).toContain('? First a');
    await press(view.stdin, 'b', enter, 'c', enter);
    expect(onSubmit).toHaveBeenCalledWith({first: 'ab', second: 'c'});
  });
});
