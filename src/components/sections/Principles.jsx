import { ShieldCheck } from 'lucide-react';
import { PageHeader, Card } from '../ui/Section.jsx';

export default function Principles({ data }) {
  const { principles } = data;
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="The Operating Principles"
        title="12 rules — read every Monday morning"
        subtitle="These are the lessons you have already paid for. Read them. Run by them. The next 24 months become almost mechanical when you do."
        accent="amber"
      />
      <div className="grid sm:grid-cols-2 gap-3">
        {principles.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-300 font-display font-extrabold flex items-center justify-center shrink-0">{p.id}</div>
              <div>
                <h3 className="font-bold text-sm sm:text-base mb-1.5">{p.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{p.body}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
