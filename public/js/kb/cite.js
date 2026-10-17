// Chapter citations for a knowledge base: "Ch. 12 · Story/Scene/Dialogue"
// in tooltips, "Ch. 12–18" on badges.

export function citeFns(chapters, labels) {
  const cite = (ch) => {
    if (ch == null) return '';
    const list = Array.isArray(ch) ? ch : [ch];
    return list
      .map((c) => (typeof c === 'number' ? `${labels.ch} ${c} · ${chapters[c]}` : chapters[c] || String(c)))
      .join('; ');
  };
  // Consecutive chapters collapse into a range; "tasks" and "pref" are named.
  const shortCite = (ch) => {
    if (ch == null) return '';
    const list = Array.isArray(ch) ? ch : [ch];
    const nums = list.filter((c) => typeof c === 'number').sort((a, b) => a - b);
    const named = list.filter((c) => typeof c !== 'number').map((c) => labels[c] || String(c));
    const runs = [];
    for (const n of nums) {
      const last = runs[runs.length - 1];
      if (last && n === last[1] + 1) last[1] = n;
      else runs.push([n, n]);
    }
    const parts = runs.map(([a, b]) => (a === b ? `${a}` : b === a + 1 ? `${a}, ${b}` : `${a}–${b}`));
    return [parts.length ? `${labels.ch} ${parts.join(', ')}` : '', ...named].filter(Boolean).join('; ');
  };
  return { cite, shortCite };
}
