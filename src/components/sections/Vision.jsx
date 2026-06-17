import * as Icons from 'lucide-react';
import { PageHeader, Card, Pill } from '../ui/Section.jsx';

export default function Vision({ data }) {
  const { vision } = data;
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="The Foundation"
        title={vision.thesis.title}
        subtitle="Why this works specifically for you, and why ₹5 Crore is a real outcome — not a fantasy."
        accent="violet"
      />
      <div className="space-y-4">
        {vision.thesis.body.map((para, i) => (
          <p key={i} className="text-slate-300 text-[15px] leading-relaxed max-w-3xl">{para}</p>
        ))}
      </div>

      <section>
        <h2 className="font-display text-xl font-extrabold mb-1">The 4 forces every action serves</h2>
        <p className="text-sm text-slate-500 mb-5">If something fails this test, drop it. No exceptions.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {vision.guidingForces.map((f, i) => {
            const Icon = Icons[f.icon] || Icons.Star;
            return (
              <Card key={i}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-300 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-1">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-extrabold mb-1">What you actually have on day one</h2>
        <p className="text-sm text-slate-500 mb-5">Most "restart" founders don't have these. You do. This is your unfair advantage.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {vision.strengths.map((s, i) => {
            const Icon = Icons[s.icon] || Icons.Star;
            return (
              <Card key={i} className="!p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-300 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-0.5">{s.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
