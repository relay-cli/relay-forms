import type {Choice} from './types.js';

export const isEnabled = (choice: Choice): boolean =>
  choice.disabled === undefined || choice.disabled === false;

/**
 * The index of the next enabled choice in a direction, wrapping at either end.
 * Returns the current index when no other choice is enabled.
 */
export const moveIndex = (choices: readonly Choice[], index: number, step: 1 | -1): number => {
  const length = choices.length;
  for (let offset = 1; offset <= length; offset += 1) {
    const next = (((index + step * offset) % length) + length) % length;
    const choice = choices[next];
    if (choice !== undefined && isEnabled(choice)) return next;
  }
  return index;
};

/** The first enabled index at or after a preferred one. */
export const firstEnabled = (choices: readonly Choice[], preferred = 0): number => {
  const start = Math.max(0, Math.min(preferred, choices.length - 1));
  const choice = choices[start];
  if (choice !== undefined && isEnabled(choice)) return start;
  return moveIndex(choices, start, 1);
};

/** The first row of a scrolled list so that the highlighted row stays visible. */
export const windowStart = (length: number, index: number, limit: number): number => {
  if (length <= limit) return 0;
  const centered = index - Math.floor(limit / 2);
  return Math.max(0, Math.min(centered, length - limit));
};

export const choiceLabel = (choice: Choice): string => choice.label ?? choice.value;
