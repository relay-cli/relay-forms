import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {describe, expect, it} from 'vitest';

const run = promisify(execFile);
const cli = fileURLToPath(new URL('../src/cli.tsx', import.meta.url));
const tsx = fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url));

describe('relay-forms command', () => {
  it('prints the demonstration without a terminal', async () => {
    const {stdout} = await run(process.execPath, [tsx, cli, '--demo', '--snapshot']);
    expect(stdout).toContain('Relay Forms');
  }, 30_000);

  it('prints the first step of the wizard demonstration', async () => {
    const {stdout} = await run(process.execPath, [tsx, cli, '--demo', 'wizard', '--snapshot']);
    expect(stdout).toContain('step 1 of 3');
    expect(stdout).toContain('Project name');
  }, 30_000);

  it('explains how to start when no mode is chosen', async () => {
    await expect(run(process.execPath, [tsx, cli])).rejects.toMatchObject({code: 2});
  }, 30_000);
});
