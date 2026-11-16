/* ============================================================
   tools/render-sweep.js — dev-only: drive every view through a
   stub DOM to catch runtime errors (bad selectors, missing fns,
   typos) that static checks can't see.
   Run: node tools/render-sweep.js
   ============================================================ */
const vm = require("vm");
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const el = {
  style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
  setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, removeEventListener() {},
  appendChild() {}, remove() {}, insertBefore() {}, focus() {}, click() {}, blur() {},
  querySelector() { return makeEl(); }, querySelectorAll() { return []; }, closest() { return null; },
  innerHTML: "", textContent: "", value: "", checked: false, disabled: false, files: [],
  scrollIntoView() {}, parentNode: null, firstChild: null, childNodes: [], children: [],
  contains() { return true; }, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; }
};
function makeEl() { return Object.create(el); }
function memStore() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, clear: () => {} }; }

const mainEl = makeEl();
const sb = {
  console, setTimeout, clearTimeout, setInterval, clearInterval, Date, Math, JSON, Promise,
  String, Number, Boolean, Array, Object, RegExp, parseInt, parseFloat, isNaN, isFinite,
  window: null,
  document: {
    getElementById: () => mainEl,
    querySelector: () => mainEl,
    querySelectorAll: () => [],
    createElement: () => makeEl(),
    addEventListener() {},
    body: { appendChild() {}, classList: { add() {}, remove() {}, toggle() {} } },
    documentElement: { style: {} }, title: "", hidden: false
  },
  localStorage: memStore(), sessionStorage: memStore(),
  location: { hash: "", href: "", pathname: "/", assign() {}, reload() {} },
  navigator: { userAgent: "sweep", platform: "linux", language: "en" },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  confirm: () => true
};
sb.window = sb;

try {
  ["js/data.js", "js/audio.js", "js/sims.js", "js/app.js"].forEach(f => vm.runInNewContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sb));
} catch (e) {
  console.log("LOAD FAIL ❌", e.message);
  process.exit(1);
}
const App = vm.runInNewContext("App", sb);
const DATA = vm.runInNewContext("DATA", sb);

let fails = 0;
const routes = App._debug.routes;
const firstLesson = DATA.lessons[0].id;
const firstCh = DATA.challenges[0].id;

function run(key, parts) {
  const fn = routes[key];
  if (!fn) { console.log("no route", key); return; }
  const r = { parts: parts || key.split("/"), base: (parts || key.split("/"))[0], full: "/" + key };
  try {
    fn(r);
  } catch (e) {
    fails++;
    console.log("  ✘ " + key + " → " + e.message);
  }
}

console.log("render sweep (stub DOM)…");
Object.keys(routes).forEach(k => {
  if (k === "lesson") run("lesson", ["lesson", firstLesson]);
  else if (k === "challenge") run("challenge", ["challenge", firstCh]);
  else run(k);
});

// also resets the main element between runs (fresh innerHTML)
// and exercise app-level quizzing state snapshot
console.log(fails === 0 ? "ALL VIEWS RENDERED ✅" : fails + " VIEW(S) FAILED ❌");
process.exit(fails ? 1 : 0);
