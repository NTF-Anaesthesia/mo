// node qbank/tools/import-guide.mjs   copies the MO guide's case scenarios into the bank as questions, then run check.mjs
// One question per step on each case's main path (the route the best answers take); detours after a wrong answer are
// left out. The stem is the step, then the case opening (step 1 is the opening); the explanation is the guide's
// feedback on each choice.
// Safe to re-run: a question is matched by its source line, so its id stays the same and edits in the guide flow in.
// Questions edited in the bank since (review notes, status) keep those fields.
import fs from 'node:fs';
import { SCENARIOS } from '../../mo/guide/js/data/scenarios.js';
import { clean, idFor, bankJSON } from '../js/bank.js';

const file = new URL('../bank/questions.json', import.meta.url).pathname;
const bank = JSON.parse(fs.readFileSync(file, 'utf8'));
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });

// The bank's topics for each case (the guide has none of its own).
const TOPICS = {
  'first-induction': ['Airway'], 'desat-intubated': ['Airway', 'Emergencies'], 'hypotension-induction': ['Cardiac'],
  'anaphylaxis-antibiotic': ['Emergencies'], 'laryngospasm-emergence': ['Airway', 'Emergencies'], 'pacu-pain-ponv': ['PACU', 'Pain'],
  'pacu-drowsy': ['PACU'], 'premed-flags': ['Pre-op'], 'rsi-appendix': ['Airway'], 'spinal-hypotension': ['Regional'],
  'pacu-discharge': ['PACU'], 'last-block': ['Regional', 'Emergencies'], 'cant-intubate': ['Airway', 'Emergencies'],
  'brady-pneumoperitoneum': ['Cardiac'],
};

const plain = s => String(s || '').replace(/`/g, '').trim();
// Fixed shuffle per step, so the best answer isn't always A and re-runs give the same order.
function order(n, seed) {
  let h = 2166136261 >>> 0;
  for (const c of seed) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const idx = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

const bySource = new Map(bank.questions.map(q => [q.source, q]));
const taken = new Set(bank.questions.map(q => q.id));
let added = 0, updated = 0; // updated = changed in the guide since the last run
for (const s of SCENARIOS) {
  if (!TOPICS[s.id]) throw new Error(`No topics for case ${s.id}: add it to TOPICS`);
  const opening = plain(s.nodes[s.start].text);
  const seen = new Set();
  for (let key = s.start, step = 1; key && !seen.has(key) && s.nodes[key]?.choices; step++) {
    seen.add(key);
    const node = s.nodes[key];
    const best = node.choices.filter(c => c.good === true);
    if (best.length !== 1) throw new Error(`${s.id} ${key}: needs exactly one best choice`);
    const ord = order(node.choices.length, `${s.id}:${key}`);
    const choices = ord.map(i => node.choices[i]);
    const text = plain(node.text), ask = text.endsWith('?') ? '' : '\n\nWhich is the best choice?';
    const stem = key === s.start ? `${opening}\n\nWhat do you do first?` : `${text}\n\nThe case so far: ${opening}${ask}`;
    const others = choices.filter(c => c !== best[0]).map(c => `• “${plain(c.text)}” ${plain(c.feedback)}`).join('\n');
    const source = `MO guide case: ${s.title} (${s.id}), step ${step}`;
    const q = {
      stem, options: choices.map(c => plain(c.text)), answer: choices.indexOf(best[0]),
      explain: `${plain(best[0].feedback)}\n\nThe other choices:\n${others}`,
      topics: [...TOPICS[s.id], 'MO guide cases', 'MO level'], level: s.level === 'beyond' ? 'hard' : 'standard',
      status: 'active', image: '', source, review: '', updated: today,
    };
    const old = bySource.get(source);
    if (old) {
      const next = clean({ ...q, id: old.id, status: old.status, review: old.review, updated: old.updated });
      if (JSON.stringify(next) !== JSON.stringify(clean(old))) { Object.assign(old, next, { updated: today }); updated++; }
    }
    else { q.id = idFor(stem + key, taken); taken.add(q.id); bank.questions.push(clean(q)); added++; }
    key = best[0].next;
  }
}
fs.writeFileSync(file, bankJSON(bank.questions));
console.log(`MO guide cases: ${added} added, ${updated} changed`);
