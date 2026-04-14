(() => {
  const FORTUNES = [
    { img: "assets/images/1.jpg", rank: "大吉", caption: "スマホの背景画像にしてね！" },
    { img: "assets/images/2.jpg", rank: "吉",   caption: "MAX145キロ（仮）" },
    { img: "assets/images/3.jpg", rank: "中吉", caption: "体が大きいだけで戦えた" },
  ];

  const SECRET_VISIBLE_MS = 5000;

  /* ---- decode ---- */

  function decode() {
    let h = location.hash.slice(1);
    if (!h) return null;
    try { h = decodeURIComponent(h); } catch {}
    try {
      let s = h.replace(/-/g, "+").replace(/_/g, "/");
      while (s.length % 4) s += "=";
      const bin = atob(s);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch { return null; }
  }

  function esc(s) {
    if (!s) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  /* ---- particles ---- */

  function spawnConfetti(container) {
    const colors = ["#c9a87c", "#e8d5b7", "#f0c674", "#e88b72", "#8cc5b2", "#f5a0b8", "#d4a0d4"];
    const count = 50;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      const x = (Math.random() * 260 - 130).toFixed(0);
      const y = (Math.random() * 200 + 120).toFixed(0);
      const r = (Math.random() * 1080 - 540).toFixed(0);
      const delay = (Math.random() * 0.3).toFixed(2);
      const dur = (Math.random() * 0.6 + 0.8).toFixed(2);
      el.style.cssText =
        `--x:${x}px;--y:${y}px;--r:${r}deg;` +
        `animation-delay:${delay}s;animation-duration:${dur}s;` +
        `left:${(50 + Math.random() * 30 - 15).toFixed(0)}%;` +
        `background:${colors[Math.floor(Math.random() * colors.length)]};`;
      if (Math.random() > 0.5) {
        el.style.borderRadius = "50%";
        const s = (Math.random() * 6 + 4).toFixed(1);
        el.style.width = el.style.height = s + "px";
      } else {
        el.style.width = (Math.random() * 10 + 5) + "px";
        el.style.height = (Math.random() * 5 + 3) + "px";
      }
      container.appendChild(el);
    }
  }

  function spawnSparkles(container) {
    for (let i = 0; i < 8; i++) {
      const el = document.createElement("div");
      el.className = "sparkle";
      el.textContent = "✦";
      el.style.cssText =
        `left:${(Math.random() * 80 + 10).toFixed(0)}%;` +
        `top:${(Math.random() * 60 + 20).toFixed(0)}%;` +
        `animation-delay:${(Math.random() * 0.6).toFixed(2)}s;` +
        `font-size:${(Math.random() * 10 + 10).toFixed(0)}px;`;
      container.appendChild(el);
    }
  }

  /* ---- smooth scroll ---- */

  function smoothScrollTo(el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ---- render ---- */

  function render(d) {
    const fortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    const tilt = (Math.random() * 6 - 3).toFixed(1);

    document.getElementById("app").innerHTML = [
      `<div class="letter">`,
        `<h1 class="letter-to">${esc(d.n)}${esc(d.h || "さん")}へ</h1>`,
        `<div class="letter-body">${esc(d.l)}</div>`,
        `<div class="letter-from">${esc(d.from || "")}</div>`,
      `</div>`,

      `<div class="divider" id="divider">`,
        `<span class="divider-line"></span>`,
        `<span class="divider-dot"></span>`,
        `<span class="divider-line"></span>`,
      `</div>`,

      `<div class="surprise-box" id="surpriseBox">`,

        `<div class="omikuji-box" id="omikujiBox">`,
          `<div class="omikuji-label">おみくじ</div>`,
          `<div class="omikuji-cylinder" id="omikujiCylinder">`,
            `<div class="cylinder-body"></div>`,
            `<div class="omikuji-stick" id="omikujiStick">`,
              `<div class="stick-shaft"></div>`,
              `<div class="stick-tip"></div>`,
            `</div>`,
          `</div>`,
        `</div>`,

        `<div class="rank-reveal" id="rankReveal">`,
          `<div class="rank-text" id="rankText">${esc(fortune.rank)}</div>`,
        `</div>`,

        `<div class="confetti-layer" id="confettiLayer"></div>`,

        `<div class="photo-area" id="photoArea">`,
          `<div class="photo-frame" id="photoFrame" style="--tilt:${tilt}deg">`,
            `<img src="${fortune.img}" alt="" loading="eager">`,
          `</div>`,
          `<div class="photo-caption" id="caption">${esc(fortune.caption)}</div>`,
        `</div>`,

        d.secret
          ? `<div class="secret-box" id="secretBox">` +
              `<div class="secret-label">secret message</div>` +
              `<div class="secret-content" id="secretContent">` +
                `<div class="secret-text">${esc(d.secret)}</div>` +
              `</div>` +
              `<div class="secret-burned" id="secretBurned">` +
                `<span class="burned-icon">🔥</span>` +
                `<span class="burned-text">危険すぎるので消えました</span>` +
                `<span class="burned-sub">（QRを読み直すとまた見えます）</span>` +
              `</div>` +
            `</div>`
          : "",
      `</div>`,

      `<div class="footer-space"></div>`,
    ].join("");

    new Image().src = fortune.img;
    runSequence();
  }

  /* ---- animation sequence ---- */

  function runSequence() {
    const $ = (id) => document.getElementById(id);

    const divider    = $("divider");
    const box        = $("surpriseBox");
    const cylinder   = $("omikujiCylinder");
    const omikujiBox = $("omikujiBox");
    const stick      = $("omikujiStick");
    const rankReveal = $("rankReveal");
    const rankText   = $("rankText");
    const confLayer  = $("confettiLayer");
    const photoArea  = $("photoArea");
    const frame      = $("photoFrame");
    const caption    = $("caption");
    const secretBox  = $("secretBox");
    const secretContent = $("secretContent");
    const secretBurned  = $("secretBurned");

    let t = 3000;

    // 1 — divider + box slide in
    at(t, () => {
      divider.classList.add("visible");
      box.classList.add("visible");
      setTimeout(() => smoothScrollTo(box), 300);
    });

    // 2 — cylinder shakes
    t += 1200;
    at(t, () => {
      cylinder.classList.add("shaking");
    });

    // 3 — stick rises out
    t += 900;
    at(t, () => {
      cylinder.classList.remove("shaking");
      stick.classList.add("rising");
    });

    // 4 — stick flies away, box collapses
    t += 700;
    at(t, () => {
      stick.classList.add("out");
      setTimeout(() => omikujiBox.classList.add("done"), 300);
    });

    // 5 — rank stamps in + sparkles
    t += 500;
    at(t, () => {
      rankReveal.classList.add("visible");
      rankText.classList.add("stamp");
      spawnSparkles(confLayer);
      confLayer.classList.add("visible");
    });

    // 6 — confetti burst
    t += 400;
    at(t, () => {
      spawnConfetti(confLayer);
    });

    // 7 — photo slides up
    t += 800;
    at(t, () => {
      photoArea.classList.add("visible");
      frame.classList.add("pop");
    });

    // 8 — caption
    t += 700;
    at(t, () => {
      if (caption) caption.classList.add("visible");
    });

    // 9 — secret message appears
    t += 1200;
    at(t, () => {
      if (!secretBox) return;
      secretBox.classList.add("visible");
      smoothScrollTo(secretBox);

      // 10 — secret auto-destructs
      setTimeout(() => {
        secretContent.classList.add("burning");
        setTimeout(() => {
          secretContent.classList.add("gone");
          secretBurned.classList.add("visible");
        }, 800);
      }, SECRET_VISIBLE_MS);
    });
  }

  function at(ms, fn) { setTimeout(fn, ms); }

  /* ---- error ---- */

  function showError() {
    document.getElementById("app").innerHTML =
      `<div class="error">` +
        `<p class="error-text">このリンクは無効です。<br>QRコードをもう一度スキャンしてください。</p>` +
      `</div>`;
  }

  /* ---- init ---- */

  document.addEventListener("DOMContentLoaded", () => {
    const data = decode();
    if (data && data.n) render(data);
    else showError();
  });
})();
