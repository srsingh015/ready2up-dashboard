import { useMemo, useState } from 'react';
import { Copy, Check, Search } from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';

export default function Scripts({ data }) {
  const { scripts } = data;
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const categories = useMemo(() => ['All', ...Array.from(new Set(scripts.map((s) => s.category)))], [scripts]);
  const filtered = useMemo(() => {
    return scripts.filter((s) => {
      if (filter !== 'All' && s.category !== filter) return false;
      if (query && !(`${s.title} ${s.body} ${s.notes || ''}`.toLowerCase().includes(query.toLowerCase()))) return false;
      return true;
    });
  }, [scripts, filter, query]);

  async function handleCopy(s) {
    try {
      await navigator.clipboard.writeText(s.body);
      setCopiedId(s.id);
      setTimeout(() => setCopiedId((id) => (id === s.id ? null : id)), 1600);
    } catch {}
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Outreach Library"
        title="Ready-to-send scripts & templates"
        subtitle="LinkedIn DMs, Upwork proposals, cold emails, discovery questions, proposals, objection handling, and post-launch upsells. Copy, personalize the [brackets], send."
        accent="violet"
      />

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search scripts…"
            className="w-full bg-ink-900 border border-white/[0.08] rounded-xl pl-9 pr-3 py-2.5 text-sm focus-ring placeholder-slate-500"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {categories.map((c) => {
            const active = filter === c;
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  active ? 'bg-violet-500/15 text-violet-200 border border-violet-500/30' : 'text-slate-400 border border-white/[0.08] hover:text-slate-200'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((s) => {
          const copied = copiedId === s.id;
          return (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Pill color="violet">{s.category}</Pill>
                    {s.when && <span className="text-[11px] text-slate-500">{s.when}</span>}
                  </div>
                  <h3 className="font-bold text-base">{s.title}</h3>
                  {s.notes && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{s.notes}</p>}
                </div>
                <button
                  onClick={() => handleCopy(s)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    copied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500/15 text-violet-300 hover:bg-violet-500/25'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="bg-ink-900/80 border border-white/[0.06] rounded-xl p-4 text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">{s.body}</pre>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card><p className="text-sm text-slate-400 text-center py-6">No scripts match.</p></Card>
        )}
      </div>
    </div>
  );
}
