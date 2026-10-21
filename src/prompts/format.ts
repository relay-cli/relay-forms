import {choiceLabel} from './choices.js';
import type {Field} from './types.js';

/** How an accepted answer is shown once a prompt is done. */
export const formatAnswer = (field: Field, value: unknown): string => {
  switch (field.kind) {
    case 'text':
      if (typeof value !== 'string') return '';
      return field.mask === true ? '•'.repeat(Math.min(Array.from(value).length, 12)) : value;
    case 'number':
      return typeof value === 'number' ? String(value) : '';
    case 'confirm':
      return value === true ? 'Yes' : 'No';
    case 'select': {
      const choice = field.options.find((option) => option.value === value);
      return choice === undefined ? '' : choiceLabel(choice);
    }
    case 'multiselect': {
      if (!Array.isArray(value)) return '';
      const picked = field.options.filter((option) => value.includes(option.value));
      return picked.length === 0 ? 'None' : picked.map(choiceLabel).join(', ');
    }
  }
};

/** Check the limits a field declares, before its own `validate`. */
export const checkLimits = (field: Field, value: unknown): string | undefined => {
  if (field.kind === 'text') {
    if (field.required === true && typeof value === 'string' && value.trim() === '')
      return 'Enter a value.';
  } else if (field.kind === 'number' && typeof value === 'number') {
    if (field.integer === true && !Number.isInteger(value)) return 'Enter a whole number.';
    if (field.min !== undefined && value < field.min) return `Enter ${field.min} or more.`;
    if (field.max !== undefined && value > field.max) return `Enter ${field.max} or less.`;
  } else if (field.kind === 'multiselect' && Array.isArray(value)) {
    if (field.min !== undefined && value.length < field.min) return `Pick at least ${field.min}.`;
    if (field.max !== undefined && value.length > field.max) return `Pick at most ${field.max}.`;
  }
  return undefined;
};

type AnyValidate = (value: unknown) => string | undefined | Promise<string | undefined>;

/**
 * Run a field's declared limits and then its own check. The result is only a
 * promise when the field's check returns one, so synchronous checks answer at once.
 */
export const validateAnswer = (
  field: Field,
  value: unknown,
): string | undefined | Promise<string | undefined> => {
  const limit = checkLimits(field, value);
  if (limit !== undefined) return limit;
  const validate = field.validate as AnyValidate | undefined;
  return validate?.(value);
};
