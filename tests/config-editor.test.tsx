import {mkdtemp, readFile, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import React from 'react';
import {render} from 'ink-testing-library';
import {describe, expect, it, vi} from 'vitest';
import {ConfigEditor, editConfig} from '../src/config/index.js';
import type {Field} from '../src/prompts/index.js';
import {fakeTerminal, tick} from './helpers.js';

const enter = '\r';
const escape = '\u001B';
const down = '\u001B[B';
const backspace = '\u007F';

const fields: Field[] = [
  {kind: 'text', name: 'name', label: 'Name', required: true},
  {kind: 'number', name: 'server.port', label: 'Port', initial: 3000, min: 1, max: 65535},
  {kind: 'select', name: 'log', label: 'Log level', options: [{value: 'info'}, {value: 'debug'}]},
  {kind: 'text', name: 'token', label: 'Token', mask: true},
];

const press = async (stdin: {write: (data: string) => void}, ...keys: string[]) => {
  for (const key of keys) {
    stdin.write(key);
    await tick();
  }
};

const editor = (values: Record<string, unknown>) => {
  const onSave = vi.fn();
  const onQuit = vi.fn();
  const view = render(
    <ConfigEditor
      title="Settings"
      fields={fields}
      values={values}
      onSave={onSave}
      onQuit={onQuit}
    />,
  );
  return {view, onSave, onQuit};
};

describe('ConfigEditor', () => {
  it('lists current values, defaults, unset values, and invalid ones', async () => {
    const {view} = editor({name: 'api', log: 'verbose', token: 'secret'});
    await tick();
    const frame = view.lastFrame() ?? '';
    expect(frame).toContain('Name      api');
    expect(frame).toContain('Port      3000 (default)');
    expect(frame).toContain('Log level "verbose" (invalid)');
    expect(frame).toContain('Token     ••••••');
    expect(frame).not.toContain('secret');
  });

  it('edits a value with its prompt and saves the changes', async () => {
    const {view, onSave} = editor({name: 'api', other: 'kept'});
    await tick();
    await press(view.stdin, down, enter, backspace, backspace, backspace, backspace, '8080', enter);
    expect(view.lastFrame()).toContain('1 unsaved change');
    expect(view.lastFrame()).toContain('● Port      8080');
    await press(view.stdin, 's');
    expect(onSave).toHaveBeenCalledWith({name: 'api', other: 'kept', server: {port: 8080}}, [
      {name: 'server.port', before: undefined, after: 8080},
    ]);
    expect(view.lastFrame()).toContain('Port · default → 8080');
  });

  it('keeps the value when an edit is abandoned or invalid', async () => {
    const {view} = editor({name: 'api'});
    await tick();
    await press(view.stdin, down, enter, '000', enter);
    expect(view.lastFrame()).toContain('Enter 65535 or less.');
    await press(view.stdin, escape);
    await tick();
    expect(view.lastFrame()).toContain('Port      3000 (default)');
    expect(view.lastFrame()).not.toContain('unsaved');
  });

  it('reverts a setting and clears one back to its default', async () => {
    const {view} = editor({name: 'api', server: {port: 80}});
    await tick();
    await press(view.stdin, down, backspace);
    expect(view.lastFrame()).toContain('Port      3000 (default)');
    await press(view.stdin, 'r');
    expect(view.lastFrame()).toContain('Port      80');
    expect(view.lastFrame()).not.toContain('unsaved');
  });

  it('asks before discarding unsaved changes', async () => {
    const {view, onQuit} = editor({name: 'api'});
    await tick();
    await press(view.stdin, down, down, enter, down, enter, 'q');
    expect(view.lastFrame()).toContain('Discard 1 unsaved change?');
    await press(view.stdin, 'n');
    expect(onQuit).not.toHaveBeenCalled();
    await press(view.stdin, 'q', 'y');
    expect(onQuit).toHaveBeenCalled();
  });

  it('quits at once when nothing changed', async () => {
    const {view, onQuit} = editor({name: 'api'});
    await tick();
    await press(view.stdin, 'q');
    expect(onQuit).toHaveBeenCalled();
  });
});

describe('editConfig', () => {
  it('writes the file only when the person saves a change', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'relay-forms-'));
    const path = join(folder, 'config.json');
    await writeFile(path, '{"name": "api", "extra": [1]}');

    const quit = fakeTerminal();
    const unchanged = editConfig(path, fields, quit);
    await tick();
    quit.press('q');
    await expect(unchanged).resolves.toMatchObject({saved: false, changes: []});
    expect(await readFile(path, 'utf8')).toBe('{"name": "api", "extra": [1]}');

    const terminal = fakeTerminal();
    const pending = editConfig(path, fields, terminal);
    await tick();
    for (const key of [down, down, enter, down, enter, 's']) {
      terminal.press(key);
      await tick();
    }
    await expect(pending).resolves.toMatchObject({saved: true});
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual({
      name: 'api',
      extra: [1],
      log: 'debug',
    });
    expect(terminal.output()).toContain('Log level · default → debug');
  });
});
