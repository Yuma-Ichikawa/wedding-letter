/* ============================================================
   effects.js - Visual effects engine (v2)
   紙吹雪 / 桜 / 花火 / emoji / ハート / 虹
   ============================================================ */

const Effects = (() => {
  let canvas, ctx;
  let particles = [];
  let running = false;

  function init() {
    canvas = document.querySelector(".effects-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
  }

  function resize() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(dpr, dpr);
  }

  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.isDead()) particles.splice(i, 1);
    }

    ctx.restore();

    if (particles.length > 0) {
      requestAnimationFrame(loop);
    } else {
      running = false;
    }
  }

  function startLoop() {
    if (running) return;
    running = true;
    loop();
  }

  /* ------ Confetti (紙吹雪) ------ */

  class ConfettiPiece {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 10;
      this.vy = -(Math.random() * 8 + 4);
      this.gravity = 0.18;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 15;
      this.w = Math.random() * 10 + 4;
      this.h = Math.random() * 6 + 2;
      this.life = 1;
      this.decay = 0.006 + Math.random() * 0.004;
      const colors = [
        "#e74c3c", "#f39c12", "#2ecc71", "#3498db",
        "#9b59b6", "#e91e63", "#ff6b6b", "#ffd93d",
        "#6bcb77", "#fd79a8", "#a29bfe",
      ];
      this.color = colors[(Math.random() * colors.length) | 0];
    }
    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      this.life -= this.decay;
      this.vx *= 0.99;
    }
    draw(c) {
      c.save();
      c.translate(this.x, this.y);
      c.rotate((this.rotation * Math.PI) / 180);
      c.globalAlpha = Math.max(0, this.life);
      c.fillStyle = this.color;
      c.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      c.restore();
    }
    isDead() {
      return this.life <= 0 || this.y > window.innerHeight + 30;
    }
  }

  function confetti(ox, oy, count = 60) {
    const x = ox ?? window.innerWidth / 2;
    const y = oy ?? window.innerHeight / 2;
    for (let i = 0; i < count; i++) particles.push(new ConfettiPiece(x, y));
    startLoop();
  }

  /* ------ Sakura (桜) ------ */

  class SakuraPetal {
    constructor() {
      this.x = Math.random() * window.innerWidth;
      this.y = -20 - Math.random() * window.innerHeight * 0.5;
      this.size = Math.random() * 12 + 6;
      this.vy = Math.random() * 1.5 + 0.5;
      this.vx = Math.random() * 0.8 - 0.4;
      this.swing = Math.random() * Math.PI * 2;
      this.swingSpd = Math.random() * 0.03 + 0.01;
      this.swingAmp = Math.random() * 2 + 1;
      this.rot = Math.random() * 360;
      this.rotSpd = (Math.random() - 0.5) * 2;
      this.life = 1;
      this.decay = 0.0015 + Math.random() * 0.001;
      this.h = Math.random() * 20 + 340;
      this.s = Math.random() * 20 + 70;
      this.l = Math.random() * 15 + 78;
    }
    update() {
      this.swing += this.swingSpd;
      this.x += this.vx + Math.sin(this.swing) * this.swingAmp;
      this.y += this.vy;
      this.rot += this.rotSpd;
      this.life -= this.decay;
    }
    draw(c) {
      c.save();
      c.translate(this.x, this.y);
      c.rotate((this.rot * Math.PI) / 180);
      c.globalAlpha = Math.max(0, this.life) * 0.85;
      c.fillStyle = `hsl(${this.h},${this.s}%,${this.l}%)`;
      c.beginPath();
      c.ellipse(0, 0, this.size / 2, this.size / 3.5, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    isDead() {
      return this.life <= 0 || this.y > window.innerHeight + 30;
    }
  }

  function sakura(count = 40) {
    for (let i = 0; i < count; i++) particles.push(new SakuraPetal());
    startLoop();
  }

  /* ------ Firework (花火) ------ */

  class Spark {
    constructor(cx, cy, color) {
      this.x = cx;
      this.y = cy;
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 6 + 2;
      this.vx = Math.cos(a) * s;
      this.vy = Math.sin(a) * s;
      this.gravity = 0.06;
      this.life = 1;
      this.decay = 0.01 + Math.random() * 0.01;
      this.r = Math.random() * 3 + 1;
      this.color = color;
      this.trail = [];
    }
    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 6) this.trail.shift();
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.97;
      this.life -= this.decay;
    }
    draw(c) {
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        c.globalAlpha = (i / this.trail.length) * Math.max(0, this.life) * 0.4;
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(t.x, t.y, this.r * 0.4, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = Math.max(0, this.life);
      c.fillStyle = this.color;
      c.beginPath();
      c.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      c.fill();
    }
    isDead() { return this.life <= 0; }
  }

  function fireworks(count = 3) {
    const palettes = [
      ["#ff6b6b", "#ffd93d", "#fff"],
      ["#a29bfe", "#fd79a8", "#fff"],
      ["#55efc4", "#81ecec", "#fff"],
      ["#fdcb6e", "#e17055", "#fff"],
      ["#ff9ff3", "#f368e0", "#fff"],
    ];
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const cx = Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2;
        const cy = Math.random() * window.innerHeight * 0.35 + window.innerHeight * 0.1;
        const pal = palettes[(Math.random() * palettes.length) | 0];
        for (let j = 0; j < 60; j++) {
          particles.push(new Spark(cx, cy, pal[(Math.random() * pal.length) | 0]));
        }
        startLoop();
      }, i * 350);
    }
  }

  /* ------ Emoji burst ------ */

  class EmojiP {
    constructor(x, y, emoji) {
      this.x = x; this.y = y; this.emoji = emoji;
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 5 + 2;
      this.vx = Math.cos(a) * s;
      this.vy = Math.sin(a) * s - 4;
      this.gravity = 0.14;
      this.life = 1;
      this.decay = 0.012 + Math.random() * 0.006;
      this.size = Math.random() * 18 + 14;
      this.rot = Math.random() * 30 - 15;
      this.rotSpd = (Math.random() - 0.5) * 5;
    }
    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rot += this.rotSpd;
      this.life -= this.decay;
    }
    draw(c) {
      c.save();
      c.translate(this.x, this.y);
      c.rotate((this.rot * Math.PI) / 180);
      c.globalAlpha = Math.max(0, this.life);
      c.font = `${this.size}px serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(this.emoji, 0, 0);
      c.restore();
    }
    isDead() { return this.life <= 0; }
  }

  function emojiBurst(x, y, emojis, count = 12) {
    const arr = Array.isArray(emojis) ? emojis : [...emojis];
    const cx = x ?? window.innerWidth / 2;
    const cy = y ?? window.innerHeight / 2;
    for (let i = 0; i < count; i++) {
      particles.push(new EmojiP(cx, cy, arr[(Math.random() * arr.length) | 0]));
    }
    startLoop();
  }

  /* ------ Heart float (ハート上昇) ------ */

  class HeartP {
    constructor(x, y) {
      this.x = x + (Math.random() - 0.5) * 60;
      this.y = y;
      this.vy = -(Math.random() * 1.5 + 0.8);
      this.vx = (Math.random() - 0.5) * 0.5;
      this.swing = Math.random() * Math.PI * 2;
      this.life = 1;
      this.decay = 0.005 + Math.random() * 0.003;
      this.size = Math.random() * 14 + 10;
      this.h = Math.random() * 20 + 340;
    }
    update() {
      this.swing += 0.03;
      this.x += this.vx + Math.sin(this.swing) * 0.5;
      this.y += this.vy;
      this.life -= this.decay;
    }
    draw(c) {
      c.save();
      c.globalAlpha = Math.max(0, this.life) * 0.7;
      c.font = `${this.size}px serif`;
      c.textAlign = "center";
      c.fillText("❤", this.x, this.y);
      c.restore();
    }
    isDead() { return this.life <= 0; }
  }

  function hearts(x, y, count = 8) {
    const cx = x ?? window.innerWidth / 2;
    const cy = y ?? window.innerHeight / 2;
    for (let i = 0; i < count; i++) particles.push(new HeartP(cx, cy));
    startLoop();
  }

  /* ------ Star shower (星シャワー) ------ */

  class StarP {
    constructor() {
      this.x = Math.random() * window.innerWidth;
      this.y = -10;
      this.vy = Math.random() * 3 + 1;
      this.vx = (Math.random() - 0.5) * 2;
      this.life = 1;
      this.decay = 0.005 + Math.random() * 0.003;
      this.size = Math.random() * 14 + 8;
      this.rot = Math.random() * 360;
      this.rotSpd = (Math.random() - 0.5) * 6;
      const stars = ["⭐", "✨", "💫", "🌟"];
      this.char = stars[(Math.random() * stars.length) | 0];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.rot += this.rotSpd;
      this.life -= this.decay;
    }
    draw(c) {
      c.save();
      c.translate(this.x, this.y);
      c.rotate((this.rot * Math.PI) / 180);
      c.globalAlpha = Math.max(0, this.life);
      c.font = `${this.size}px serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(this.char, 0, 0);
      c.restore();
    }
    isDead() { return this.life <= 0 || this.y > window.innerHeight + 20; }
  }

  function starShower(count = 30) {
    for (let i = 0; i < count; i++) {
      const p = new StarP();
      p.y = -Math.random() * window.innerHeight * 0.4;
      particles.push(p);
    }
    startLoop();
  }

  return { init, confetti, sakura, fireworks, emojiBurst, hearts, starShower };
})();
