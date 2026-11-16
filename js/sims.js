/* ============================================================
   MEMORY.EXE — sims.js
   Interactive simulators embedded in lessons. Each exposes
   mount(el) and returns an optional cleanup function.
   All visuals are inline SVG / CSS — no external assets.
   ============================================================ */

const Sims = {};

/* ---------- tiny helpers ---------- */
function $simEl(html) {
  const t = document.createElement("div");
  t.innerHTML = html.trim();
  return t.firstChild;
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function fmtNs(ns) {
  if (ns >= 1e9) return (ns / 1e9).toFixed(2) + " s";
  if (ns >= 1e6) return (ns / 1e6).toFixed(1) + " ms";
  if (ns >= 1e3) return (ns / 1e3).toFixed(1) + " µs";
  return ns.toFixed(2) + " ns";
}
function fmtMB(mb) {
  if (mb >= 1e6) return (mb / 1e6).toFixed(1) + " TB/s";
  if (mb >= 1e3) return (mb / 1e3).toFixed(0) + " GB/s";
  return Math.round(mb) + " MB/s";
}

/* ============================================================
   1) Hierarchy Explorer
   ============================================================ */
Sims.hierarchyExplorer = {
  title: "Hierarchy explorer",
  desc: "Click a level to inspect it; switch the bar chart to compare size, speed, or bandwidth.",
  mount: function (el) {
    const LEVELS = [
      { name: "Registers",  color: "#00ff41", size: "<1 KB",            acc: 0.25, bw: 550000, mgmt: "compiler",           backed: "cache",       note: "Inside the CPU; holds operands." },
      { name: "Cache",      color: "#00e5ff", size: "32 KB–8 MB",      acc: 5,     bw: 25000, mgmt: "hardware",           backed: "main memory",  note: "On-chip SRAM; hides main-memory latency." },
      { name: "Main memory", color: "#ffb000", size: "<512 GB",         acc: 100,   bw: 12000, mgmt: "operating system",   backed: "disk",         note: "DRAM; where programs and data live while running." },
      { name: "Disk storage", color: "#c77dff", size: ">1 TB",          acc: 5000000, bw: 250, mgmt: "OS / operator",      backed: "other disks + DVD", note: "Magnetic bulk storage; nonvolatile." }
    ];
    const DIMS = [
      { key: "speed", label: "Speed (access time)", numeric: true, val: function (L) { return L.acc; }, text: function (L) { return fmtNs(L.acc); } },
      { key: "size", label: "Size", numeric: false, val: function (L) { return 0; }, text: function (L) { return L.size; } },
      { key: "bandwidth", label: "Bandwidth", numeric: true, val: function (L) { return L.bw; }, text: function (L) { return fmtMB(L.bw); } },
      { key: "managed", label: "Managed by", numeric: false, val: function (L) { return 0; }, text: function (L) { return L.mgmt; } },
      { key: "backed", label: "Backed by", numeric: false, val: function (L) { return 0; }, text: function (L) { return L.backed; } }
    ];

    let dim = "speed";
    let sel = 0;

    function pyramidHTML() {
      let s = '<div class="hier-pyramid">';
      LEVELS.forEach(function (L, i) {
        s += '<div class="hier-layer' + (i === sel ? " active" : "") + '" data-i="' + i + '">' +
          '<span class="hl-name">' + L.name + "</span>" +
          '<span class="hl-meta">' + esc(L.size) + " · " + esc(fmtNs(L.acc)) + "</span>" +
          "</div>";
      });
      s += "</div>";
      return s;
    }

    function barsHTML() {
      const D = DIMS.find(function (d) { return d.key === dim; });
      const logs = LEVELS.map(function (L) { return Math.log10(Math.max(L.acc, 0.01)); });
      const minLog = Math.min.apply(null, logs), maxLog = Math.max.apply(null, logs);
      let s = '<div class="sim-tabs">';
      DIMS.forEach(function (d) {
        s += '<button class="sim-tab' + (d.key === dim ? " active" : "") + '" data-dim="' + d.key + '">' + d.label + "</button>";
      });
      s += "</div><div class='card'>";
      LEVELS.forEach(function (L, i) {
        s += '<div class="accuracy-row">';
        s += '<span class="ar-mod" style="width:120px">' + L.name + "</span>";
        if (D.numeric) {
          const v = Math.log10(Math.max(L.acc, 0.01));
          const pct = Math.max(3, ((v - minLog) / (maxLog - minLog)) * 100);
          s += '<div class="progress" style="flex:1"><div class="bar" style="width:' + pct.toFixed(1) + '%;background:' + L.color + '"></div></div>';
        } else {
          s += '<span class="dim" style="flex:1;font-family:var(--mono);font-size:var(--fs-xs)"> ' + esc(D.text(L)) + "</span>";
        }
        s += '<span class="ar-mod" style="width:150px;text-align:right">' + esc(D.text(L)) + "</span>";
        s += "</div>";
      });
      s += "</div>";
      return s;
    }

    function detailsHTML() {
      const L = LEVELS[sel];
      return '<div class="card panel2">' +
        '<h3 style="color:' + L.color + '">' + L.name + "</h3>" +
        "<p>" + esc(L.note) + "</p>" +
        '<div class="grid grid-2" style="font-family:var(--mono);font-size:var(--fs-sm)">' +
        "<div>Size: <strong>" + esc(L.size) + "</strong></div>" +
        "<div>Access time: <strong>" + esc(fmtNs(L.acc)) + "</strong></div>" +
        "<div>Bandwidth: <strong>" + esc(fmtMB(L.bw)) + "</strong></div>" +
        "<div>Managed by: <strong>" + esc(L.mgmt) + "</strong></div>" +
        "<div>Backed by: <strong>" + esc(L.backed) + "</strong></div>" +
        "</div></div>";
    }

    function render() {
      el.innerHTML = pyramidHTML() + barsHTML() + detailsHTML();
    }
    el.addEventListener("click", function (e) {
      const layer = e.target.closest ? e.target.closest(".hier-layer") : null;
      if (layer) {
        sel = parseInt(layer.getAttribute("data-i"), 10);
        SFX.key();
        render();
        return;
      }
      const tab = e.target.closest ? e.target.closest(".sim-tab") : null;
      if (tab) {
        dim = tab.getAttribute("data-dim");
        SFX.key();
        render();
      }
    });
    render();
  }
};

/* ============================================================
   2) Address Decoder
   ============================================================ */
Sims.addressDecoder = {
  title: "Address decoder",
  desc: "Pick a memory size + word width, then type an address to see which row is selected and what it holds.",
  mount: function (el) {
    let N = 4096, width = 12, addr = 3, winStart = 0;
    const VISIBLE = 16;

    function valAt(row) {
      // deterministic pseudo-random value in [0, 2^width)
      const w = Math.max(1, width);
      return ((row * 31 + 7) % Math.pow(2, w)) >>> 0;
    }

    function bitsOf(v) {
      const w = Math.max(1, width);
      const bits = [];
      for (let i = w - 1; i >= 0; i--) bits.push((v >> i) & 1);
      return bits;
    }

    function renderGrid() {
      let s = '<div class="mem-grid">';
      for (let i = 0; i < VISIBLE; i++) {
        const row = winStart + i;
        if (row >= N) break;
        const on = row === addr;
        s += '<div class="mem-row' + (on ? " active" : "") + '">' +
          '<span class="addr">' + row + "</span>" +
          '<span class="words">';
        bitsOf(valAt(row)).forEach(function (b) {
          s += '<span class="bit' + (b ? " on" : "") + '"></span>';
        });
        s += "</span></div>";
      }
      s += "</div>";
      return s;
    }

    function renderStats() {
      const addrBits = Math.max(1, Math.ceil(Math.log2(N)));
      return '<div class="sim-out">' +
        "<div>Locations: <strong>" + N + "</strong> (2<sup>" + addrBits + "</sup>);  address bits needed: <strong>" + addrBits + "</strong></div>" +
        "<div>Total bits stored: <strong>" + (N * width).toLocaleString() + "</strong> (" + N + " × " + width + ")</div>" +
        "<div>Selected row <strong>" + addr + "</strong> value: <strong>0b" + (valAt(addr) >>> 0).toString(2).padStart(width, "0") + "</strong></div>" +
        "</div>";
    }

    el.innerHTML =
      '<div class="controls">' +
      '<label>Words (N) <input type="number" id="simN" min="1" max="65536" step="1" value="' + N + '"></label>' +
      '<label>Bit width (n) <input type="number" id="simW" min="1" max="32" step="1" value="' + width + '"></label>' +
      '<label>Address <input type="text" id="simAddr" value="' + addr + '" placeholder="decimal or 0b101"></label>' +
      '<button class="btn btn-sm" id="simExample">Load 4K × 12 example</button>' +
      '<button class="btn btn-sm" id="simApply">Apply</button>' +
      "</div>" +
      '<div class="sim-out">Enter an address (decimal, e.g. 4095, or binary 0b111…) to select its row. Use the <strong>4K × 12</strong> example to watch the slide-7 naming math.</div>' +
      '<div id="simGrid"></div>' +
      '<div id="simStats"></div>';

    function refresh() {
      el.querySelector("#simGrid").innerHTML = renderGrid();
      el.querySelector("#simStats").innerHTML = renderStats();
      const active = el.querySelector("#simGrid .mem-row.active");
      if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
    }
    refresh();

    function tryApply() {
      const n = Math.max(1, Math.min(65536, parseInt(el.querySelector("#simN").value, 10) || 4096));
      const w = Math.max(1, Math.min(32, parseInt(el.querySelector("#simW").value, 10) || 12));
      N = n; width = w;
      let a = el.querySelector("#simAddr").value.trim();
      let idx;
      if (/^0b[01]+$/i.test(a)) idx = parseInt(a.slice(2), 2);
      else idx = parseInt(a, 10);
      if (isNaN(idx)) idx = 0;
      addr = Math.max(0, Math.min(N - 1, idx));
      winStart = Math.floor(addr / VISIBLE) * VISIBLE;
      refresh();
      SFX.key();
    }

    el.querySelector("#simApply").addEventListener("click", tryApply);
    el.querySelector("#simAddr").addEventListener("keydown", function (e) { if (e.key === "Enter") tryApply(); });
    el.querySelector("#simExample").addEventListener("click", function () {
      el.querySelector("#simN").value = 4096;
      el.querySelector("#simW").value = 12;
      el.querySelector("#simAddr").value = "4095";
      tryApply();
      SFX.confirm();
    });
  }
};

/* ============================================================
   3) Data Fetch Stepper (slide 8 diagram in SVG)
   ============================================================ */
Sims.fetchStepper = {
  title: "Data fetch stepper",
  desc: "Walk the five steps of a fetch cycle. Components highlight as data moves.",
  mount: function (el) {
    const STEPS = [
      { tip: "Step 1 — The address moves from a CPU register into the MAR over the CPU internal bus." },
      { tip: "Step 2 — The MAR places that address on the address bus toward memory." },
      { tip: "Step 3 — Memory decodes the address and locates the requested data." },
      { tip: "Step 4 — The data travels back over the data bus into the MDR." },
      { tip: "Step 5 — Data moves from the MDR over the CPU internal bus into a CPU register." }
    ];
    const HOT = [
      ["reg", "bus", "mar"],
      ["mar", "abus", "mem"],
      ["mem"],
      ["dbus", "mdr", "mem"],
      ["mdr", "bus", "reg"]
    ];

    let step = 0, timer = null;

    const svg = `
<svg viewBox="0 0 780 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Fetch cycle diagram" style="background:var(--bg2);border:1px solid var(--border);border-radius:8px">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/>
    </marker>
  </defs>
  <g id="reg">
    <!-- CPU register: x=80..230, y=26..78 -->
    <rect x="80" y="26" width="150" height="52" rx="8" fill="var(--panel)" stroke="var(--border)" stroke-width="1.5"/>
    <text x="155" y="51" text-anchor="middle" font-family="var(--mono)" font-size="14" fill="var(--fg)">CPU register</text>
    <text x="155" y="68" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--dim)">holds operand/address</text>
  </g>
  <g id="bus">
    <!-- internal bus runs under the register, y=100 -->
    <line x1="20" y1="100" x2="760" y2="100" stroke="var(--border)" stroke-width="2"/>
    <text x="300" y="92" font-family="var(--mono)" font-size="11" fill="var(--dim)">CPU internal bus</text>
  </g>
  <!-- MAR/MDR hooks drop from the bus down the LEFT margin (x=32), left of both boxes,
       so they never cross the address/data lanes on the right -->
  <g id="stub">
    <path d="M32,100 L32,155 L40,155" fill="none" stroke="var(--border)" stroke-width="2"/>
    <path d="M32,100 L32,256 L40,256" fill="none" stroke="var(--border)" stroke-width="2"/>
  </g>
  <g id="mar">
    <!-- MAR rect: x=40..230, y=130..182; right-edge midpoint (230,156)
         ellipse at y=156 spans x=508.6..731.4, so the lane ends at (509,156) on its edge -->
    <rect x="40" y="130" width="190" height="52" rx="8" fill="var(--panel)" stroke="var(--border)" stroke-width="1.5"/>
    <text x="135" y="151" text-anchor="middle" font-family="var(--mono)" font-size="14" fill="var(--fg)">MAR</text>
    <text x="135" y="168" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--dim)">memory address register</text>
  </g>
  <g id="mdr">
    <!-- MDR rect: x=40..230, y=230..282; right-edge midpoint (230,256)
         ellipse at y=256 spans x=510.3..729.7, so the lane starts at (510,256) -->
    <rect x="40" y="230" width="190" height="52" rx="8" fill="var(--panel)" stroke="var(--border)" stroke-width="1.5"/>
    <text x="135" y="251" text-anchor="middle" font-family="var(--mono)" font-size="14" fill="var(--fg)">MDR</text>
    <text x="135" y="268" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--dim)">memory data register</text>
  </g>
  <g id="abus">
    <!-- address lane: from MAR right edge (230,156) to memory-ellipse edge (509,156).
         y=156 sits between MAR (y=130..182) and MDR (y=230..282) and right of both boxes,
         so it crosses no box and shares no y with the data lane. -->
    <path d="M230,156 L509,156" fill="none" stroke="var(--border)" stroke-width="2.5" marker-end="url(#arr)"/>
    <text x="412" y="146" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--dim)">address bus</text>
  </g>
  <g id="dbus">
    <!-- data lane: back from memory-ellipse edge (510,256) into MDR right edge (230,256).
         y=256 sits below MAR (y=130..182) and right of both boxes, so it crosses no box
         and does not overlap the address lane (y=156). -->
    <path d="M510,256 L230,256" fill="none" stroke="var(--border)" stroke-width="2.5" marker-end="url(#arr)"/>
    <text x="412" y="282" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--dim)">data bus</text>
  </g>
  <g id="mem">
    <!-- memory ellipse: center (620,205), rx=130, ry=95 → bounds x=490..750, y=110..300 -->
    <ellipse cx="620" cy="205" rx="130" ry="95" fill="var(--panel)" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="6 4"/>
    <text x="620" y="195" text-anchor="middle" font-family="var(--mono)" font-size="15" fill="var(--fg)">memory</text>
    <text x="620" y="216" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--dim)">N words × n bits</text>
    <text x="620" y="234" text-anchor="middle" font-family="var(--mono)" font-size="10" fill="var(--dim)">(addresses 0..N−1)</text>
  </g>
</svg>`;

    function apply() {
      el.querySelectorAll(".fetch-diagram g, .fetch-diagram path, .fetch-diagram rect, .fetch-diagram ellipse, .fetch-diagram line").forEach(function (n) {
        n.classList.remove("hot");
      });
      HOT[step].forEach(function (id) {
        const g = el.querySelector("#" + id);
        if (g) g.classList.add("hot");
      });
      el.querySelector(".fetch-step-line").textContent = STEPS[step].tip;
      el.querySelector(".fetch-step-count").textContent = (step + 1) + " / 5";
      el.querySelector("#fetchPrev").disabled = step === 0;
      el.querySelector("#fetchNext").disabled = step === 4;
    }

    el.innerHTML =
      '<div class="fetch-diagram">' + svg + "</div>" +
      '<div class="controls">' +
      '<button class="btn btn-sm" id="fetchPrev">&#9664; Back</button>' +
      '<button class="btn btn-sm btn-primary" id="fetchNext">Next &#9654;</button>' +
      '<button class="btn btn-sm" id="fetchAuto">Auto-play</button>' +
      '<span class="fetch-step-count dim mono" style="margin-left:auto"></span>' +
      "</div>" +
      '<div class="fetch-step-line"></div>';

    el.querySelector("#fetchNext").addEventListener("click", function () {
      if (step < 4) { step++; apply(); SFX.key(); } else { SFX.confirm(); }
    });
    el.querySelector("#fetchPrev").addEventListener("click", function () {
      if (step > 0) { step--; apply(); SFX.key(); }
    });
    el.querySelector("#fetchAuto").addEventListener("click", function () {
      if (timer) { clearInterval(timer); timer = null; el.querySelector("#fetchAuto").textContent = "Auto-play"; return; }
      el.querySelector("#fetchAuto").textContent = "Stop";
      timer = setInterval(function () {
        if (step >= 4) { step = 0; } else { step++; }
        apply();
        SFX.key();
      }, 1600);
    });
    apply();

    return function () {
      if (timer) { clearInterval(timer); timer = null; }
    };
  }
};

/* ============================================================
   4) DRAM vs SRAM lab
   ============================================================ */
Sims.dramSramLab = {
  title: "DRAM vs SRAM lab",
  desc: "Watch DRAM leak charge (and need refresh), while SRAM holds steady. Try reading — DRAM's read is destructive.",
  mount: function (el) {
    let dram = 100, sram = 100;
    let dramRestoring = false;
    let timer = null;

    function render() {
      const dramFull = dram > 40;
      const sramFull = sram > 40;
      el.querySelector("#dramCell").className = "cell" + (dramRestoring ? " drain" : dramFull ? " full" : " empty");
      el.querySelector("#sramCell").className = "cell" + (sramFull ? " full" : " empty");
      el.querySelector("#dramCharge").style.width = Math.max(0, Math.round(dram)) + "%";
      el.querySelector("#sramCharge").style.width = Math.round(sram) + "%";
      el.querySelector("#dramVal").textContent = dramRestoring ? "RESTORING" : dramFull ? "1 (charge held)" : "0 (drained)";
      el.querySelector("#sramVal").textContent = sramFull ? "1 (held)" : "0";
      el.querySelector("#dramRefresh").disabled = dramRestoring;
    }

    el.innerHTML =
      '<div class="lab-pair">' +
      '<div class="lab-col">' +
      "<h4>DRAM — dynamic, leaks, destructive read</h4>" +
      '<div class="cell full" id="dramCell"><span class="charge" id="dramChargeIco">&#9889;</span><span class="clabel">DRAM cell</span></div>' +
      '<div class="charge-bar"><div class="bar" id="dramCharge" style="width:100%"></div></div>' +
      '<div class="sim-out" id="dramVal">1 (charge held)</div>' +
      '<div class="controls">' +
      '<button class="btn btn-sm" id="dramRefresh">Refresh</button>' +
      '<button class="btn btn-sm" id="dramRead">Read (destructive)</button>' +
      "</div></div>" +
      '<div class="lab-col">' +
      "<h4>SRAM — static, holds, non-destructive read</h4>" +
      '<div class="cell full" id="sramCell"><span class="charge">&#9889;</span><span class="clabel">SRAM cell</span></div>' +
      '<div class="charge-bar"><div class="bar" id="sramCharge" style="width:100%"></div></div>' +
      '<div class="sim-out" id="sramVal">1 (held)</div>' +
      '<div class="controls">' +
      '<button class="btn btn-sm" id="sramRead">Read (non-destructive)</button>' +
      '<span class="dim" style="font-size:var(--fs-xs)">no refresh needed</span>' +
      "</div></div></div>";

    timer = setInterval(function () {
      dram = Math.max(0, dram - 2.2);
      render();
    }, 220);

    el.querySelector("#dramRefresh").addEventListener("click", function () {
      dram = 100; render(); SFX.confirm();
    });
    el.querySelector("#dramRead").addEventListener("click", function () {
      if (dramRestoring) return;
      // destructive read
      const had = dram > 40;
      dram = 0; dramRestoring = true; render();
      SFX.wrong();
      // restore cycle
      setTimeout(function () {
        dram = had ? 100 : 0;
        dramRestoring = false;
        render();
        SFX.confirm();
      }, 700);
    });
    el.querySelector("#sramRead").addEventListener("click", function () {
      SFX.correct();
      // flash the value
      el.querySelector("#sramVal").textContent = "READ OK — value intact (1)";
      setTimeout(function () { render(); }, 600);
    });
    render();

    return function () { if (timer) clearInterval(timer); };
  }
};

/* ============================================================
   5) Volatility demo
   ============================================================ */
Sims.volatilityDemo = {
  title: "Volatility demo",
  desc: "Power off the system. Volatile memory wipes; nonvolatile storage survives.",
  mount: function (el) {
    let powered = true;
    const CELLS = [
      { id: "n", name: "RAM", vol: true },
      { id: "m", name: "Cache", vol: true },
      { id: "o", name: "BIOS / EEPROM", vol: false },
      { id: "p", name: "Disk", vol: false },
      { id: "q", name: "Flash drive", vol: false }
    ];

    function render() {
      el.querySelector("#volGrid").innerHTML = CELLS.map(function (c) {
        const wiped = !powered && c.vol;
        return '<div class="vol-cell' + (wiped ? " wiped" : "") + '">' +
          '<span class="v-label">' + c.name + "</span>" +
          '<span class="dim">' + (c.vol ? (wiped ? "WIPED" : "data") : "kept") + "</span>" +
          "</div>";
      }).join("");
      el.querySelector("#volStat").textContent = "Power " + (powered ? "ON" : "OFF") +
        " — volatile cells: " + (powered ? "held" : "wiped") + "; nonvolatile: always kept.";
    }

    el.innerHTML =
      '<div class="controls">' +
      '<button class="btn btn-sm" id="volOff">Power OFF</button>' +
      '<button class="btn btn-sm" id="volOn">Power ON</button>' +
      "</div>" +
      '<div id="volGrid" class="vol-grid"></div>' +
      '<div class="sim-out" id="volStat"></div>';

    el.querySelector("#volOff").addEventListener("click", function () { powered = false; render(); SFX.wrong(); });
    el.querySelector("#volOn").addEventListener("click", function () { powered = true; render(); SFX.correct(); });
    render();
  }
};

/* ============================================================
   6) Classifier sorter
   ============================================================ */
Sims.classifierSorter = {
  title: "Classifier sorter",
  desc: "Tap a device, then tap a bin on each axis to classify it. Correct placements flash green.",
  mount: function (el) {
    const DEVICES = [
      { name: "DVD-R", vol: false, rem: true },
      { name: "hard disk", vol: false, rem: false },
      { name: "flash drive", vol: false, rem: true },
      { name: "RAM", vol: true, rem: false },
      { name: "optical disk", vol: false, rem: true },
      { name: "USB drive", vol: false, rem: true },
      { name: "hot-swappable disk", vol: false, rem: true }
    ];
    const state = {}; // name -> {vol:null|bool, rem:null|bool}
    DEVICES.forEach(function (d) { state[d.name] = { vol: null, rem: null }; });

    let selName = null;
    let placed = 0, errors = 0;

    function bothDone(name) {
      return state[name].vol !== null && state[name].rem !== null;
    }

    function render() {
      el.querySelector("#tray").innerHTML = DEVICES.map(function (d) {
        const done = bothDone(d.name);
        return '<button class="sorter-chip' + (done ? " placed" : "") + (selName === d.name ? " selected" : "") + '" data-d="' + esc(d.name) + '">' + esc(d.name) + "</button>";
      }).join("");

      el.querySelector("#axes").innerHTML =
        axisHTML("Volatility", "vol", [
          { key: true, label: "volatile", ok: function (d) { return d.vol === true; } },
          { key: false, label: "nonvolatile", ok: function (d) { return d.vol === false; } }
        ]) +
        axisHTML("Removability", "rem", [
          { key: true, label: "removable", ok: function (d) { return d.rem === true; } },
          { key: false, label: "permanent", ok: function (d) { return d.rem === false; } }
        ]);

      el.querySelector("#sorterScore").textContent = "Placed: " + placed + " / " + DEVICES.length + " · errors: " + errors;

      // bind tray
      el.querySelectorAll(".sorter-chip").forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.classList.contains("placed")) { selName = null; render(); return; }
          selName = b.getAttribute("data-d");
          render();
          SFX.key();
        });
      });
      // bind bins
      el.querySelectorAll(".sorter-bin").forEach(function (bin) {
        bin.addEventListener("click", function () {
          if (!selName) return;
          const axis = bin.getAttribute("data-axis");   // 'vol' | 'rem'
          const key = bin.getAttribute("data-key") === "true";
          const dev = DEVICES.find(function (d) { return d.name === selName; });
          if (!dev) return;
          if (state[selName][axis] !== null) { selName = null; render(); return; }
          if ((axis === "vol" && dev.vol === key) || (axis === "rem" && dev.rem === key)) {
            state[selName][axis] = key;
            if (bothDone(selName)) { placed++; SFX.correct(); } else { SFX.confirm(); }
          } else {
            errors++;
            SFX.wrong();
          }
          selName = null;
          render();
        });
      });
    }

    function axisHTML(title, axisKey, bins) {
      let s = '<div class="sorter-axis"><div class="sa-title">' + title + "</div>";
      bins.forEach(function (bin) {
        const placedDevs = DEVICES.filter(function (d) { return state[d.name][axisKey] === bin.key; });
        s += '<div class="sorter-bin' + (placedDevs.length ? " ok" : "") + '" data-axis="' + axisKey + '" data-key="' + bin.key + '">' +
          '<div>' + bin.label + "</div>" +
          '<div class="bin-items">' + placedDevs.map(function (d) { return '<span class="mini">' + esc(d.name) + "</span>"; }).join("") + "</div></div>";
      });
      s += "</div>";
      return s;
    }

    el.innerHTML =
      '<div class="sorter-wrap">' +
      '<div><div class="sim-tabs"><span style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--dim)">device tray — tap one, then tap its bin</span></div>' +
      '<div id="tray" class="sorter-tray"></div>' +
      '<div class="sim-out" id="sorterScore"></div></div>' +
      '<div id="axes" class="sorter-grid"></div>' +
      "</div>" +
      '<div class="card panel2" style="margin-top:12px;font-size:var(--fs-sm)">' +
      "<strong>All four axes:</strong> <span class=\"mono\">static</span> (SRAM holds bits; DRAM leaks/dynamic), <span class=\"mono\">volatile/nonvolatile</span>, <span class=\"mono\">destructive read</span> (DRAM read drains the cell; SRAM non-destructive), <span class=\"mono\">removable/permanent</span>. The two playable axes here are volatility and removability. <span class=\"extra-tag\" data-kind=\"extra\">extra</span>" +
      "</div>";

    render();
  }
};

/* ============================================================
   7) ROM eraser
   ============================================================ */
Sims.romEraser = {
  title: "ROM eraser",
  desc: "Choose a ROM type and try to erase it — UV for EPROM, voltage for EEPROM, impossible for PROM.",
  mount: function (el) {
    let kind = "eprom"; // prom | eprom | eeprom
    let prog = 0, timer = null;

    function chipSVG(kind) {
      const uv = kind === "eprom";
      const elec = kind === "eeprom";
      let s = '<div class="rom-chip' + (uv ? " uv" : "") + (elec ? " elect" : "") + '">' +
        '<div class="rc-body">' +
        (kind === "prom" ? "PROM<br><span style='font-size:10px'>one-time programmable</span>" :
          kind === "eprom" ? "EPROM<br><span style='font-size:10px'>erase: UV light</span>" :
          "EEPROM<br><span style='font-size:10px'>erase: electrical</span>") +
        "</div>" +
        '<div class="rc-pins">' + Array(9).fill("<span></span>").join("") + "</div></div>";
      return s;
    }

    function render() {
      el.querySelector("#romButtons").innerHTML =
        ["prom", "eprom", "eeprom"].map(function (k) {
          return '<button class="btn btn-sm' + (k === kind ? " btn-primary" : "") + '" data-k="' + k + '">' +
            k.toUpperCase() + "</button>";
        }).join("");

      el.querySelector("#romStage").innerHTML =
        '<div class="rom-stage">' +
        (kind === "eprom" ? '<div class="uv-lamp" title="UV lamp">&#9889;<div style="font-size:9px">UV</div></div>' : kind === "eeprom" ? '<div class="uv-lamp" style="color:var(--accent)" title="Electrode">+<div style="font-size:9px">V</div></div>' : "") +
        chipSVG(kind) +
        "</div>";

      el.querySelector("#romLog").innerHTML =
        '<div class="sim-out">' +
        (kind === "prom"
          ? "PROM: no erase mechanism exists — contents are fabbed once and fixed forever."
          : kind === "eprom"
            ? "EPROM: remove chip, expose to UV through its quartz window for 20–40 minutes. <span class='extra-tag' data-kind='extra'>extra</span>"
            : "EEPROM: apply a high voltage in-circuit to erase and rewrite electrically.") +
        (prog > 0 && prog < 100 ? "<div class='progress' style='margin-top:6px'><div class='bar' style='width:" + prog + "%'></div></div>" : "") +
        (prog >= 100 ? "<div class='good'>Erase complete — contents cleared.</div>" : "") +
        "</div>";

      el.querySelectorAll("#romButtons button").forEach(function (b) {
        b.addEventListener("click", function () {
          kind = b.getAttribute("data-k");
          prog = 0;
          if (timer) { clearInterval(timer); timer = null; }
          render();
          SFX.key();
        });
      });

      const btn = el.querySelector("#romAction");
      if (btn) {
        btn.onclick = function () {
          if (kind === "prom") { SFX.wrong(); el.querySelector("#romLog .sim-out").innerHTML = "<div class='bad'>Cannot erase — one-time programmable. Contents fixed.</div>"; return; }
          if (timer) { clearInterval(timer); timer = null; }
          prog = 0;
          timer = setInterval(function () {
            prog += 3 + Math.random() * 4;
            if (prog >= 100) { prog = 100; clearInterval(timer); timer = null; SFX.levelup(); }
            render();
          }, 100);
        };
      }
    }

    el.innerHTML =
      '<div id="romButtons" class="controls"></div>' +
      '<div id="romStage"></div>' +
      '<div class="controls"><button class="btn btn-sm btn-primary" id="romAction">Try to erase</button></div>' +
      '<div id="romLog"></div>';

    render();
  }
};

/* ============================================================
   8) Packaging gallery
   ============================================================ */
Sims.packagingGallery = {
  title: "Packaging gallery",
  desc: "Click a package to see specs, then check whether a module will fit a particular slot.",
  mount: function (el) {
    let sel = "dip";

    const PKG = {
      dip: {
        name: "DIP", spec: "Dual Inline Package — pins down both sides, soldered or socketed directly on the system board (early DRAM).",
        svg: function () { return '<svg viewBox="0 0 160 120"><rect x="20" y="20" width="120" height="60" rx="6" fill="var(--panel2)" stroke="var(--border)"/>' + Array(14).fill(0).map(function (_, i) { const x = 30 + i * 8; return '<line x1="' + x + '" y1="20" x2="' + x + '" y2="8" stroke="var(--dim)"/><line x1="' + x + '" y1="80" x2="' + x + '" y2="92" stroke="var(--dim)"/>'; }).join("") + '<text x="80" y="58" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--fg)">DIP</text></svg>'; }
      },
      simm: {
        name: "SIMM", spec: "Single Inline Memory Module — 72-pin, 32-bit wide, one row of ~8 chips on a narrow board.",
        svg: function () { return '<svg viewBox="0 0 200 120"><rect x="10" y="30" width="180" height="46" fill="var(--panel2)" stroke="var(--border)"/>' + Array(8).fill(0).map(function (_, i) { const x = 22 + i * 22; return '<rect x="' + x + '" y="36" width="16" height="16" fill="var(--panel)" stroke="var(--accent)"/>'; }).join("") + '<rect x="10" y="76" width="180" height="8" fill="var(--warn)"/><text x="100" y="112" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--fg)">SIMM · 72-pin</text></svg>'; }
      },
      dimm: {
        name: "DIMM", spec: "Dual Inline Memory Module — contacts on both edges, notched gold edge; standard desktop RAM.",
        svg: function () { return '<svg viewBox="0 0 220 120"><rect x="10" y="20" width="200" height="56" fill="var(--panel2)" stroke="var(--border)"/>' + Array(10).fill(0).map(function (_, i) { const x = 18 + i * 20; return '<rect x="' + x + '" y="26" width="14" height="14" fill="var(--panel)" stroke="var(--accent)"/><rect x="' + x + '" y="52" width="14" height="14" fill="var(--panel)" stroke="var(--accent)"/>'; }).join("") + '<rect x="10" y="76" width="200" height="8" fill="var(--warn)"/><rect x="80" y="20" width="20" height="6" fill="var(--bg)"/><text x="110" y="112" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--fg)">DIMM</text></svg>'; }
      },
      sodimm: {
        name: "SO-DIMM", spec: "Small Outline DIMM — compact version used in laptops and small systems.",
        svg: function () { return '<svg viewBox="0 0 220 110"><rect x="20" y="24" width="180" height="44" fill="var(--panel2)" stroke="var(--border)"/>' + Array(9).fill(0).map(function (_, i) { const x = 30 + i * 19; return '<rect x="' + x + '" y="30" width="13" height="13" fill="var(--panel)" stroke="var(--accent)"/><rect x="' + x + '" y="50" width="13" height="12" fill="var(--panel)" stroke="var(--accent)"/>'; }).join("") + '<rect x="20" y="68" width="180" height="6" fill="var(--warn)"/><text x="110" y="98" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--fg)">SO-DIMM</text></svg>'; }
      },
      bank: {
        name: "Memory bank", spec: "Four modules standing in parallel sockets — a bank is populated together.",
        svg: function () { return '<svg viewBox="0 0 220 120">' + Array(4).fill(0).map(function (_, i) { const x = 20 + i * 48; return '<g><rect x="' + x + '" y="26" width="38" height="66" fill="var(--panel2)" stroke="var(--border)"/><rect x="' + (x + 4) + '" y="32" width="10" height="10" fill="var(--accent)"/><rect x="' + (x + 18) + '" y="32" width="10" height="10" fill="var(--accent)"/><rect x="' + (x + 4) + '" y="46" width="10" height="10" fill="var(--accent)"/><rect x="' + (x + 18) + '" y="46" width="10" height="10" fill="var(--accent)"/></g>'; }).join("") + '<text x="110" y="112" text-anchor="middle" font-family="var(--mono)" font-size="11" fill="var(--fg)">4-slot bank</text></svg>'; }
      }
    };

    const FIT = {
      "DDR3 DIMM": { "DDR3 board": true, "DDR4 board": false, "laptop SO-DIMM slot": false, "72-pin SIMM slot": false },
      "DDR4 DIMM": { "DDR3 board": false, "DDR4 board": true, "laptop SO-DIMM slot": false, "72-pin SIMM slot": false },
      "SO-DIMM": { "DDR3 board": false, "DDR4 board": false, "laptop SO-DIMM slot": true, "72-pin SIMM slot": false },
      "72-pin SIMM": { "DDR3 board": false, "DDR4 board": false, "laptop SO-DIMM slot": false, "72-pin SIMM slot": true }
    };

    function render() {
      el.querySelector("#pkgGallery").innerHTML = Object.keys(PKG).map(function (k) {
        return '<div class="pkg-item' + (k === sel ? " active" : "") + '" data-p="' + k + '">' +
          PKG[k].svg() + '<span class="pkg-name">' + PKG[k].name + "</span></div>";
      }).join("");
      el.querySelector("#pkgSpec").innerHTML = '<div class="card panel2"><strong>' + PKG[sel].name + "</strong> — " + PKG[sel].spec + "</div>";

      el.querySelectorAll("#pkgGallery .pkg-item").forEach(function (b) {
        b.addEventListener("click", function () { sel = b.getAttribute("data-p"); render(); SFX.key(); });
      });
    }

    el.innerHTML =
      '<div id="pkgGallery" class="pkg-gallery"></div>' +
      '<div id="pkgSpec"></div>' +
      '<div class="card" style="margin-top:12px">' +
      '<h4 style="font-family:var(--mono);font-size:var(--fs-sm);color:var(--accent);margin-bottom:8px">Will it fit?</h4>' +
      '<div class="fit-checker">' +
      '<label class="dim">Module <select id="fitMod" class="theme-select">' +
      '<option>DDR3 DIMM</option><option>DDR4 DIMM</option><option>SO-DIMM</option><option>72-pin SIMM</option>' +
      "</select></label>" +
      '<label class="dim">Slot <select id="fitSlot" class="theme-select">' +
      '<option>DDR3 board</option><option>DDR4 board</option><option>laptop SO-DIMM slot</option><option>72-pin SIMM slot</option>' +
      "</select></label>" +
      '<button class="btn btn-sm btn-primary" id="fitCheck">Check</button>' +
      "</div>" +
      '<div class="sim-out" id="fitResult"></div>' +
      "</div>";

    render();
    el.querySelector("#fitCheck").addEventListener("click", function () {
      const m = el.querySelector("#fitMod").value;
      const s = el.querySelector("#fitSlot").value;
      const ok = FIT[m][s];
      el.querySelector("#fitResult").innerHTML = "\ <div class='" + (ok ? "good" : "bad") + "'>" + m + " in " + s + ": <strong>" + (ok ? "FITS" : "does NOT fit") + "</strong></div>";
      if (ok) SFX.correct(); else SFX.wrong();
    });
  }
};

/* ============================================================
   9) Virtual memory pager
   ============================================================ */
Sims.virtualPager = {
  title: "Virtual memory pager",
  desc: "Request virtual pages. Resident pages hit; missing pages fault and swap in from the disk cache (FIFO replacement).",
  mount: function (el) {
    const NPAGE = 8, NFRAME = 4;
    let frames = [];        // array of page numbers resident (0..NPAGE-1) or null
    let fifo = [];         // queue of frame indices (oldest first)
    let hits = 0, faults = 0;
    let log = [];

    function render() {
      el.querySelector("#vmFrames").innerHTML = frames.map(function (p, i) {
        return '<div class="vm-cell' + (p !== null ? " loaded" : "") + '"><span class="vc-tag">frame ' + i + "</span>" +
          (p !== null ? "page " + p : "—") + "</div>";
      }).join("");
      el.querySelector("#vmVirtual").innerHTML = Array(NPAGE).fill(0).map(function (_, p) {
        const resident = frames.indexOf(p) !== -1;
        return '<div class="vm-cell' + (resident ? " hit" : "") + '"><span class="vc-tag">vpage ' + p + "</span>" +
          (resident ? "resident" : "on disk") + "</div>";
      }).join("");
      el.querySelector("#vmStats").innerHTML =
        '<span>hits <strong class="good">' + hits + "</strong></span>" +
        '<span>faults <strong class="bad">' + faults + "</strong></span>" +
        '<span>FIFO queue: [' + (fifo.map(function (f) { return "F" + f; }).join(",") || "—") + "]</span>";
      el.querySelector("#vmLog").innerHTML = log.slice(-4).map(function (l) {
        return "<div style='font-family:var(--mono);font-size:var(--fs-xs);color:var(--dim)'>" + l + "</div>";
      }).join("");
    }

    function request(p) {
      const idx = frames.indexOf(p);
      if (idx !== -1) {
        hits++;
        log.push("access page " + p + " → HIT (resident in frame " + idx + ")");
        SFX.correct();
      } else {
        faults++;
        // find a free frame, else FIFO evict
        let slot = frames.indexOf(null);
        if (slot === -1) {
          slot = fifo.shift();
          log.push("page " + p + " faulted → evict frame " + slot + " (page " + frames[slot] + ") to disk cache");
          frames[slot] = p;
          fifo.push(slot);
        } else {
          frames[slot] = p;
          fifo.push(slot);
          log.push("page " + p + " faulted → load into free frame " + slot);
        }
        SFX.wrong();
      }
      render();
    }

    el.innerHTML =
      '<div class="vm-wrap">' +
      '<div class="vm-box"><h4>physical memory — 4 frames</h4><div id="vmFrames" class="vm-frames"></div></div>' +
      '<div class="vm-box"><h4>virtual address space — 8 pages</h4><div id="vmVirtual" class="vm-virtual"></div></div>' +
      "</div>" +
      '<div class="controls">' + Array(NPAGE).fill(0).map(function (_, p) {
        return '<button class="btn btn-sm" data-p="' + p + '">page ' + p + "</button>";
      }).join("") + "</div>" +
      '<div class="sim-out" id="vmStats"></div>' +
      '<div class="card panel2" style="margin-top:10px;font-size:var(--fs-sm)"><strong>FIFO replacement</strong> evicts the oldest loaded page. (LRU is an alternative policy — <span class="extra-tag" data-kind="extra">extra</span>)</div>' +
      '<div id="vmLog" style="margin-top:8px"></div>';

    el.querySelectorAll(".controls [data-p]").forEach(function (b) {
      b.addEventListener("click", function () {
        request(parseInt(b.getAttribute("data-p"), 10));
      });
    });
    render();
  }
};
