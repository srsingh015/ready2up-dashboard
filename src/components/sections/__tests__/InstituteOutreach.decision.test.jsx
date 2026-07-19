// Component tests for the Ready2UP Accept/Reject decision feature: toggling a
// decision persists to its own namespaced key, reflects on the control's
// pressed state, supports the decision filter, and rolls back with a "not
// saved" indicator when persistence fails. The decision axis is independent of
// the outreach pipeline status.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import InstituteOutreach from '../InstituteOutreach.jsx';

const DECISION_STORE_KEY = 'r2up_v1::io_lead_decision';

function makeData() {
  return {
    instituteOutreach: {
      offer: { headline: 'Modern institute sites' },
      leads: [
        {
          id: 'nsk-a',
          name: 'Alpha Law College',
          category: 'Law college',
          city: 'Nashik',
          weakness: 'Dated mobile view.',
          suggestedProof: 'Law college',
          proofUrl: 'https://www.navjeevanlawcollege.com/',
          contactAngle: 'Lead with the matched law build.',
        },
        {
          id: 'mum-b',
          name: 'Beta Pharmacy College',
          category: 'Pharmacy college',
          city: 'Mumbai',
          weakness: 'Slow on mobile.',
          suggestedProof: 'Pharmacy college',
          contactAngle: 'Pitch an enquiry-first site.',
        },
      ],
      pricingTiers: [],
      addOns: [],
      portfolioProof: [],
      outreachTemplates: [],
    },
  };
}

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('InstituteOutreach — Ready2UP decision (Accept/Reject)', () => {
  it('persists an Accept decision to its own key and marks the control pressed', () => {
    render(<InstituteOutreach data={makeData()} />);
    // Alpha (Nashik) sorts first.
    fireEvent.click(screen.getAllByRole('button', { name: /Accept lead/i })[0]);

    const stored = JSON.parse(localStorage.getItem(DECISION_STORE_KEY));
    expect(stored['nsk-a']).toBe('Accepted');
    expect(screen.getAllByRole('button', { name: /Accept lead/i })[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('persists a Reject decision independently of pipeline status', () => {
    render(<InstituteOutreach data={makeData()} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Reject lead/i })[0]);

    const stored = JSON.parse(localStorage.getItem(DECISION_STORE_KEY));
    expect(stored['nsk-a']).toBe('Rejected');
    expect(screen.getAllByRole('button', { name: /Reject lead/i })[0]).toHaveAttribute('aria-pressed', 'true');

    // Status store holds no override for this lead — the decision change did
    // not touch pipeline status.
    const statusStore = JSON.parse(localStorage.getItem('r2up_v1::io_lead_status') || '{}');
    expect(statusStore['nsk-a']).toBeUndefined();
  });

  it('toggles a decision back to Undecided when the active choice is clicked again', () => {
    render(<InstituteOutreach data={makeData()} />);
    fireEvent.click(screen.getAllByRole('button', { name: /Accept lead/i })[0]);
    expect(screen.getAllByRole('button', { name: /Accept lead/i })[0]).toHaveAttribute('aria-pressed', 'true');

    // Click Accept again → back to Undecided.
    fireEvent.click(screen.getAllByRole('button', { name: /Accept lead/i })[0]);
    const stored = JSON.parse(localStorage.getItem(DECISION_STORE_KEY));
    expect(stored['nsk-a']).toBe('Undecided');
    expect(screen.getAllByRole('button', { name: /Accept lead/i })[0]).toHaveAttribute('aria-pressed', 'false');
  });

  it('persists an In-progress decision and marks the control pressed', () => {
    render(<InstituteOutreach data={makeData()} />);
    fireEvent.click(screen.getAllByRole('button', { name: /in progress/i })[0]);

    const stored = JSON.parse(localStorage.getItem(DECISION_STORE_KEY));
    expect(stored['nsk-a']).toBe('In progress');
    expect(screen.getAllByRole('button', { name: /in progress/i })[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('filters leads by decision', () => {
    render(<InstituteOutreach data={makeData()} />);
    // Accept Alpha only.
    fireEvent.click(screen.getAllByRole('button', { name: /Accept lead/i })[0]);

    // Filter to "Accepted" → only Alpha remains.
    fireEvent.change(screen.getByLabelText('Filter by decision'), { target: { value: 'Accepted' } });
    expect(screen.getByText('Alpha Law College')).toBeInTheDocument();
    expect(screen.queryByText('Beta Pharmacy College')).not.toBeInTheDocument();
  });

  it('rolls back and flags "not saved" when the decision write fails', () => {
    render(<InstituteOutreach data={makeData()} />);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    fireEvent.click(screen.getAllByRole('button', { name: /Reject lead/i })[0]);

    expect(screen.getByText(/not saved/i)).toBeInTheDocument();
    // Decision rolled back to Undecided → the Reject control is not pressed.
    expect(screen.getAllByRole('button', { name: /Reject lead/i })[0]).toHaveAttribute('aria-pressed', 'false');
    spy.mockRestore();
  });
});
