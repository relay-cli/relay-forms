import {describe, expect, it} from 'vitest';
import {editText, textState} from '../src/prompts/text-editing.js';
import {keyOf} from './helpers.js';

const type = (text: string) => editText(textState(), text, keyOf());

describe('editText', () => {
  it('inserts typed and pasted text at the cursor', () => {
    const start = {value: 'helo', cursor: 3};
    expect(editText(start, 'l', keyOf())).toEqual({value: 'hello', cursor: 4});
    expect(type('two\nlines')).toEqual({value: 'two lines', cursor: 9});
  });

  it('moves and deletes by character, including wide characters', () => {
    const state = textState('a😀b');
    const left = editText(state, '', keyOf({leftArrow: true}));
    expect(left).toEqual({value: 'a😀b', cursor: 2});
    expect(editText({value: 'a😀b', cursor: 2}, '', keyOf({backspace: true}))).toEqual({
      value: 'ab',
      cursor: 1,
    });
    expect(editText({value: 'abc', cursor: 0}, '', keyOf({delete: true}))).toEqual({
      value: 'bc',
      cursor: 0,
    });
  });

  it('supports the readline shortcuts for words and lines', () => {
    const state = textState('npm run build');
    expect(editText(state, 'w', keyOf({ctrl: true}))).toEqual({value: 'npm run ', cursor: 8});
    expect(editText(state, 'u', keyOf({ctrl: true}))).toEqual({value: '', cursor: 0});
    expect(editText({value: 'abc', cursor: 1}, 'k', keyOf({ctrl: true}))).toEqual({
      value: 'a',
      cursor: 1,
    });
    expect(editText(state, 'a', keyOf({ctrl: true}))?.cursor).toBe(0);
  });

  it('leaves Enter, Esc, and Tab to the caller', () => {
    expect(editText(textState('x'), '', keyOf({return: true}))).toBeUndefined();
    expect(editText(textState('x'), '', keyOf({escape: true}))).toBeUndefined();
    expect(editText(textState('x'), '', keyOf({tab: true}))).toBeUndefined();
  });

  it('drops characters the field does not accept', () => {
    expect(editText(textState(), '4a2', keyOf(), (c) => /\d/.test(c))).toEqual({
      value: '42',
      cursor: 2,
    });
  });
});
