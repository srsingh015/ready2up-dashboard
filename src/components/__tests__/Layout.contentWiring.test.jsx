// Content-wiring tests for task 10.2 — the Layout is a pure reflection of the
// content that ACTUALLY arrived from the server.
//
// In the server-side access-control model the browser only ever receives the
// rows the authenticated role is permitted to read (RLS filters them). The
// merged `data` object therefore contains ONLY the permitted content keys, and
// `Layout` derives its navigation from that data via `navIdsFromContent(data)`
// (Req 5.3, 6.3, 8.2). These tests build the role-scoped data objects DIRECTLY
// (no retired `../access/*` tier table) and assert:
//   - Owner data (all content keys present) → every nav entry is shown, the
//     "Building to ₹5CR" badge renders, and personal/owner-only entries appear.
//   - Employee data (only the 7 permitted keys) → exactly the 7 Employee_Content
//     nav entries appear, no badge, and no Overview / Trackers / personal
//     entries (Req 6.3, 6.4, 8.2, 8.5).
//   - The employee's landing section renders without crashing.
//   - Rhythm renders weekly+monthly only (no personal Daily tab) when
//     `dailyRoutine` is absent, and keeps the Daily tab for the owner (Req 6.2).
//
// Validates: Requirements 5.3, 6.2, 6.3, 6.4, 8.2, 8.5
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';
import Layout from '../Layout.jsx';
import Rhythm from '../sections/Rhythm.jsx';
import { contents } from '../../../content-source/contents.js';

// The exactly-7 content keys an Employee_Role session receives from the server
// (Req 6.1): redacted roadmap, redacted months, the weekly + monthly rhythm,
// channels, onboarding, and principles. `dailyRoutine` and every owner-only
// section are absent.
const EMPLOYEE_KEYS = [
  'roadmap',
  'months',
  'weeklyRhythm',
  'monthlyRhythm',
  'channels',
  'onboarding',
  'principles',
];

// Owner receives every content key.
function ownerData() {
  const out = {};
  for (const k of Object.keys(contents)) out[k] = contents[k];
  return out;
}

// Employee receives only the 7 permitted keys.
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

// The exact set of nav labels an Employee_Role should see (the 7 entries).
const EMPLOYEE_NAV_LABELS = [
  '24-Month Roadmap',
  'Monthly Plans',
  'Daily / Weekly Rhythm',
  'Focus Mode',
  'Client Channels',
  'Client Onboarding',
  'Operating Principles',
];

// Owner-only / personal nav labels that must NEVER appear for an employee.
const OWNER_ONLY_NAV_LABELS = [
  'Overview',
  'Goals & Why',
  'Income Streams',
  'Pricing & Packages',
  'Scripts & Templates',
  'Institute Outreach',
  'Affiliate & Properties',
  'Brand Playbook',
  'Trackers',
  'Passive Income',
  'Content Plan',
  'Dubai Expansion',
  'Settle & Wealth Plan',
  'Partnership Companies',
  'Us 💞',
  'For Kaira 🌸',
  'For Me 💕',
];

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('Owner sees the full dashboard (Req 6.4, 8.2, 8.5)', () => {
  it('presents every navigation entry', () => {
    renderLayout('owner', ownerData());
    const nav = screen.getByRole('navigation');
    for (const label of [...EMPLOYEE_NAV_LABELS, ...OWNER_ONLY_NAV_LABELS]) {
      expect(within(nav).getByText(label)).toBeInTheDocument();
    }
  });

  it('renders the "Building to ₹5CR" badge', () => {
    renderLayout('owner', ownerData());
    expect(screen.getByText(/Building to ₹5CR/)).toBeInTheDocument();
  });
});

describe('Employee sees exactly the 7 permitted sections (Req 6.3, 6.4, 8.2)', () => {
  it('offers exactly the 7 Employee_Content nav entries and no others', () => {
    renderLayout('employee', employeeData());
    const nav = screen.getByRole('navigation');

    // All 7 permitted entries are present.
    for (const label of EMPLOYEE_NAV_LABELS) {
      expect(within(nav).getByText(label)).toBeInTheDocument();
    }
    // None of the owner-only / personal entries are present.
    for (const label of OWNER_ONLY_NAV_LABELS) {
      expect(within(nav).queryByText(label)).toBeNull();
    }
  });

  it('does NOT render the "Building to ₹5CR" badge', () => {
    renderLayout('employee', employeeData());
    expect(screen.queryByText(/Building to ₹5CR/)).toBeNull();
  });

  it('renders the landing section (Roadmap) without crashing', () => {
    renderLayout('employee', employeeData());
    // The first visible section for the employee is the Roadmap; its header
    // renders from the permitted `roadmap` key.
    expect(screen.getByText('The 24-Month Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Five phases. Five gates. No skipping.')).toBeInTheDocument();
  });
});

describe('Rhythm renders weekly+monthly only when the personal daily routine is absent (Req 6.2)', () => {
  it('Owner (dailyRoutine present) sees the Daily tab alongside Weekly and Monthly', () => {
    render(<Rhythm data={ownerData()} />);
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('Employee (dailyRoutine absent) sees weekly+monthly and no Daily tab, without crashing', () => {
    const data = employeeData();
    expect(data.dailyRoutine).toBeUndefined();
    expect(data.weeklyRhythm).toBeDefined();

    render(<Rhythm data={data} />);
    expect(screen.queryByText('Daily')).toBeNull();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });
});
