# MEMORY.EXE

A polished, offline study console for the *IT51 Computer Architecture: Memory* module.
Two phases: **LEARN** (6 lessons + 9 embedded simulators) and **SOLVE** (36 CTF-style challenges).

## Open it

Double-click **`index.html`** — that's it. No server, no build, no network, no CDN.
Everything (content, sounds, visuals) is local. Works on `file://`.

## Project layout

```
memory-exe/
  index.html        # single page shell (boot screen, nav, modals)
  css/style.css     # themes, layout, components, CRT, print
  js/data.js        # ★ ALL content: lessons, challenges, glossary, achievements, ranks
  js/app.js         # routing, state/persistence, views, quiz engine, palette
  js/sims.js        # the 9 interactive simulators (inline SVG)
  js/audio.js       # WebAudio sound effects
  tools/            # dev-only validation (not shipped/required)
    smoke.js        # data-integrity checks        → node tools/smoke.js
    render-sweep.js # renders every view under a stub DOM → node tools/render-sweep.js
```

## Add a new challenge (3 lines)

1. In **`js/data.js`** → `challenges` array, append an object:
   `{ id:"H6", module:"hier", title:"…", points:100, difficulty:"easy", briefing:"…", artifact:"…", question:"…", aliases:["answer"], hints:["…","…"], writeup:"…", lesson:"hierarchy" }`
2. Give `aliases` the accepted answers (case/space/comma-insensitive). For a boss, add `boss:true` and a `parts:[{q,aliases},{q,aliases},{q,aliases}]` instead of `aliases`.
3. Reload the page — the board picks it up automatically. (IDs must be unique.)

Same pattern for lessons (`lessons`), glossary (`glossary`), achievements (`achievements`).

## Notes on "extra" content

Everything outside the PDF text + SLIDE DATA is tagged with a small **extra** badge in the UI:
- `N = 2^k` address-bit clarification (slide reuses `n`)
- FIFO vs LRU discussion in the virtual-memory pager
- Security-flavored touches (volatile-evidence note, rewritable firmware, EEPROM reflashing)
- 4-axes classifier simplification: static/dynamic and destructive-read axes are shown as reference; the two playable axes are volatility and removability
- Speed-ratio challenge uses register ≈ 0.25 ns (midpoint of slide-4 range)

## Keyboard

`Ctrl+K` command palette · `Enter` submit · `Esc` close · `?` shortcuts · `h` learn · `c` challenges
