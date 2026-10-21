import {describe, expect, it} from 'vitest';
import {formatAnswer, validateAnswer} from '../src/prompts/format.js';
import type {Field} from '../src/prompts/types.js';

const features: Field = {
  kind: 'multiselect',
  name: 'features',
  label: 'Features',
  options: [{value: 'lint', label: 'Linting'}, {value: 'test'}],
  min: 1,
};

describe('formatAnswer', () => {
  it('shows answers the way a person picked them', () => {
    expect(formatAnswer(features, ['lint', 'test'])).toBe('Linting, test');
    expect(formatAnswer(features, [])).toBe('None');
    expect(formatAnswer({kind: 'confirm', name: 'ok', label: 'OK'}, true)).toBe('Yes');
  });

  it('never prints a masked value', () => {
    const token: Field = {kind: 'text', name: 'token', label: 'Token', mask: true};
    expect(formatAnswer(token, 'secret')).toBe('••••••');
  });
});

describe('validateAnswer', () => {
  it('applies the limits a field declares', async () => {
    const port: Field = {
      kind: 'number',
      name: 'port',
      label: 'Port',
      min: 1,
      max: 65535,
      integer: true,
    };
    expect(await validateAnswer(port, 0)).toBe('Enter 1 or more.');
    expect(await validateAnswer(port, 80.5)).toBe('Enter a whole number.');
    expect(await validateAnswer(port, 8080)).toBeUndefined();
    expect(await validateAnswer(features, [])).toBe('Pick at least 1.');
    expect(await validateAnswer({kind: 'text', name: 'n', label: 'N', required: true}, '  ')).toBe(
      'Enter a value.',
    );
  });

  it('runs the field check after the limits, including async checks', async () => {
    const name: Field = {
      kind: 'text',
      name: 'name',
      label: 'Name',
      required: true,
      validate: (value) => Promise.resolve(value.includes(' ') ? 'No spaces.' : undefined),
    };
    expect(await validateAnswer(name, '')).toBe('Enter a value.');
    expect(await validateAnswer(name, 'a b')).toBe('No spaces.');
    expect(await validateAnswer(name, 'ab')).toBeUndefined();
  });
});
