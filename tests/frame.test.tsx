import React from 'react';
import {Text} from 'ink';
import {render} from 'ink-testing-library';
import {describe, expect, it} from 'vitest';
import {FormFrame} from '../src/frame/index.js';

describe('FormFrame', () => {
  it('draws a title, a ruled body, and a footer', () => {
    const view = render(
      <FormFrame title="Setup" subtitle="step 1 of 3" footer={<Text>enter continue</Text>}>
        <Text>Project name</Text>
      </FormFrame>,
    );
    const lines = (view.lastFrame() ?? '').split('\n');
    expect(lines[0]).toContain('◆ Setup · step 1 of 3');
    expect(lines[1]).toMatch(/│ Project name/);
    expect(lines.at(-1)).toContain('enter continue');
  });

  it('truncates a title wider than the frame', () => {
    const view = render(<FormFrame title={'x'.repeat(80)} width={20} />);
    const first = (view.lastFrame() ?? '').split('\n')[0] ?? '';
    expect(first.length).toBeLessThanOrEqual(20);
  });
});
