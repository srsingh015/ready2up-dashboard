// Component tests for pricing, portfolio proof, and template copy behaviour.
// Covers tier order/recommended/add-ons and the "pricing unavailable" path;
// proof anchors carrying safe rel/target and the exact category→URL mapping;
// and clipboard confirmation that clears within 5s plus the rejection path.
// Validates: Requirements 6.1, 6.8, 7.2, 7.3, 8.4, 8.5
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { PricingTiers, PortfolioProof, OutreachTemplates } from '../InstituteOutreach.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('PricingTiers', () => {
  const tiers = [
    { id: 'starter', name: 'Starter', priceRange: '₹20,000 – ₹35,000', scope: '4 to 6 page small site' },
    { id: 'standard', name: 'Standard', priceRange: '₹40,000 – ₹75,000', scope: '8 to 12 page admissions-focused site', recommended: true },
    { id: 'advanced', name: 'Advanced', priceRange: '₹90,000 – ₹1,50,000', scope: 'near-Navjeevan custom build' },
  ];
  const addOns = [
    { id: 'maintenance', name: 'Yearly maintenance', priceRange: '₹8,000 – ₹15,000 / year' },
    { id: 'seo', name: 'SEO' },
  ];

  it('renders exactly three tiers in Starter → Standard → Advanced order', () => {
    render(<PricingTiers pricingTiers={tiers} addOns={addOns} />);
    const headings = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
    const tierNames = headings.filter((t) => ['Starter', 'Standard', 'Advanced'].includes(t));
    expect(tierNames).toEqual(['Starter', 'Standard', 'Advanced']);
  });

  it('marks Standard as recommended and labels add-ons as quoted separately', () => {
    render(<PricingTiers pricingTiers={tiers} addOns={addOns} />);
    expect(screen.getByText(/recommended/i)).toBeInTheDocument();
    // The add-ons section is labeled and an add-on without a price range
    // falls back to a "quoted separately" label (header + fallback = 2).
    expect(screen.getAllByText(/quoted separately/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('SEO')).toBeInTheDocument();
  });

  it('shows "pricing unavailable" and no tier prices when pricing data is empty', () => {
    render(<PricingTiers pricingTiers={[]} addOns={[]} />);
    expect(screen.getByText(/pricing unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText('₹20,000 – ₹35,000')).not.toBeInTheDocument();
  });
});

describe('PortfolioProof', () => {
  const portfolioProof = [
    { category: 'MBA', urls: ['https://navjeevanmba.com/'] },
    {
      category: 'Trust/Foundation',
      urls: ['https://navjeevannashik.org/', 'https://navjeevanfoundationnashik.org/'],
    },
  ];

  it('renders one labeled group per category with the exact URL mapping', () => {
    render(<PortfolioProof portfolioProof={portfolioProof} />);
    expect(screen.getByText('MBA')).toBeInTheDocument();
    expect(screen.getByText('Trust/Foundation')).toBeInTheDocument();

    const mbaLink = screen.getByRole('link', { name: /navjeevanmba\.com/i });
    expect(mbaLink).toHaveAttribute('href', 'https://navjeevanmba.com/');
  });

  it('gives every link target=_blank and rel=noopener noreferrer', () => {
    render(<PortfolioProof portfolioProof={portfolioProof} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3); // 1 MBA + 2 Trust/Foundation
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});

describe('OutreachTemplates — clipboard behaviour', () => {
  const templates = [
    { id: 'e1', channel: 'email', label: 'Cold email', body: 'Dear [Institute Name], hello.' },
  ];

  function mockClipboard(impl) {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn(impl) },
    });
    return navigator.clipboard.writeText;
  }

  it('shows a copy confirmation that clears within 5s on success', async () => {
    vi.useFakeTimers();
    mockClipboard(() => Promise.resolve());
    render(<OutreachTemplates outreachTemplates={templates} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    });
    expect(screen.getByText(/copied/i)).toBeInTheDocument();

    // Advance within the 5s window — the confirmation must be gone.
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.queryByText(/copied/i)).not.toBeInTheDocument();
  });

  it('shows an error and leaves the template text unchanged on failure', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')));
    render(<OutreachTemplates outreachTemplates={templates} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    });

    expect(screen.getByText(/copy failed/i)).toBeInTheDocument();
    // The body text is still displayed verbatim.
    expect(screen.getByText('Dear [Institute Name], hello.')).toBeInTheDocument();
  });
});
