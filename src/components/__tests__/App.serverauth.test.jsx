// Unit tests for the server-side auth flow in src/App.jsx.
//
// Feature: server-side-access-control (task 8.2)
// Covers: session-restore rendering (Req 9.2), successful/failed login,
// no password persisted (Req 9.6), logout success + signOut-throw paths
// (Req 10.2, 10.3, 10.4).
//
// The heavy UI (Layout, PasswordGate, WelcomeIntro, CherryPetals) and the
// data/auth/cloud modules are mocked so these tests exercise ONLY App's auth
// orchestration. `rowsToContentObject` is kept real.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Hoisted mock functions shared across the module mocks below.
const h = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
  signInResolvingRole: vi.fn(),
  getRole: vi.fn(),
  fetchContent: vi.fn(),
  setAuthState: vi.fn(),
  startUpdateWatcher: vi.fn(),
}));

vi.mock('../../lib/supabase.js', () => ({
  isCloudEnabled: true,
  supabase: {
    auth: {
      getSession: h.getSession,
      onAuthStateChange: h.onAuthStateChange,
      signOut: h.signOut,
    },
  },
}));

vi.mock('../../lib/auth.js', () => ({
  signInResolvingRole: h.signInResolvingRole,
}));

// Keep rowsToContentObject real; mock only the network-touching functions.
vi.mock('../../lib/content.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, getRole: h.getRole, fetchContent: h.fetchContent };
});

vi.mock('../../lib/cloudSync.js', () => ({
  setAuthState: h.setAuthState,
}));

vi.mock('../../lib/version.js', () => ({
  startUpdateWatcher: h.startUpdateWatcher,
}));

vi.mock('../../hooks/useTheme.js', () => ({
  useTheme: () => ({ theme: 'blossom', toggleTheme: () => {} }),
}));

// Lightweight UI stand-ins.
vi.mock('../Layout.jsx', () => ({
  default: ({ role, onLock }) => (
    <div data-testid="layout">
      <span data-testid="role">{role || ''}</span>
      <button onClick={onLock}>logout</button>
    </div>
  ),
}));

vi.mock('../PasswordGate.jsx', () => ({
  default: ({ onSubmit, error, busy }) => (
    <div data-testid="gate">
      <span data-testid="error">{error || ''}</span>
      <button disabled={busy} onClick={() => onSubmit('secret-pw')}>
        submit
      </button>
    </div>
  ),
}));

vi.mock('../WelcomeIntro.jsx', () => ({ default: () => null }));
vi.mock('../ui/CherryPetals.jsx', () => ({ default: () => null }));

// Import AFTER mocks are registered.
import App from '../../App.jsx';

const PW_KEY = 'r2up_session_pw';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  // Sensible defaults; individual tests override as needed.
  h.getSession.mockResolvedValue({ data: { session: null } });
  h.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: h.unsubscribe } },
  });
  h.signOut.mockResolvedValue({ error: null });
  h.getRole.mockResolvedValue('employee');
  h.fetchContent.mockResolvedValue({ ok: true, rows: [] });
});

describe('App server-side auth flow', () => {
  it('(a) shows the login screen when no session exists on load (Req 9.2 negative)', async () => {
    h.getSession.mockResolvedValue({ data: { session: null } });

    render(<App />);

    // The gate is present and stays; no dashboard appears.
    expect(await screen.findByTestId('gate')).toBeInTheDocument();
    await waitFor(() => expect(h.setAuthState).toHaveBeenCalledWith(null));
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
  });

  it('(b) restores a valid session on load and renders the dashboard without login (Req 9.2)', async () => {
    h.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' } } },
    });
    h.getRole.mockResolvedValue('owner');
    h.fetchContent.mockResolvedValue({
      ok: true,
      rows: [{ key: 'roadmap', data: { phases: [] } }],
    });

    render(<App />);

    expect(await screen.findByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('role')).toHaveTextContent('owner');
    expect(screen.queryByTestId('gate')).not.toBeInTheDocument();
    await waitFor(() => expect(h.setAuthState).toHaveBeenCalledWith('user-1'));
  });

  it('(c) renders the Layout after a successful login', async () => {
    h.signInResolvingRole.mockResolvedValue({
      ok: true,
      role: 'employee',
      session: { user: { id: 'user-2' } },
    });
    h.fetchContent.mockResolvedValue({
      ok: true,
      rows: [{ key: 'principles', data: {} }],
    });

    render(<App />);

    const submit = await screen.findByText('submit');
    fireEvent.click(submit);

    expect(await screen.findByTestId('layout')).toBeInTheDocument();
    expect(screen.getByTestId('role')).toHaveTextContent('employee');
    expect(h.setAuthState).toHaveBeenCalledWith('user-2');
  });

  it('(d) keeps the login screen on a failed login and persists no password (Req 9.6)', async () => {
    h.signInResolvingRole.mockResolvedValue({ ok: false, code: 'invalid' });

    render(<App />);

    const submit = await screen.findByText('submit');
    fireEvent.click(submit);

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('invalid')
    );
    expect(screen.getByTestId('gate')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();

    // Req 9.6 — no Login_Password may be persisted anywhere on the device.
    expect(localStorage.getItem(PW_KEY)).toBeNull();
    expect(sessionStorage.getItem(PW_KEY)).toBeNull();
  });

  it('(e) logs out: calls signOut and returns to the login screen (Req 10.2/10.3)', async () => {
    h.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-3' } } },
    });
    h.getRole.mockResolvedValue('owner');

    render(<App />);

    // Dashboard first.
    const logoutBtn = await screen.findByText('logout');
    fireEvent.click(logoutBtn);

    await waitFor(() => expect(h.signOut).toHaveBeenCalledTimes(1));
    expect(await screen.findByTestId('gate')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
    expect(h.setAuthState).toHaveBeenLastCalledWith(null);
  });

  it('(f) logs out even when signOut throws (Req 10.4)', async () => {
    h.getSession.mockResolvedValue({
      data: { session: { user: { id: 'user-4' } } },
    });
    h.getRole.mockResolvedValue('employee');
    h.signOut.mockRejectedValue(new Error('network down'));

    render(<App />);

    const logoutBtn = await screen.findByText('logout');
    fireEvent.click(logoutBtn);

    // Despite the throw, the app forces the local logged-out state.
    expect(await screen.findByTestId('gate')).toBeInTheDocument();
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
    expect(h.setAuthState).toHaveBeenLastCalledWith(null);
  });
});
