// Feature: institute-outreach, Property 14: for any outreach template, the
// string handed to the clipboard equals the template body exactly — including
// any placeholder tokens verbatim — with no substitution or transformation.
// Validates: Requirements 8.2, 8.3
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import fc from 'fast-check';
import { OutreachTemplates } from '../InstituteOutreach.jsx';

// Arbitrary template bodies including placeholder tokens, newlines, unicode,
// punctuation and whitespace so we exercise "verbatim, no transformation".
const bodyArb = fc.string({ minLength: 0, maxLength: 400 });
const tokenArb = fc.constantFrom(
  '[Institute Name]',
  '[Your Name]',
  '[Recipient Name]',
  '[Matched Navjeevan Link]',
  '₹40,000 – ₹75,000'
);
const richBodyArb = fc
  .tuple(bodyArb, tokenArb, bodyArb)
  .map(([a, token, b]) => `${a}${token}\n${b}`);

const templateArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 12 }).map((s) => `t-${s}`),
  channel: fc.constantFrom('email', 'WhatsApp'),
  label: fc.string({ minLength: 1, maxLength: 40 }),
  body: richBodyArb,
});

describe('Property 14: template copy fidelity', () => {
  let writeText;

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('hands the clipboard the exact template body, tokens verbatim', () => {
    fc.assert(
      fc.property(templateArb, (template) => {
        writeText.mockClear();
        cleanup();

        render(<OutreachTemplates outreachTemplates={[template]} />);
        const copyBtn = screen.getByRole('button', { name: /copy/i });
        fireEvent.click(copyBtn);

        expect(writeText).toHaveBeenCalledTimes(1);
        // The string handed to the clipboard is byte-for-byte the body.
        expect(writeText).toHaveBeenCalledWith(template.body);
      }),
      { numRuns: 100 }
    );
  });
});
