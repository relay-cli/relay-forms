import type {Key} from 'ink';

/** A single-line value and the cursor position within it, counted in characters. */
export interface TextState {
  value: string;
  cursor: number;
}

const chars = (value: string): string[] => Array.from(value);

export const textState = (value = ''): TextState => ({value, cursor: chars(value).length});

const splice = (state: TextState, start: number, end: number, insert = ''): TextState => {
  const list = chars(state.value);
  const inserted = chars(insert);
  list.splice(start, end - start, ...inserted);
  return {value: list.join(''), cursor: start + inserted.length};
};

/** Keep only characters that belong on one line. */
const printable = (input: string): string =>
  input.replace(/\r\n|\r|\n|\t/g, ' ').replace(/\p{Cc}/gu, '');

const previousWordStart = (list: readonly string[], cursor: number): number => {
  let index = cursor;
  while (index > 0 && list[index - 1] === ' ') index -= 1;
  while (index > 0 && list[index - 1] !== ' ') index -= 1;
  return index;
};

/**
 * Apply a key press to a line of text. Returns `undefined` when the key is not
 * an editing key, so the caller can handle it, such as Enter or Esc.
 */
export const editText = (
  state: TextState,
  input: string,
  key: Key,
  accept: (character: string) => boolean = () => true,
): TextState | undefined => {
  const list = chars(state.value);
  const {cursor} = state;
  if (key.return || key.escape || key.tab || key.upArrow || key.downArrow) return undefined;
  if (key.leftArrow) return {...state, cursor: Math.max(0, cursor - 1)};
  if (key.rightArrow) return {...state, cursor: Math.min(list.length, cursor + 1)};
  if (key.home || (key.ctrl && input === 'a')) return {...state, cursor: 0};
  if (key.end || (key.ctrl && input === 'e')) return {...state, cursor: list.length};
  if (key.backspace) return cursor === 0 ? state : splice(state, cursor - 1, cursor);
  if (key.delete) return cursor === list.length ? state : splice(state, cursor, cursor + 1);
  if (key.ctrl && input === 'u') return splice(state, 0, cursor);
  if (key.ctrl && input === 'k') return splice(state, cursor, list.length);
  if (key.ctrl && input === 'w') return splice(state, previousWordStart(list, cursor), cursor);
  if (key.ctrl || key.meta) return undefined;
  const text = chars(printable(input)).filter(accept).join('');
  return text === '' ? state : splice(state, cursor, cursor, text);
};
