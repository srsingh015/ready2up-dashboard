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
import Trackers from '../sections/Trackers.jsx';
import { contents } from '../../../content-source/contents.js';

// The exactly-5 content keys an Employee_Role session receives from the server
// (Req 6.1): channels, onboarding, principles, scripts, and instituteOutreach.
// `roadmap`, `months`, `dailyRoutine`, `brandPlaybook`, and every other
// owner-only section are absent. The Work Tracker ('trackers') is added by
// Layout for the employee role (it has no content row), so it is NOT in this
// content-key set but DOES appear in the employee's nav.
const EMPLOYEE_KEYS = [
  'channels',
  'onboarding',
  'principles',
  'scripts',
  'instituteOutreach',
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

// The exact set of nav labels an Employee_Role should see (6 entries): the five
// content-driven sections plus the Work Tracker ('Trackers'), which Layout adds
// for the employee role even though it has no content row.
const EMPLOYEE_NAV_LABELS = [
  'Client Channels',
  'Client Onboarding',
  'Operating Principles',
  'Scripts & Templates',
  'Institute Outreach',
  'Trackers',
];

// Owner-only / personal nav labels that must NEVER appear for an employee.
// Note: Brand Playbook stays owner-only; Focus Mode is gone for employees
// (it was backed by 'months', which employees no longer receive).
const OWNER_ONLY_NAV_LABELS = [
  'Overview',
  'Goals & Why',
  'Income Streams',
  '24-Month Roadmap',
  'Monthly Plans',
  'Daily / Weekly Rhythm',
  'Focus Mode',
  'Pricing & Packages',
  'Affiliate & Properties',
  'Brand Playbook',
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

describe('Employee sees exactly the permitted sections + Work Tracker (Req 6.3, 6.4, 8.2)', () => {
  it('offers exactly the 6 employee nav entries and no others', () => {
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

  it('renders the landing section (Client Channels) without crashing', () => {
    renderLayout('employee', employeeData());
    // The first visible section in NAV order for the employee is now Client
    // Channels; its header renders from the permitted `channels` key.
    expect(screen.getByText('Where Clients Come From')).toBeInTheDocument();
    expect(screen.getByText('6 channels — ranked by ROI')).toBeInTheDocument();
  });
});

describe('Rhythm renders weekly+monthly only when the personal daily routine is absent (Req 6.2)', () => {
  it('Owner (dailyRoutine present) sees the Daily tab alongside Weekly and Monthly', () => {
    render(<Rhythm data={ownerData()} />);
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('When dailyRoutine is absent, shows weekly+monthly and no Daily tab, without crashing', () => {
    // A content set with the work-tier rhythm keys but no personal daily
    // routine still renders weekly+monthly and hides the Daily tab.
    const data = {
      weeklyRhythm: contents.weeklyRhythm,
      monthlyRhythm: contents.monthlyRhythm,
    };
    expect(data.dailyRoutine).toBeUndefined();
    expect(data.weeklyRhythm).toBeDefined();

    render(<Rhythm data={data} />);
    expect(screen.queryByText('Daily')).toBeNull();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });
});

describe('Trackers is role-aware: money-free Work Tracker for employees, financial for owner (Req 6.2, 6.4)', () => {
  it('renders the money-free Work Tracker for an employee and shows NO money', () => {
    render(<Trackers data={employeeData()} role="employee" />);

    // The employee Work Tracker UI is present.
    expect(screen.getByText('Your tasks & daily notes')).toBeInTheDocument();
    expect(screen.getByText('My tasks')).toBeInTheDocument();
    expect(screen.getByText('What I did today')).toBeInTheDocument();

    // Absolutely no financial / money language leaks into the employee view.
    expect(screen.queryByText(/revenue/i)).toBeNull();
    expect(screen.queryByText(/target/i)).toBeNull();
    expect(screen.queryByText(/pipeline/i)).toBeNull();
    expect(screen.queryByText(/₹/)).toBeNull();
    expect(screen.queryByText(/MRR/i)).toBeNull();
  });

  it('renders the financial tracker for the owner', () => {
    render(<Trackers data={ownerData()} role="owner" />);
    expect(screen.getByText('Plan vs Actual — track the truth')).toBeInTheDocument();
    expect(screen.getByText('Pipeline tracker')).toBeInTheDocument();
  });
});
