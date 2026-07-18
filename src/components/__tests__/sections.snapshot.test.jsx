// Snapshot / structural tests for task 9.4 — existing sections render
// unchanged (same theme, navigation, and charts) under role gating for the
// OWNER role.
//
// The Owner is the reference role: it sees every content key and every nav
// entry, so gating must not alter what the Owner sees versus the base build
// (Req 13.4). These tests lock that "unchanged rendering" in place (Req 13.2):
//   - Stable, deterministic sections (Principles, Roadmap) are captured with
//     full snapshots so any future change to their markup/theme is caught.
//   - The Layout navigation is snapshotted to lock the Owner's full nav set and
//     its theming under gating.
//   - The chart-bearing Overview section is time-sensitive (it renders the
//     current month/year and animated hero), so instead of a volatile full
//     snapshot it asserts the key structural elements are present: the Recharts
//     chart container (charts unchanged) and the gold-text theme treatment.
//
// Validates: Requirements 13.2, 13.4
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Layout from '../Layout.jsx';
import Principles from '../sections/Principles.jsx';
import Roadmap from '../sections/Roadmap.jsx';
import Overview from '../sections/Overview.jsx';
import { contents } from '../../../content-source/contents.js';

// Full owner data: the owner receives every content key from the server.
function ownerData() {
  const out = {};
  for (const k of Object.keys(contents)) out[k] = contents[k];
  return out;
}

const noop = () => {};

beforeEach(() => localStorage.clear());
afterEach(() => cleanup());

describe('Owner sections render unchanged under gating (Req 13.2, 13.4)', () => {
  it('Principles renders unchanged', () => {
    const { container } = render(<Principles data={ownerData()} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('Roadmap renders unchanged (theme + phase structure)', () => {
    const { container } = render(<Roadmap data={ownerData()} role="owner" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('Layout navigation renders unchanged for the Owner (full nav set + theme)', () => {
    render(<Layout data={ownerData()} role="owner" onLock={noop} theme="ink" toggleTheme={noop} />);
    // The navigation is deterministic (no time-sensitive content) and, for the
    // Owner, must present every entry with the current build's theming.
    expect(screen.getByRole('navigation')).toMatchSnapshot();
  });

  it('Overview keeps its chart and gold-text theme (charts unchanged)', () => {
    const { container } = render(<Overview data={ownerData()} role="owner" onNavigate={noop} />);
    // Charts: the Recharts responsive container is present and unchanged.
    expect(container.querySelector('.recharts-responsive-container')).not.toBeNull();
    // Theme: the signature gold-text treatment is still applied.
    expect(container.querySelector('.gold-text')).not.toBeNull();
    // Content renders (owner greeting) — no gating change for the Owner.
    expect(
      screen.getByText(new RegExp(`Hello, ${contents.meta.ownerName.split(' ')[0]}`, 'i'))
    ).toBeInTheDocument();
  });
});
