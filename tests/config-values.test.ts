import {mkdtemp, readdir, readFile, stat, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  diffValues,
  getValue,
  loadConfig,
  saveConfig,
  setValue,
  unsetValue,
} from '../src/config/index.js';
import type {Field} from '../src/prompts/index.js';

describe('dotted values', () => {
  const document = {server: {port: 8080, host: 'localhost'}, name: 'api'};

  it('reads and writes nested values without changing the original', () => {
    expect(getValue(document, 'server.port')).toBe(8080);
    expect(getValue(document, 'server.missing')).toBeUndefined();
    expect(getValue(document, 'name.length')).toBeUndefined();
    const next = setValue(document, 'server.tls.enabled', true);
    expect(next).toEqual({
      server: {port: 8080, host: 'localhost', tls: {enabled: true}},
      name: 'api',
    });
    expect(document.server).toEqual({port: 8080, host: 'localhost'});
  });

  it('removes values and the objects they leave empty', () => {
    expect(unsetValue(document, 'server.port')).toEqual({server: {host: 'localhost'}, name: 'api'});
    expect(unsetValue({a: {b: 1}}, 'a.b')).toEqual({});
    expect(unsetValue(document, 'nothing.here')).toBe(document);
  });

  it('refuses keys that would reach the object prototype', () => {
    expect(() => setValue({}, '__proto__.polluted', true)).toThrow('Invalid configuration key');
    expect(() => getValue({}, 'a..b')).toThrow('Invalid configuration key');
  });

  it('lists the fields that changed', () => {
    const fields: Field[] = [
      {kind: 'number', name: 'server.port', label: 'Port'},
      {kind: 'text', name: 'name', label: 'Name'},
    ];
    expect(diffValues(fields, document, setValue(document, 'server.port', 9090))).toEqual([
      {name: 'server.port', before: 8080, after: 9090},
    ]);
  });
});

describe('configuration files', () => {
  const directory = () => mkdtemp(join(tmpdir(), 'relay-forms-'));

  it('reads a missing or empty file as an empty document', async () => {
    const folder = await directory();
    await expect(loadConfig(join(folder, 'missing.json'))).resolves.toEqual({});
    await writeFile(join(folder, 'empty.json'), '\n');
    await expect(loadConfig(join(folder, 'empty.json'))).resolves.toEqual({});
  });

  it('refuses files that are not a JSON object', async () => {
    const folder = await directory();
    await writeFile(join(folder, 'broken.json'), '{"a":');
    await expect(loadConfig(join(folder, 'broken.json'))).rejects.toThrow('is not valid JSON');
    await writeFile(join(folder, 'list.json'), '[1, 2]');
    await expect(loadConfig(join(folder, 'list.json'))).rejects.toThrow(
      'must contain a JSON object',
    );
  });

  it('writes formatted JSON in place without leaving temporary files', async () => {
    const folder = await directory();
    const path = join(folder, 'nested', 'config.json');
    await saveConfig(path, {server: {port: 1}});
    expect(await readFile(path, 'utf8')).toBe('{\n  "server": {\n    "port": 1\n  }\n}\n');
    await saveConfig(path, {server: {port: 2}});
    await expect(loadConfig(path)).resolves.toEqual({server: {port: 2}});
    expect(await readdir(join(folder, 'nested'))).toEqual(['config.json']);
  });

  it.skipIf(process.platform === 'win32')(
    'keeps the permissions of the file it replaces',
    async () => {
      const folder = await directory();
      const path = join(folder, 'secret.json');
      await saveConfig(path, {token: 'a'}, {mode: 0o600});
      await saveConfig(path, {token: 'b'});
      expect((await stat(path)).mode & 0o777).toBe(0o600);
    },
  );
});
