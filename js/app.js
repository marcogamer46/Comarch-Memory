/* ============================================================
   MEMORY.EXE — app.js
   Core application: routing, state/persistence, views.

   ============================================================ */

const App = (function () {

  /* ---------- tiny utils ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function todayStr() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function normAns(v) { return String(v).toLowerCase().replace(/[\s,'"\-()]/g, ""); }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  const STORE_KEY = "memory.exe.v1";

  /* ---------- state ---------- */
  const defaultState = function () {
    return {
      v: 1,
      learned: {}, qchecked: {}, solved: {}, revealed: {}, hintsUsed: {},
      xp: 0,
      history: [],
      moduleDone: {},
      daily: { last: "", count: 0 },
      streak: { current: 0, best: 0, lastDate: "" },
      stats: { noHintSolves: 0, speedrunBest: null, dailies: 0, quickCleans: 0, perfectExam: false },
      cards: { box: {} },
      achievements: {},
      settings: { theme: "matrix", crt: true, sound: true, motion: "auto", fs: 16, freeRoam: false }
    };
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        const def = defaultState();
        Object.keys(def).forEach(function (k) { if (s[k] === undefined) s[k] = def[k]; });
        return s;
      }
    } catch (e) {}
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  /* ---------- rank / xp ---------- */
  function rankOf(xp) {
    let rank = DATA.ranks[0];
    DATA.ranks.forEach(function (r) { if (xp >= r.xp) rank = r; });
    return rank;
  }
  function addXP(pts, label) {
    const before = rankOf(state.xp).name;
    state.xp += pts;
    if (label) state.history.push({ t: Date.now(), pts: pts, label: label });
    if (state.history.length > 400) state.history = state.history.slice(-400);
    const after = rankOf(state.xp).name;
    save();
    updateHUD();
    if (before !== after) showRankUp(before, after);
  }

  function updateHUD() {
    const chip = $("#xpChip");
    if (chip) chip.textContent = "XP " + state.xp + " · " + rankOf(state.xp).name;
  }

  /* ---------- toasts / confetti ---------- */
  function toast(msg, kind) {
    const w = $("#toastWrap");
    const t = document.createElement("div");
    t.className = "toast" + (kind ? " " + kind : "");
    t.textContent = msg;
    w.appendChild(t);
    setTimeout(function () { t.classList.add("hidden"); setTimeout(function () { t.remove(); }, 300); }, 2400);
  }

  function confetti() {
    const wrap = $("#confettiWrap");
    const colors = ["#00ff41", "#00e5ff", "#ffb000", "#c77dff", "#ff5c8a", "#ffd25e"];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement("div");
      p.className = "confetti-piece";
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.width = (6 + Math.random() * 8) + "px";
      p.style.height = (6 + Math.random() * 8) + "px";
      p.style.animationDuration = (1.6 + Math.random() * 1.4) + "s";
      p.style.animationDelay = (Math.random() * 0.4) + "s";
      wrap.appendChild(p);
      setTimeout(function () { p.remove(); }, 3400);
    }
    if (state.settings.sound) SFX.correct();
  }

  function showRankUp(oldRank, newRank) {
    const d = document.createElement("div");
    d.className = "rankup";
    d.innerHTML = '<div class="ru-card"><div class="ru-old">' + esc(oldRank) + " →</div>" +
      '<div class="ru-rank">' + esc(newRank) + "</div>" +
      "<div>rank up!</div>" +
      '<button class="btn btn-primary" style="margin-top:12px">Nice</button></div>';
    document.body.appendChild(d);
    if (state.settings.sound) SFX.levelup();
    $(".ru-card button", d).addEventListener("click", function () { d.remove(); });
  }

  /* ---------- achievements ---------- */
  function solvedIds() { return Object.keys(state.solved); }
  function bossSolvedCount() { return solvedIds().filter(function (id) { return DATA.challenges.find(function (c) { return c.id === id; }) && DATA.challenges.find(function (c) { return c.id === id; }).boss; }).length; }
  function allLessonsLearned() { return DATA.lessons.every(function (l) { return state.learned[l.id]; }); }
  function nonBossTotal() { return DATA.challenges.filter(function (c) { return !c.boss; }).length; }
  function nonBossSolved() { return solvedIds().filter(function (id) { const c = DATA.challenges.find(function (x) { return x.id === id; }); return c && !c.boss; }).length; }

  function unlockCount() {
    return Object.keys(state.achievements).filter(function (id) { return id !== "hoarder"; }).length;
  }

  function achievementMet(a) {
    switch (a.id) {
      case "firstblood": return solvedIds().length >= 1;
      case "solver10": return solvedIds().length >= 10;
      case "solver25": return solvedIds().length >= 25;
      case "allclear": return nonBossSolved() >= nonBossTotal();
      case "bosslayer": return bossSolvedCount() >= 1;
      case "allboss": return bossSolvedCount() >= 6;
      case "nohints": return state.stats.noHintSolves >= 5;
      case "speedrun": return state.stats.speedrunBest !== null && state.stats.speedrunBest <= 45;
      case "scholar": return allLessonsLearned();
      case "perfectexam": return state.stats.perfectExam;
      case "quickperfect": return state.stats.quickCleans >= 1;
      case "streak7": return state.streak.best >= 7;
      case "streak14": return state.streak.best >= 14;
      case "daily1": return state.stats.dailies >= 1;
      case "daily5": return state.stats.dailies >= 5;
      case "hoarder": return unlockCount() >= 8;
      default: return false;
    }
  }

  function checkAchievements() {
    DATA.achievements.forEach(function (a) {
      if (!state.achievements[a.id] && achievementMet(a)) {
        state.achievements[a.id] = true;
        save();
        toast("Achievement unlocked: " + a.name, "good");
        confetti();
      }
    });
  }

  /* ---------- lesson helpers ---------- */
  function moduleOf(modId) { return DATA.modules.find(function (m) { return m.id === modId; }); }
  function moduleLessons(modId) { return DATA.lessons.filter(function (l) { return l.module === modId; }); }
  function allLearned(modId) { return moduleLessons(modId).every(function (l) { return state.learned[l.id]; }); }
  function moduleUnlocked(modId) {
    return state.settings.freeRoam || allLearned(modId);
  }
  function challengeById(id) { return DATA.challenges.find(function (c) { return c.id === id; }); }

  function lockedReason(ch) {
    if (state.settings.freeRoam) return null;
    if (state.solved[ch.id] || state.revealed[ch.id]) return null;
    if (moduleUnlocked(ch.module)) return null;
    return "Learn all lessons in " + moduleOf(ch.module).title + " to unlock this challenge.";
  }

  /* ---------- answering ---------- */
  function checkAnswer(ch, input) {
    const n = normAns(input);
    if (!n) return false;
    const list = ch.aliases || [];
    for (let i = 0; i < list.length; i++) if (normAns(list[i]) === n) return true;
    return false;
  }

  function hintCost(ch, used) {
    const base = ch.points;
    const per = Math.floor(base * 0.1);
    return Math.max(Math.ceil(base * 0.5), base - used * per);
  }

  /* ============================================================
     Router
     ============================================================ */
  const ROUTES = {
    "learn": viewLearn,
    "lesson": viewLesson,
    "challenges": viewBoard,
    "challenge": viewChallenge,
    "quiz": viewQuizMenu,
    "quiz/daily": viewDaily,
    "quiz/timed": viewTimed,
    "quiz/exam": viewExam,
    "quiz/review": viewReview,
    "cards": viewCards,
    "glossary": viewGlossary,
    "sheet": viewSheet,
    "score": viewScore,
    "badges": viewBadges,
    "settings": viewSettings
  };

  function parseHash() {
    let h = location.hash.replace(/^#/, "");
    let query = "";
    const qi = h.indexOf("?");
    if (qi !== -1) { query = h.slice(qi + 1); h = h.slice(0, qi); }
    if (!h) h = "/learn";
    if (h.charAt(0) !== "/") h = "/" + h;
    const parts = h.split("/").filter(Boolean);
    const base = parts.length ? parts[0] : "learn";
    const full = "/" + parts.join("/");
    return { full: full, base: base, parts: parts, query: query };
  }

  let currentCleanup = null;

  function route() {
    // cleanup previous view timers
    if (currentCleanup) { try { currentCleanup(); } catch (e) {} currentCleanup = null; }
    closeOverlays();
    const r = parseHash();
    let key = r.parts.join("/");          // e.g. "quiz/daily"
    if (!ROUTES[key]) key = r.parts[0];   // fall back to base view
    const view = ROUTES[key] || viewLearn;
    updateNav(r.base);
    view(r);
    updateHUD();
    const scroller = $("#main");
    if (scroller) scroller.scrollTop = 0;
  }

  function updateNav(base) {
    $$(".nav a, .tabbar a").forEach(function (a) {
      const key = a.getAttribute("data-nav");
      const active = (base === "lesson" && key === "learn") || (base === "challenge" && key === "challenges") ||
        (base === "quiz" && key === "quiz") || base === key;
      a.classList.toggle("active", active);
    });
  }

  function go(hash) {
    if (location.hash === hash) { route(); }
    else { location.hash = hash; }
  }

  /* ---------- overlays ---------- */
  function closeOverlays() {
    $("#paletteOverlay").classList.add("hidden");
    $("#helpOverlay").classList.add("hidden");
  }
  function togglePalette() {
    const o = $("#paletteOverlay");
    const hidden = o.classList.contains("hidden");
    o.classList.toggle("hidden", !hidden);
    if (hidden) { $("#paletteInput").value = ""; renderPalette(""); $("#paletteInput").focus(); }
  }
  function toggleHelp() {
    const o = $("#helpOverlay");
    o.classList.toggle("hidden", !o.classList.contains("hidden"));
  }

  /* ---------- palette ---------- */
  let palSel = 0, palItems = [];
  function renderPalette(q) {
    const qn = normAns(q);
    let items = [];
    if (!q || qn) {
      if (!q || normAns("learn").indexOf(qn) === 0) items.push({ kind: "view", label: "Learn — modules", hash: "#/learn" });
      if (!q || normAns("challenges").indexOf(qn) === 0) items.push({ kind: "view", label: "Challenges board", hash: "#/challenges" });
      if (!q || normAns("quiz").indexOf(qn) === 0) items.push({ kind: "view", label: "Quiz modes", hash: "#/quiz" });
      if (!q || normAns("cards").indexOf(qn) === 0) items.push({ kind: "view", label: "Flashcards", hash: "#/cards" });
      if (!q || normAns("glossary").indexOf(qn) === 0) items.push({ kind: "view", label: "Glossary", hash: "#/glossary" });
      if (!q || normAns("sheet").indexOf(qn) === 0) items.push({ kind: "view", label: "Cheat sheet", hash: "#/sheet" });
      if (!q || normAns("score").indexOf(qn) === 0) items.push({ kind: "view", label: "Scoreboard", hash: "#/score" });
      if (!q || normAns("badges").indexOf(qn) === 0) items.push({ kind: "view", label: "Badges", hash: "#/badges" });
      if (!q || normAns("settings").indexOf(qn) === 0) items.push({ kind: "view", label: "Settings", hash: "#/settings" });
      DATA.lessons.forEach(function (l) {
        if (!q || normAns(l.title).indexOf(qn) !== -1 || normAns(l.id).indexOf(qn) !== -1)
          items.push({ kind: "lesson", label: l.title, hash: "#/lesson/" + l.id });
      });
      DATA.challenges.forEach(function (c) {
        if (!q || normAns(c.title).indexOf(qn) !== -1 || normAns(c.id).indexOf(qn) !== -1)
          items.push({ kind: "challenge", label: c.title + " (" + c.points + ")", hash: "#/challenge/" + c.id });
      });
      DATA.glossary.forEach(function (g) {
        if (!q || normAns(g.term).indexOf(qn) !== -1)
          items.push({ kind: "term", label: g.term, hash: "#/glossary?term=" + g.id });
      });
    }
    items = items.slice(0, 40);
    palItems = items;
    palSel = 0;
    const ul = $("#paletteResults");
    ul.innerHTML = items.map(function (it, i) {
      return '<li class="' + (i === 0 ? "sel" : "") + '" data-i="' + i + '"><span>' + esc(it.label) + "</span><span class='pr-kind'>" + it.kind + "</span></li>";
    }).join("") || '<li class="dim" style="cursor:default">no matches</li>';
    $$("#paletteResults li").forEach(function (li) {
      li.addEventListener("click", function () {
        const it = palItems[parseInt(li.getAttribute("data-i"), 10)];
        if (it) { closeOverlays(); go(it.hash); }
      });
    });
  }

  /* ============================================================
     Views
     ============================================================ */

  /* ----- Learn ----- */
  function viewLearn() {
    const main = $("#main");
    main.innerHTML = '<div class="view">' +
      '<h1 class="page-title">Learn</h1>' +
      '<div class="page-sub">Six modules from the slide deck. Pass a lesson’s Quick Check to mark it learned and unlock its challenges.</div>' +
      (state.settings.freeRoam ? '<div class="card" style="border-color:var(--warn)"><span class="warn">Free Roam is ON — all challenges are unlocked regardless of lesson progress.</span></div>' : "") +
      '<div class="grid grid-2">' +
      DATA.modules.map(function (m) {
        const lessons = moduleLessons(m.id);
        const learned = lessons.filter(function (l) { return state.learned[l.id]; }).length;
        const pct = Math.round((learned / lessons.length) * 100);
        const unlocked = moduleUnlocked(m.id);
        return '<div class="card module-card" data-goto="#/lesson/' + lessons[0].id + '">' +
          '<div class="m-num">MODULE ' + m.num + "</div>" +
          "<div class='m-title' style='color:" + m.color + "'>" + esc(m.title) + "</div>" +
          '<div class="m-desc">' + esc(m.desc) + "</div>" +
          '<div class="progress"><div class="bar" style="width:' + pct + '%;background:' + m.color + '"></div></div>' +
          '<div class="m-status">' + learned + "/" + lessons.length + " lessons learned · " +
          (unlocked ? '<span class="good">challenges unlocked</span>' : '<span class="warn">locked</span>') + "</div>" +
          '<div class="m-boss"><span class="boss-badge">BOSS</span></div>' +
          "</div>";
      }).join("") +
      "</div></div>";
    $$(".module-card").forEach(function (c) {
      c.addEventListener("click", function () { go(c.getAttribute("data-goto")); });
    });
  }

  /* ----- Lesson ----- */
  function viewLesson(r) {
    const id = r.parts[1] || "hierarchy";
    const l = DATA.lessons.find(function (x) { return x.id === id; });
    if (!l) { viewLearn(); return; }
    const mod = moduleOf(l.module);
    const main = $("#main");
    const passed = !!state.qchecked[l.id];
    const learned = !!state.learned[l.id];
    const mkLabel = learned ? "Learned ✓" : "Mark as learned";

    let sims = "";
    ["sim", "sim2", "sim3"].forEach(function (k, i) {
      if (l[k]) {
        const sim = Sims[l[k]];
        if (sim) {
          sims += '<div class="sim"><div class="sim-tabs"><span class="sim-tab active">' + esc(sim.title) + '</span></div>' +
            '<div class="sim-host" data-sim="' + l[k] + '"></div></div>';
        }
      }
    });

    let qc = "";
    if (passed) {
      qc = '<div class="quickcheck card"><h3 style="color:var(--ok)">Quick Check — passed</h3></div>';
    } else {
      qc = '<div class="quickcheck card"><h3>Quick Check</h3><div class="qcheck" data-l="' + l.id + '"></div></div>';
    }

    main.innerHTML = '<div class="view">' +
      '<div class="lesson-head"><span class="crumb">MODULE ' + mod.num + " · " + esc(mod.short) + "</span>" +
      '<h2 class="lesson-title">' + esc(l.title) + "</h2></div>" +
      '<div class="card">' +
      '<div class="lesson-body">' + l.text + "</div>" +
      '<div class="why-box"><div class="why-label">WHY THIS MATTERS' +
      (l.whyExtra ? ' <span class="extra-tag" data-kind="extra">extra</span>' : "") + "</div>" +
      "<div>" + l.why + "</div></div>" +
      '<div class="keyterms"><span class="dim" style="font-family:var(--mono);font-size:var(--fs-xs)">KEY TERMS</span>' +
      l.terms.map(function (t) {
        const g = DATA.glossary.find(function (x) { return x.id === t; });
        return g ? '<button class="chip accent" data-term="' + g.id + '">' + esc(g.term) + "</button>" : "";
      }).join("") +
      "</div></div>" +
      sims +
      qc +
      '<div class="actions" style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button class="btn btn-primary" id="markLearned" ' + (passed && !learned ? "" : "disabled") + ">" + mkLabel + "</button>" +
      '<button class="btn" id="backLearn" >Back to modules</button>' +
      "</div></div>";

    // mount sims
    $$("[data-sim]", main).forEach(function (host) {
      const s = Sims[host.getAttribute("data-sim")];
      if (s) { const cleanup = s.mount(host); if (cleanup) currentCleanup = cleanup; }
    });

    // key term chips -> glossary
    $$("[data-term]", main).forEach(function (b) {
      b.addEventListener("click", function () { go("#/glossary?term=" + b.getAttribute("data-term")); });
    });

    $("#backLearn").addEventListener("click", function () { go("#/learn"); });

    if (!passed) initQuickCheck(l, main);
    else $("#markLearned").addEventListener("click", markLearned);

    function markLearned() {
      if (!state.qchecked[l.id]) { toast("Pass the Quick Check first.", "bad"); return; }
      state.learned[l.id] = true;
      addXP(DATA.xp.lesson, l.title);
      save();
      checkAchievements();
      toast("Lesson learned! +" + DATA.xp.lesson + " XP", "good");
      $("#markLearned").disabled = true;
      $("#markLearned").textContent = "Learned ✓";
    }
  }

  function initQuickCheck(l, main) {
    const box = $(".qcheck", main);
    let qi = 0, errors = 0;
    const total = l.check.length;
    let passed = true;

    function renderQ() {
      const q = l.check[qi];
      box.innerHTML = '<div class="qc-q">Q' + (qi + 1) + " / " + total + ": " + esc(q.q) + "</div>" +
        '<div class="qc-opts">' + q.o.map(function (opt, i) {
          return '<button class="qc-opt" data-i="' + i + '">' + esc(opt) + "</button>";
        }).join("") + "</div>" +
        '<div class="qc-feedback"></div>';
      $$(".qc-opt", box).forEach(function (b) {
        b.addEventListener("click", function () {
          const choice = parseInt(b.getAttribute("data-i"), 10);
          const correct = choice === q.a;
          $$(".qc-opt", box).forEach(function (x) { x.disabled = true; });
          if (correct) {
            b.classList.add("correct");
            $(".qc-feedback", box).innerHTML = '<span class="good">Correct.</span>';
            SFX.correct();
            setTimeout(function () {
              qi++;
              if (qi < total) renderQ(); else finish(true);
            }, 420);
          } else {
            errors++;
            b.classList.add("wrong");
            $(".qc-feedback", box).innerHTML = '<span class="bad">Not quite — try again.</span>';
            SFX.wrong();
            setTimeout(function () {
              const q2 = l.check[qi];
              box.innerHTML = '<div class="qc-q">Q' + (qi + 1) + ': ' + esc(q2.q) + "</div>" +
                '<div class="qc-opts">' + q2.o.map(function (opt, i) {
                  return '<button class="qc-opt" data-i="' + i + '">' + esc(opt) + "</button>";
                }).join("") + "</div>" +
                '<div class="qc-feedback"></div>';
              bindOpts();
            }, 350);
          }
        });
      });
    }
    function bindOpts() {
      $$(".qc-opt", box).forEach(function (b) {
        b.addEventListener("click", renderOptClick(b));
      });
    }
    function renderOptClick(b) {
      return function () {
        const q = l.check[qi];
        const choice = parseInt(b.getAttribute("data-i"), 10);
        $$(".qc-opt", box).forEach(function (x) { x.disabled = true; });
        if (choice === q.a) {
          b.classList.add("correct");
          $(".qc-feedback", box).innerHTML = '<span class="good">Correct.</span>';
          SFX.correct();
          setTimeout(function () { qi++; if (qi < total) renderQ(); else finish(true); }, 420);
        } else {
          errors++; passed = false;
          b.classList.add("wrong");
          $(".qc-feedback", box).innerHTML = '<span class="bad">Not quite — try this one again.</span>';
          SFX.wrong();
          setTimeout(function () {
            const q2 = l.check[qi];
            box.innerHTML = '<div class="qc-q">Q' + (qi + 1) + ': ' + esc(q2.q) + "</div>" +
              '<div class="qc-opts">' + q2.o.map(function (opt, i) {
                return '<button class="qc-opt" data-i="' + i + '">' + esc(opt) + "</button>";
              }).join("") + "</div>" +
              '<div class="qc-feedback"></div>';
            bindOpts();
          }, 350);
        }
      };
    }
    function finish(clean) {
      state.qchecked[l.id] = true;
      if (errors === 0) { state.stats.quickCleans++; }
      addXP(DATA.xp.quickcheck, l.title + " quick check");
      save();
      checkAchievements();
      box.innerHTML = '<div class="good" style="font-family:var(--mono)">✓ Quick Check passed. Now you can mark this lesson learned.</div>';
      const btn = $("#markLearned");
      btn.disabled = false;
      btn.addEventListener("click", function () {
        state.learned[l.id] = true;
        addXP(DATA.xp.lesson, l.title);
        save();
        checkAchievements();
        toast("Lesson learned! +" + DATA.xp.lesson + " XP", "good");
        btn.disabled = true;
        btn.textContent = "Learned ✓";
      });
      if (clean) SFX.correct();
    }

    renderQ();
  }

  /* ----- Challenge board ----- */
  function viewBoard() {
    const main = $("#main");
    const solvedCount = solvedIds().length;
    const totalPts = solvedIds().reduce(function (sum, id) {
      const s = state.solved[id]; return sum + (s ? s.pts : 0);
    }, 0);

    let html = '<div class="view">' +
      '<h1 class="page-title">Challenges</h1>' +
      '<div class="page-sub">CTF-style puzzles. Solve challenges to earn XP. Hints cost points; giving up reveals the answer for 0.</div>' +
      '<div class="board-stats">' +
      '<div class="stat-tile"><div class="st-num">' + solvedCount + "</div><div class='st-label'>solved</div></div>" +
      '<div class="stat-tile"><div class="st-num">' + totalPts + "</div><div class='st-label'>points earned</div></div>" +
      '<div class="stat-tile"><div class="st-num">' + state.xp + "</div><div class='st-label'>total XP</div></div>" +
      "</div>" +
      '<div class="filter-bar">' +
      '<input type="search" id="boardSearch" placeholder="Search challenges…">' +
      '<button class="btn btn-sm" data-f="all" data-kind="cat">All</button>' +
      DATA.modules.map(function (m) {
        return '<button class="btn btn-sm" data-f="' + m.id + '" data-kind="cat">' + esc(m.short) + "</button>";
      }).join("") +
      '<select id="boardDiff" class="theme-select"><option value="all">All difficulties</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>' +
      '<select id="boardStatus" class="theme-select"><option value="all">All states</option><option value="open">Unsolved</option><option value="solved">Solved</option><option value="revealed">Revealed</option></select>' +
      "</div>";

    DATA.modules.forEach(function (m) {
      const chs = DATA.challenges.filter(function (c) { return c.module === m.id; });
      const solvedMod = chs.filter(function (c) { return state.solved[c.id]; }).length;
      const unlocked = moduleUnlocked(m.id);
      html += '<div class="card" data-mod="' + m.id + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
        '<h3 style="margin:0;color:' + m.color + '">' + esc(m.short) + "</h3>" +
        '<span class="chip">' + solvedMod + "/" + chs.length + "</span></div>" +
        '<div class="progress" style="margin-bottom:12px"><div class="bar" style="width:' + Math.round((solvedMod / chs.length) * 100) + '%;background:' + m.color + '"></div></div>' +
        '<div class="grid grid-3">' +
        chs.map(function (c) {
          let cls = "card chal-card";
          let stateTag = "";
          let pts = c.points;
          if (state.solved[c.id]) { cls += " solved"; stateTag = '<span class="good mono" style="font-size:var(--fs-xs)">✓ solved</span>'; pts = state.solved[c.id].pts; }
          else if (state.revealed[c.id]) { cls += " revealed"; stateTag = '<span class="warn mono" style="font-size:var(--fs-xs)">revealed</span>'; pts = 0; }
          else if (!unlocked) { cls += " locked"; stateTag = '<span class="dim mono" style="font-size:var(--fs-xs)">🔒 locked</span>'; }
          return '<div class="' + cls + '" data-goto="#/challenge/' + c.id + '" data-mod="' + m.id + '" data-pts="' + c.points + '" data-diff="' + c.difficulty + '" data-status="' + (state.solved[c.id] ? "solved" : state.revealed[c.id] ? "revealed" : "open") + '">' +
            '<div class="cc-top"><span class="cc-title">' + esc(c.title) + "</span>" +
            '<span class="cc-pts">' + pts + "</span></div>" +
            '<div class="cc-meta">' +
            (c.boss ? '<span class="boss-badge">BOSS</span>' : '<span class="diff ' + c.difficulty + '">' + c.difficulty.toUpperCase() + "</span>") +
            stateTag + "</div></div>";
        }).join("") +
        "</div></div>";
    });

    html += "</div>";
    main.innerHTML = html;

    $$(".chal-card").forEach(function (c) {
      c.addEventListener("click", function () {
        go(c.getAttribute("data-goto"));
      });
    });

    function applyFilters() {
      const q = normAns($("#boardSearch").value);
      const cat = $("[data-kind=cat].btn.active") ? $("[data-kind=cat].btn.active").getAttribute("data-f") : "all";
      const diff = $("#boardDiff").value;
      const st = $("#boardStatus").value;
      $$(".chal-card").forEach(function (c) {
        const t = normAns(c.querySelector(".cc-title").textContent) + normAns(c.getAttribute("data-pts"));
        let show = true;
        if (q && t.indexOf(q) === -1) show = false;
        if (cat !== "all" && c.getAttribute("data-mod") !== cat) show = false;
        if (diff !== "all" && c.getAttribute("data-diff") !== diff) show = false;
        if (st !== "all" && c.getAttribute("data-status") !== st) show = false;
        c.classList.toggle("hidden", !show);
      });
      $$("[data-mod]").forEach(function (m) {
        const visible = $$(".chal-card", m).some(function (c) { return !c.classList.contains("hidden"); });
        m.classList.toggle("hidden", !visible);
      });
    }

    $("#boardSearch").addEventListener("input", applyFilters);
    $("#boardDiff").addEventListener("change", applyFilters);
    $("#boardStatus").addEventListener("change", applyFilters);
    $$("[data-kind=cat]").forEach(function (b) {
      b.addEventListener("click", function () {
        $$("[data-kind=cat]").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        applyFilters();
      });
    });
  }

  /* ----- Challenge view ----- */
  function viewChallenge(r) {
    const id = r.parts[1] || "H1";
    const ch = challengeById(id);
    if (!ch) { viewBoard(); return; }
    const main = $("#main");
    const lock = lockedReason(ch);
    const isBoss = !!ch.parts;

    if (lock) {
      main.innerHTML = '<div class="view"><div class="card"><h2>' + esc(ch.title) + "</h2>" +
        '<div class="bad">🔒 ' + esc(lock) + "</div>" +
        '<button class="btn" id="backBoard">Back to challenges</button></div></div>';
      $("#backBoard").addEventListener("click", function () { go("#/challenges"); });
      return;
    }

    const loadT = Date.now(); // for the speed-run achievement

    const solved = state.solved[ch.id];
    const revealed = state.revealed[ch.id];

    let stateTag = "";
    if (solved) stateTag = '<span class="chip accent">solved · +' + solved.pts + ' XP</span>';
    else if (revealed) stateTag = '<span class="chip" style="border-color:var(--warn);color:var(--warn)">revealed · 0</span>';

    main.innerHTML = '<div class="view">' +
      '<div class="chal-head"><div>' +
      '<div class="crumb dim" style="font-family:var(--mono);font-size:var(--fs-xs)">' + esc(moduleOf(ch.module).short) + " · " + ch.points + " pts · " + ch.difficulty.toUpperCase() + (isBoss ? " · BOSS" : "") + "</div>" +
      '<h2 class="ch-title">' + esc(ch.title) + "</h2></div>" +
      stateTag + "</div>" +
      '<div class="chal-sections">' +
      '<div class="sec"><div class="sec-label">BRIEFING</div><div>' + esc(ch.briefing) + "</div></div>" +
      '<div class="sec"><div class="sec-label">ARTIFACT</div><pre class="artifact">' + artifactHTML(ch.artifact) + "</pre></div>" +
      '<div class="sec"><div class="sec-label">CHALLENGE</div><div id="chQ"></div></div>' +
      (isBoss ? '<div class="sec"><div class="sec-label">BOSS CHAIN</div><div id="chBoss"></div></div>' : "") +
      '<div class="sec"><div class="sec-label">HINTS</div><div class="hints" id="chHints"></div></div>' +
      (solved || revealed ? '<div class="sec"><div class="sec-label">WRITEUP</div><div class="writeup" id="chWriteup"></div></div>' : "") +
      '</div></div>';

    function artifactHTML(a) {
      const text = esc(a);
      const re = /\b(OK|HIT|FITS|resident|NOT|WIPED|fault|slow|huge|pressure)\b/g;
      const cls = {
        OK: "a-ok", HIT: "a-ok", FITS: "a-ok", resident: "a-ok",
        NOT: "a-err", WIPED: "a-err", fault: "a-err",
        slow: "a-warn", huge: "a-warn", pressure: "a-warn"
      };
      return text.replace(re, function (m) { return '<span class="' + cls[m] + '">' + m + "</span>"; });
    }

    if (!solved && !revealed) {
      if (isBoss) {
        renderBoss(ch);
      } else {
        renderSingle(ch);
      }
      renderHints(ch);
    } else {
      $("#chWriteup").innerHTML = writeupHTML(ch);
    }

    function writeupHTML(ch) {
      return '<div>' + esc(ch.writeup) + "</div>" +
        '<div style="margin-top:8px">Related lesson: <a href="#/lesson/' + ch.lesson + '">' +
        esc(DATA.lessons.find(function (l) { return l.id === ch.lesson; }).title) + "</a></div>";
    }

    function renderSingle(ch) {
      const q = $("#chQ");
      q.innerHTML = '<div class="mono" style="font-size:var(--fs-sm);color:var(--dim);margin-bottom:4px">' + esc(ch.format) + "</div>" +
        "<div style='margin-bottom:8px'>" + esc(ch.question) + "</div>" +
        '<div class="answer-form">' +
        '<input type="text" id="ansInput" autocomplete="off" placeholder="your answer…">' +
        '<button class="btn btn-primary" id="ansSubmit">Submit</button>' +
        "</div>" +
        '<div class="answer-feedback" id="ansFb"></div>';

      function submit() {
        const v = $("#ansInput").value;
        if (!v.trim()) return;
        if (checkAnswer(ch, v)) {
          const secs = Math.max(0, Math.round((Date.now() - loadT) / 1000));
          const hintsUsed = state.hintsUsed[ch.id] || 0;
          const pts = hintCost(ch, hintsUsed);
          const xpAdd = pts + (ch.boss ? DATA.xp.bossbonus : 0);
          state.solved[ch.id] = { pts: xpAdd, hints: hintsUsed, ts: Date.now(), secs: secs };
          delete state.hintsUsed[ch.id];
          if (state.revealed[ch.id]) delete state.revealed[ch.id];
          if (hintsUsed === 0) state.stats.noHintSolves++;
          if (state.stats.speedrunBest === null || secs < state.stats.speedrunBest) state.stats.speedrunBest = secs;
          addXP(xpAdd, ch.title);
          state.reviewMisses = (state.reviewMisses || []).filter(function (x) { return x !== ch.id; });
          save();
          checkAchievements();
          $("#ansFb").innerHTML = '<span class="good">✓ Correct! +' + xpAdd + " XP</span>";
          confetti();
          setTimeout(function () { go("#/challenge/" + ch.id); }, 700);
        } else {
          $("#ansFb").innerHTML = '<span class="bad">Incorrect — try again.</span>';
          const form = $(".answer-form", q);
          form.classList.add("shake");
          setTimeout(function () { form.classList.remove("shake"); }, 450);
          SFX.wrong();
        }
      }
      $("#ansSubmit").addEventListener("click", submit);
      $("#ansInput").addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    }

    function renderBoss(ch) {
      let part = 0;
      const q = $("#chQ");
      const boss = $("#chBoss");
      q.innerHTML = "<div>" + esc(ch.briefing) + "</div>";
      function showPart() {
        const p = ch.parts[part];
        boss.innerHTML = '<div class="boss-chain">' +
          '<div class="boss-part"><div class="bp-q">' + esc(p.q) + "</div>" +
          '<div class="mono" style="font-size:var(--fs-sm);color:var(--dim);margin-bottom:6px">' + esc(p.format || "") + "</div>" +
          '<div class="answer-form"><input type="text" id="bossAns" autocomplete="off" placeholder="answer for this part…">' +
          '<button class="btn btn-primary" id="bossSubmit">Submit part</button></div>' +
          '<div class="answer-feedback" id="bossFb"></div></div></div>';
        $("#bossSubmit").addEventListener("click", submitPart);
        $("#bossAns").addEventListener("keydown", function (e) { if (e.key === "Enter") submitPart(); });
      }
      function submitPart() {
        const p = ch.parts[part];
        const v = $("#bossAns").value;
        if (!v.trim()) return;
        if (normAns(v) && p.aliases.some(function (a) { return normAns(a) === normAns(v); })) {
          $("#bossFb").innerHTML = '<span class="good">Part ' + (part + 1) + " correct.</span>";
          SFX.correct();
          part++;
          if (part < ch.parts.length) {
            setTimeout(showPart, 420);
          } else {
            // all parts correct -> solve
            const secs = Math.max(0, Math.round((Date.now() - loadT) / 1000));
            const hintsUsed = state.hintsUsed[ch.id] || 0;
            const pts = hintCost(ch, hintsUsed);
            const xpAdd = pts + DATA.xp.bossbonus;
            state.solved[ch.id] = { pts: xpAdd, hints: hintsUsed, ts: Date.now(), secs: secs };
            delete state.hintsUsed[ch.id];
            if (hintsUsed === 0) state.stats.noHintSolves++;
            if (state.stats.speedrunBest === null || secs < state.stats.speedrunBest) state.stats.speedrunBest = secs;
            addXP(xpAdd, ch.title);
            state.reviewMisses = (state.reviewMisses || []).filter(function (x) { return x !== ch.id; });
            save();
            checkAchievements();
            boss.innerHTML = '<div class="good" style="font-family:var(--mono)">✓ BOSS solved! +' + xpAdd + " XP</div>";
            confetti();
            setTimeout(function () { go("#/challenge/" + ch.id); }, 800);
          }
        } else {
          $("#bossFb").innerHTML = '<span class="bad">Incorrect — try this part again.</span>';
          const f = $(".answer-form", boss);
          f.classList.add("shake");
          setTimeout(function () { f.classList.remove("shake"); }, 450);
          SFX.wrong();
        }
      }
      showPart();
    }

    function renderHints(ch) {
      const box = $("#chHints");
      if (state.solved[ch.id] || state.revealed[ch.id]) {
        box.innerHTML = ch.hints.map(function (h, i) { return '<div class="hint-item">' + esc(h) + "</div>"; }).join("");
        return;
      }
      box.innerHTML = '<div style="margin-bottom:6px">' +
        '<button class="btn btn-sm" id="hint1">Reveal hint 1 (−' + Math.floor(ch.points * 0.1) + " pts)</button> " +
        (ch.hints.length > 1 ? '<button class="btn btn-sm" id="hint2">Reveal hint 2 (−' + Math.floor(ch.points * 0.1) + " pts)</button>" : "") +
        '<button class="btn btn-sm btn-danger" id="giveup">Give up (0 pts)</button>' +
        "</div>";
      const h1 = $("#hint1"), h2 = $("#hint2");
      function reveal(n) {
        state.hintsUsed[ch.id] = (state.hintsUsed[ch.id] || 0) + 1;
        const span = document.createElement("div");
        span.className = "hint-item";
        span.textContent = "Hint " + n + ": " + ch.hints[n - 1];
        box.appendChild(span);
        let btn = $("#hint" + n);
        if (btn) btn.disabled = true;
        save();
        SFX.key();
      }
      if (h1) h1.addEventListener("click", function () { reveal(1); });
      if (h2) h2.addEventListener("click", function () { reveal(2); });
      const gu = $("#giveup");
      if (gu) gu.addEventListener("click", function () {
        state.revealed[ch.id] = true;
        state.reviewMisses = (state.reviewMisses || []);
        if (state.reviewMisses.indexOf(ch.id) === -1) state.reviewMisses.push(ch.id);
        save();
        go("#/challenge/" + ch.id);
      });
    }

    const backBtn = document.createElement("button");
    backBtn.className = "btn";
    backBtn.id = "backBoard2";
    backBtn.textContent = "← Back to challenges";
    main.querySelector(".view").appendChild(backBtn);
    backBtn.addEventListener("click", function () { go("#/challenges"); });
  }

  /* ----- Quiz menu ----- */
  function viewQuizMenu() {
    const main = $("#main");
    main.innerHTML = '<div class="view">' +
      '<h1 class="page-title">Modes</h1>' +
      '<div class="page-sub">Four ways to test yourself — choose your grind.</div>' +
      '<div class="mode-grid">' +
      '<div class="card mode-card" data-goto="#/quiz/daily"><div class="mc-title">Daily</div><div class="mc-desc">One challenge picked by the date. Bonus XP for the streak.</div></div>' +
      '<div class="card mode-card" data-goto="#/quiz/timed"><div class="mc-title">Timed</div><div class="mc-desc">10 questions against a countdown. Finish fast for a speed bonus.</div></div>' +
      '<div class="card mode-card" data-goto="#/quiz/exam"><div class="mc-title">Exam</div><div class="mc-desc">10 random challenges, no hints, no writeups until the end — then a breakdown.</div></div>' +
      '<div class="card mode-card" data-goto="#/quiz/review"><div class="mc-title">Review</div><div class="mc-desc">Replay only the challenges you got wrong or revealed.</div></div>' +
      "</div></div>";
    $$(".mode-card").forEach(function (c) { c.addEventListener("click", function () { go(c.getAttribute("data-goto")); }); });
  }

  /* ----- daily ----- */
  function viewDaily() {
    // deterministic pick by date
    const d = new Date();
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    const pool = DATA.challenges.filter(function (c) { return c.aliases; });
    const ch = pool[seed % pool.length];
    const today = todayStr();
    const done = state.daily.last === today;
    const main = $("#main");

    main.innerHTML = '<div class="view">' +
      '<h1 class="page-title">Daily Challenge</h1>' +
      '<div class="page-sub">Today: <strong>' + esc(ch.title) + "</strong> (" + ch.points + " pts). " +
      '<span class="chip accent">streak: ' + state.streak.current + "</span> " +
      (done ? '<span class="good">✓ completed today</span>' : "") + "</div>" +
      '<div id="dailyBody"></div></div>';

    const wrap = $("#dailyBody");
    function render() {
      wrap.innerHTML = '<div class="card">' +
        '<div class="sec-label">BRIEFING</div><div>' + esc(ch.briefing) + "</div>" +
        '<pre class="artifact" style="margin-top:10px">' + esc(ch.artifact) + "</pre>" +
        "<div style='margin-top:12px'>" + esc(ch.question) + "</div>" +
        '<div class="answer-form"><input type="text" id="dAns" placeholder="answer…"><button class="btn btn-primary" id="dSubmit">Submit</button></div>' +
        '<div class="answer-feedback" id="dFb"></div></div>';

      function submit() {
        const v = $("#dAns").value;
        if (!v.trim()) return;
        if (checkAnswer(ch, v)) {
          if (!done) {
            state.daily.last = today;
            state.daily.count++;
            state.stats.dailies++;
            // streak logic
            if (state.streak.lastDate === today) { /* already counted */ }
            else if (state.streak.lastDate === yesterdayStr()) { state.streak.current++; }
            else { state.streak.current = 1; }
            state.streak.lastDate = today;
            if (state.streak.current > state.streak.best) state.streak.best = state.streak.current;
            const bonus = DATA.xp.daily;
            state.solved[ch.id] = { pts: ch.points, hints: 0, ts: Date.now(), daily: true };
            addXP(ch.points + bonus, ch.title + " (daily +" + bonus + ")");
            save();
            checkAchievements();
          }
          $("#dFb").innerHTML = done
            ? '<span class="good">✓ Correct — you already completed today’s challenge.</span>'
            : '<span class="good">✓ Correct! +' + (ch.points + DATA.xp.daily) + ' XP (daily bonus included)</span>';
          if (!done) confetti();
          setTimeout(function () { go("#/quiz/daily"); }, 900);
        } else {
          $("#dFb").innerHTML = '<span class="bad">Incorrect — try again.</span>';
          SFX.wrong();
        }
      }
      $("#dSubmit").addEventListener("click", submit);
      $("#dAns").addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
    }
    render();
  }

  /* ----- generic quiz runner ----- */
  function startQuiz(list, opts) {
    const main = $("#main");
    list = list.filter(function (c) { return c && c.aliases; });
    if (!list.length) {
      main.innerHTML = '<div class="view"><div class="card"><h2>' + esc(opts.title) + '</h2>' +
        '<div class="dim">No challenge available for this mode right now.</div>' +
        '<button class="btn" id="qBack">back to modes</button></div></div>';
      $("#qBack").addEventListener("click", function () { go("#/quiz"); });
      return;
    }
    const total = list.length;
    let idx = 0;
    let correct = 0;
    const results = []; // {ch, ok}
    let startT = Date.now();
    const TIME = opts.timed ? 60 : 0; // seconds
    let timeLeft = TIME;
    let timer = null;

    function render() {
      let html = '<div class="view quiz-run">' + '<h2 class="page-title">' + esc(opts.title) + "</h2>";
      if (opts.timed) html += '<div class="timer' + (timeLeft < 10 ? " low" : "") + '" id="qTimer">' + timeLeft + "s</div>";
      html += '<div class="quiz-progress">question ' + (idx + 1) + " / " + total + "</div>";
      html += '<div id="qBody"></div></div>';
      main.innerHTML = html;
      renderQ();
      if (opts.timed) startTimer();
    }
    function renderQ() {
      const ch = list[idx];
      if (!ch || !ch.aliases) {
        idx++;
        if (idx >= total) return finish();
        return renderQ();
      }
      const body = $("#qBody");
      body.innerHTML = '<div class="card">' +
        '<div class="sec-label">' + esc(moduleOf(ch.module).short) + " · " + ch.points + " pts</div>" +
        "<div>" + esc(ch.briefing) + "</div>" +
        '<pre class="artifact" style="margin-top:10px">' + esc(ch.artifact) + "</pre>" +
        "<div style='margin-top:12px'>" + esc(ch.question) + "</div>" +
        '<div class="answer-form"><input type="text" id="qAns" autocomplete="off" placeholder="answer…"><button class="btn btn-primary" id="qSubmit">Submit</button></div>' +
        '<div class="answer-feedback" id="qFb"></div></div>';
      function submit() {
        const v = $("#qAns").value;
        if (!v.trim()) return;
        const ok = checkAnswer(ch, v);
        results.push({ ch: ch, ok: ok });
        if (ok) { correct++; $("#qFb").innerHTML = '<span class="good">✓ Correct</span>'; SFX.correct(); }
        else { $("#qFb").innerHTML = '<span class="bad">✗ Incorrect</span>'; SFX.wrong(); }
        if (state.reviewMisses && !ok && state.reviewMisses.indexOf(ch.id) === -1) state.reviewMisses.push(ch.id);
        if (ok) state.reviewMisses = (state.reviewMisses || []).filter(function (x) { return x !== ch.id; });
        setTimeout(next, 650);
      }
      $("#qSubmit").addEventListener("click", submit);
      $("#qAns").addEventListener("keydown", function (e) { if (e.key === "Enter") submit(); });
      if (opts.timed && timeLeft <= 0) return;
      $("#qAns").focus();
    }
    function next() {
      idx++;
      if (idx >= total) return finish();
      renderQ();
    }
    function startTimer() {
      if (timer) clearInterval(timer);
      timer = setInterval(function () {
        timeLeft--;
        const t = $("#qTimer");
        if (t) { t.textContent = timeLeft + "s"; t.className = "timer" + (timeLeft < 10 ? " low" : ""); }
        if (timeLeft <= 0) { clearInterval(timer); timer = null; finish(); }
      }, 1000);
    }
    function finish() {
      if (timer) { clearInterval(timer); timer = null; }
      const elapsed = Math.round((Date.now() - startT) / 1000);
      const speedBonus = opts.timed ? Math.min(100, timeLeft) : 0;
      const xpEarned = correct * 10 + speedBonus;
      // award XP
      if (correct > 0) addXP(xpEarned, opts.title + " quiz");
      if (opts.exam && correct === total) state.stats.perfectExam = true;
      save();
      checkAchievements();

      // results view
      let html = '<div class="view quiz-results">' +
        '<h1 class="page-title">' + esc(opts.title) + " — results</h1>" +
        '<div class="grid grid-3">' +
        '<div class="card qr-tile"><div class="qr-num">' + correct + "</div><div>correct</div></div>" +
        '<div class="card qr-tile"><div class="qr-num">' + (total - correct) + "</div><div>missed</div></div>" +
        '<div class="card qr-tile"><div class="qr-num">' + xpEarned + "</div><div>XP earned</div></div>" +
        "</div>";

      if (opts.exam) {
        // breakdown by module + weak spots
        const modStats = {};
        results.forEach(function (r) {
          const mk = r.ch.module;
          if (!modStats[mk]) modStats[mk] = { t: 0, ok: 0 };
          modStats[mk].t++; if (r.ok) modStats[mk].ok++;
        });
        html += '<div class="card"><h3>Breakdown</h3>';
        Object.keys(modStats).forEach(function (mk) {
          const ms = modStats[mk];
          const pct = Math.round((ms.ok / ms.t) * 100);
          html += '<div class="accuracy-row"><span class="ar-mod">' + esc(moduleOf(mk).short) + "</span>" +
            '<div class="progress" style="flex:1"><div class="bar" style="width:' + pct + '%"></div></div>' +
            '<span>' + ms.ok + "/" + ms.t + "</span></div>";
        });
        html += "</div>";
        const weak = Object.keys(modStats).filter(function (mk) { return modStats[mk].ok / modStats[mk].t < 0.7; });
        if (weak.length) {
          html += '<div class="card"><h3>Weak spots</h3><ul class="weak-spots">' +
            weak.map(function (mk) { return "<li>" + esc(moduleOf(mk).title) + "</li>"; }).join("") + "</ul></div>";
        }
      } else {
        // list results
        html += '<div class="card"><h3>Review</h3><ul>' +
          results.map(function (r) {
            return "<li>" + (r.ok ? '<span class="good">✓</span>' : '<span class="bad">✗</span>') + " " + esc(r.ch.title) + "</li>";
          }).join("") + "</ul></div>";
      }
      html += '<div class="actions" style="display:flex;gap:10px">' +
        '<button class="btn" id="qReview">Review missed</button>' +
        '<button class="btn btn-primary" id="qAgain">Try again</button>' +
        '<button class="btn" id="qBack">Modes</button></div></div>';
      main.innerHTML = html;
      $("#qAgain").addEventListener("click", function () { startQuiz(list, opts); });
      $("#qBack").addEventListener("click", function () { go("#/quiz"); });
      $("#qReview").addEventListener("click", function () { go("#/quiz/review"); });
    }
    render();
  }

  function pickRandom(n) {
    const pool = DATA.challenges.filter(function (c) { return c.aliases; });
    const arr = pool.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr.slice(0, n);
  }

  function viewTimed() {
    // 10 questions
    const list = pickRandom(10);
    startQuiz(list, { title: "Timed Mode", timed: true });
  }
  function viewExam() {
    const list = pickRandom(10);
    startQuiz(list, { title: "Exam Mode", exam: true });
  }
  function viewReview() {
    const miss = (state.reviewMisses || []).filter(function (id) {
      const c = challengeById(id);
      return c && c.aliases;
    });
    const list = miss.map(function (id) { return challengeById(id); });
    if (!list.length) {
      $("#main").innerHTML = '<div class="view"><div class="card"><h2>Review Mode</h2>' +
        '<div class="dim">Nothing to review yet — challenges you miss or reveal get queued here.</div>' +
        '<button class="btn" id="qBack">back to modes</button></div></div>';
      $("#qBack").addEventListener("click", function () { go("#/quiz"); });
      return;
    }
    startQuiz(list, { title: "Review Mode" });
  }

  /* ----- Flashcards ----- */
  function viewCards() {
    const main = $("#main");
    const terms = DATA.glossary;
    // build due list: box1 first, then ascending box
    const due = terms.slice().sort(function (a, b) {
      const ba = state.cards.box[a.id] || 1, bb = state.cards.box[b.id] || 1;
      return ba - bb;
    });
    let idx = 0, flipped = false;

    function boxOf(id) { return state.cards.box[id] || 1; }

    function render() {
      if (!due.length) { main.innerHTML = '<div class="view"><div class="card"><h2>Flashcards</h2><div class="dim">No cards.</div></div></div>'; return; }
      const t = due[idx % due.length];
      const b = boxOf(t.id);
      main.innerHTML = '<div class="view"><h1 class="page-title">Flashcards</h1>' +
        '<div class="page-sub">Leitner spaced repetition — 5 boxes. Know it? Move up. Miss it? Back to box 1.</div>' +
        '<div class="card-deck">' +
        '<div class="card-count">card ' + (idx + 1) + " / " + due.length + " · box " + b + "</div>" +
        '<div class="card-stage"><div class="card-face' + (flipped ? " flipped" : "") + '" id="cf">' +
        '<div class="cf-side cf-front">' + esc(t.term) + "</div>" +
        '<div class="cf-side cf-back">' + esc(t.def) + "</div>" +
        "</div></div>" +
        '<div class="card-boxes">' + [1, 2, 3, 4, 5].map(function (n) {
          return '<div class="box' + (n === b ? " active" : "") + '">' + n + "</div>";
        }).join("") + "</div>" +
        '<div class="card-actions">' +
        '<button class="btn btn-sm" id="cFlip">Flip</button>' +
        '<button class="btn btn-sm" id="cPrev">‹ prev</button>' +
        '<button class="btn btn-sm" id="cNext">next ›</button>' +
        "</div>" +
        '<div class="card-actions">' +
        '<button class="btn btn-primary btn-sm" id="cKnow">I knew it</button>' +
        '<button class="btn btn-danger btn-sm" id="cDont">Didn’t know</button>' +
        "</div></div></div>";

      $("#cFlip").addEventListener("click", function () { flipped = !flipped; render(); SFX.flip(); });
      $("#cPrev").addEventListener("click", function () { idx = (idx - 1 + due.length) % due.length; flipped = false; render(); });
      $("#cNext").addEventListener("click", function () { idx = (idx + 1) % due.length; flipped = false; render(); });
      $("#cKnow").addEventListener("click", function () {
        state.cards.box[t.id] = Math.min(5, b + 1);
        save(); SFX.correct();
        idx = (idx + 1) % due.length; flipped = false; render();
      });
      $("#cDont").addEventListener("click", function () {
        state.cards.box[t.id] = 1;
        save(); SFX.wrong();
        idx = (idx + 1) % due.length; flipped = false; render();
      });
      $("#cf").addEventListener("click", function () { flipped = !flipped; render(); SFX.flip(); });
    }
    render();
  }

  /* ----- Glossary ----- */
  function viewGlossary(r) {
    const main = $("#main");
    let highlight = "";
    const mq = /(?:^|&)term=([^&]*)/.exec(r.query || "");
    if (mq && mq[1]) { try { highlight = decodeURIComponent(mq[1]); } catch (e) { highlight = mq[1]; } }
    if (highlight && !DATA.glossary.some(function (g) { return g.id === highlight; })) highlight = "";
    main.innerHTML = '<div class="view"><h1 class="page-title">Glossary</h1>' +
      '<input type="search" class="term-search" id="termSearch" placeholder="Search terms…">' +
      '<div class="term-list" id="termList"></div></div>';

    function renderList(q) {
      const qn = normAns(q);
      const items = DATA.glossary.filter(function (g) {
        return !qn || normAns(g.term).indexOf(qn) !== -1 || normAns(g.def).indexOf(qn) !== -1;
      });
      $("#termList").innerHTML = items.map(function (g) {
        return '<div class="term-item' + (g.id === highlight ? '" style="border-color:var(--accent)"' : '"') +
          ' data-term="' + g.id + '">' +
          '<div class="tt-term">' + esc(g.term) + "</div>" +
          '<div class="tt-def">' + esc(g.def) + "</div></div>";
      }).join("") || '<div class="dim">no matching terms</div>';
      if (highlight) {
        const t = $('.term-item[data-term="' + highlight + '"]', main);
        if (t) t.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }
    renderList("");
    $("#termSearch").addEventListener("input", function () { renderList(this.value); });
  }

  /* ----- Cheat sheet ----- */
  function viewSheet() {
    const main = $("#main");
    main.innerHTML = '<div class="view">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">' +
      '<h1 class="page-title">Cheat Sheet</h1>' +
      '<button class="btn btn-primary" id="printBtn">Print / PDF</button></div>' +
      '<div class="page-sub">One page of the whole PDF. Print-ready.</div>' +
      '<div class="sheet-grid">' +
      sheetHier() + sheetFetch() + sheetRom() + sheetRam() + sheetPack() + sheetVm() +
      "</div></div>";
    $("#printBtn").addEventListener("click", function () { window.print(); });
  }

  function sheetHier() {
    const rows = [
      ["Level", "Size", "Access", "Bandwidth", "Managed by", "Backed by"],
      ["Registers", "<1 KB", "0.15–0.30 ns", "100k–1M MB/s", "compiler", "cache"],
      ["Cache", "32 KB–8 MB", "0.5–15 ns", "10k–40k MB/s", "hardware", "main memory"],
      ["Main memory", "<512 GB", "30–200 ns", "5k–20k MB/s", "OS", "disk"],
      ["Disk", ">1 TB", "5,000,000 ns", "50–500 MB/s", "OS/operator", "other disks + DVD"]
    ];
    return sheetTable("Memory hierarchy", rows);
  }
  function sheetFetch() {
    return '<div class="sheet-sec"><h3>Fetch cycle</h3><ol>' +
      "<li>address CPU register → MAR</li><li>MAR → address bus</li><li>memory locates data</li>" +
      "<li>data bus → MDR</li><li>MDR → CPU register (internal bus)</li>" +
      "</ol><p class='dim' style='font-size:var(--fs-xs)'>Memory: N words × n bits; 4K × 12 = 4096 loc × 12 bits = 49,152 bits; address bits k where N = 2^k (extra)</p></div>";
  }
  function sheetRom() {
    return sheetTable("ROM types", [
      ["Type", "Erase", "Notes"],
      ["ROM / mask", "none", "fixed at manufacture"],
      ["PROM", "none", "one-time programmable"],
      ["EPROM", "UV light", "quartz window; chip removed"],
      ["EEPROM", "electrical", "in-circuit rewrite; BIOS updates"]
    ]);
  }
  function sheetRam() {
    return '<div class="sheet-sec"><h3>RAM classifications</h3><ul>' +
      "<li><strong>Static</strong> (SRAM: holds, no refresh) vs <strong>dynamic</strong> (DRAM: leaks, refresh)</li>" +
      "<li><strong>Volatile</strong> (RAM/cache vanish at power-off) vs <strong>nonvolatile</strong> (ROM/disk/flash)</li>" +
      "<li><strong>Destructive read</strong> (DRAM; restore) vs <strong>non-destructive</strong> (SRAM)</li>" +
      "<li><strong>Removable</strong> (USB/optical) vs <strong>permanent</strong> (internal disk)</li>" +
      "</ul></div>";
  }
  function sheetPack() {
    return '<div class="sheet-sec"><h3>Packaging</h3><ul>' +
      "<li><strong>DIP</strong> — pins both sides, mounted on board</li>" +
      "<li><strong>SIMM</strong> — 72-pin, 32-bit, one row (vintage)</li>" +
      "<li><strong>DIMM</strong> — dual edge, desktop</li>" +
      "<li><strong>SO-DIMM</strong> — laptop variant</li>" +
      "<li><strong>Banks</strong> — sockets populated together; <strong>DDR4</strong> keyed vs DDR3 (won’t mix)</li>" +
      "</ul></div>";
  }
  function sheetVm() {
    return '<div class="sheet-sec"><h3>Virtual memory</h3><p>Virtual memory = <strong>main memory + disk cache</strong> (swap).</p><ul>' +
      "<li><strong>Page</strong> — fixed-size unit moved RAM ↔ disk</li>" +
      "<li><strong>Page hit</strong> — resident, no disk</li>" +
      "<li><strong>Page fault</strong> — missing, swap in</li>" +
      "<li><strong>Swapping</strong> — the paging mechanism</li>" +
      "</ul></div>";
  }
  function sheetTable(title, rows) {
    let s = '<div class="sheet-sec"><h3>' + title + "</h3><table>";
    s += rows.map(function (r, i) {
      return "<tr>" + r.map(function (c, j) {
        return (i === 0 ? "<th>" : "<td>") + esc(c) + (i === 0 ? "</th>" : "</td>");
      }).join("") + "</tr>";
    }).join("");
    s += "</table></div>";
    return s;
  }

  /* ----- Scoreboard ----- */
  function viewScore() {
    const main = $("#main");
    const rank = rankOf(state.xp);
    const solvedCount = solvedIds().length;
    // per-module accuracy
    let modAcc = "";
    DATA.modules.forEach(function (m) {
      const chs = DATA.challenges.filter(function (c) { return c.module === m.id; });
      const ok = chs.filter(function (c) { return state.solved[c.id]; }).length;
      const pct = Math.round((ok / chs.length) * 100);
      modAcc += '<div class="accuracy-row"><span class="ar-mod">' + esc(m.short) + "</span>" +
        '<div class="progress" style="flex:1"><div class="bar" style="width:' + pct + '%;background:' + m.color + '"></div></div>' +
        '<span>' + ok + "/" + chs.length + "</span></div>";
    });

    // points-over-time chart from history
    let chart = "";
    if (state.history.length >= 2) {
      let cum = 0;
      const pts = state.history.map(function (h) { cum += h.pts; return cum; });
      const max = Math.max.apply(null, pts) || 1;
      const W = 600, H = 160;
      let poly = pts.map(function (p, i) {
        const x = 10 + (i / (pts.length - 1)) * (W - 20);
        const y = H - 10 - (p / max) * (H - 30);
        return x.toFixed(1) + "," + y.toFixed(1);
      }).join(" ");
      chart = '<div class="chart-wrap"><h3>Points over time</h3><svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:auto">' +
        '<polyline points="' + poly + '" fill="none" stroke="var(--accent)" stroke-width="2"/>' +
        '<circle cx="' + (10 + (pts.length - 1) / (pts.length - 1) * (W - 20)) + '" cy="' + (H - 10 - (pts[pts.length - 1] / max) * (H - 30)) + '" r="3" fill="var(--accent)"/>' +
        "</svg></div>";
    }

    main.innerHTML = '<div class="view">' +
      '<h1 class="page-title">Scoreboard</h1>' +
      '<div class="score-top">' +
      '<div class="score-card"><div class="sc-num">' + state.xp + "</div><div class='sc-label'>XP</div></div>" +
      '<div class="score-card"><div class="sc-num">' + rank.name + "</div><div class='sc-label'>rank</div></div>" +
      '<div class="score-card"><div class="sc-num">' + solvedCount + "</div><div class='sc-label'>solved</div></div>" +
      '<div class="score-card"><div class="sc-num">' + state.streak.best + "</div><div class='sc-label'>best streak</div></div>" +
      "</div>" +
      chart +
      '<div class="card"><h3>Accuracy by module</h3>' + modAcc + "</div>" +
      "</div>";
  }

  /* ----- Badges ----- */
  function viewBadges() {
    const main = $("#main");
    main.innerHTML = '<div class="view"><h1 class="page-title">Badges</h1>' +
      '<div class="page-sub">' + Object.keys(state.achievements).length + " / " + DATA.achievements.length + " unlocked</div>" +
      '<div class="badge-grid">' +
      DATA.achievements.map(function (a) {
        const unlocked = !!state.achievements[a.id];
        return '<div class="badge' + (unlocked ? " unlocked" : "") + '">' +
          '<span class="bd-ico">' + a.ico + "</span>" +
          '<div class="bd-name">' + esc(a.name) + "</div>" +
          '<div class="bd-desc">' + esc(a.desc) + "</div>" +
          '<span class="bd-state">' + (unlocked ? "✓ unlocked" : "locked") + "</span></div>";
      }).join("") +
      "</div></div>";
  }

  /* ----- Settings ----- */
  function viewSettings() {
    const main = $("#main");
    const s = state.settings;
    main.innerHTML = '<div class="view">' +
      '<h1 class="page-title">Settings</h1>' +
      '<div class="card">' +
      settingRow("Theme", "Switch the color scheme.", '<select id="setTheme" class="theme-select">' +
        ["matrix", "cyber", "amber", "purple", "paper"].map(function (t) {
          return '<option value="' + t + '"' + (s.theme === t ? " selected" : "") + ">" + t.charAt(0).toUpperCase() + t.slice(1) + "</option>";
        }).join("") + "</select>") +
      settingRow("CRT scanlines + glow", "Toggle the subtle CRT overlay.", toggleHTML("setCrt", s.crt)) +
      settingRow("Sound effects", "UI sounds via WebAudio.", toggleHTML("setSound", s.sound)) +
      settingRow("Reduced motion", "Smooth animations off.", toggleHTML("setMotion", s.motion === "off")) +
      settingRow("Font size", "Adjust base font size.", '<input type="range" id="setFs" min="13" max="21" value="' + s.fs + '"> <span class="mono" id="fsVal">' + s.fs + "px</span>") +
      settingRow("Free Roam", "Unlock every challenge regardless of lesson progress.", toggleHTML("setRoam", s.freeRoam)) +
      "</div>" +
      '<div class="card"><h3>Data</h3>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      '<button class="btn" id="btnExport">Export progress (.json)</button>' +
      '<button class="btn" id="btnImportWrap">Import progress</button>' +
      '<input type="file" id="btnImport" class="hidden" accept="application/json">' +
      '<button class="btn btn-danger" id="btnReset">Reset progress</button>' +
      "</div></div></div>";

    function settingRow(label, desc, control) {
      return '<div class="setting-row"><div><div class="sr-label">' + label + "</div><div class='sr-desc'>" + desc + "</div></div>" + control + "</div>";
    }
    function toggleHTML(id, on) {
      return '<label class="toggle"><input type="checkbox" id="' + id + '"' + (on ? " checked" : "") + '><span class="track"></span></label>';
    }

    $("#setTheme").addEventListener("change", function () { state.settings.theme = this.value; applySettings(); save(); });
    $("#setCrt").addEventListener("change", function () { state.settings.crt = this.checked; applySettings(); save(); });
    $("#setSound").addEventListener("change", function () { state.settings.sound = this.checked; SFX.setEnabled(this.checked); save(); });
    $("#setMotion").addEventListener("change", function () { state.settings.motion = this.checked ? "off" : "auto"; applySettings(); save(); });
    $("#setFs").addEventListener("input", function () { state.settings.fs = parseInt(this.value, 10); $("#fsVal").textContent = this.value + "px"; applySettings(); save(); });
    $("#setRoam").addEventListener("change", function () { state.settings.freeRoam = this.checked; save(); });

    $("#btnExport").addEventListener("click", function () {
      try {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "memory-exe-progress.json";
        a.click();
        URL.revokeObjectURL(a.href);
        toast("Progress exported.", "good");
      } catch (e) { toast("Export failed.", "bad"); }
    });
    $("#btnImportWrap").addEventListener("click", function () { $("#btnImport").click(); });
    $("#btnImport").addEventListener("change", function () {
      const f = this.files && this.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const data = JSON.parse(reader.result);
          if (data && data.v) { state = data; save(); applySettings(); toast("Progress imported.", "good"); go("#/score"); }
          else toast("Invalid progress file.", "bad");
        } catch (e) { toast("Could not read file.", "bad"); }
      };
      reader.readAsText(f);
    });
    $("#btnReset").addEventListener("click", function () {
      if (confirm("Reset ALL progress, XP, and settings? This cannot be undone.")) {
        state = defaultState();
        save();
        applySettings();
        toast("Progress reset.", "bad");
        go("#/learn");
      }
    });
  }

  /* ---------- apply settings ---------- */
  function applySettings() {
    const s = state.settings;
    document.body.setAttribute("data-theme", s.theme);
    document.body.classList.toggle("crt-off", !s.crt);
    document.body.classList.toggle("motion-off", s.motion === "off");
    document.body.style.setProperty("--fs", s.fs + "px");
    SFX.setEnabled(s.sound);
  }

  /* ---------- boot ---------- */
  function boot() {
    const screen = $("#bootScreen");
    let booted = false;
    try { booted = sessionStorage.getItem("memory.exe.boot") === "1"; } catch (e) {}
    if (booted) { screen.classList.add("hidden"); return; }
    const txt = $("#bootText");
    const lines = [
      "[ MEMORY.EXE v1.0 ]",
      "POST self-test............",
      "CPU................. OK",
      "RAM................. OK",
      "CACHE.............. OK",
      "ROM/FIRMWARE...... OK",
      "loading kernel...........",
      "Ready."
    ];
    let li = 0;
    const okay = function (s) { return s.indexOf("OK") !== -1; };
    function step() {
      if (li >= lines.length) { finish(); return; }
      const line = lines[li++];
      const div = document.createElement("div");
      div.textContent = line;
      if (line.indexOf("OK") !== -1) div.className = "ok";
      else if (line.indexOf("Ready") !== -1) div.className = "ok";
      else if (line.indexOf("POST") !== -1 || line.indexOf("MEMORY") !== -1) div.className = "dim";
      txt.appendChild(div);
      setTimeout(step, li === lines.length ? 320 : 240);
    }
    function hideBoot() { screen.classList.add("hidden"); }
    function persistBooted() { try { sessionStorage.setItem("memory.exe.boot", "1"); } catch (e) {} }
    var skip = function () { persistBooted(); hideBoot(); detachSkip(); };
    function detachSkip() {
      window.removeEventListener("keydown", skip);
      screen.removeEventListener("click", skip);
    }
    function finish() {
      persistBooted(); hideBoot(); detachSkip();
      SFX.levelup();
    }
    window.addEventListener("keydown", skip);
    screen.addEventListener("click", skip);
    step();
  }

  /* ---------- init ---------- */
  function init() {
    applySettings();
    window.addEventListener("hashchange", route);
    route();
    boot();
    updateHUD();

    $("#paletteBtn").addEventListener("click", togglePalette);
    window.addEventListener("keydown", function (e) {
      const tag = (e.target.tagName || "").toLowerCase();
      const typing = tag === "input" || tag === "textarea" || tag === "select";
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); togglePalette(); return; }
      if (e.key === "Escape") { closeOverlays(); return; }
      if (!typing) {
        if (e.key === "?") { e.preventDefault(); toggleHelp(); }
        else if (e.key === "h") go("#/learn");
        else if (e.key === "c") go("#/challenges");
      }
    });
    $("#paletteInput").addEventListener("input", function () { renderPalette(this.value); });
    $("#paletteInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        const it = palItems[palSel];
        if (it) { closeOverlays(); go(it.hash); }
      }
      if (e.key === "ArrowDown") { e.preventDefault(); palSel = Math.min(palItems.length - 1, palSel + 1); markPal(); }
      if (e.key === "ArrowUp") { e.preventDefault(); palSel = Math.max(0, palSel - 1); markPal(); }
    });
    function markPal() {
      $$("#paletteResults li").forEach(function (li, i) { li.classList.toggle("sel", i === palSel); });
    }
  }

  return { init: init, state: state, save: save, go: go, checkAnswer: checkAnswer, rankOf: rankOf, toast: toast, _debug: { routes: ROUTES, parseHash: parseHash } };
})();

document.addEventListener("DOMContentLoaded", function () { App.init(); });
