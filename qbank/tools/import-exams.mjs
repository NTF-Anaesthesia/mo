// node qbank/tools/import-exams.mjs [page]   copies the SAQ essays of the exams pages into the bank, then run check.mjs
// page: the exams page's index.html, a file path or a URL (default https://anantf.com/exams/). The essays stay owned by
// the exams pages (another maintainer's; used here with their OK, 24 Oct 2026): re-run this after they change.
// - The study plan's essays (studyPlan in the page): one essay question each, topics Essay + the plan's tag.
// - The worked essays (PDFs, listed in exams-worked.json): the essay gets a link to its PDF and the topics
//   Worked answer + its curriculum group. One that is not in the study plan becomes its own question.
// Safe to re-run: a question is matched by its text, so its id stays. Status and review set in the bank are kept.
import fs from 'node:fs';
import { clean, idFor, bankJSON } from '../js/bank.js';

const page = process.argv[2] || 'https://anantf.com/exams/';
const html = /^https:/.test(page) ? await (await fetch(page)).text() : fs.readFileSync(page, 'utf8');
const file = new URL('../bank/questions.json', import.meta.url).pathname;
const bank = JSON.parse(fs.readFileSync(file, 'utf8'));
const worked = JSON.parse(fs.readFileSync(new URL('exams-worked.json', import.meta.url), 'utf8')).essays;
const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' });
const PDF = 'https://anantf.com/exams/reference/';

// The page keeps its data as script literals (const studyPlan = {...}; const exams = ...): read that one literal.
function literal(name, next) {
  const a = html.indexOf(`const ${name} = `), b = html.indexOf(`const ${next} = `, a);
  if (a < 0 || b < 0) throw new Error(`The exams page has no "${name}" data: has it changed shape?`);
  return Function(`"use strict"; return (${html.slice(a + name.length + 9, b).trim().replace(/;$/, '')});`)();
}
const plan = literal('studyPlan', 'exams');

const key = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
// "A. What ... (20%) · B. Why ..." -> one part a line, lettered A, B, C
const parts = q => {
  const list = String(q).split(' · ').map(s => s.replace(/^[A-Za-z][.)]\s*/, '').trim()).filter(Boolean);
  return list.length > 1 ? list.map((p, i) => `${String.fromCharCode(65 + i)}. ${p}`).join('\n') : list[0] || '';
};
const pdfOf = w => ({ link: PDF + w.file, topics: ['Worked answer', w.group], explain: 'The worked answer is a PDF: open it below.' });

const incoming = [];
plan.weeks.forEach(w => w.sessions.forEach(s => s.essays.forEach(e => {
  const stem = `${e.stem.trim()}\n\n${parts(e.q)}`;
  const w2 = worked.find(x => (x.plan || []).some(p => key(e.stem).startsWith(key(p))));
  incoming.push({ stem, topics: ['Essay', e.tag], source: `Exams page study plan, week ${w.num}${w2?.from ? ` (from ${w2.from})` : ''}`, ...(w2 ? { ...pdfOf(w2), topics: ['Essay', e.tag, ...pdfOf(w2).topics] } : {}) });
})));
for (const w of worked.filter(x => x.stem)) incoming.push({ stem: w.stem, ...pdfOf(w), topics: ['Essay', ...pdfOf(w).topics], source: `Exams page worked essay: ${w.title}${w.from ? ` (from ${w.from})` : ''}` });
for (const w of worked.filter(x => x.plan)) if (!incoming.some(q => q.link === PDF + w.file)) throw new Error(`${w.file}: its study plan essay is gone; give it a stem in exams-worked.json`);

// The same essay twice in the plan (another week, slightly different spacing): keep the first.
const seen = new Set();
const unique = incoming.filter(q => !seen.has(key(q.stem)) && seen.add(key(q.stem)));
const byText = new Map(bank.questions.filter(q => q.type === 'essay').map(q => [key(q.stem), q]));
const taken = new Set(bank.questions.map(q => q.id));
let added = 0, changed = 0;
for (const x of unique) {
  const q = { type: 'essay', options: [], answer: -1, explain: '', level: 'standard', status: 'active', image: '', review: '', link: '', ...x, updated: today };
  const old = byText.get(key(q.stem));
  if (old) {
    const next = clean({ ...q, id: old.id, status: old.status, review: old.review, updated: old.updated });
    if (JSON.stringify(next) !== JSON.stringify(clean(old))) { Object.assign(old, next, { updated: today }); changed++; }
  } else { q.id = idFor(q.stem, taken); taken.add(q.id); bank.questions.push(clean(q)); byText.set(key(q.stem), q); added++; }
}
fs.writeFileSync(file, bankJSON(bank.questions));
console.log(`Exams essays: ${added} added, ${changed} changed (${unique.length} on the page)`);
