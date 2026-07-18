import { Component } from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * Wiring-level guard for content sections (Req 4.4, 4.5).
 *
 * The role's merged `data` contains ONLY the content keys that role is
 * permitted to see, and — because `unlock()` merges only the tiers that
 * decrypted successfully — a permitted tier that FAILED to decrypt simply has
 * its keys absent from `data`. Most sections tolerate a missing key gracefully
 * (they read a single backing key and null-guard it), but this boundary is the
 * defensive backstop so that if any section throws on an absent key, the
 * affected item surfaces as a visible "unavailable" state instead of taking
 * down the whole dashboard — while every other section/tier still renders
 * (Req 4.5). It never fabricates or reveals non-permitted content.
 *
 * Reset it per section by giving it a `key` tied to the active section id, so
 * navigating away from a failed section renders the next one fresh.
 */
export default class SectionBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // Surface for debugging without breaking the UX. Never logs content.
    // eslint-disable-next-line no-console
    console.error('Section failed to render:', error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-4 text-sm text-amber-200"
        >
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-300" strokeWidth={2} />
          <div className="flex-1">
            <div className="font-semibold text-amber-100">This content is currently unavailable</div>
            <div className="text-amber-200/80">
              We couldn’t load this part right now. Other sections are unaffected — try another section from the menu.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
