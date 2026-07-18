import { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard, Compass, Coins, Map, CalendarDays, Repeat, Sun,
  Megaphone, Tag as TagIcon, MessageSquareText, ShieldCheck, LineChart,
  Lock, Menu, X, ClipboardList, Layers, Building2, Heart, Pin, PinOff, Sparkles, Timer, HeartHandshake, User, TrendingUp, FileText, Globe2, GraduationCap
} from 'lucide-react';

import Overview from './sections/Overview.jsx';
import Vision from './sections/Vision.jsx';
import Streams from './sections/Streams.jsx';
import Roadmap from './sections/Roadmap.jsx';
import Months from './sections/Months.jsx';
import Rhythm from './sections/Rhythm.jsx';
import Focus from './sections/Focus.jsx';
import Channels from './sections/Channels.jsx';
import Pricing from './sections/Pricing.jsx';
import Onboarding from './sections/Onboarding.jsx';
import Scripts from './sections/Scripts.jsx';
import Properties from './sections/Properties.jsx';
import Dubai from './sections/Dubai.jsx';
import Settle from './sections/Settle.jsx';
import Principles from './sections/Principles.jsx';
import BrandPlaybook from './sections/BrandPlaybook.jsx';
import Trackers from './sections/Trackers.jsx';
import PassiveIncome from './sections/PassiveIncome.jsx';
import ContentPlan from './sections/ContentPlan.jsx';
import Partnerships from './sections/Partnerships.jsx';
import ForKaira from './sections/ForKaira.jsx';
import ForMe from './sections/ForMe.jsx';
import Us from './sections/Us.jsx';
import InstituteOutreach from './sections/InstituteOutreach.jsx';
import ThemeToggle from './ui/ThemeToggle.jsx';
import SectionBoundary from './SectionBoundary.jsx';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { navIdsFromContent } from '../lib/content.js';

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'core' },
  { id: 'vision', label: 'Goals & Why', icon: Compass, group: 'core' },
  { id: 'streams', label: 'Income Streams', icon: Coins, group: 'core' },
  { id: 'roadmap', label: '24-Month Roadmap', icon: Map, group: 'plan' },
  { id: 'months', label: 'Monthly Plans', icon: CalendarDays, group: 'plan' },
  { id: 'rhythm', label: 'Daily / Weekly Rhythm', icon: Repeat, group: 'plan' },
  { id: 'focus', label: 'Focus Mode', icon: Timer, group: 'plan' },
  { id: 'channels', label: 'Client Channels', icon: Megaphone, group: 'execution' },
  { id: 'pricing', label: 'Pricing & Packages', icon: TagIcon, group: 'execution' },
  { id: 'onboarding', label: 'Client Onboarding', icon: ClipboardList, group: 'execution' },
  { id: 'scripts', label: 'Scripts & Templates', icon: MessageSquareText, group: 'execution' },
  { id: 'institute-outreach', label: 'Institute Outreach', icon: GraduationCap, group: 'execution' },
  { id: 'properties', label: 'Affiliate & Properties', icon: Layers, group: 'execution' },
  { id: 'brand', label: 'Brand Playbook', icon: Sparkles, group: 'execution' },
  { id: 'principles', label: 'Operating Principles', icon: ShieldCheck, group: 'execution' },
  { id: 'trackers', label: 'Trackers', icon: LineChart, group: 'tools' },
  { id: 'passive', label: 'Passive Income', icon: TrendingUp, group: 'build' },
  { id: 'content', label: 'Content Plan', icon: FileText, group: 'build' },
  { id: 'dubai', label: 'Dubai Expansion', icon: Globe2, group: 'build' },
  { id: 'settle', label: 'Settle & Wealth Plan', icon: Compass, group: 'build' },
  { id: 'partnerships', label: 'Partnership Companies', icon: Building2, group: 'portfolio' },
  { id: 'us', label: 'Us 💞', icon: HeartHandshake, group: 'kaira' },
  { id: 'kaira', label: 'For Kaira 🌸', icon: Heart, group: 'kaira' },
  { id: 'me', label: 'For Me 💕', icon: Heart, group: 'kaira' },
];

const GROUP_LABELS = {
  core: 'Foundation',
  plan: 'The Plan',
  execution: 'Execution',
  tools: 'Tools',
  build: 'Build & Earn',
  portfolio: 'Partnerships',
  kaira: 'Together',
};

// Nothing is pinned by default now — the Together group has its own special spot.
const DEFAULT_PINNED = [];

export default function Layout({ data, onLock, theme, toggleTheme, role }) {
  // Nav visibility is a pure reflection of the content that ACTUALLY arrived
  // from the server (Req 5.3, 6.3, 8.2). A nav entry shows only when all of its
  // backing content keys are present in `data` — authorization is enforced
  // server-side by RLS, so a section the role may not see never has its data
  // and therefore never has a nav entry. Memoized on `data`.
  const visibleIds = useMemo(() => navIdsFromContent(data), [data]);
  const visibleSet = useMemo(() => {
    const set = new Set(visibleIds);
    // The Work Tracker is user-state based (no content_sections row backs it),
    // so `navIdsFromContent` — which is purely content-driven — never surfaces
    // it for an employee. The owner already gets 'trackers' via its 'meta'
    // backing key. Add it explicitly for non-owner roles so employees get the
    // money-free Work Tracker even though it has no server content row.
    if (role !== 'owner') set.add('trackers');
    return set;
  }, [visibleIds, role]);

  // The first visible nav id in NAV order — the initial/landing section and the
  // fallback whenever a non-visible section is somehow requested.
  const firstVisibleId = useMemo(
    () => NAV.find((n) => visibleSet.has(n.id))?.id ?? null,
    [visibleSet]
  );

  const [active, setActive] = useState(firstVisibleId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useLocalStorage('pinned_nav', DEFAULT_PINNED);
  const [togetherTop, setTogetherTop] = useLocalStorage('together_pinned', true);

  // Navigate to a requested section, switching only to a visible section. If a
  // non-visible id is somehow requested it falls back to the first visible
  // section, so non-permitted content is never rendered (Req 6.3, 8.2).
  function navigate(requestedId) {
    setActive(visibleSet.has(requestedId) ? requestedId : firstVisibleId);
    setMobileOpen(false);
  }

  // Re-clamp the active section into the visible set whenever the data (and
  // hence the permitted content) or the role changes — e.g. after a role switch
  // the previously-active owner section is no longer present, so fall back to
  // the first visible section (Req 6.3, 8.2).
  useEffect(() => {
    if (!visibleSet.has(active)) {
      setActive(firstVisibleId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSet, firstVisibleId, role]);

  // Reset scroll to top whenever the user navigates to a different section.
  // Without this, scrolling deep into one section then switching meant the
  // next section also opened scrolled to the bottom — confusing on phones.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [active]);

  function togglePin(id, e) {
    e?.stopPropagation();
    e?.preventDefault();
    setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  // Only nav entries whose backing content arrived are ever presented
  // (Req 5.3, 6.3, 8.2). All downstream list-building works off this filtered
  // set so non-visible entries never render, not even as pinned items.
  const visibleNav = useMemo(
    () => NAV.filter((n) => visibleSet.has(n.id)),
    [visibleSet]
  );

  // Build pinned section list (preserves NAV order) and unpinned groups.
  // The Together group ('kaira') is handled separately as one special block.
  const togetherItems = visibleNav.filter((n) => n.group === 'kaira');
  const { pinnedItems, unpinnedGroups } = useMemo(() => {
    const pinnedItems = visibleNav.filter((n) => n.group !== 'kaira' && pinned.includes(n.id));
    const m = {};
    visibleNav.forEach((n) => {
      if (n.group === 'kaira') return;
      if (pinned.includes(n.id)) return;
      m[n.group] ??= [];
      m[n.group].push(n);
    });
    return { pinnedItems, unpinnedGroups: m };
  }, [pinned, visibleNav]);

  // The "Together" block — subtly special (soft rose tint), with one pin toggle.
  const renderTogether = () => (
    <div className="mb-3 rounded-2xl p-2 bg-rose-500/[0.05] border border-rose-500/15">
      <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300/90">
          <Heart className="w-3 h-3 fill-current" />
          <span>Together</span>
        </div>
        <button
          onClick={() => setTogetherTop((v) => !v)}
          title={togetherTop ? 'Unpin Together from top' : 'Pin Together to top'}
          aria-label={togetherTop ? 'Unpin Together from top' : 'Pin Together to top'}
          className={`p-1 rounded-md transition-colors ${togetherTop ? 'text-rose-300/90 hover:bg-white/[0.06]' : 'text-slate-500 hover:text-rose-300 hover:bg-white/[0.06]'}`}
        >
          {togetherTop ? <Pin className="w-3.5 h-3.5 fill-current" /> : <PinOff className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="space-y-0.5">
        {togetherItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all border ${
                isActive
                  ? 'bg-white text-rose-600 border-white font-bold shadow-[0_3px_14px_-3px_rgba(0,0,0,0.22)]'
                  : 'border-transparent text-slate-300 font-medium hover:text-slate-100 hover:bg-white/[0.06]'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderSection = () => {
    // Guard: never render a section whose backing content did not arrive
    // (Req 6.3, 8.2). `navigate` and the clamp effect keep `active` visible,
    // but this is a defensive backstop against any non-visible `active` value.
    if (!visibleSet.has(active)) return null;
    const props = { data, role };
    switch (active) {
      case 'overview': return <Overview {...props} onNavigate={navigate} />;
      case 'vision': return <Vision {...props} />;
      case 'streams': return <Streams {...props} />;
      case 'roadmap': return <Roadmap {...props} onNavigate={navigate} />;
      case 'months': return <Months {...props} />;
      case 'rhythm': return <Rhythm {...props} />;
      case 'focus': return <Focus {...props} />;
      case 'channels': return <Channels {...props} />;
      case 'pricing': return <Pricing {...props} />;
      case 'onboarding': return <Onboarding {...props} />;
      case 'scripts': return <Scripts {...props} />;
      case 'institute-outreach': return <InstituteOutreach {...props} />;
      case 'properties': return <Properties {...props} />;
      case 'brand': return <BrandPlaybook {...props} />;
      case 'principles': return <Principles {...props} />;
      case 'trackers': return <Trackers {...props} />;
      case 'passive': return <PassiveIncome {...props} />;
      case 'content': return <ContentPlan {...props} />;
      case 'dubai': return <Dubai {...props} />;
      case 'settle': return <Settle {...props} />;
      case 'partnerships': return <Partnerships {...props} />;
      case 'kaira': return <ForKaira {...props} />;
      case 'us': return <Us {...props} />;
      case 'me': return <ForMe {...props} />;
      default: return <Overview {...props} onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-ink-950 relative">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.18]" />

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 p-2.5 rounded-xl glass focus-ring"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[270px] z-40 glass border-r border-white/[0.06] transform transition-transform duration-300 flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand — pinned at top, never scrolls away */}
        <div className="px-5 pt-6 pb-4 border-b border-white/[0.06] flex items-start justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-ink-950 font-extrabold text-sm">⚡</div>
              <div className="font-display text-lg font-extrabold gold-text leading-none">Ready2UP</div>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Private Growth Plan</div>
            {role === 'owner' && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                🎯 Building to ₹5CR
              </div>
            )}
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav — only this scrolls if too tall to fit */}
        <nav
          className="flex-1 min-h-0 px-2 py-2 overflow-y-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          {/* Together — special block, pinned to top by default.
              Only rendered when the role can see at least one Together entry. */}
          {togetherTop && togetherItems.length > 0 && renderTogether()}

          {/* Pinned group */}
          {pinnedItems.length > 0 && (
            <div className="mb-3">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/90 flex items-center gap-1.5">
                <Pin className="w-3 h-3 fill-current" />
                Pinned
              </div>
              {pinnedItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={active}
                  isPinned
                  onSelect={() => navigate(item.id)}
                  onTogglePin={(e) => togglePin(item.id, e)}
                />
              ))}
            </div>
          )}

          {/* Regular groups */}
          {Object.keys(unpinnedGroups).map((g) => (
            <div key={g} className="mb-3">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                {GROUP_LABELS[g]}
              </div>
              {unpinnedGroups[g].map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={active}
                  isPinned={false}
                  onSelect={() => navigate(item.id)}
                  onTogglePin={(e) => togglePin(item.id, e)}
                />
              ))}
            </div>
          ))}

          {/* Together at its natural spot when not pinned to top */}
          {!togetherTop && togetherItems.length > 0 && renderTogether()}
        </nav>

        {/* Footer — pinned at bottom, never scrolls away */}
        <div className="px-3 pt-3 pb-4 border-t border-white/[0.06] space-y-2 shrink-0">
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} layout="inline" />
          <button
            onClick={onLock}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] py-2 rounded-xl transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock dashboard
          </button>
        </div>
      </aside>

      {/* Backdrop on mobile */}
      {mobileOpen && (
        <button onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30" aria-label="Close menu" />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 relative">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10 pb-24">
          {/* Per-section failure isolation: a missing/malformed content key
              surfaces as a visible "unavailable" state for this section only,
              while the rest of the dashboard keeps working (Req 4.5, 8.8).
              Keyed by `active` so navigating renders the next section fresh. */}
          <SectionBoundary key={active}>{renderSection()}</SectionBoundary>
        </div>
      </main>
    </div>
  );
}

/**
 * One nav item with a primary "go to section" button and a secondary pin button
 * that appears on hover. Pin state is shown by a filled vs outline pin icon.
 */
function NavItem({ item, active, isPinned, onSelect, onTogglePin }) {
  const Icon = item.icon;
  const isActive = active === item.id;
  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className={`w-full flex items-center gap-3 pl-3 pr-9 py-2 rounded-xl text-sm transition-all border ${
          isActive
            ? 'bg-white text-rose-600 border-white font-bold shadow-[0_3px_14px_-3px_rgba(0,0,0,0.22)]'
            : 'border-transparent text-slate-300 font-medium hover:text-slate-100 hover:bg-white/[0.05]'
        }`}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
        <span className="truncate">{item.label}</span>
      </button>
      {/* Pin / unpin button — small, in the right edge of the row */}
      <button
        onClick={onTogglePin}
        title={isPinned ? 'Unpin from top' : 'Pin to top'}
        aria-label={isPinned ? 'Unpin from top' : 'Pin to top'}
        className={`absolute top-1/2 right-1.5 -translate-y-1/2 p-1.5 rounded-md transition-all ${
          isPinned
            ? 'opacity-90 text-amber-300 hover:bg-amber-500/15'
            : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 text-slate-400 hover:bg-white/10 hover:text-slate-100'
        }`}
      >
        {isPinned
          ? <Pin className="w-3.5 h-3.5 fill-current" strokeWidth={2} />
          : <Pin className="w-3.5 h-3.5" strokeWidth={2} />
        }
      </button>
    </div>
  );
}
