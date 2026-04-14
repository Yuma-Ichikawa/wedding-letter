/* ============================================================
   effects.js - Visual effects engine
   紙吹雪 / 桜パーティクル / 花火 / emoji burst
   ============================================================ */

const Effects = (() => {
  let canvas, ctx;
  let particles = [];
  let animationId = null;
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function loop() {
    if (!running) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.isDead()) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      animationId = requestAnimationFrame(loop);
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
      this.vx = (Math.random() - 0.5) * 8;
      this.vy = -(Math.random() * 6 + 4);
      this.gravity = 0.15;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 12;
      this.width = Math.random() * 8 + 4;
      this.height = Math.random() * 4 + 2;
      this.life = 1;
      this.decay = 0.008 + Math.random() * 0.005;
      const colors = [
        "#e74c3c", "#f39c12", "#2ecc71",
        "#3498db", "#9b59b6", "#e91e63",
        "#ff6b6b", "#ffd93d", "#6bcb77",
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      this.life -= this.decay;
      this.vx *= 0.99;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
      ctx.restore();
    }

    isDead() {
      return this.life <= 0 || this.y > canvas.height + 20;
    }
  }

  function confetti(originX, originY, count = 60) {
    const x = originX ?? canvas.width / 2;
    const y = originY ?? canvas.height / 2;
    for (let i = 0; i < count; i++) {
      particles.push(new ConfettiPiece(x, y));
    }
    startLoop();
  }

  /* ------ Sakura petals (桜の花びら) ------ */

  class SakuraPetal {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = -20;
      this.size = Math.random() * 10 + 6;
      this.vy = Math.random() * 1.5 + 0.5;
      this.vx = Math.random() * 1 - 0.5;
      this.swing = Math.random() * Math.PI * 2;
      this.swingSpeed = Math.random() * 0.03 + 0.01;
      this.swingAmp = Math.random() * 2 + 1;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 2;
      this.life = 1;
      this.decay = 0.002 + Math.random() * 0.001;
      this.pink = Math.floor(Math.random() * 40 + 180);
    }

    update() {
      this.swing += this.swingSpeed;
      this.x += this.vx + Math.sin(this.swing) * this.swingAmp;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      this.life -= this.decay;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, this.life) * 0.8;
      ctx.fillStyle = `rgb(${this.pink}, 150, 170)`;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size / 2, this.size / 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    isDead() {
      return this.life <= 0 || this.y > canvas.height + 20;
    }
  }

  function sakura(count = 40) {
    for (let i = 0; i < count; i++) {
      const petal = new SakuraPetal();
      petal.y = -Math.random() * canvas.height * 0.5;
      particles.push(petal);
    }
    startLoop();
  }

  /* ------ Firework (花火) ------ */

  class FireworkSpark {
    constructor(cx, cy, color) {
      this.x = cx;
      this.y = cy;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
      this.gravity = 0.05;
      this.life = 1;
      this.decay = 0.012 + Math.random() * 0.008;
      this.size = Math.random() * 3 + 1;
      this.color = color;
      this.trail = [];
    }

    update() {
      this.trail.push({ x: this.x, y: this.y, life: this.life });
      if (this.trail.length > 5) this.trail.shift();
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.vx *= 0.98;
      this.life -= this.decay;
    }

    draw(ctx) {
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i];
        ctx.globalAlpha = (i / this.trail.length) * Math.max(0, this.life) * 0.5;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    isDead() {
      return this.life <= 0;
    }
  }

  function fireworks(count = 3) {
    const colors = [
      ["#ff6b6b", "#ffd93d", "#ffffff"],
      ["#a29bfe", "#fd79a8", "#ffffff"],
      ["#55efc4", "#81ecec", "#ffffff"],
      ["#fdcb6e", "#e17055", "#ffffff"],
    ];

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const cx = Math.random() * canvas.width * 0.6 + canvas.width * 0.2;
        const cy = Math.random() * canvas.height * 0.4 + canvas.height * 0.1;
        const palette = colors[Math.floor(Math.random() * colors.length)];
        for (let j = 0; j < 50; j++) {
          const color = palette[Math.floor(Math.random() * palette.length)];
          particles.push(new FireworkSpark(cx, cy, color));
        }
        startLoop();
      }, i * 400);
    }
  }

  /* ------ Emoji burst (emoji 爆発) ------ */

  class EmojiParticle {
    constructor(x, y, emoji) {
      this.x = x;
      this.y = y;
      this.emoji = emoji;
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 2;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed - 3;
      this.gravity = 0.12;
      this.life = 1;
      this.decay = 0.01 + Math.random() * 0.005;
      this.size = Math.random() * 16 + 16;
      this.rotation = Math.random() * 30 - 15;
      this.rotSpeed = (Math.random() - 0.5) * 4;
    }

    update() {
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.rotSpeed;
      this.life -= this.decay;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.font = `${this.size}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
    }

    isDead() {
      return this.life <= 0;
    }
  }

  function emojiBurst(x, y, emojis, count = 12) {
    const emojiArr = Array.isArray(emojis) ? emojis : [...emojis];
    const cx = x ?? canvas.width / 2;
    const cy = y ?? canvas.height / 2;
    for (let i = 0; i < count; i++) {
      const emoji = emojiArr[Math.floor(Math.random() * emojiArr.length)];
      particles.push(new EmojiParticle(cx, cy, emoji));
    }
    startLoop();
  }

  return { init, confetti, sakura, fireworks, emojiBurst };
})();
