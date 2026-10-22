import {describe, expect, it} from 'vitest';
import {parseCliOptions} from '../src/cli/options.js';

describe('CLI options', () => {
  it('runs the prompts demonstration by default', () => {
    expect(parseCliOptions(['--demo', '--snapshot'])).toMatchObject({
      demo: 'prompts',
      snapshot: true,
      help: false,
    });
  });

  it('reads a demonstration name', () => {
    expect(parseCliOptions(['--demo', 'wizard']).demo).toBe('wizard');
    expect(parseCliOptions(['--demo=wizard']).demo).toBe('wizard');
    expect(() => parseCliOptions(['--demo=nope'])).toThrow('Unknown demonstration');
  });

  it('rejects unknown options', () => {
    expect(() => parseCliOptions(['--wat'])).toThrow('Unknown option');
  });
});
