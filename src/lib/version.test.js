// Tests for the auto-update decision logic.
//
// The regression these lock down: the previous implementation used a single
// boolean "already reloaded" flag, so once it had attempted one reload it would
// never act again for the rest of the session — even when a genuinely newer
// build was deployed. Users stayed pinned to a stale bundle. The decision is
// now keyed on the specific remote build id, and a failed attempt escalates to
// a user-visible prompt instead of silence.
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { decideUpdateAction } from './version.js';

describe('decideUpdateAction', () => {
  it('does nothing when the page is already on the deployed build', () => {
    expect(decideUpdateAction({ local: '100', remote: '100', attempted: false })).toBe('none');
    expect(decideUpdateAction({ local: '100', remote: '100', attempted: true })).toBe('none');
  });

  it('reloads when the server is on a different build and we have not tried yet', () => {
    expect(decideUpdateAction({ local: '100', remote: '200', attempted: false })).toBe('reload');
  });

  it('escalates to a manual prompt when a reload was already attempted for that build', () => {
    // This is the stale-cache case: we reloaded, the browser served the old
    // bundle anyway, so asking the user is the only remaining move.
    expect(decideUpdateAction({ local: '100', remote: '200', attempted: true })).toBe('notify');
  });

  it('never acts on incomplete information', () => {
    expect(decideUpdateAction({ local: '', remote: '200', attempted: false })).toBe('none');
    expect(decideUpdateAction({ local: '100', remote: '', attempted: false })).toBe('none');
    expect(decideUpdateAction({ local: '', remote: '', attempted: false })).toBe('none');
  });

  it('a newer build still triggers a reload even after an earlier build was attempted', () => {
    // The old boolean-flag bug: build 200 was attempted, then 300 shipped. The
    // attempt record is per-build, so 300 is unseen and must reload.
    const attemptedBuilds = new Set(['200']);
    const action = decideUpdateAction({
      local: '100',
      remote: '300',
      attempted: attemptedBuilds.has('300'),
    });
    expect(action).toBe('reload');
  });

  it('property: identical ids are always none, differing ids never none', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.boolean(),
        (local, remote, attempted) => {
          const action = decideUpdateAction({ local, remote, attempted });
          if (local === remote) {
            expect(action).toBe('none');
          } else {
            expect(action).not.toBe('none');
            expect(action).toBe(attempted ? 'notify' : 'reload');
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
