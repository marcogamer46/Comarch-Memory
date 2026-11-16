/* ============================================================
   MEMORY.EXE — audio.js
   Tiny WebAudio synth for UI feedback. No external assets.
   All sounds are generated from oscillators/noise buffers.
   ============================================================ */

const SFX = (function () {
  let ctx = null;
  let master = null;
  let enabled = true;
  let noiseBuf = null;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      // prebuild a short noise buffer for the "wrong" buzz
      const len = Math.floor(ctx.sampleRate * 0.25);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) {
      return false;
    }
  }

  function resume() {
    if (ctx && ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!enabled) return;
    if (!ensure()) return;
    resume();
    try {
      const t0 = ctx.currentTime + (when || 0);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || "square";
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + dur + 0.02);
    } catch (e) {}
  }

  function noise(dur, vol) {
    if (!enabled) return;
    if (!ensure()) return;
    resume();
    try {
      const t0 = ctx.currentTime;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 900;
      g.gain.setValueAtTime(vol || 0.15, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t0); src.stop(t0 + dur + 0.02);
    } catch (e) {}
  }

  return {
    setEnabled(v) { enabled = !!v; },
    isEnabled() { return enabled; },
    unlock() { ensure(); resume(); },
    key()   { tone(620, 0.04, "square", 0.05); },
    correct(){ tone(523, 0.09, "triangle", 0.16); tone(784, 0.12, "triangle", 0.16, 0.07); },
    wrong() { tone(180, 0.18, "sawtooth", 0.12, 0, 90); noise(0.15, 0.08); },
    levelup(){ [440, 554, 659, 880].forEach((f, i) => tone(f, 0.14, "triangle", 0.16, i * 0.08)); },
    confirm(){ tone(880, 0.06, "sine", 0.08); },
    flip(){ tone(300, 0.05, "sine", 0.06, 0, 500); }
  };
})();
