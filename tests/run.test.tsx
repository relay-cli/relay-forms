import React, {useEffect} from 'react';
import {Text} from 'ink';
import {describe, expect, it} from 'vitest';
import {FormCancelledError, runForm, type FormControls} from '../src/run.js';
import {fakeTerminal} from './helpers.js';

const Immediate = ({controls, value}: {controls: FormControls<string>; value?: string}) => {
  useEffect(() => {
    if (value === undefined) controls.cancel();
    else controls.submit(value);
  }, [controls, value]);
  return <Text>working</Text>;
};

describe('runForm', () => {
  it('resolves with the submitted value', async () => {
    const terminal = fakeTerminal();
    await expect(
      runForm((controls) => <Immediate controls={controls} value="done" />, terminal),
    ).resolves.toBe('done');
  });

  it('rejects when the form is cancelled', async () => {
    const terminal = fakeTerminal();
    await expect(
      runForm<string>((controls) => <Immediate controls={controls} />, terminal),
    ).rejects.toBeInstanceOf(FormCancelledError);
  });

  it('cancels on Ctrl+C', async () => {
    const terminal = fakeTerminal();
    const pending = runForm<string>(() => <Text>waiting</Text>, terminal);
    await new Promise((resolve) => setTimeout(resolve, 20));
    terminal.press('\u0003');
    await expect(pending).rejects.toBeInstanceOf(FormCancelledError);
  });
});
