export const SoundEngine = {
  ctx: null,
  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  play(type) {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "correct") {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === "wrong") {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(250, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "click") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "boost") {
        // Power-up rising sweep sound
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.25);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        // Sparkle overlay
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = "triangle";
        o2.frequency.setValueAtTime(1047, ctx.currentTime + 0.1);
        o2.frequency.setValueAtTime(1319, ctx.currentTime + 0.25);
        g2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
        g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        o2.start(ctx.currentTime + 0.1);
        o2.stop(ctx.currentTime + 0.5);
      } else if (type === "celebrate") {
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.15);
          g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
          o.start(ctx.currentTime + i * 0.15);
          o.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
      } else if (type === "coin") {
        // Quick coin pickup ding
        osc.type = "sine";
        osc.frequency.setValueAtTime(988, ctx.currentTime);
        osc.frequency.setValueAtTime(1319, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === "star") {
        // Magical star collect (rising sparkle)
        osc.type = "triangle";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = "sine";
        o2.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
        g2.gain.setValueAtTime(0.15, ctx.currentTime + 0.1);
        g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        o2.start(ctx.currentTime + 0.1);
        o2.stop(ctx.currentTime + 0.35);
      } else if (type === "hit") {
        // Getting hurt sound
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.setValueAtTime(100, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === "unlock") {
        // Door unlock fanfare
        [440, 554, 659, 880].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = "sine";
          o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.12);
          g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.25);
          o.start(ctx.currentTime + i * 0.12);
          o.stop(ctx.currentTime + i * 0.12 + 0.25);
        });
      }
    } catch (e) {}
  }
};
