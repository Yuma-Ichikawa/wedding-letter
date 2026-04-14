(() => {
  "use strict";

  const FORTUNES = [
    { img: "assets/images/1.jpg", rank: "大吉", caption: "スマホの背景画像にしてね！" },
    { img: "assets/images/2.jpg", rank: "吉",   caption: "MAX145キロ（仮）" },
    { img: "assets/images/3.jpg", rank: "中吉", caption: "体が大きいだけで戦えた" },
  ];

  const SECRET_VISIBLE_MS = 5000;

  /* ---- base64 decode ---- */

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

  /* ---- CSS-only confetti (no emoji) ---- */

  function burstConfetti(container) {
    const palette = ["#c9a87c", "#e8d5b7", "#f0c674", "#e88b72",
                     "#8cc5b2", "#f5a0b8", "#d4a0d4", "#a0c4e8"];
    const N = 55;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < N; i++) {
      const el = document.createElement("span");
      el.className = "confetti";

      const angle = (Math.PI * 2 * i) / N + (Math.random() - 0.5) * 0.6;
      const dist  = 80 + Math.random() * 140;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 40;
      const rot = (Math.random() * 1080 - 540);
      const dur = 0.7 + Math.random() * 0.5;
      const delay = Math.random() * 0.15;
      const w = 4 + Math.random() * 7;
      const h = 3 + Math.random() * 5;

      el.style.cssText =
        `width:${w}px;height:${h}px;` +
        `background:${palette[i % palette.length]};` +
        `--dx:${dx.toFixed(0)}px;--dy:${dy.toFixed(0)}px;--rot:${rot.toFixed(0)}deg;` +
        `animation-duration:${dur.toFixed(2)}s;animation-delay:${delay.toFixed(2)}s;`;

      if (Math.random() > 0.6) el.style.borderRadius = "50%";

      frag.appendChild(el);
    }
    container.appendChild(frag);
  }

  /* ---- CSS-only sparkle rings (no emoji) ---- */

  function burstRings(container) {
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement("span");
      ring.className = "burst-ring";
      ring.style.animationDelay = (i * 0.12) + "s";
      container.appendChild(ring);
    }
  }

  /* ---- smooth scroll ---- */

  function scrollIntoViewSmooth(el) {
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
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

      `<div class="surprise-card" id="surpriseCard">`,

        /* omikuji card face */
        `<div class="omikuji-card" id="omikujiCard">`,
          `<div class="omikuji-front" id="omikujiFront">`,
            `<div class="omikuji-top-label">おみくじ</div>`,
            `<div class="omikuji-question">?</div>`,
            `<div class="omikuji-sub">tap to reveal</div>`,
          `</div>`,
          `<div class="omikuji-result" id="omikujiResult">`,
            `<div class="result-rank" id="resultRank">${esc(fortune.rank)}</div>`,
          `</div>`,
        `</div>`,

        `<div class="effects-layer" id="effectsLayer"></div>`,

        /* photo + caption */
        `<div class="reveal-area" id="revealArea">`,
          `<div class="photo-frame" id="photoFrame" style="--tilt:${tilt}deg">`,
            `<img src="${fortune.img}" alt="" loading="eager">`,
          `</div>`,
          `<p class="photo-caption" id="caption">${esc(fortune.caption)}</p>`,
        `</div>`,

        /* secret message */
        d.secret
          ? `<div class="secret-section" id="secretSection">` +
              `<div class="secret-divider"></div>` +
              `<div class="secret-label">secret message</div>` +
              `<div class="secret-content" id="secretContent">` +
                `<p class="secret-text">${esc(d.secret)}</p>` +
              `</div>` +
              `<div class="secret-redacted" id="secretRedacted">` +
                `<div class="redacted-bar"></div>` +
                `<p class="redacted-text">この内容は機密につき消去されました</p>` +
                `<p class="redacted-sub">QRを読み直すとまた見えます</p>` +
              `</div>` +
            `</div>`
          : "",
      `</div>`,

      `<div class="footer-space"></div>`,
    ].join("");

    new Image().src = fortune.img;
    runSequence();
  }

  /* ---- animation orchestrator ---- */

  function runSequence() {
    const $ = (id) => document.getElementById(id);

    const divider       = $("divider");
    const card          = $("surpriseCard");
    const omikujiCard   = $("omikujiCard");
    const front         = $("omikujiFront");
    const result        = $("omikujiResult");
    const rank          = $("resultRank");
    const fx            = $("effectsLayer");
    const revealArea    = $("revealArea");
    const frame         = $("photoFrame");
    const caption       = $("caption");
    const secretSection = $("secretSection");
    const secretContent = $("secretContent");
    const secretRedacted = $("secretRedacted");

    const seq = [];
    let t = 0;

    function after(ms, fn) { t += ms; seq.push({ t, fn }); }

    // 1 - show divider + card
    after(3000, () => {
      divider.classList.add("show");
      card.classList.add("show");
      scrollIntoViewSmooth(card);
    });

    // 2 - card shakes (like shaking an omikuji box)
    after(1400, () => {
      omikujiCard.classList.add("shaking");
    });

    // 3 - card stops shaking, flip to reveal
    after(1200, () => {
      omikujiCard.classList.remove("shaking");
      omikujiCard.classList.add("flipped");
    });

    // 4 - rank stamps in + burst effects
    after(500, () => {
      rank.classList.add("stamp");
      burstRings(fx);
      fx.classList.add("show");
    });

    // 5 - confetti
    after(300, () => {
      burstConfetti(fx);
    });

    // 6 - omikuji collapses, photo area appears
    after(1200, () => {
      omikujiCard.classList.add("collapse");
      setTimeout(() => {
        revealArea.classList.add("show");
        frame.classList.add("pop");
        scrollIntoViewSmooth(revealArea);
      }, 400);
    });

    // 7 - caption
    after(1100, () => {
      if (caption) caption.classList.add("show");
    });

    // 8 - secret
    after(1000, () => {
      if (!secretSection) return;
      secretSection.classList.add("show");
      scrollIntoViewSmooth(secretSection);

      // auto-destruct after delay
      setTimeout(() => {
        secretContent.classList.add("dissolving");
        setTimeout(() => {
          secretContent.classList.add("gone");
          secretRedacted.classList.add("show");
        }, 700);
      }, SECRET_VISIBLE_MS);
    });

    // run all
    seq.forEach(({ t: ms, fn }) => setTimeout(fn, ms));
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
