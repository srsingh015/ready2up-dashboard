// INR formatting helpers — Indian numbering system, optional crore/lakh shorthand.

export function formatInr(n, opts = {}) {
  if (n == null || isNaN(n)) return '—';
  const { short = true } = opts;
  if (short) {
    if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(n % 1_00_00_000 === 0 ? 0 : 2)}Cr`;
    if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(n % 1_00_000 === 0 ? 0 : 2)}L`;
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`;
    return `₹${n.toLocaleString('en-IN')}`;
  }
  return `₹${n.toLocaleString('en-IN')}`;
}

export function formatRange(range, opts) {
  if (!range) return '—';
  return `${formatInr(range.from, opts)} – ${formatInr(range.to, opts)}`;
}

export function formatUsd(n) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1_000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `$${n}`;
}

export function formatUsdRange(range) {
  if (!range) return '—';
  return `${formatUsd(range.from)} – ${formatUsd(range.to)}`;
}
