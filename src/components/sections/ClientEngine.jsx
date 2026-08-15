import { useState, useMemo } from 'react';
import {
  Radar, Filter, Repeat2, MessageSquareQuote, AlertTriangle,
  Trophy, Copy, Check, TrendingUp,
} from 'lucide-react';
import { PageHeader, SectionHeader, Card, Pill, StatCard, Divider } from '../ui/Section.jsx';

// ---------------------------------------------------------------------------
// Segment scorecard — ranked by how fast a Tier-2/3 prospect actually pays.
// Ranking rationale: single decision maker + obvious ROI + urgency beats
// market size every time. Schools rank last despite being the biggest list:
// committees, annual budgets and incumbent vendors make them the slowest close.
// ---------------------------------------------------------------------------
const SEGMENTS = [
  {
    rank: 1,
    name: 'Lawns & banquets',
    color: 'emerald',
    decider: 'Owner, decides alone',
    ticket: '₹50k–5L per booking',
    why: 'One extra wedding enquiry pays for the site several times over. They genuinely need galleries, capacity details and an enquiry form — the exact things a website does well.',
    verdict: 'Start here',
  },
  {
    rank: 2,
    name: 'Doctors & dentists',
    color: 'emerald',
    decider: 'Single doctor',
    ticket: 'High-value treatments',
    why: 'Patients Google before booking. Cash-rich, reputation-sensitive, and dentists especially compete locally. No committee to convince.',
    verdict: 'Strong second',
  },
  {
    rank: 3,
    name: 'Cafes & restaurants',
    color: 'amber',
    decider: 'Owner',
    ticket: 'Low margin',
    why: 'Owner decides quickly, but many believe Instagram and Zomato are already enough. The ROI story is weaker and budgets are thinner.',
    verdict: 'Fill-in work',
  },
  {
    rank: 4,
    name: 'Schools & colleges',
    color: 'rose',
    decider: 'Committee / trust board',
    ticket: 'Annual budget cycle',
    why: 'Trust boards, procurement, budgets fixed months ahead, and usually an incumbent vendor. The principal you pitch is often not the decision maker.',
    verdict: 'Slow — do not lead with this',
  },
];

// ---------------------------------------------------------------------------
// First-touch templates. Both lead with a specific observed defect, never with
// "we can make it better" — that reads as criticism of a decision they already
// made and triggers defensiveness.
// ---------------------------------------------------------------------------
const TEMPLATES = [
  {
    id: 'banquet',
    label: 'Lawns & banquets',
    color: 'emerald',
    body: `Hi {Name}, I was looking at {Venue} for a family function and tried your enquiry form — it returns an error, so any enquiry sent through it never reaches you. Screenshot attached.

I build websites for venues in Nashik. Happy to point out the two other things costing you enquiries, no charge and no obligation — you can fix them yourself or we can do it.

Either way you should know the form is down.`,
  },
  {
    id: 'dentist',
    label: 'Doctors & dentists',
    color: 'sky',
    body: `Hi Dr. {Name}, when I search "dentist in {Area}" your clinic does not come up in the first page of results, though three clinics nearby do. Your site also does not open properly on a phone, which is where most patients look.

I build clinic websites here in Nashik. I can show you exactly what those three clinics are doing differently in about ten minutes.

No cost for the look — happy to just send it over if easier.`,
  },
  {
    id: 'revive',
    label: 'Already-with-another-vendor follow-up',
    color: 'amber',
    body: `Understood, {Name} — thanks for telling me straight.

One thing: if the new site is not live by {Month}, do reach out. Half the projects I see in Nashik stall halfway and the client is left paying for hosting on an unfinished site.

I will check back around then. Good luck with it.`,
  },
];

export default function ClientEngine() {
  // Funnel model — defaults reflect the plan of pitching at volume.
  const [outreach, setOutreach] = useState(150);
  const [replyRate, setReplyRate] = useState(14);
  const [demoToClose, setDemoToClose] = useState(25);
  const [ticket, setTicket] = useState(45000);
  const [retainer, setRetainer] = useState(3000);
  const [hoursPerDemo, setHoursPerDemo] = useState(2.5);

  const m = useMemo(() => {
    const replies = outreach * (replyRate / 100);
    const closes = replies * (demoToClose / 100);
    const projectRevenue = closes * ticket;
    // Qualify-first builds demos only for prospects who replied.
    const hoursQualifyFirst = replies * hoursPerDemo;
    const hoursBuildFirst = outreach * hoursPerDemo;
    return {
      replies,
      closes,
      projectRevenue,
      hoursQualifyFirst,
      hoursBuildFirst,
      hoursSaved: hoursBuildFirst - hoursQualifyFirst,
      mrrAfter6: closes * 6 * retainer,
    };
  }, [outreach, replyRate, demoToClose, ticket, retainer, hoursPerDemo]);

  const inr = (n) =>
    '₹' + Math.round(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Client Acquisition Engine"
        title="Fix the order, not the effort"
        subtitle="One client closed at ₹66,000 proves the offer works. What is not working is the segment you lead with and the sequence you spend effort in. Both are cheap to change."
      />

      {/* ---------------- The one reframe that matters most ---------------- */}
      <Card className="!border-emerald-500/25 !bg-emerald-500/[0.04]">
        <SectionHeader
          icon={Radar}
          color="emerald"
          title="The buying signal is already in your sheet"
          subtitle="Your Reason column is doing the most valuable work in the whole business."
        />
        <p className="text-sm text-slate-300 leading-relaxed">
          You have entries like <em className="text-slate-100 not-italic font-semibold">website is not working</em> and{' '}
          <em className="text-slate-100 not-italic font-semibold">domain suspended or not configured</em>. You have been
          logging those as rejection notes. They are the opposite — they are the highest-intent signal on the list.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed mt-3">
          A business whose site is down is already losing enquiries and already knows something is wrong. You are not
          selling them an upgrade nobody asked for, you are fixing a live problem. Filter your entire list for broken,
          suspended, non-HTTPS, or no-mobile-version sites and work only that slice first.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Pill color="emerald">Form returning an error</Pill>
          <Pill color="emerald">Domain expired or parked</Pill>
          <Pill color="emerald">No HTTPS</Pill>
          <Pill color="emerald">Unusable on mobile</Pill>
          <Pill color="emerald">Not ranking for its own city</Pill>
        </div>
      </Card>

      <Divider />

      {/* ---------------- Segment ranking ---------------- */}
      <div>
        <SectionHeader
          icon={Trophy}
          color="amber"
          title="You started with the hardest segment"
          subtitle="Two college rejections tell you almost nothing. That was a qualification failure, not a pitch failure."
        />
        <div className="space-y-3">
          {SEGMENTS.map((s) => (
            <Card key={s.rank} className="!p-5">
              <div className="flex items-start gap-4">
                <div className="font-display text-2xl font-extrabold text-slate-600 shrink-0 w-8">{s.rank}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-bold text-base">{s.name}</h3>
                    <Pill color={s.color}>{s.verdict}</Pill>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.why}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-slate-500">
                    <span>Decision maker: <span className="text-slate-300">{s.decider}</span></span>
                    <span>Value at stake: <span className="text-slate-300">{s.ticket}</span></span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Divider />

      {/* ---------------- The conflict in the current plan ---------------- */}
      <div>
        <SectionHeader
          icon={Filter}
          color="rose"
          title="Build-first and volume cannot both be true"
          subtitle="Your instinct to pre-build is right. Applying it to every prospect will break you."
        />
        <Card className="!border-rose-500/25 !bg-rose-500/[0.04] mb-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              At <span className="font-semibold text-slate-100">{hoursPerDemo}h</span> per demo, pre-building for{' '}
              <span className="font-semibold text-slate-100">{outreach}</span> prospects a month is{' '}
              <span className="font-semibold text-rose-300">{Math.round(m.hoursBuildFirst)} hours</span> — before you
              deliver a single rupee of paid work. That is the whole month gone. It is also exactly how the two college
              builds got spent on prospects who already had a vendor.
            </p>
          </div>
        </Card>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          Split the funnel by effort instead. Send a cheap, specific first touch to everyone. Build the demo only for
          the ones who reply. Same close rate, a fraction of the work — <span className="font-semibold text-emerald-300">
          qualify first, build second.</span>
        </p>

        {/* Funnel calculator */}
        <Card>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <NumField label="Outreach / month" value={outreach} set={setOutreach} step={10} />
            <NumField label="Reply rate %" value={replyRate} set={setReplyRate} step={1} />
            <NumField label="Demo → close %" value={demoToClose} set={setDemoToClose} step={1} />
            <NumField label="Avg project ₹" value={ticket} set={setTicket} step={5000} />
            <NumField label="Monthly retainer ₹" value={retainer} set={setRetainer} step={500} />
            <NumField label="Hours per demo" value={hoursPerDemo} set={setHoursPerDemo} step={0.5} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Replies" value={Math.round(m.replies)} sub="worth building for" color="sky" />
            <StatCard label="Clients closed" value={m.closes.toFixed(1)} sub="per month" color="emerald" />
            <StatCard label="Project revenue" value={inr(m.projectRevenue)} sub="per month" color="amber" />
            <StatCard label="Hours saved" value={Math.round(m.hoursSaved) + 'h'} sub="vs building for all" color="violet" />
          </div>
        </Card>
      </div>

      <Divider />

      {/* ---------------- Retainer economics ---------------- */}
      <div>
        <SectionHeader
          icon={Repeat2}
          color="violet"
          title="One-off projects are why this feels volatile"
          subtitle="Every month you restart from zero. That is a structural problem, not a sales problem."
        />
        <Card className="!border-violet-500/25 !bg-violet-500/[0.04]">
          <p className="text-sm text-slate-300 leading-relaxed">
            Attach a hosting and maintenance retainer to every build. At{' '}
            <span className="font-semibold text-slate-100">{inr(retainer)}/month</span>, six months of closing at your
            current model puts roughly <span className="font-semibold text-violet-300">{inr(m.mrrAfter6)}</span> of
            recurring revenue on the books — before you sell anything new, and at very high margin since you are already
            paying for the hosting.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed mt-3">
            For the broken-site segment, open much smaller: <span className="font-semibold text-slate-100">₹5,000 to
            get it back online this week.</span> Far easier yes than ₹66,000, and it makes you their web person for the
            redesign later.
          </p>
        </Card>
      </div>

      <Divider />

      {/* ---------------- Templates ---------------- */}
      <div>
        <SectionHeader
          icon={MessageSquareQuote}
          color="sky"
          title="First-touch messages"
          subtitle="Lead with what it is costing them. Never with “we can make it better” — that criticises a decision they already made."
        />
        <div className="space-y-3">
          {TEMPLATES.map((t) => <Template key={t.id} t={t} />)}
        </div>
      </div>

      <Divider />

      {/* ---------------- Two small fixes ---------------- */}
      <div>
        <SectionHeader
          icon={TrendingUp}
          color="amber"
          title="Two small fixes worth doing this week"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Card>
            <h3 className="font-bold text-base mb-2">Host demos on your own domain</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The <code className="text-xs text-slate-300">preview.emergentagent.com</code> links in your sheet read as a
              template someone generated. Put them on <code className="text-xs text-slate-300">demo.yourdomain.com/venuename</code>{' '}
              instead — you already pay for the hosting, and it reads as custom work.
            </p>
          </Card>
          <Card>
            <h3 className="font-bold text-base mb-2">Add a follow-up date column</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              “Already gave it to another company” is rarely a permanent no. Projects stall constantly. Log a date three
              months out and check back — a real share of these become clients on the second pass.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/** A labelled numeric input used by the funnel model. */
function NumField({ label, value, set, step = 1 }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(e) => set(Math.max(0, parseFloat(e.target.value) || 0))}
        className="mt-1.5 w-full bg-ink-950 border border-white/[0.10] rounded-xl px-3 py-2.5 text-sm
                   text-slate-100 tabular-nums focus:outline-none focus:border-amber-400/60
                   focus:ring-2 focus:ring-amber-400/15 transition-colors"
      />
    </label>
  );
}

/** One copy-to-clipboard message template. */
function Template({ t }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(t.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* Clipboard unavailable (insecure context) — the text is selectable anyway. */
    }
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.06]">
        <Pill color={t.color}>{t.label}</Pill>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100
                     px-2.5 py-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          {copied
            ? <><Check className="w-3.5 h-3.5 text-emerald-300" /> Copied</>
            : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <pre className="px-5 py-4 text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
        {t.body}
      </pre>
    </Card>
  );
}
