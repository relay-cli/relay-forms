/**
 * Checks an answer before it is accepted. Return a message to show beneath the
 * prompt, or `undefined` to accept. A promise lets the check reach the network.
 */
export type Validate<V> = (value: V) => string | undefined | Promise<string | undefined>;

interface FieldBase<V> {
  /** The key the answer is stored under. */
  name: string;
  /** The question shown to the person. */
  label: string;
  /** A short explanation shown beneath the question while it is active. */
  hint?: string;
  validate?: Validate<V>;
}

export interface TextField extends FieldBase<string> {
  kind: 'text';
  initial?: string;
  /** Muted text shown while the value is empty. */
  placeholder?: string;
  /** Hide the value on screen, for tokens and passwords. */
  mask?: boolean;
  /** Reject an empty answer. */
  required?: boolean;
}

export interface NumberField extends FieldBase<number> {
  kind: 'number';
  initial?: number;
  min?: number;
  max?: number;
  /** Reject fractions. */
  integer?: boolean;
}

export interface ConfirmField extends FieldBase<boolean> {
  kind: 'confirm';
  initial?: boolean;
}

export interface Choice<V extends string = string> {
  value: V;
  /** Defaults to the value. */
  label?: string;
  hint?: string;
  /** A disabled choice is shown but cannot be picked. A string explains why. */
  disabled?: boolean | string;
}

export interface SelectField<V extends string = string> extends FieldBase<V> {
  kind: 'select';
  options: readonly Choice<V>[];
  initial?: V;
  /** The most options shown at once before the list scrolls. Defaults to 7. */
  limit?: number;
}

export interface MultiSelectField<V extends string = string> extends FieldBase<V[]> {
  kind: 'multiselect';
  options: readonly Choice<V>[];
  initial?: readonly V[];
  /** The fewest options that must be picked. */
  min?: number;
  /** The most options that may be picked. */
  max?: number;
  limit?: number;
}

export type Field = TextField | NumberField | ConfirmField | SelectField | MultiSelectField;

/** The type of answer a field produces. */
export type FieldValue<F> = F extends TextField
  ? string
  : F extends NumberField
    ? number
    : F extends ConfirmField
      ? boolean
      : F extends {kind: 'select'; options: readonly Choice<infer V>[]}
        ? V
        : F extends {kind: 'multiselect'; options: readonly Choice<infer V>[]}
          ? V[]
          : never;

/** The answers a list of fields produces, keyed by field name. */
export type Answers<Fields extends readonly Field[]> = {
  [F in Fields[number] as F['name']]: FieldValue<F>;
};

/** Keep the literal names and option values of a field list so answers are typed. */
export const defineFields = <const Fields extends readonly Field[]>(fields: Fields): Fields =>
  fields;
