import { describe, it, expect } from 'vitest';

// Trivial smoke test confirming the Vitest + jsdom toolchain runs.
describe('toolchain smoke test', () => {
  it('runs arithmetic', () => {
    expect(1 + 1).toBe(2);
  });

  it('has a jsdom document available', () => {
    expect(typeof document).toBe('object');
    const el = document.createElement('div');
    el.textContent = 'hello';
    expect(el.textContent).toBe('hello');
  });
});
