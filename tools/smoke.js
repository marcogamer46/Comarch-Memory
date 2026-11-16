/* ============================================================
   tools/smoke.js — dev-only validation harness.
   Stubs the browser environment, loads all JS files in order,
   and checks content integrity. Not part of the shipped site.
   Run: node tools/smoke.js
   ============================================================ */
const vm = require("vm");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function makeEl() {
  return {
    style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, removeEventListener() {},
    appendChild() {}, remove() {}, insertBefore() {}, focus() {}, click() {}, blur() {},
    querySelector() { return makeEl(); }, querySelectorAll() { return []; }, closest() { return null; },
    innerHTML: "", textContent: "", value: "", checked: false, disabled: false, files: [],
    scrollIntoView() {}, parentNode: null, firstChild: null, childNodes: [], children: [],
    contains() { return true; }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; }
  };
}
const el = makeEl();
function memStore() {
  const m = {};
  return {
    getItem: k => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: k => { delete m[k]; },
    clear: () => { Object.keys(m).forEach(k => delete m[k]); }
  };
}

const sandbox = {
  console: console,
  setTimeout: setTimeout, clearTimeout: clearTimeout, setInterval: setInterval, clearInterval: clearInterval,
  Date: Date, Math: Math, JSON: JSON, Promise: Promise, RegExp: RegExp,
  parseFloat: parseFloat, parseInt: parseInt, isNaN: isNaN, isFinite: isFinite,
  String: String, Number: Number, Boolean: Boolean, Array: Array, Object: Object, Symbol: Symbol,
  encodeURIComponent: encodeURIComponent, decodeURIComponent: decodeURIComponent,
  window: null,
  document: {
    getElementById: () => el, querySelector: () => el, querySelectorAll: () => [],
    createElement: () => makeEl(), addEventListener() {},
    body: { appendChild() {}, classList: { add() {}, remove() {}, toggle() {} } },
    documentElement: { style: {} }, title: "", hidden: false
  },
  localStorage: memStore(), sessionStorage: memStore(),
  location: { hash: "", href: "", pathname: "/", assign() {}, reload() {} },
  navigator: { userAgent: "smoke", platform: "linux", language: "en" },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  confirm: () => true
};
sandbox.window = sandbox;

let failures = 0;
function check(cond, msg) {
  if (cond) { console.log("  ✔ " + msg); }
  else { failures++; console.log("  ✘ FAIL: " + msg); }
}
function load(file) {
  const code = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInNewContext(code, sandbox, { filename: file });
}
function evalIn(expr) {
  return vm.runInNewContext(expr, sandbox);
}

console.log("MEMORY.EXE smoke test");
console.log("loading files...");
try {
  load("js/data.js"); load("js/audio.js"); load("js/sims.js"); load("js/app.js");
  console.log("  ✔ all four files loaded without throwing\n");
} catch (e) {
  check(false, "load error: " + e.stack.split("\n").slice(0, 4).join(" | "));
  process.exit(1);
}

const DATA = evalIn("DATA");
const Sims = evalIn("Sims");
const App = evalIn("App");

check(!!DATA && !!DATA.modules, "DATA + modules present");
check(Array.isArray(DATA.lessons) && DATA.lessons.length === 6, "6 lessons");
check(DATA.modules.length === 6, "6 modules");

/* ----- challenges ----- */
const chs = DATA.challenges;
check(Array.isArray(chs) && chs.length >= 30, ">= 30 challenges (got " + chs.length + ")");
const bosses = chs.filter(c => c.boss);
check(bosses.length === 6, "6 BOSS challenges");
check(chs.every(c => [100, 200, 300].indexOf(c.points) !== -1), "all points are 100/200/300");
check(chs.every(c => ["easy", "medium", "hard"].indexOf(c.difficulty) !== -1), "valid difficulties");

const ids = {};
check(chs.every(c => (ids[c.id] = (ids[c.id] || 0) + 1) === 1), "unique challenge ids");
check(chs.every(c => DATA.modules.some(m => m.id === c.module)), "challenge module refs valid");
check(chs.every(c => DATA.lessons.some(l => l.id === c.lesson)), "challenge lesson refs valid");
check(chs.every(c => c.briefing && c.artifact && c.writeup), "briefing/artifact/writeup present");
check(chs.every(c => Array.isArray(c.hints) && c.hints.length === 2), "2 hints per challenge");
check(chs.filter(c => !c.boss).every(c => Array.isArray(c.aliases) && c.aliases.length > 0), "aliases non-empty (non-boss)");
check(bosses.every(c => Array.isArray(c.parts) && c.parts.length === 3 && c.parts.every(p => Array.isArray(p.aliases) && p.aliases.length)), "boss parts = 3 each with aliases");

/* ----- lessons ----- */
const taught = DATA.lessons;
check(taught.every(l => Array.isArray(l.check) && l.check.length >= 2), "each lesson has quick check");
check(taught.every(l => l.check.every(q => q.o && q.a !== undefined && q.a >= 0 && q.a < q.o.length)), "quick-check answer in range");
const termIds = new Set(DATA.glossary.map(g => g.id));
check(taught.every(l => (l.terms || []).every(t => termIds.has(t))), "lesson key terms exist in glossary");
check(taught.every(l => !l.sim || Sims[l.sim]), "lesson.sim exists in Sims");
check(taught.every(l => !l.sim2 || Sims[l.sim2]), "lesson.sim2 exists in Sims");
check(taught.every(l => !l.sim3 || Sims[l.sim3]), "lesson.sim3 exists in Sims");

/* ----- glossary ----- */
check(DATA.glossary.length >= 40, "glossary >= 40 terms (got " + DATA.glossary.length + ")");
const gids = {};
check(DATA.glossary.every(g => (gids[g.id] = (gids[g.id] || 0) + 1) === 1), "unique glossary ids");

/* ----- achievements / ranks ----- */
check(DATA.achievements.length >= 15, ">= 15 achievements (got " + DATA.achievements.length + ")");
const aid = {};
check(DATA.achievements.every(a => (aid[a.id] = (aid[a.id] || 0) + 1) === 1), "unique achievement ids");
check(Array.isArray(DATA.ranks) && DATA.ranks.length >= 6, "rank ladder present");

/* ----- sims ----- */
check(Object.keys(Sims).length >= 9, ">= 9 sims mounted (got " + Object.keys(Sims).length + ")");
Object.keys(Sims).forEach(k => {
  check(typeof Sims[k].mount === "function", "sim " + k + " has mount()");
});

/* ----- answer aliases normalize to non-empty values ----- */
check(chs.filter(c => !c.boss).every(c => c.aliases.some(a => String(a).replace(/[\s,'"\-()]/g, "").length > 0)), "each challenge has a non-empty normalized answer");
check(bosses.every(c => c.parts.every(p => p.aliases.some(a => String(a).replace(/[\s,'"\-()]/g, "").length > 0))), "boss parts have non-empty normalized answers");
check(bosses.every(c => c.parts.every(p => p.q && p.aliases.length)), "boss parts have question + aliases");

/* ----- new: bug-fix smoke assertions ----- */

// (a) every challenge that can appear in Daily/Timed/Exam/Review pools (non-boss)
//     must have both a question and non-empty aliases.
const poolable = chs.filter(c => !c.parts);
check(poolable.every(c => Array.isArray(c.aliases) && c.aliases.length > 0 && !!c.question), "(a) poolable challenges all have question + aliases");
check(chs.filter(c => c.parts).every(c => !c.question && !c.aliases), "(a) boss challenges expose parts, not question/aliases");

// (b) parseHash must strip the query string before splitting, exposing r.query.
sandbox.location.hash = "#/glossary?term=dram";
const ph = App._debug.parseHash();
check(ph.base === "glossary" && ph.parts.join("/") === "glossary", "(b) parseHash base = 'glossary' for '#/glossary?term=dram'");
check(ph.query === "term=dram", "(b) parseHash exposes query 'term=dram'");
check(ph.full === "/glossary", "(b) parseHash full = '/glossary' (query stripped)");

// (c) go() with an unchanged hash must call route() (re-render), not sit idle.
//     No init()/route() has run yet, so main.innerHTML is still ""; a broken go()
//     would leave it empty. (The stub's querySelector returns the same node for every
//     selector, so nested writes like #termList clobber the outer shell — we only
//     assert that route() actually ran and filled #main.)
sandbox.location.hash = "#/glossary";
el.innerHTML = "";
App.go("#/glossary");
check(el.innerHTML.length > 0, "(c) go() with unchanged hash re-renders (route() runs)");

// (d) every glossary id referenced by lesson key-terms exists (explicit check).
check(taught.every(l => (l.terms || []).every(t => termIds.has(t))), "(d) every lesson key-term id resolves in glossary");

// (e) no MDRAM / Multibank content remains in data.js or sims.js.
const dsrc = fs.readFileSync(path.join(ROOT, "js/data.js"), "utf8");
const ssrc = fs.readFileSync(path.join(ROOT, "js/sims.js"), "utf8");
check(!/MDRAM|Multibank/.test(dsrc + ssrc), "(e) no MDRAM/Multibank text left in data.js or sims.js");

console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED ✅" : failures + " CHECK(S) FAILED ❌"));
process.exit(failures === 0 ? 0 : 1);
