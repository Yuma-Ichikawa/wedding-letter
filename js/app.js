(() => {
  const FORTUNES = [
    { img: "assets/images/1.jpg", rank: "大吉", caption: "スマホの背景画像にしてね！" },
    { img: "assets/images/2.jpg", rank: "吉",   caption: "MAX145キロ（仮）" },
    { img: "assets/images/3.jpg", rank: "中吉", caption: "体が大きいだけで戦えた" },
  ];

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

  /* ---- confetti ---- */

  function spawnConfetti(container) {
    const colors = ["#c9a87c", "#e8d5b7", "#f0c674", "#e88b72", "#8cc5b2", "#f5a0b8"];
    const count = 40;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.setProperty("--x", (Math.random() * 200 - 100).toFixed(0) + "px");
      el.style.setProperty("--r", (Math.random() * 720 - 360).toFixed(0) + "deg");
      el.style.setProperty("--d", (Math.random() * 0.5 + 0.6).toFixed(2) + "s");
      el.style.left = (50 + (Math.random() * 30 - 15)).toFixed(0) + "%";
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      if (Math.random() > 0.5) {
        el.style.borderRadius = "50%";
        el.style.width = el.style.height = (Math.random() * 6 + 4) + "px";
      } else {
        el.style.width = (Math.random() * 8 + 4) + "px";
        el.style.height = (Math.random() * 4 + 3) + "px";
      }
      container.appendChild(el);
    }
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
          `<div class="omikuji-stick" id="omikujiStick">`,
            `<div class="stick-body"></div>`,
            `<div class="stick-tip"></div>`,
          `</div>`,
        `</div>`,

        `<div class="rank-reveal" id="rankReveal">`,
          `<div class="rank-text" id="rankText">${esc(fortune.rank)}</div>`,
        `</div>`,

        `<div class="confetti-layer" id="confettiLayer"></div>`,

        `<div class="photo-frame" id="photoFrame" style="--tilt:${tilt}deg">`,
          `<img src="${fortune.img}" alt="" loading="eager">`,
        `</div>`,
        `<div class="photo-caption" id="caption">${esc(fortune.caption)}</div>`,

        d.secret
          ? `<div class="secret-box" id="secretBox">` +
              `<div class="secret-label">secret message</div>` +
              `<div class="secret-text">${esc(d.secret)}</div>` +
            `</div>`
          : "",
      `</div>`,

      `<div class="footer-space"></div>`,
    ].join("");

    runSequence(fortune);
  }

  /* ---- animation sequence ---- */

  function runSequence(fortune) {
    const T = {
      boxAppear:  3000,
      stickPull:  1400,
      stickOut:   800,
      rankFlash:  400,
      confetti:   200,
      photo:      1200,
      caption:    600,
      secret:     1400,
    };

    const divider     = document.getElementById("divider");
    const box         = document.getElementById("surpriseBox");
    const omikujiBox  = document.getElementById("omikujiBox");
    const stick       = document.getElementById("omikujiStick");
    const rankReveal  = document.getElementById("rankReveal");
    const rankText    = document.getElementById("rankText");
    const confLayer   = document.getElementById("confettiLayer");
    const frame       = document.getElementById("photoFrame");
    const caption     = document.getElementById("caption");
    const secretBox   = document.getElementById("secretBox");

    let t = T.boxAppear;

    setTimeout(() => {
      divider.classList.add("visible");
      box.classList.add("visible");
    }, t);

    t += T.stickPull;
    setTimeout(() => {
      box.style.animation = "shake 0.5s ease";
      box.addEventListener("animationend", () => { box.style.animation = ""; }, { once: true });
      stick.classList.add("pulling");
    }, t);

    t += T.stickOut;
    setTimeout(() => {
      stick.classList.add("out");
      omikujiBox.classList.add("done");
    }, t);

    t += T.rankFlash;
    setTimeout(() => {
      rankReveal.classList.add("visible");
      rankText.classList.add("stamp");
      if (fortune.rank === "大吉") rankText.classList.add("daikichi");
    }, t);

    t += T.confetti;
    setTimeout(() => {
      spawnConfetti(confLayer);
      confLayer.classList.add("visible");
    }, t);

    t += T.photo;
    setTimeout(() => {
      frame.classList.add("pop");
    }, t);

    t += T.caption;
    setTimeout(() => {
      if (caption) caption.classList.add("visible");
    }, t);

    t += T.secret;
    setTimeout(() => {
      if (secretBox) secretBox.classList.add("visible");
    }, t);
  }

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
