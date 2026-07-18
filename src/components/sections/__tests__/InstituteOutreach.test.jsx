// Component tests for the Institute Outreach section: lead rendering,
// placeholders for missing fields, status editing + persistence with verified
// read-back, reactivity of pipeline counts, and the empty / zero-match states.
// Validates: Requirements 4.4, 4.5, 5.1, 5.2, 5.6, 9.2, 1.6, 4.9
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import InstituteOutreach from '../InstituteOutreach.jsx';

const LEAD_STORE_KEY = 'r2up_v1::io_lead_status';

function makeData(overrides = {}) {
  return {
    instituteOutreach: {
      offer: { headline: 'Modern institute sites', description: 'We build them.' },
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
          id: 'pun-b',
          name: 'Beta School',
          category: 'School',
          city: 'Pune',
          weakness: '', // intentionally empty → placeholder
          suggestedProof: 'School',
          contactAngle: '', // intentionally empty → placeholder
        },
      ],
      pricingTiers: [
        { id: 'starter', name: 'Starter', priceRange: '₹20,000 – ₹35,000', scope: '4 to 6 page small site' },
        { id: 'standard', name: 'Standard', priceRange: '₹40,000 – ₹75,000', scope: '8 to 12 page admissions-focused site', recommended: true },
        { id: 'advanced', name: 'Advanced', priceRange: '₹90,000 – ₹1,50,000', scope: 'near-Navjeevan custom build' },
      ],
      addOns: [{ id: 'seo', name: 'SEO' }],
      portfolioProof: [
        { category: 'Law college', urls: ['https://www.navjeevanlawcollege.com/'] },
        { category: 'School', urls: ['https://navjeevanschoolnashik.com/'] },
      ],
      outreachTemplates: [
        { id: 'e1', channel: 'email', label: 'Cold email', body: 'Hi [Institute Name]' },
      ],
      ...overrides,
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

describe('InstituteOutreach — content guard', () => {
  it('renders an unavailable state when instituteOutreach is absent', () => {
    render(<InstituteOutreach data={{}} />);
    expect(screen.getByText(/content is currently unavailable/i)).toBeInTheDocument();
  });
});

describe('InstituteOutreach — lead rendering', () => {
  it('renders all required fields for a lead', () => {
    render(<InstituteOutreach data={makeData()} />);
    expect(screen.getByText('Alpha Law College')).toBeInTheDocument();
    // category appears as a pill
    expect(screen.getAllByText('Law college').length).toBeGreaterThan(0);
    expect(screen.getByText('Dated mobile view.')).toBeInTheDocument();
    expect(screen.getByText('Lead with the matched law build.')).toBeInTheDocument();
    // suggested proof link points at the matched Navjeevan URL
    const proofLink = screen.getByRole('link', { name: /Law college/i });
    expect(proofLink).toHaveAttribute('href', 'https://www.navjeevanlawcollege.com/');
    expect(proofLink).toHaveAttribute('target', '_blank');
    expect(proofLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows placeholders for missing weakness and contact angle', () => {
    render(<InstituteOutreach data={makeData()} />);
    // Beta School has empty weakness and angle → two placeholders
    const placeholders = screen.getAllByText('— not available');
    expect(placeholders.length).toBeGreaterThanOrEqual(2);
  });
});

describe('InstituteOutreach — status editing & persistence', () => {
  it('writes the namespaced key on a successful status change', () => {
    render(<InstituteOutreach data={makeData()} />);
    const selects = screen.getAllByLabelText('Lead status');
    // First lead is Alpha Law College (Nashik sorts first, single lead in group).
    fireEvent.change(selects[0], { target: { value: 'Contacted' } });

    const stored = JSON.parse(localStorage.getItem(LEAD_STORE_KEY));
    expect(stored['nsk-a']).toBe('Contacted');
  });

  it('updates only the changed lead and reflects it in pipeline counts without reload', () => {
    render(<InstituteOutreach data={makeData()} />);
    const selects = screen.getAllByLabelText('Lead status');
    const alphaSelect = selects[0];
    const betaSelect = selects[1];

    fireEvent.change(alphaSelect, { target: { value: 'Closed won' } });

    // Only Alpha changed.
    expect(alphaSelect.value).toBe('Closed won');
    expect(betaSelect.value).toBe('Not contacted');

    // Pipeline conversion reacts: 1 of 2 closed won = 50%.
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('rolls back and shows a "not saved" indicator when persistence fails', () => {
    render(<InstituteOutreach data={makeData()} />);
    const selects = screen.getAllByLabelText('Lead status');
    const alphaSelect = selects[0];

    // Force the write to fail so verified read-back cannot confirm it.
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    fireEvent.change(alphaSelect, { target: { value: 'Replied' } });

    expect(screen.getByText(/not saved/i)).toBeInTheDocument();
    // Value rolled back to the previous (default) status.
    expect(alphaSelect.value).toBe('Not contacted');
    spy.mockRestore();
  });
});

describe('InstituteOutreach — empty & zero-match states', () => {
  it('shows a seed empty-state when there are no leads', () => {
    render(<InstituteOutreach data={makeData({ leads: [] })} />);
    expect(screen.getByText(/no leads have been added yet/i)).toBeInTheDocument();
  });

  it('shows a zero-match state with filters still mounted when nothing matches', () => {
    render(<InstituteOutreach data={makeData()} />);
    // Filter to a city with no leads (Mumbai) → zero match.
    fireEvent.change(screen.getByLabelText('Filter by city'), { target: { value: 'Mumbai' } });

    expect(screen.getByText(/no leads match the current filters/i)).toBeInTheDocument();
    // Filters remain mounted and interactive.
    expect(screen.getByLabelText('Filter by city')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
  });
});
