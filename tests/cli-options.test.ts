import {describe, expect, it} from 'vitest';
import {parseCliOptions} from '../src/cli/options.js';

describe('CLI options', () => {
  it('reads the demonstration flags', () => {
    expect(parseCliOptions(['--demo', '--snapshot'])).toMatchObject({
      demo: true,
      snapshot: true,
      help: false,
    });
  });

  it('rejects unknown options', () => {
    expect(() => parseCliOptions(['--wat'])).toThrow('Unknown option');
  });
});
