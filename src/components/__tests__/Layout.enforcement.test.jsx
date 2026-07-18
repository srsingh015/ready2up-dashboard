// Section-rendering + enforcement tests for the server-side access-control
// Layout. Navigation and section rendering are a pure reflection of the content
// that actually arrived from the server (RLS-filtered): a nav entry appears iff
// its backing content is present, and a section a role may not see simply has
// no data and no nav entry. These build the role-scoped data objects DIRECTLY
// (no retired `../access/*` tier table) and assert:
//   - Selecting a visible nav entry renders that section (Req 5.5, 8.3).
//   - A role switch (owner → employee) re-clamps the active section into the
//     visible set: the previously-active owner-only section and its nav entry
//     disappear and a permitted section is shown instead (Req 6.3, 8.2).
//   - A malformed backing key isolates the affected section behind the
//     "currently unavailable" boundary while every other section still renders
//     (Req 4.5, 8.8).
//
// Validates: Requirements 4.5, 5.5, 6.3, 8.2, 8.8
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, within, fireEvent } from '@testing-library/react';
import Layout from '../Layout.jsx';
import { contents } from '../../../content-source/contents.js';

// The exactly-5 content keys an Employee_Role session receives (Req 6.1).
const EMPLOYEE_KEYS = [
  'channels',
  'onboarding',
  'principles',
  'scripts',
  'instituteOutreach',
];

function ownerData() {
  const out = {};
  for (const k of Object.keys(contents)) out[k] = contents[k];
  return out;
}

function employeeData() {
  const out = {};
  for (const k of EMPLOYEE_KEYS) out[k] = contents[k];
  return out;
}

const noop = () => {};

function renderLayout(role, data) {
  return render(
    <Layout data={data} role={role} onLock={noop} theme="ink" toggleTheme={noop} />
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('Selecting a visible section renders it (Req 5.5)', () => {
  it('renders the Operating Principles section when its nav entry is chosen', () => {
    renderLayout('employee', employeeData());
    const nav = screen.getByRole('navigation');

    // The employee's landing section is now Client Channels; Operating
    // Principles is not shown yet.
    expect(screen.getByText('6 channels — ranked by ROI')).toBeInTheDocument();
    expect(screen.queryByText('12 rules — read every Monday morning')).toBeNull();

    fireEvent.click(within(nav).getByText('Operating Principles'));

    expect(screen.getByText('12 rules — read every Monday morning')).toBeInTheDocument();
  });
});

describe('A role switch re-clamps the active section into the visible set (Req 6.3, 8.2)', () => {
  it('drops the previously-active owner-only section when switching to the employee', () => {
    // Start as Owner and navigate into an owner-only section (Goals & Why).
    const { rerender } = renderLayout('owner', ownerData());
    const nav = screen.getByRole('navigation');
    fireEvent.click(within(nav).getByText('Goals & Why'));
    expect(screen.getByText('The Foundation')).toBeInTheDocument();

    // Hand the device to an Employee — the owner-only content is no longer in
    // `data`, so the section and its nav entry are gone and the active section
    // clamps to the first visible section (Client Channels).
    rerender(
      <Layout data={employeeData()} role="employee" onLock={noop} theme="ink" toggleTheme={noop} />
    );

    expect(screen.queryByText('The Foundation')).toBeNull();
    const navAfter = screen.getByRole('navigation');
    expect(within(navAfter).queryByText('Goals & Why')).toBeNull();
    expect(screen.getByText('6 channels — ranked by ROI')).toBeInTheDocument();
  });
});

describe('A malformed backing key isolates the affected section (Req 4.5, 8.8)', () => {
  it('shows "currently unavailable" for the broken section while others still render', () => {
    // The `channels` key is present (so its nav entry shows and it is the
    // landing section) but malformed, so the Channels section throws — the
    // boundary must isolate it rather than crash the whole dashboard.
    const data = employeeData();
    data.channels = {}; // not an array → Channels' `.map` throws

    renderLayout('employee', data);

    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();

    // Isolation: navigating to another visible section whose data IS intact
    // renders it normally.
    const nav = screen.getByRole('navigation');
    fireEvent.click(within(nav).getByText('Operating Principles'));

    expect(screen.getByText('12 rules — read every Monday morning')).toBeInTheDocument();
    expect(screen.queryByText(/currently unavailable/i)).toBeNull();
  });
});
