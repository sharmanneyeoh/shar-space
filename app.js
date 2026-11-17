'use strict';
/* =====================================================
   Shar's Space — personal planner PWA
   Everything is stored on the device in localStorage.
   ===================================================== */

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayStr = () => ymd(new Date());
const addDays = (ds, n) => { const d = parseYmd(ds); d.setDate(d.getDate() + n); return ymd(d); };
const monthKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const firstOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);
const fmt = (ds, o) => parseYmd(ds).toLocaleDateString(undefined, o);
const fmtTime = t => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

/* ---------- constants ---------- */
const STORE_KEY = 'shar-space-v1';
const THEMES = {
  blush: { name: 'Blush', bar: '#fff6f9', swatch: '#f7a8c4' },
  strawberry: { name: 'Strawberry Milk', bar: '#fff2f5', swatch: '#ff6f98' },
  lavender: { name: 'Lavender Rose', bar: '#fbf6fc', swatch: '#c98bc6' },
  peach: { name: 'Peachy Pink', bar: '#fff7f3', swatch: '#f39a8a' },
  midnight: { name: 'Midnight Pink', bar: '#1f1218', swatch: '#7a2f55' },
};
const COLORS = ['#f48fb1', '#ff6f91', '#e57399', '#ce93d8', '#b39ddb', '#90caf9', '#80cbc4', '#ffcc80'];
const LABELS = ['', '#f48fb1', '#ff6f91', '#ce93d8', '#90caf9', '#80cbc4', '#ffcc80'];
const MOODS = ['🥰', '😊', '😌', '😐', '😔', '😢', '😤'];
const TRACKER_EMOJI = ['💧', '🧴', '🩰', '📖', '💊', '🧘‍♀️', '🥗', '😴', '☕', '🍓', '🐾', '💌', '✍️', '🎧', '🌸', '🎀'];
const CURRENCIES = ['$', 'RM', 'S$', '₱', '£', '€', '¥', '₩', '₹'];
const PROMPTS = [
  'What made you smile today?', 'What are you grateful for right now?', "What's been on your mind lately?",
  'Describe today in three words…', 'What would make tomorrow lovely?', 'Something you are proud of this week…',
];
const AFFIRM = [
  'Soft heart, strong mind ♡', 'Little steps still count ✿', 'You are allowed to rest today',
  'Bloom at your own pace 🌷', 'Be gentle with yourself', 'Good things are on their way ✧',
  'Romanticise the little moments', 'Drink water & be kind to you 💧', 'Progress, not perfection',
  'You make today lovely ♡', 'Your pace is the right pace', 'Main character energy only ✨',
];

const ICON = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  board: '<svg viewBox="0 0 24 24"><rect x="2.5" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="16.5" y="4" width="5" height="7" rx="1.5"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3M9 8h7"/></svg>',
  wallet: '<svg viewBox="0 0 24 24"><path d="M4 7a2 2 0 0 1 2-2h11v3"/><rect x="3" y="8" width="18" height="12" rx="3"/><circle cx="16.5" cy="14" r="1.2"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></svg>',
  chevL: '<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>',
  chevR: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
};

/* ---------- state ---------- */
function defaultState() {
  return {
    v: 1,
    settings: { name: '', currency: '$', budget: 0, theme: 'blush', weekStart: 0 },
    events: [],
    board: {
      columns: [
        {
          id: uid(), title: 'To Do ♡', color: '#f48fb1', cards: [
            { id: uid(), title: 'Tap me to edit ✎', note: 'Change the title, notes, due date and label colour.', due: '', label: '#f48fb1' },
            { id: uid(), title: 'Hold me, then drag me to another column', note: '', due: '', label: '#ce93d8' },
          ],
        },
        { id: uid(), title: 'In Progress ✿', color: '#ce93d8', cards: [] },
        { id: uid(), title: 'Done ✓', color: '#80cbc4', cards: [] },
      ],
    },
    journal: [],
    expenses: [],
    categories: [
      ['Food', '🍓'], ['Transport', '🚗'], ['Shopping', '🛍️'], ['Beauty', '💄'], ['Bills', '🧾'],
      ['Fun', '🎀'], ['Health', '💊'], ['Other', '✨'],
    ].map(([name, emoji]) => ({ id: uid(), name, emoji, type: 'expense' }))
      .concat([['Salary', '💼'], ['Gift', '🎁'], ['Other', '✨']].map(([name, emoji]) => ({ id: uid(), name, emoji, type: 'income' }))),
    trackers: [
      { id: uid(), name: 'Water', emoji: '💧', kind: 'count', goal: 8, log: {} },
      { id: uid(), name: 'Skincare', emoji: '🧴', kind: 'check', goal: 1, log: {} },
      { id: uid(), name: 'Move', emoji: '🩰', kind: 'check', goal: 1, log: {} },
      { id: uid(), name: 'Read', emoji: '📖', kind: 'check', goal: 1, log: {} },
    ],
  };
}
function normalize(d) {
  const def = defaultState();
  return { ...def, ...d, settings: { ...def.settings, ...(d.settings || {}) } };
}
function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { /* fall through to defaults */ }
  return defaultState();
}
let S = load();
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) { toast('Could not save — storage is full'); }
}

const UI = {
  tab: 'home',
  calMonth: firstOfMonth(new Date()),
  sel: todayStr(),
  moneyMonth: firstOfMonth(new Date()),
  jq: '',
};

/* ---------- data helpers ---------- */
const getCol = id => S.board.columns.find(c => c.id === id);
function findCard(id) {
  for (const col of S.board.columns) {
    const card = col.cards.find(c => c.id === id);
    if (card) return { col, card };
  }
  return null;
}
const allCards = () => S.board.columns.flatMap(col => col.cards.map(card => ({ ...card, colId: col.id })));
// the last column counts as "done" (as long as there is more than one)
const doneColId = () => S.board.columns.length > 1 ? S.board.columns[S.board.columns.length - 1].id : null;

function occursOn(ev, ds) {
  if (ev.date === ds) return true;
  if (!ev.repeat || ev.repeat === 'none' || ds < ev.date) return false;
  const a = parseYmd(ev.date), b = parseYmd(ds);
  switch (ev.repeat) {
    case 'daily': return true;
    case 'weekly': return a.getDay() === b.getDay();
    case 'monthly': return a.getDate() === b.getDate();
    case 'yearly': return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
  }
  return false;
}
const eventsOn = ds => S.events.filter(e => occursOn(e, ds)).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

const catById = id => S.categories.find(c => c.id === id) || { name: 'Other', emoji: '✨' };
function catsFor(type) {
  const list = S.categories.filter(c => c.type === type);
  return list.length ? list : [{ id: 'other', name: 'Other', emoji: '✨', type }];
}
function money(n, compact) {
  const a = Math.abs(n);
  const opts = compact && a >= 100 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return (n < 0 ? '−' : '') + S.settings.currency + a.toLocaleString(undefined, opts);
}
const monthTx = key => S.expenses.filter(x => x.date.startsWith(key));
function totals(list) {
  let spent = 0, income = 0;
  for (const x of list) x.type === 'income' ? income += x.amount : spent += x.amount;
  return { spent, income };
}

const goalOf = tr => tr.kind === 'check' ? 1 : Math.max(1, +tr.goal || 1);
const isDone = (tr, ds) => (tr.log[ds] || 0) >= goalOf(tr);
function streak(tr) {
  let d = todayStr(), n = 0;
  if (!isDone(tr, d)) d = addDays(d, -1);
  while (isDone(tr, d)) { n++; d = addDays(d, -1); }
  return n;
}

/* ---------- shared bits of markup ---------- */
const headerHTML = (kicker, title, right = '') =>
  `<div class="topbar-inner"><div><div class="kicker">${kicker}</div><h1>${title}</h1></div><div class="topbar-actions">${right}</div></div>`;

function swatches(name, colors, selected) {
  return `<div class="swatches">${colors.map(c => `<label class="swatch${c ? '' : ' none'}" style="--c:${c || 'transparent'}"><input type="radio" name="${name}" value="${c}" ${c === (selected || '') ? 'checked' : ''} hidden>${c ? '' : '∅'}</label>`).join('')}</div>`;
}

function agendaHTML(ds, withOverdue) {
  const done = doneColId();
  const evs = eventsOn(ds);
  const tasks = allCards()
    .filter(c => c.due && c.colId !== done && (withOverdue ? c.due <= ds : c.due === ds))
    .sort((a, b) => a.due.localeCompare(b.due));
  if (!evs.length && !tasks.length) return `<div class="empty">Nothing planned — enjoy your day ♡</div>`;
  return `<div class="agenda">${evs.map(e => `
    <button class="agenda-item" data-act="edit-event" data-id="${e.id}" style="--c:${e.color}">
      <span class="agenda-time">${e.time ? fmtTime(e.time) : 'All day'}${e.end ? `<small>${fmtTime(e.end)}</small>` : ''}</span>
      <span class="agenda-main"><b>${esc(e.title)}</b>${e.note ? `<small>${esc(e.note)}</small>` : ''}</span>
    </button>`).join('')}${tasks.map(c => `
    <button class="agenda-item" data-act="edit-card" data-id="${c.id}" style="--c:${c.label || 'var(--accent)'}">
      <span class="agenda-time">${c.due < ds ? '<em class="overdue">overdue</em>' : 'task'}</span>
      <span class="agenda-main"><b>${esc(c.title)}</b><small>${esc(getCol(c.colId).title)}${c.due < ds ? ' · due ' + fmt(c.due, { day: 'numeric', month: 'short' }) : ''}</small></span>
    </button>`).join('')}</div>`;
}

function entryCard(j) {
  return `<button class="entry" data-act="edit-entry" data-id="${j.id}">
    <span class="date-badge"><b>${parseYmd(j.date).getDate()}</b><small>${fmt(j.date, { month: 'short' })}</small></span>
    <span class="entry-main">
      <span class="entry-title">${j.mood ? `<span class="entry-mood">${j.mood}</span>` : ''}${esc(j.title || fmt(j.date, { weekday: 'long' }))}</span>
      <span class="entry-preview">${esc(j.body.slice(0, 180))}</span>
    </span>
  </button>`;
}

function trackerTile(tr) {
  const t = todayStr(), n = tr.log[t] || 0, goal = goalOf(tr), done = n >= goal;
  const C = 2 * Math.PI * 24, pct = Math.min(1, n / goal);
  const week = [...Array(7)].map((_, i) => `<i class="${isDone(tr, addDays(t, i - 6)) ? 'on' : ''}"></i>`).join('');
  const st = streak(tr);
  return `<div class="tracker${done ? ' done' : ''}">
    <button class="tracker-tap" data-act="track" data-id="${tr.id}">
      <span class="ring"><svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="24" class="ring-bg"/><circle cx="28" cy="28" r="24" class="ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg><span>${esc(tr.emoji)}</span></span>
      <span class="tracker-name">${esc(tr.name)}</span>
      <span class="tracker-sub">${tr.kind === 'count' ? `${n} / ${goal}` : done ? 'done ✓' : 'tap to check'}</span>
    </button>
    <div class="tracker-week">${week}</div>
    <div class="tracker-foot">
      <span class="streak">${st ? `✧ ${st} day${st > 1 ? 's' : ''}` : ''}</span>
      <span>${tr.kind === 'count' && n > 0 ? `<button class="mini" data-act="untrack" data-id="${tr.id}" aria-label="Minus one">−</button>` : ''}<button class="mini" data-act="edit-tracker" data-id="${tr.id}" aria-label="Edit ${esc(tr.name)}">⋯</button></span>
    </div>
  </div>`;
}

/* ---------- views ---------- */
function homeView() {
  const t = todayStr(), h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const name = S.settings.name.trim();
  const done = doneColId();
  const openCount = allCards().filter(c => c.colId !== done).length;
  const { spent } = totals(monthTx(monthKey(new Date())));
  const entryToday = S.journal.find(j => j.date === t);
  const day = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  return {
    header: headerHTML(fmt(t, { weekday: 'long', day: 'numeric', month: 'long' }),
      `${greet}${name ? `, <em>${esc(name)}</em>` : ''} <span class="spark">✿</span>`,
      `<button class="icon-btn" data-act="settings" aria-label="Settings">${ICON.settings}</button>`),
    body: `
      <section class="hero">
        <div class="hero-quote">${esc(AFFIRM[day % AFFIRM.length])}</div>
        <div class="hero-stats">
          <button class="hero-stat" data-act="tab" data-tab="board"><b>${openCount}</b><span>tasks to do</span></button>
          <button class="hero-stat" data-act="tab" data-tab="calendar"><b>${eventsOn(t).length}</b><span>plans today</span></button>
          <button class="hero-stat" data-act="tab" data-tab="money"><b>${esc(money(spent, true))}</b><span>spent this month</span></button>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Little habits</h2><button class="link" data-act="new-tracker">+ add</button></div>
        ${S.trackers.length ? `<div class="trackers">${S.trackers.map(trackerTile).join('')}</div>` : '<div class="empty">Track anything — water, vitamins, steps, books…</div>'}
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Today</h2><button class="link" data-act="new-event" data-date="${t}">+ plan</button></div>
        ${agendaHTML(t, true)}
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Dear diary</h2><button class="link" data-act="tab" data-tab="journal">see all</button></div>
        ${entryToday ? entryCard(entryToday) : `
          <p class="muted" style="margin:0 0 10px">How are you feeling today?</p>
          <div class="mood-row">${MOODS.map(m => `<button class="mood-btn" data-act="new-entry" data-mood="${m}">${m}</button>`).join('')}</div>`}
      </section>`,
  };
}

function calendarView() {
  const m = UI.calMonth, ws = +S.settings.weekStart || 0, t = todayStr(), sel = UI.sel;
  const offset = (m.getDay() - ws + 7) % 7;
  const dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const n = Math.ceil((offset + dim) / 7) * 7;
  const done = doneColId();
  const due = new Set(allCards().filter(c => c.due && c.colId !== done).map(c => c.due));
  const jdays = new Set(S.journal.map(j => j.date));
  let cells = '';
  for (let i = 0; i < n; i++) {
    const d = new Date(m.getFullYear(), m.getMonth(), 1 - offset + i), ds = ymd(d);
    const dots = eventsOn(ds).slice(0, 3).map(e => `<i style="background:${e.color}"></i>`).join('') + (due.has(ds) ? '<i class="task-dot"></i>' : '');
    cells += `<button class="day${d.getMonth() !== m.getMonth() ? ' out' : ''}${ds === t ? ' today' : ''}${ds === sel ? ' sel' : ''}" data-act="pick-day" data-date="${ds}"><span>${d.getDate()}</span><span class="dots">${dots}</span>${jdays.has(ds) ? '<span class="jmark">♡</span>' : ''}</button>`;
  }
  // 1 Jan 2023 was a Sunday
  const week = [...Array(7)].map((_, i) => `<span>${new Date(2023, 0, 1 + ((i + ws) % 7)).toLocaleDateString(undefined, { weekday: 'narrow' })}</span>`).join('');
  const entries = S.journal.filter(j => j.date === sel);
  const { spent } = totals(S.expenses.filter(x => x.date === sel));
  return {
    header: headerHTML(m.getFullYear(), m.toLocaleDateString(undefined, { month: 'long' }),
      `<button class="pill-btn" data-act="cal-today">Today</button>
       <button class="icon-btn" data-act="cal-shift" data-n="-1" aria-label="Previous month">${ICON.chevL}</button>
       <button class="icon-btn" data-act="cal-shift" data-n="1" aria-label="Next month">${ICON.chevR}</button>`),
    body: `
      <section class="panel cal"><div class="cal-week">${week}</div><div class="cal-grid" id="calGrid">${cells}</div></section>
      <section class="panel">
        <div class="panel-head"><h2>${fmt(sel, { weekday: 'long', day: 'numeric', month: 'long' })}</h2></div>
        ${agendaHTML(sel, sel === t)}
        ${entries.length ? `<div class="stack" style="margin-top:10px">${entries.map(entryCard).join('')}</div>` : ''}
        ${spent ? `<div class="day-note">💸 Spent ${money(spent)} on this day</div>` : ''}
      </section>`,
    fab: () => eventEditor(null, UI.sel),
    after: () => swipe($('#calGrid'), () => shiftCal(1), () => shiftCal(-1)),
  };
}

function taskHTML(c, t, inDoneCol) {
  const meta = (c.due ? `<span class="${!inDoneCol && c.due < t ? 'late' : ''}">📅 ${fmt(c.due, { day: 'numeric', month: 'short' })}</span>` : '') + (c.note ? '<span>✎ note</span>' : '');
  return `<article class="task" data-act="edit-card" data-id="${c.id}" style="--label:${c.label || 'var(--line)'}" tabindex="0"><div class="task-title">${esc(c.title)}</div>${meta ? `<div class="task-meta">${meta}</div>` : ''}</article>`;
}

function boardView() {
  const t = todayStr(), done = doneColId();
  const cols = S.board.columns.map(col => `
    <section class="col" style="--col:${col.color}">
      <header class="col-head">
        <input class="col-title" data-col-title="${col.id}" value="${esc(col.title)}" maxlength="40" enterkeyhint="done" aria-label="Column name">
        <span class="col-count">${col.cards.length}</span>
        <button class="icon-btn sm" data-act="col-menu" data-id="${col.id}" aria-label="Column options">⋯</button>
      </header>
      <div class="col-cards" data-cards="${col.id}">${col.cards.map(c => taskHTML(c, t, col.id === done)).join('')}</div>
      <button class="add-card" data-act="add-card" data-id="${col.id}">+ Add task</button>
    </section>`).join('');
  return {
    header: headerHTML('to-do board', 'Tasks', `<button class="pill-btn" data-act="add-col">+ Column</button>`),
    body: `<p class="board-hint">Tap a column title to rename it · hold a task to drag it</p>
      <div class="board">${cols}<button class="add-col" data-act="add-col">+ New column</button></div>`,
    fab: () => cardEditor(null, S.board.columns[0]?.id),
  };
}

function journalList() {
  const q = UI.jq.trim().toLowerCase();
  const list = S.journal
    .filter(j => !q || `${j.title} ${j.body}`.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.updated || 0) - (a.updated || 0));
  if (!list.length) return `<div class="empty">${q ? 'No entries match your search' : 'Your journal is waiting for its first page ✎'}</div>`;
  let out = '', last = '';
  for (const j of list) {
    const k = j.date.slice(0, 7);
    if (k !== last) { last = k; out += `<h3 class="month-label">${parseYmd(j.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>`; }
    out += entryCard(j);
  }
  return out;
}

function journalView() {
  const key = monthKey(new Date());
  const moods = S.journal.filter(j => j.date.startsWith(key) && j.mood).sort((a, b) => a.date.localeCompare(b.date));
  return {
    header: headerHTML('dear diary', 'Journal'),
    body: `
      <label class="search">${ICON.search}<input id="jq" type="search" placeholder="Search your entries" value="${esc(UI.jq)}" autocomplete="off"></label>
      ${moods.length ? `<section class="panel"><div class="panel-head"><h2>Moods this month</h2><span class="muted">${moods.length} ${moods.length > 1 ? 'days' : 'day'}</span></div><div class="mood-strip">${moods.map(j => `<span title="${fmt(j.date, { day: 'numeric', month: 'short' })}">${j.mood}</span>`).join('')}</div></section>` : ''}
      <div id="jlist">${journalList()}</div>`,
    fab: () => entryEditor(),
    after: () => { $('#jq').oninput = e => { UI.jq = e.target.value; $('#jlist').innerHTML = journalList(); }; },
  };
}

function moneyView() {
  const m = UI.moneyMonth;
  const list = monthTx(monthKey(m)).sort((a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0));
  const { spent, income } = totals(list);
  const budget = +S.settings.budget || 0;
  const byCat = {};
  list.filter(x => x.type !== 'income').forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + x.amount; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const max = cats.length ? cats[0][1] : 1;

  let txs = '', last = '';
  for (const x of list) {
    if (x.date !== last) {
      if (last) txs += '</div>';
      last = x.date;
      txs += `<div class="tx-day"><h3>${fmt(x.date, { weekday: 'short', day: 'numeric', month: 'short' })}</h3>`;
    }
    const c = catById(x.category), inc = x.type === 'income';
    txs += `<button class="tx" data-act="edit-tx" data-id="${x.id}"><span class="tx-emoji">${esc(c.emoji)}</span><span class="tx-main"><b>${esc(x.note || c.name)}</b><small>${esc(c.name)}</small></span><span class="tx-amt${inc ? ' in' : ''}">${inc ? '+' : '−'}${money(x.amount)}</span></button>`;
  }
  if (last) txs += '</div>';

  return {
    header: headerHTML(`money diary · ${m.getFullYear()}`, m.toLocaleDateString(undefined, { month: 'long' }),
      `<button class="icon-btn" data-act="money-shift" data-n="-1" aria-label="Previous month">${ICON.chevL}</button>
       <button class="icon-btn" data-act="money-shift" data-n="1" aria-label="Next month">${ICON.chevR}</button>`),
    body: `
      <section class="hero">
        <div class="hero-label">Spent this month</div>
        <div class="hero-big">${money(spent)}</div>
        ${budget ? `<div class="budget"><div class="budget-bar"><i style="width:${Math.min(100, spent / budget * 100)}%"></i></div>
          <span>${spent <= budget ? `${money(budget - spent)} left of your ${money(budget)} budget` : `${money(spent - budget)} over your budget`}</span></div>` : ''}
        <div class="hero-split"><div><small>Income</small><b>${money(income)}</b></div><div><small>Balance</small><b>${money(income - spent)}</b></div></div>
      </section>
      ${cats.length ? `<section class="panel"><div class="panel-head"><h2>Where it went</h2></div>
        ${cats.map(([id, amt]) => { const c = catById(id); return `<div class="cat-bar"><span class="emo">${esc(c.emoji)}</span><div><div class="cat-line"><span>${esc(c.name)}</span><span>${money(amt)}</span></div><div class="track"><i style="width:${amt / max * 100}%"></i></div></div><span class="pct">${Math.round(amt / spent * 100)}%</span></div>`; }).join('')}
      </section>` : ''}
      <section class="panel"><div class="panel-head"><h2>Entries</h2></div>
        ${txs || '<div class="empty">Nothing logged this month — tap + to add ♡</div>'}
      </section>`,
    fab: () => txEditor(),
  };
}

const VIEWS = { home: homeView, calendar: calendarView, board: boardView, journal: journalView, money: moneyView };

function render() {
  const board = $('.board'), scroll = board ? board.scrollLeft : null;
  const v = VIEWS[UI.tab]();
  $('#topbar').innerHTML = v.header;
  $('#view').innerHTML = v.body;
  $$('.tabbar [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === UI.tab));
  const fab = $('#fab');
  fab.hidden = !v.fab;
  fab.onclick = v.fab || null;
  if (scroll != null && $('.board')) $('.board').scrollLeft = scroll;
  if (v.after) v.after();
}

function shiftCal(n) { UI.calMonth = new Date(UI.calMonth.getFullYear(), UI.calMonth.getMonth() + n, 1); render(); }

function swipe(el, onLeft, onRight) {
  if (!el) return;
  let x0 = null, y0 = 0;
  el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchend', e => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? onLeft : onRight)();
  });
}

/* ---------- bottom sheet ---------- */
let sheetHooks = {}, sheetToken = 0;
function openSheet(title, html, onMount, opts = {}) {
  const root = $('#sheet-root');
  sheetHooks = opts;
  sheetToken++;
  root.innerHTML = `<div class="sheet-backdrop" data-act="close-sheet"></div>
    <div class="sheet${opts.tall ? ' tall' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="sheet-grip"></div>
      <div class="sheet-head"><h2>${esc(title)}</h2><button class="icon-btn" type="button" data-act="close-sheet" aria-label="Close">${ICON.close}</button></div>
      <div class="sheet-body">${html}</div>
    </div>`;
  document.body.classList.add('sheet-open');
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('open')));
  if (onMount) onMount(root.querySelector('.sheet'), sheetHooks);
}
function closeSheet(force) {
  const root = $('#sheet-root');
  if (!root.innerHTML) return;
  if (!force && sheetHooks.beforeClose && sheetHooks.beforeClose() === false) return;
  const { onClose } = sheetHooks;
  sheetHooks = {};
  root.classList.remove('open');
  document.body.classList.remove('sheet-open');
  const tok = sheetToken;
  setTimeout(() => { if (tok === sheetToken) root.innerHTML = ''; }, 320);
  if (onClose) onClose();
}
function commit(msg) { save(); closeSheet(true); render(); if (msg) toast(msg); }

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1900);
}

const formData = f => Object.fromEntries(new FormData(f));
const actions = (isEdit, saveLabel, delLabel = 'Delete') =>
  `<div class="form-actions">${isEdit ? `<button type="button" class="btn danger" data-del>${delLabel}</button>` : ''}<button class="btn primary">${saveLabel}</button></div>`;

/* ---------- editors ---------- */
function eventEditor(id, date) {
  const ev = id ? S.events.find(e => e.id === id) : { title: '', date: date || UI.sel, time: '', end: '', repeat: 'none', color: COLORS[0], note: '' };
  if (!ev) return;
  const repeats = [['none', 'Never'], ['daily', 'Every day'], ['weekly', 'Every week'], ['monthly', 'Every month'], ['yearly', 'Every year']];
  openSheet(id ? 'Edit plan' : 'New plan', `<form class="form" id="f">
    <label class="field"><span>Title</span><input name="title" required value="${esc(ev.title)}" placeholder="Brunch with the girls 🥂" autocomplete="off"></label>
    <div class="row2">
      <label class="field"><span>Date</span><input type="date" name="date" required value="${ev.date}"></label>
      <label class="field"><span>Repeat</span><select name="repeat">${repeats.map(([v, l]) => `<option value="${v}"${ev.repeat === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    </div>
    <div class="row2">
      <label class="field"><span>Starts</span><input type="time" name="time" value="${ev.time || ''}"></label>
      <label class="field"><span>Ends</span><input type="time" name="end" value="${ev.end || ''}"></label>
    </div>
    <div class="field"><span>Colour</span>${swatches('color', COLORS, ev.color)}</div>
    <label class="field"><span>Notes</span><textarea name="note" rows="3" placeholder="Location, details…">${esc(ev.note)}</textarea></label>
    ${actions(id, id ? 'Save' : 'Add to calendar')}
  </form>`, sh => {
    const f = $('#f', sh);
    f.onsubmit = e => {
      e.preventDefault();
      const d = formData(f);
      Object.assign(ev, { title: d.title.trim(), date: d.date, time: d.time, end: d.end, repeat: d.repeat, color: d.color || COLORS[0], note: d.note.trim() });
      if (!id) { ev.id = uid(); S.events.push(ev); }
      UI.sel = ev.date;
      UI.calMonth = firstOfMonth(parseYmd(ev.date));
      commit(id ? 'Saved ♡' : 'Added to your calendar ♡');
    };
    const del = $('[data-del]', sh);
    if (del) del.onclick = () => {
      if (!confirm(ev.repeat !== 'none' ? 'Delete this plan (and all its repeats)?' : 'Delete this plan?')) return;
      S.events = S.events.filter(e => e.id !== id);
      commit('Deleted');
    };
  });
}

function cardEditor(id, colId) {
  if (!S.board.columns.length) return toast('Add a column first ♡');
  const found = id ? findCard(id) : null;
  if (id && !found) return;
  const card = found ? found.card : { title: '', note: '', due: '', label: '' };
  const cur = found ? found.col.id : (colId || S.board.columns[0].id);
  openSheet(id ? 'Edit task' : 'New task', `<form class="form" id="f">
    <label class="field"><span>Task</span><input name="title" value="${esc(card.title)}" placeholder="What needs doing?" required autocomplete="off"></label>
    <label class="field"><span>Notes</span><textarea name="note" rows="3" placeholder="Details, links, little reminders…">${esc(card.note)}</textarea></label>
    <label class="field"><span>Due date</span><input type="date" name="due" value="${card.due || ''}"></label>
    <div class="field"><span>Label</span>${swatches('label', LABELS, card.label)}</div>
    <div class="field"><span>Column</span><div class="chips">${S.board.columns.map(c => `<label class="chip"><input type="radio" name="col" value="${c.id}"${c.id === cur ? ' checked' : ''} hidden>${esc(c.title)}</label>`).join('')}</div></div>
    ${actions(id, id ? 'Save' : 'Add task')}
  </form>`, sh => {
    const f = $('#f', sh);
    f.onsubmit = e => {
      e.preventDefault();
      const d = formData(f);
      Object.assign(card, { title: d.title.trim(), note: d.note.trim(), due: d.due, label: d.label || '' });
      if (!found) { card.id = uid(); getCol(d.col).cards.push(card); }
      else if (d.col !== found.col.id) {
        found.col.cards.splice(found.col.cards.indexOf(card), 1);
        getCol(d.col).cards.push(card);
      }
      commit(id ? 'Saved ♡' : 'Task added ♡');
    };
    const del = $('[data-del]', sh);
    if (del) del.onclick = () => {
      if (!confirm('Delete this task?')) return;
      found.col.cards.splice(found.col.cards.indexOf(card), 1);
      commit('Task deleted');
    };
  });
}

function columnEditor(id) {
  const col = getCol(id);
  if (!col) return;
  const cols = S.board.columns, i = cols.indexOf(col);
  openSheet('Edit column', `<form class="form" id="f">
    <label class="field"><span>Column name</span><input name="title" value="${esc(col.title)}" maxlength="40" required autocomplete="off"></label>
    <div class="field"><span>Colour</span>${swatches('color', COLORS, col.color)}</div>
    <div class="btn-row">
      <button type="button" class="btn soft" data-move="-1"${i === 0 ? ' disabled' : ''}>← Move left</button>
      <button type="button" class="btn soft" data-move="1"${i === cols.length - 1 ? ' disabled' : ''}>Move right →</button>
    </div>
    <p class="hint">Tip: your last column counts as “done” — tasks in it won't show as due on your Home page.</p>
    ${actions(true, 'Save', 'Delete column')}
  </form>`, sh => {
    const f = $('#f', sh);
    const apply = () => { const d = formData(f); col.title = d.title.trim() || 'Untitled'; col.color = d.color || col.color; };
    f.onsubmit = e => { e.preventDefault(); apply(); commit(); };
    $$('[data-move]', sh).forEach(b => b.onclick = () => {
      apply();
      cols.splice(i, 1);
      cols.splice(i + +b.dataset.move, 0, col);
      commit();
    });
    $('[data-del]', sh).onclick = () => {
      if (col.cards.length && !confirm(`Delete “${col.title}” and its ${col.cards.length} task${col.cards.length > 1 ? 's' : ''}?`)) return;
      cols.splice(i, 1);
      commit('Column deleted');
    };
  });
}

function addColumn() {
  const col = { id: uid(), title: 'New column', color: COLORS[S.board.columns.length % COLORS.length], cards: [] };
  S.board.columns.push(col);
  save();
  if (UI.tab !== 'board') UI.tab = 'board';
  render();
  const input = $(`[data-col-title="${col.id}"]`);
  if (input) {
    input.closest('.col').scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    input.focus();
    input.select();
  }
}

function entryEditor(id, mood) {
  const j = id ? S.journal.find(x => x.id === id) : { date: todayStr(), mood: mood || '', title: '', body: '' };
  if (!j) return;
  const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  openSheet(id ? 'Journal entry' : 'New entry', `<form class="form" id="f">
    <div class="row2">
      <label class="field"><span>Date</span><input type="date" name="date" value="${j.date}" required></label>
      <label class="field"><span>Title</span><input name="title" value="${esc(j.title)}" placeholder="optional" autocomplete="off"></label>
    </div>
    <div class="field"><span>Mood</span><div class="mood-row">${MOODS.map(m => `<label class="mood-btn"><input type="radio" name="mood" value="${m}"${j.mood === m ? ' checked' : ''} hidden>${m}</label>`).join('')}</div></div>
    <label class="field"><span>Dear diary…</span><textarea name="body" rows="12" placeholder="${esc(prompt)}">${esc(j.body)}</textarea></label>
    ${actions(id, id ? 'Save' : 'Save entry')}
  </form>`, (sh, hooks) => {
    const f = $('#f', sh);
    const initial = JSON.stringify(formData(f));
    hooks.beforeClose = () => JSON.stringify(formData(f)) === initial || confirm('Discard your changes?');
    f.onsubmit = e => {
      e.preventDefault();
      const d = formData(f);
      if (!d.title.trim() && !d.body.trim() && !d.mood) return toast('Write a little something first ♡');
      Object.assign(j, { date: d.date, mood: d.mood || '', title: d.title.trim(), body: d.body.trim(), updated: Date.now() });
      if (!id) { j.id = uid(); S.journal.push(j); }
      commit('Saved to your journal ♡');
    };
    const del = $('[data-del]', sh);
    if (del) del.onclick = () => {
      if (!confirm('Delete this journal entry?')) return;
      S.journal = S.journal.filter(x => x.id !== id);
      commit('Entry deleted');
    };
  }, { tall: true });
}

function txEditor(id) {
  const t = todayStr();
  const x = id ? S.expenses.find(e => e.id === id)
    : { type: 'expense', amount: '', category: '', date: t.startsWith(monthKey(UI.moneyMonth)) ? t : ymd(UI.moneyMonth), note: '' };
  if (!x) return;
  openSheet(id ? 'Edit entry' : 'Add money entry', `<form class="form" id="f">
    <div class="seg">${[['expense', 'Expense'], ['income', 'Income']].map(([v, l]) => `<label><input type="radio" name="type" value="${v}"${x.type === v ? ' checked' : ''} hidden>${l}</label>`).join('')}</div>
    <div class="amount-wrap"><b>${esc(S.settings.currency)}</b><input name="amount" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0.00" value="${x.amount}" required aria-label="Amount"></div>
    <div class="field"><span>Category</span><div class="chips" id="cats"></div></div>
    <div class="row2">
      <label class="field"><span>Date</span><input type="date" name="date" value="${x.date}" required></label>
      <label class="field"><span>Note</span><input name="note" value="${esc(x.note)}" placeholder="Matcha latte 🍵" autocomplete="off"></label>
    </div>
    ${actions(id, id ? 'Save' : 'Add')}
  </form>`, sh => {
    const f = $('#f', sh), box = $('#cats', sh);
    const fill = () => {
      const list = catsFor(f.elements.type.value);
      const cur = list.some(c => c.id === x.category) ? x.category : list[0].id;
      box.innerHTML = list.map(c => `<label class="chip"><input type="radio" name="category" value="${c.id}"${c.id === cur ? ' checked' : ''} hidden>${esc(c.emoji)} ${esc(c.name)}</label>`).join('');
    };
    fill();
    $$('input[name=type]', sh).forEach(r => { r.onchange = fill; });
    f.onsubmit = e => {
      e.preventDefault();
      const d = formData(f);
      const amount = Math.round(parseFloat(d.amount) * 100) / 100;
      if (!(amount > 0)) return toast('Enter an amount ♡');
      Object.assign(x, { type: d.type, amount, category: d.category, date: d.date, note: d.note.trim() });
      if (!id) { x.id = uid(); x.created = Date.now(); S.expenses.push(x); }
      UI.moneyMonth = firstOfMonth(parseYmd(x.date));
      commit(id ? 'Saved ♡' : 'Added ♡');
    };
    const del = $('[data-del]', sh);
    if (del) del.onclick = () => {
      if (!confirm('Delete this entry?')) return;
      S.expenses = S.expenses.filter(e => e.id !== id);
      commit('Deleted');
    };
  });
}

function trackerEditor(id) {
  const tr = id ? S.trackers.find(t => t.id === id) : { name: '', emoji: '🌸', kind: 'check', goal: 1, log: {} };
  if (!tr) return;
  openSheet(id ? 'Edit habit' : 'New habit', `<form class="form" id="f">
    <div class="row2" style="grid-template-columns:72px 1fr">
      <label class="field"><span>Icon</span><input name="emoji" value="${esc(tr.emoji)}" maxlength="8" style="text-align:center;font-size:1.3rem"></label>
      <label class="field"><span>Name</span><input name="name" value="${esc(tr.name)}" placeholder="Vitamins, steps, no-spend day…" required autocomplete="off"></label>
    </div>
    <div class="emoji-picks">${TRACKER_EMOJI.map(e => `<button type="button" data-emo="${e}">${e}</button>`).join('')}</div>
    <div class="field"><span>Type</span><div class="seg">
      <label><input type="radio" name="kind" value="check"${tr.kind === 'check' ? ' checked' : ''} hidden>Check off ✓</label>
      <label><input type="radio" name="kind" value="count"${tr.kind === 'count' ? ' checked' : ''} hidden>Counter +1</label>
    </div></div>
    <label class="field goal-field"><span>Daily goal</span><input name="goal" type="number" inputmode="numeric" min="1" step="1" value="${tr.kind === 'count' ? tr.goal : 8}"></label>
    ${actions(id, id ? 'Save' : 'Add habit')}
  </form>`, sh => {
    const f = $('#f', sh);
    $$('[data-emo]', sh).forEach(b => { b.onclick = () => { f.elements.emoji.value = b.dataset.emo; }; });
    f.onsubmit = e => {
      e.preventDefault();
      const d = formData(f);
      Object.assign(tr, { name: d.name.trim(), emoji: d.emoji.trim() || '🌸', kind: d.kind, goal: d.kind === 'count' ? Math.max(1, parseInt(d.goal, 10) || 1) : 1 });
      if (!id) { tr.id = uid(); S.trackers.push(tr); }
      commit(id ? 'Saved ♡' : 'Habit added ♡');
    };
    const del = $('[data-del]', sh);
    if (del) del.onclick = () => {
      if (!confirm(`Delete “${tr.name}” and its history?`)) return;
      S.trackers = S.trackers.filter(t => t.id !== id);
      commit('Habit deleted');
    };
  });
}

/* ---------- settings & backup ---------- */
function applyTheme() {
  const theme = THEMES[S.settings.theme] ? S.settings.theme : 'blush';
  document.documentElement.dataset.theme = theme;
  $('meta[name="theme-color"]').setAttribute('content', THEMES[theme].bar);
}

function settingsSheet() {
  const s = S.settings;
  openSheet('Settings', `<div class="form">
    <label class="field"><span>Your name</span><input id="s-name" value="${esc(s.name)}" placeholder="What should I call you?" autocomplete="off"></label>
    <div class="field"><span>Theme</span><div class="themes">${Object.entries(THEMES).map(([k, t]) => `<label class="theme-opt"><input type="radio" name="theme" value="${k}"${s.theme === k ? ' checked' : ''} hidden><i style="background:${t.swatch}"></i>${t.name}</label>`).join('')}</div></div>
    <div class="row2">
      <label class="field"><span>Currency</span><input id="s-cur" value="${esc(s.currency)}" maxlength="4" autocomplete="off"></label>
      <label class="field"><span>Monthly budget</span><input id="s-budget" type="number" inputmode="decimal" min="0" value="${s.budget || ''}" placeholder="optional"></label>
    </div>
    <div class="chips">${CURRENCIES.map(c => `<button type="button" class="chip" data-cur="${c}">${c}</button>`).join('')}</div>
    <div class="field"><span>Week starts on</span><div class="seg">
      <label><input type="radio" name="ws" value="0"${+s.weekStart === 0 ? ' checked' : ''} hidden>Sunday</label>
      <label><input type="radio" name="ws" value="1"${+s.weekStart === 1 ? ' checked' : ''} hidden>Monday</label>
    </div></div>
    <div class="field"><span>Money categories</span><div id="catList"></div>
      <div class="cat-add">
        <input id="c-emoji" placeholder="🌸" maxlength="8" aria-label="Category emoji">
        <input id="c-name" placeholder="New category name" autocomplete="off">
        <select id="c-type" aria-label="Category type"><option value="expense">Expense</option><option value="income">Income</option></select>
        <button type="button" class="btn soft small" id="c-add">Add</button>
      </div>
    </div>
    <div class="field"><span>Backup</span>
      <p class="hint">Everything is saved privately on this phone. Save a backup once in a while (to Files, iCloud or email) so you never lose it.</p>
      <div class="btn-row" style="margin-top:8px">
        <button type="button" class="btn soft" id="b-export">Save backup</button>
        <label class="btn soft">Restore<input type="file" id="b-import" accept="application/json,.json" hidden></label>
      </div>
    </div>
    <button type="button" class="btn danger full" id="b-reset">Erase everything</button>
  </div>`, sh => {
    $('#s-name', sh).oninput = e => { s.name = e.target.value; save(); };
    $('#s-cur', sh).oninput = e => { s.currency = e.target.value; save(); };
    $('#s-budget', sh).oninput = e => { s.budget = parseFloat(e.target.value) || 0; save(); };
    $$('[data-cur]', sh).forEach(b => { b.onclick = () => { s.currency = b.dataset.cur; $('#s-cur', sh).value = s.currency; save(); }; });
    $$('input[name=theme]', sh).forEach(r => { r.onchange = () => { s.theme = r.value; applyTheme(); save(); }; });
    $$('input[name=ws]', sh).forEach(r => { r.onchange = () => { s.weekStart = +r.value; save(); }; });

    const list = $('#catList', sh);
    const drawCats = () => {
      list.innerHTML = S.categories.map(c => `<div class="cat-item"><span>${esc(c.emoji)}</span><span>${esc(c.name)}</span><small>${c.type}</small><button type="button" class="icon-btn sm" data-delcat="${c.id}" aria-label="Remove ${esc(c.name)}">${ICON.close}</button></div>`).join('');
    };
    drawCats();
    list.onclick = e => {
      const b = e.target.closest('[data-delcat]');
      if (!b) return;
      S.categories = S.categories.filter(c => c.id !== b.dataset.delcat);
      save(); drawCats();
    };
    $('#c-add', sh).onclick = () => {
      const name = $('#c-name', sh).value.trim();
      if (!name) return toast('Give your category a name');
      S.categories.push({ id: uid(), name, emoji: $('#c-emoji', sh).value.trim() || '✨', type: $('#c-type', sh).value });
      $('#c-name', sh).value = '';
      $('#c-emoji', sh).value = '';
      save(); drawCats();
    };

    $('#b-export', sh).onclick = exportData;
    $('#b-import', sh).onchange = e => importData(e.target.files[0]);
    $('#b-reset', sh).onclick = () => {
      if (!confirm('Erase ALL your plans, tasks, journal, money and habits? This cannot be undone.')) return;
      if (!confirm('Are you really sure? Maybe save a backup first ♡')) return;
      S = defaultState();
      save(); applyTheme();
      commit('Fresh start ✿');
    };
  }, { onClose: render });
}

async function exportData() {
  const name = `shar-space-backup-${todayStr()}.json`;
  const file = new File([JSON.stringify(S, null, 2)], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Shar’s Space backup' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let d;
    try { d = JSON.parse(reader.result); } catch (e) { d = null; }
    if (!d || !d.board || !Array.isArray(d.events)) return toast('That file isn’t a valid backup');
    if (!confirm('Replace everything in the app with this backup?')) return;
    S = normalize(d);
    save(); applyTheme();
    commit('Backup restored ♡');
  };
  reader.readAsText(file);
}

/* ---------- kanban drag & drop ---------- */
// Touch: hold a card ~0.35s, then drag. Mouse: just drag.
const drag = { st: null, suppressClick: false };

function initDrag() {
  const view = $('#view');
  view.addEventListener('pointerdown', e => {
    const card = e.target.closest('.task');
    if (!card || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const st = drag.st = { card, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, mouse: e.pointerType === 'mouse', active: false };
    if (!st.mouse) st.timer = setTimeout(() => startDrag(st), 350);
  });
  window.addEventListener('pointermove', e => {
    const st = drag.st;
    if (!st) return;
    st.x = e.clientX; st.y = e.clientY;
    if (st.active) return moveDrag(st);
    if (Math.hypot(st.x - st.x0, st.y - st.y0) > 8) {
      if (st.mouse) startDrag(st);
      else { clearTimeout(st.timer); drag.st = null; } // finger moved first: it's a scroll
    }
  });
  const end = () => {
    const st = drag.st;
    if (!st) return;
    clearTimeout(st.timer);
    drag.st = null;
    if (st.active) finishDrag(st);
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  document.addEventListener('touchmove', e => { if (drag.st && drag.st.active) e.preventDefault(); }, { passive: false });
  view.addEventListener('contextmenu', e => { if (e.target.closest('.task')) e.preventDefault(); });
}

function startDrag(st) {
  const r = st.card.getBoundingClientRect();
  st.active = true;
  st.dx = st.x - r.left;
  st.dy = st.y - r.top;
  st.ghost = st.card.cloneNode(true);
  st.ghost.classList.add('ghost');
  st.ghost.style.width = r.width + 'px';
  document.body.appendChild(st.ghost);
  st.card.classList.add('placeholder');
  document.body.classList.add('dragging');
  if (navigator.vibrate) navigator.vibrate(10);
  moveDrag(st);
  const loop = () => { if (!st.active) return; autoScroll(st); st.raf = requestAnimationFrame(loop); };
  st.raf = requestAnimationFrame(loop);
}

function moveDrag(st) {
  st.ghost.style.transform = `translate(${st.x - st.dx}px, ${st.y - st.dy}px) rotate(2.5deg)`;
  const under = document.elementFromPoint(st.x, st.y);
  const col = under && under.closest('.col');
  if (!col) return;
  const list = col.querySelector('[data-cards]');
  const before = $$('.task:not(.placeholder)', list).find(c => {
    const r = c.getBoundingClientRect();
    return st.y < r.top + r.height / 2;
  });
  if (before) { if (st.card.nextElementSibling !== before) list.insertBefore(st.card, before); }
  else if (list.lastElementChild !== st.card) list.appendChild(st.card);
}

function autoScroll(st) {
  const board = $('.board');
  if (!board) return;
  const r = board.getBoundingClientRect(), edge = 44, speed = 12;
  let moved = false;
  if (st.x < r.left + edge) { board.scrollLeft -= speed; moved = true; }
  else if (st.x > r.right - edge) { board.scrollLeft += speed; moved = true; }
  if (st.y < 130) { window.scrollBy(0, -speed); moved = true; }
  else if (st.y > window.innerHeight - 140) { window.scrollBy(0, speed); moved = true; }
  if (moved) moveDrag(st);
}

function finishDrag(st) {
  cancelAnimationFrame(st.raf);
  st.active = false;
  st.ghost.remove();
  document.body.classList.remove('dragging');
  st.card.classList.remove('placeholder');
  const list = st.card.parentElement;
  const found = findCard(st.card.dataset.id);
  const to = getCol(list.dataset.cards);
  if (found && to) {
    found.col.cards.splice(found.col.cards.indexOf(found.card), 1);
    to.cards.splice($$('.task', list).indexOf(st.card), 0, found.card);
    save();
  }
  drag.suppressClick = true;
  setTimeout(() => { drag.suppressClick = false; }, 80);
  render();
}

/* ---------- actions (tap handlers) ---------- */
function switchTab(tab) {
  UI.tab = VIEWS[tab] ? tab : 'home';
  try { localStorage.setItem('shar-tab', UI.tab); } catch (e) { /* ignore */ }
  history.replaceState(null, '', '#' + UI.tab);
  render();
  window.scrollTo(0, 0);
  const view = $('#view');
  view.classList.remove('enter');
  void view.offsetWidth;
  view.classList.add('enter');
}

const ACTIONS = {
  'tab': el => switchTab(el.dataset.tab),
  'close-sheet': () => closeSheet(),
  'settings': () => settingsSheet(),
  'track': el => {
    const tr = S.trackers.find(t => t.id === el.dataset.id), t = todayStr();
    const was = isDone(tr, t), n = tr.log[t] || 0;
    tr.log[t] = tr.kind === 'check' ? (n ? 0 : 1) : n + 1;
    if (!tr.log[t]) delete tr.log[t];
    save(); render();
    if (!was && isDone(tr, t)) toast(`${tr.emoji} ${tr.name} — done for today!`);
  },
  'untrack': el => {
    const tr = S.trackers.find(t => t.id === el.dataset.id), t = todayStr();
    tr.log[t] = Math.max(0, (tr.log[t] || 0) - 1);
    if (!tr.log[t]) delete tr.log[t];
    save(); render();
  },
  'new-tracker': () => trackerEditor(),
  'edit-tracker': el => trackerEditor(el.dataset.id),
  'new-event': el => eventEditor(null, el.dataset.date),
  'edit-event': el => eventEditor(el.dataset.id),
  'pick-day': el => {
    UI.sel = el.dataset.date;
    const d = parseYmd(UI.sel);
    if (d.getMonth() !== UI.calMonth.getMonth()) UI.calMonth = firstOfMonth(d);
    render();
  },
  'cal-shift': el => shiftCal(+el.dataset.n),
  'cal-today': () => { UI.calMonth = firstOfMonth(new Date()); UI.sel = todayStr(); render(); },
  'edit-card': el => { if (!drag.suppressClick) cardEditor(el.dataset.id); },
  'add-card': el => cardEditor(null, el.dataset.id),
  'add-col': () => addColumn(),
  'col-menu': el => columnEditor(el.dataset.id),
  'new-entry': el => entryEditor(null, el.dataset.mood),
  'edit-entry': el => entryEditor(el.dataset.id),
  'edit-tx': el => txEditor(el.dataset.id),
  'money-shift': el => { UI.moneyMonth = new Date(UI.moneyMonth.getFullYear(), UI.moneyMonth.getMonth() + +el.dataset.n, 1); render(); },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || !ACTIONS[el.dataset.act]) return;
  e.preventDefault();
  ACTIONS[el.dataset.act](el, e);
});
// rename kanban columns right in their title
document.addEventListener('change', e => {
  const id = e.target.dataset && e.target.dataset.colTitle;
  if (!id) return;
  const col = getCol(id);
  if (col) { col.title = e.target.value.trim() || 'Untitled'; e.target.value = col.title; save(); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.dataset && e.target.dataset.colTitle) e.target.blur();
  if (e.key === 'Escape') closeSheet();
});

/* ---------- start ---------- */
function init() {
  applyTheme();
  $('.tabbar').innerHTML = [['home', 'Home', ICON.home], ['calendar', 'Calendar', ICON.cal], ['board', 'Tasks', ICON.board], ['journal', 'Journal', ICON.book], ['money', 'Money', ICON.wallet]]
    .map(([k, label, icon]) => `<button data-act="tab" data-tab="${k}">${icon}<span>${label}</span></button>`).join('');
  initDrag();
  const fromHash = location.hash.slice(1);
  let saved = null;
  try { saved = localStorage.getItem('shar-tab'); } catch (e) { /* ignore */ }
  UI.tab = VIEWS[fromHash] ? fromHash : VIEWS[saved] ? saved : 'home';
  render();

  // if the app is reopened on a new day, refresh "today"
  let lastDay = todayStr();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || todayStr() === lastDay) return;
    lastDay = todayStr();
    UI.sel = lastDay;
    render();
  });

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
init();
