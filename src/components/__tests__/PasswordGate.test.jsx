// Unit tests for the Login screen (PasswordGate) — server-side access-control model.
//
// The parent (App.jsx) passes `error` as a CODE string:
//   'empty' | 'invalid' | 'ratelimited' | 'timeout' | 'unavailable' (or ''/null).
// The gate renders friendly copy for each code. It also runs a minimal LOCAL
// empty/whitespace guard on submit.
//
// Covers:
//  - Single password input; NO email field ever rendered (Req 1.1).
//  - Each error code renders its friendly message.
//  - Submitting empty/whitespace shows the 'empty' message and does NOT call
//    onSubmit (Req 1.8 / 2.2).
//  - A valid password calls onSubmit(password, remember=true) untrimmed.
//  - A parent error persists until the input is edited, then clears (Req 2.4).
//
// Validates: Requirements 1.1, 1.8, 2.1, 2.2, 2.4, 2.6, 2.7
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import PasswordGate from '../PasswordGate.jsx';

afterEach(() => {
  cleanup();
});

function getPasswordInput() {
  return screen.getByPlaceholderText('Password');
}

function getUnlockButton() {
  return screen.getByRole('button', { name: /unlock/i });
}

describe('PasswordGate — login screen', () => {
  it('renders a single password input and Unlock button, never an email field (Req 1.1)', () => {
    render(<PasswordGate onSubmit={vi.fn()} />);

    expect(getPasswordInput()).toBeInTheDocument();
    expect(getUnlockButton()).toBeInTheDocument();
    expect(screen.getByText(/enter password to continue/i)).toBeInTheDocument();

    // No email field of any kind.
    expect(screen.queryByPlaceholderText(/email/i)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="email"]')).toBeNull();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();

    // Exactly one text-ish input (the password field).
    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBe(1);
  });

  it('constrains the password input to 72 characters (Req 1.3)', () => {
    render(<PasswordGate onSubmit={vi.fn()} />);
    expect(getPasswordInput()).toHaveAttribute('maxlength', '72');
  });

  const errorCases = [
    ['empty', 'Please enter your password.'],
    ['invalid', "That password wasn't recognized."],
    ['ratelimited', 'Too many attempts. Please wait a few minutes and try again.'],
    ['timeout', "Login couldn't be completed. Check your connection and try again."],
    ['unavailable', 'The dashboard is temporarily unavailable. Please try again.'],
  ];

  it.each(errorCases)("renders friendly copy for the '%s' error code", (code, message) => {
    render(<PasswordGate onSubmit={vi.fn()} error={code} />);
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('passes an unknown non-empty error string through as-is', () => {
    render(<PasswordGate onSubmit={vi.fn()} error="Something specific happened" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something specific happened');
  });

  it("submitting empty shows the 'empty' message and does NOT call onSubmit (Req 1.8/2.2)", () => {
    const onSubmit = vi.fn();
    render(<PasswordGate onSubmit={onSubmit} />);

    fireEvent.click(getUnlockButton());

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your password.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submitting whitespace-only shows the 'empty' message and does NOT call onSubmit (Req 1.8/2.2)", () => {
    const onSubmit = vi.fn();
    render(<PasswordGate onSubmit={onSubmit} />);

    fireEvent.change(getPasswordInput(), { target: { value: '   \t  ' } });
    fireEvent.click(getUnlockButton());

    expect(screen.getByRole('alert')).toHaveTextContent('Please enter your password.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submitting a valid password calls onSubmit with (password, remember=true), untrimmed', () => {
    const onSubmit = vi.fn();
    render(<PasswordGate onSubmit={onSubmit} />);

    fireEvent.change(getPasswordInput(), { target: { value: ' correct horse ' } });
    fireEvent.click(getUnlockButton());

    expect(onSubmit).toHaveBeenCalledTimes(1);
    // Password is forwarded byte-for-byte (not trimmed).
    expect(onSubmit).toHaveBeenCalledWith(' correct horse ', true);
  });

  it('persists a parent error until the input is edited, then clears it (Req 2.4)', () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<PasswordGate onSubmit={onSubmit} error="invalid" />);

    expect(screen.getByRole('alert')).toHaveTextContent("That password wasn't recognized.");

    // Persists across an unrelated re-render (no input change yet).
    rerender(<PasswordGate onSubmit={onSubmit} error="invalid" />);
    expect(screen.getByRole('alert')).toHaveTextContent("That password wasn't recognized.");

    // Editing the input clears the message immediately.
    fireEvent.change(getPasswordInput(), { target: { value: 'x' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('permits unlimited submissions — no client-side lockout (Req 2.5)', () => {
    const onSubmit = vi.fn();
    render(<PasswordGate onSubmit={onSubmit} />);

    const input = getPasswordInput();
    const button = getUnlockButton();

    for (let i = 0; i < 10; i++) {
      fireEvent.change(input, { target: { value: `attempt-${i}` } });
      fireEvent.click(button);
    }

    expect(onSubmit).toHaveBeenCalledTimes(10);
    expect(input).not.toBeDisabled();
    expect(button).not.toBeDisabled();
    expect(onSubmit).toHaveBeenLastCalledWith('attempt-9', true);
  });
});
