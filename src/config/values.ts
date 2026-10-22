import type {Field} from '../prompts/index.js';

/** A configuration document: nested objects of JSON values. */
export type ConfigValues = Record<string, unknown>;

/** One field whose value differs from the value it started with. */
export interface ConfigChange {
  name: string;
  before: unknown;
  after: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const forbidden = new Set(['__proto__', 'prototype', 'constructor']);

const segments = (name: string): string[] => {
  const parts = name.split('.');
  if (parts.some((part) => part === '' || forbidden.has(part))) {
    throw new Error(`Invalid configuration key: ${name}`);
  }
  return parts;
};

/** Read a value by a dotted name such as `server.port`. */
export const getValue = (values: ConfigValues, name: string): unknown => {
  let current: unknown = values;
  for (const part of segments(name)) {
    if (!isRecord(current) || !Object.hasOwn(current, part)) return undefined;
    current = current[part];
  }
  return current;
};

/** Return a copy with a value set by dotted name, creating objects on the way. */
export const setValue = (values: ConfigValues, name: string, value: unknown): ConfigValues => {
  const [head, ...rest] = segments(name);
  if (head === undefined) return values;
  if (rest.length === 0) return {...values, [head]: value};
  const child = values[head];
  return {...values, [head]: setValue(isRecord(child) ? child : {}, rest.join('.'), value)};
};

const without = (values: ConfigValues, key: string): ConfigValues =>
  Object.fromEntries(Object.entries(values).filter(([candidate]) => candidate !== key));

/** Return a copy without a value, removing objects that become empty. */
export const unsetValue = (values: ConfigValues, name: string): ConfigValues => {
  const [head, ...rest] = segments(name);
  if (head === undefined || !Object.hasOwn(values, head)) return values;
  if (rest.length === 0) return without(values, head);
  const child = values[head];
  if (!isRecord(child)) return values;
  const next = unsetValue(child, rest.join('.'));
  return Object.keys(next).length === 0 ? without(values, head) : {...values, [head]: next};
};

const same = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);

/** The fields whose values differ between two documents, in field order. */
export const diffValues = (
  fields: readonly Field[],
  before: ConfigValues,
  after: ConfigValues,
): ConfigChange[] =>
  fields
    .map((field) => ({
      name: field.name,
      before: getValue(before, field.name),
      after: getValue(after, field.name),
    }))
    .filter((change) => !same(change.before, change.after));

/** Whether a stored value can be shown and edited by a field of this kind. */
export const fitsField = (field: Field, value: unknown): boolean => {
  switch (field.kind) {
    case 'text':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'confirm':
      return typeof value === 'boolean';
    case 'select':
      return field.options.some((option) => option.value === value);
    case 'multiselect':
      return (
        Array.isArray(value) &&
        value.every((item) => field.options.some((option) => option.value === item))
      );
  }
};
