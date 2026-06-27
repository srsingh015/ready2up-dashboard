import { useState } from 'react';
import { ListTodo, Plus, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Pill } from './Section.jsx';
import { useCloudState } from '../../lib/cloudSync.js';

const todayKey = () => new Date().toISOString().slice(0, 10);
function shiftKey(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function prettyDate(dateStr) {
  const today = todayKey();
  if (dateStr === today) return 'Today';
  if (dateStr === shiftKey(today, -1)) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

const ACCENTS = {
  amber: { text: 'text-amber-300', chip: 'bg-amber-500/10 text-amber-300 border-amber-500/20', btn: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200', active: 'bg-amber-500 text-ink-950 hover:bg-amber-400 shadow-[0_0_22px_-4px_rgba(245,158,11,0.75)]', ring: 'focus:border-amber-500/40', inputActive: 'border-amber-500/40', check: 'bg-amber-500 border-amber-500', pill: 'amber' },
  rose: { text: 'text-rose-300', chip: 'bg-rose-500/10 text-rose-300 border-rose-500/20', btn: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-200', active: 'bg-rose-500 text-white hover:bg-rose-400 shadow-[0_0_22px_-4px_rgba(244,63,94,0.75)]', ring: 'focus:border-rose-500/40', inputActive: 'border-rose-500/40', check: 'bg-rose-500 border-rose-500', pill: 'rose' },
};

/**
 * A per-day to-do list. Every day has its own list, stored by date, so nothing
 * is ever deleted — you can step back through previous days. Cloud-synced.
 */
export default function DailyTodo({ cloudKey, accent = 'amber', title = 'To-do list' }) {
  const [store, setStore] = useCloudState(cloudKey, {});
  const [viewDate, setViewDate] = useState(todayKey());
  const [text, setText] = useState('');
  const a = ACCENTS[accent] || ACCENTS.amber;

  const today = todayKey();
  const items = store[viewDate] || [];
  const done = items.filter((i) => i.done).length;
  const isToday = viewDate === today;

  function add() {
    const t = text.trim();
    if (!t) return;
    setStore((s) => ({ ...s, [viewDate]: [...(s[viewDate] || []), { id: Date.now(), text: t, done: false }] }));
    setText('');
  }
  function update(id, patch) {
    setStore((s) => ({ ...s, [viewDate]: (s[viewDate] || []).map((i) => (i.id === id ? { ...i, ...patch } : i)) }));
  }
  function remove(id) {
    setStore((s) => ({ ...s, [viewDate]: (s[viewDate] || []).filter((i) => i.id !== id) }));
  }

  return (
    <Card className={`border ${a.chip.split(' ').pop()}`}>
      {/* Header: title + date nav + progress */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ListTodo className={`w-5 h-5 ${a.text}`} />
          <h3 className="font-display text-lg font-extrabold">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {items.length > 0 && <Pill color={a.pill}>{done} / {items.length}</Pill>}
          <div className="flex items-center gap-0.5 bg-ink-900 border border-white/[0.06] rounded-lg p-0.5">
            <button onClick={() => setViewDate((d) => shiftKey(d, -1))} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06]" aria-label="Previous day">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-2 min-w-[64px] text-center">{prettyDate(viewDate)}</span>
            <button
              onClick={() => setViewDate((d) => (d >= today ? d : shiftKey(d, 1)))}
              disabled={isToday}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add row */}
      <div className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder={isToday ? 'Add a task for today…' : `Add a task for ${prettyDate(viewDate)}…`}
          className={`flex-1 min-w-0 bg-ink-900 border rounded-lg px-3 py-2 text-sm focus:outline-none placeholder-slate-600 transition-colors ${text.trim() ? a.inputActive : 'border-white/[0.08]'} ${a.ring}`}
        />
        <button
          onClick={add}
          disabled={!text.trim()}
          className={`inline-flex items-center justify-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg transition-all shrink-0 ${
            text.trim()
              ? `${a.active} cursor-pointer`
              : 'bg-white/[0.05] text-slate-600 cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add</span>
        </button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
          <p className="text-sm text-slate-500">{isToday ? 'Nothing yet. Add your first task for today.' : 'No tasks were added on this day.'}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 group">
              <button
                onClick={() => update(it.id, { done: !it.done })}
                className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${it.done ? a.check : 'border-white/20 hover:border-white/40'}`}
                aria-label={it.done ? 'Mark not done' : 'Mark done'}
              >
                {it.done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
              <input
                value={it.text}
                onChange={(e) => update(it.id, { text: e.target.value })}
                className={`flex-1 min-w-0 bg-transparent border-b border-transparent hover:border-white/[0.08] focus:border-white/[0.2] px-1 py-1.5 text-sm focus:outline-none transition-colors ${it.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}
              />
              <button
                onClick={() => remove(it.id)}
                className="shrink-0 text-slate-600 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                aria-label="Remove task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-slate-500 mt-3">Each day is saved separately — use the arrows to look back. Nothing is ever deleted.</p>
    </Card>
  );
}
