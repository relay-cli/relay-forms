import React from 'react';
import {describe, expect, it} from 'vitest';
import {DemoForm, DemoWizard} from '../src/demo/index.js';
import {runForm} from '../src/run.js';
import {fakeTerminal, tick} from './helpers.js';

describe('demo setup flow', () => {
  it('walks through every kind of prompt', async () => {
    const terminal = fakeTerminal();
    const pending = runForm<Record<string, unknown>>(
      ({submit, cancel}) => <DemoForm onSubmit={submit} onCancel={cancel} />,
      terminal,
    );
    await tick();
    const keys = ['my-tool', '\r', '\u001B[B', '\r', ' ', '\r', '\r', '\r', 'y'];
    for (const key of keys) {
      terminal.press(key);
      await tick();
    }
    await expect(pending).resolves.toEqual({
      name: 'my-tool',
      packageManager: 'pnpm',
      features: ['lint'],
      port: 3000,
      token: '',
      git: true,
    });
    expect(terminal.output()).toContain('✔ Features · Linting');
  });
});

describe('demo wizard', () => {
  it('asks the service step only for web services', async () => {
    const terminal = fakeTerminal();
    const pending = runForm<Record<string, unknown>>(
      ({submit, cancel}) => <DemoWizard onSubmit={submit} onCancel={cancel} />,
      terminal,
    );
    await tick();
    // name, kind (service), package manager, features, port, token, git, review
    const keys = ['api', '\r', '\u001B[B', '\r', '\r', '\r', '\r', '\r', 'n', '\r'];
    for (const key of keys) {
      terminal.press(key);
      await tick();
    }
    await expect(pending).resolves.toEqual({
      name: 'api',
      kind: 'service',
      packageManager: 'npm',
      features: ['tests', 'lint'],
      port: 3000,
      token: '',
      git: false,
    });
    expect(terminal.output()).toContain('Relay Forms · done');
  });
});
