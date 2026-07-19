import { motion } from 'framer-motion';

export function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      {eyebrow && (
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300/80 mb-3">{eyebrow}</div>
      )}
      <h1
        className="font-display font-extrabold leading-[1.05] tracking-tight"
        style={{
          fontSize: 'clamp(1.75rem, 4.5vw, 2.5rem)',
          backgroundImage:
            'linear-gradient(110deg, var(--page-grad-1, #ec4899) 0%, var(--page-grad-2, #f472b6) 30%, var(--page-grad-3, #fbbf24) 55%, var(--page-grad-2, #f472b6) 80%, var(--page-grad-1, #ec4899) 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
          animation: 'blossomShimmer 8s ease-in-out infinite',
          display: 'inline-block',
          padding: '0 0.05em',
        }}
      >
        {title}
      </h1>
      {subtitle && <p className="text-base text-slate-400 mt-3 max-w-2xl leading-relaxed">{subtitle}</p>}
    </motion.div>
  );
}

export function SectionHeader({ icon: Icon, title, subtitle, color = 'amber' }) {
  const colorMap = {
    amber: 'bg-amber-500/10 text-amber-300',
    violet: 'bg-violet-500/10 text-violet-300',
    emerald: 'bg-emerald-500/10 text-emerald-300',
    sky: 'bg-sky-500/10 text-sky-300',
    rose: 'bg-rose-500/10 text-rose-300',
  };
  return (
    <div className="flex items-start gap-3 mb-5">
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="font-display text-xl sm:text-2xl font-extrabold leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
}

export function Card({ children, className = '', hover = true }) {
  return (
    <div className={`bg-ink-800/60 border border-white/[0.06] rounded-2xl p-5 sm:p-6 ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Pill({ children, color = 'amber' }) {
  const colorMap = {
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    sky: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    slate: 'bg-white/[0.04] text-slate-300 border-white/[0.08]',
  };
  return <span className={`tag border ${colorMap[color]}`}>{children}</span>;
}

export function StatCard({ label, value, sub, color = 'amber' }) {
  const colorMap = {
    amber: 'text-amber-300',
    violet: 'text-violet-300',
    emerald: 'text-emerald-300',
    sky: 'text-sky-300',
    rose: 'text-rose-300',
    slate: 'text-slate-100',
  };
  return (
    <Card>
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{label}</div>
      <div className={`font-display text-2xl font-extrabold ${colorMap[color]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1.5">{sub}</div>}
    </Card>
  );
}

export function Divider() {
  return <div className="my-10 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />;
}
