import type {ReactNode} from 'react';
import {render, useInput, type Instance} from 'ink';

/** Thrown by `runForm` when the person cancels with Esc or Ctrl+C. */
export class FormCancelledError extends Error {
  constructor(message = 'The form was cancelled.') {
    super(message);
    this.name = 'FormCancelledError';
  }
}

export interface FormControls<T> {
  /** Finish the form with a value. The last frame stays in the terminal. */
  submit: (value: T) => void;
  /** Abandon the form. `runForm` rejects with `FormCancelledError`. */
  cancel: () => void;
}

export interface RunFormOptions {
  stdout?: NodeJS.WriteStream;
  stdin?: NodeJS.ReadStream;
  /** Print `console` output above the form instead of through it. Defaults to true. */
  patchConsole?: boolean;
}

const CancelOnInterrupt = ({cancel, children}: {cancel: () => void; children: ReactNode}) => {
  useInput((input, key) => {
    if (key.ctrl && input === 'c') cancel();
  });
  return children;
};

/**
 * Render a form in the current terminal position and resolve with the value it
 * submits. Unlike a full-screen application, the final frame stays in the
 * scrollback so the answers remain visible after the form closes.
 */
export const runForm = async <T,>(
  build: (controls: FormControls<T>) => ReactNode,
  options: RunFormOptions = {},
): Promise<T> => {
  // A form may finish during its first render, before `render` has returned,
  // so the outcome lives on an object the controls and the caller share.
  const state: {settled: boolean; result?: {value: T}; app?: Instance} = {settled: false};
  const controls: FormControls<T> = {
    submit: (value) => {
      if (state.settled) return;
      state.settled = true;
      state.result = {value};
      state.app?.unmount();
    },
    cancel: () => {
      if (state.settled) return;
      state.settled = true;
      state.app?.unmount();
    },
  };
  const app = render(
    <CancelOnInterrupt cancel={controls.cancel}>{build(controls)}</CancelOnInterrupt>,
    {
      exitOnCtrlC: false,
      patchConsole: options.patchConsole ?? true,
      ...(options.stdout === undefined ? {} : {stdout: options.stdout}),
      ...(options.stdin === undefined ? {} : {stdin: options.stdin}),
    },
  );
  state.app = app;
  if (state.settled) app.unmount();
  const interrupt = (): void => controls.cancel();
  process.once('SIGTERM', interrupt);
  try {
    await app.waitUntilExit();
  } finally {
    process.off('SIGTERM', interrupt);
  }
  if (state.result === undefined) throw new FormCancelledError();
  return state.result.value;
};
