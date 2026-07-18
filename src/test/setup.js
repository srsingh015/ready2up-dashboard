// Vitest global setup: register @testing-library/jest-dom custom matchers
// (e.g. toBeInTheDocument, toHaveTextContent) for all test files.
import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement a few browser APIs the dashboard relies on. Polyfill
// them so component tests can render sections that use charts (Recharts'
// ResponsiveContainer needs ResizeObserver) and the Layout scroll-reset effect.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// jsdom provides a `scrollTo` stub that throws "Not implemented"; override it
// with a no-op so the Layout scroll-reset effect runs quietly under test.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}
