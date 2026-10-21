import {EventEmitter} from 'node:events';
import type {Key} from 'ink';

export const noKey: Key = {
  upArrow: false,
  downArrow: false,
  leftArrow: false,
  rightArrow: false,
  pageDown: false,
  pageUp: false,
  home: false,
  end: false,
  return: false,
  escape: false,
  ctrl: false,
  shift: false,
  tab: false,
  backspace: false,
  delete: false,
  meta: false,
  super: false,
  hyper: false,
  capsLock: false,
  numLock: false,
};

export const keyOf = (key: Partial<Key> = {}): Key => ({...noKey, ...key});

/** Give Ink a moment to read stdin and re-render. */
export const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 50));

class FakeStdout extends EventEmitter {
  readonly columns = 80;
  readonly rows = 24;
  readonly isTTY = true;
  output = '';
  write = (chunk: string): boolean => {
    this.output += chunk;
    return true;
  };
}

class FakeStdin extends EventEmitter {
  readonly isTTY = true;
  private pending: string | null = null;
  press = (data: string): void => {
    this.pending = data;
    this.emit('readable');
    this.emit('data', data);
  };
  read = (): string | null => {
    const data = this.pending;
    this.pending = null;
    return data;
  };
  setEncoding(): void {}
  setRawMode(): void {}
  resume(): void {}
  pause(): void {}
  ref(): void {}
  unref(): void {}
}

/** Streams that stand in for a terminal when a test calls a `run*` function. */
export const fakeTerminal = () => {
  const stdout = new FakeStdout();
  const stdin = new FakeStdin();
  return {
    stdout: stdout as unknown as NodeJS.WriteStream,
    stdin: stdin as unknown as NodeJS.ReadStream,
    patchConsole: false,
    press: stdin.press,
    output: () => stdout.output,
  };
};
