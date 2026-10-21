import {describe, expect, it} from 'vitest';
import {firstEnabled, moveIndex, windowStart} from '../src/prompts/choices.js';

const choices = [
  {value: 'a'},
  {value: 'b', disabled: true},
  {value: 'c'},
  {value: 'd', disabled: 'coming soon'},
];

describe('choice movement', () => {
  it('skips disabled choices and wraps at either end', () => {
    expect(moveIndex(choices, 0, 1)).toBe(2);
    expect(moveIndex(choices, 2, 1)).toBe(0);
    expect(moveIndex(choices, 0, -1)).toBe(2);
  });

  it('starts on the first enabled choice', () => {
    expect(firstEnabled(choices, 1)).toBe(2);
    expect(firstEnabled(choices, 0)).toBe(0);
  });

  it('stays put when nothing else can be picked', () => {
    expect(moveIndex([{value: 'only'}], 0, 1)).toBe(0);
  });

  it('scrolls a long list so the highlighted row stays visible', () => {
    expect(windowStart(3, 2, 7)).toBe(0);
    expect(windowStart(20, 0, 5)).toBe(0);
    expect(windowStart(20, 10, 5)).toBe(8);
    expect(windowStart(20, 19, 5)).toBe(15);
  });
});
