(() => {
  const PHOTOS = ["assets/images/1.jpg", "assets/images/2.jpg", "assets/images/3.jpg"];
  const CAPTIONS = [
    "この顔よ。",
    "完全に本気。",
    "プロ志望だったらしい。",
    "フォームだけは一流。",
    "甲子園は遠かった。",
    "眼光が鋭すぎる。",
  ];

  const DELAY_BOX    = 3000;
  const DELAY_SHAKE  = 1200;
  const DELAY_PHOTO  = 800;
  const DELAY_CAP    = 600;
  const DELAY_SECRET = 1400;

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

  /* ---- render ---- */

  function render(d) {
    const photo = PHOTOS[Math.floor(Math.random() * PHOTOS.length)];
    const caption = CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
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
        `<div class="mystery" id="mystery">？</div>`,
        `<div class="photo-frame" id="photoFrame" style="--tilt:${tilt}deg">`,
          `<img src="${photo}" alt="" loading="eager">`,
        `</div>`,
        `<div class="photo-caption" id="caption">${esc(caption)}</div>`,
        d.secret
          ? `<div class="secret-box" id="secretBox">` +
              `<div class="secret-label">secret message</div>` +
              `<div class="secret-text">${esc(d.secret)}</div>` +
            `</div>`
          : "",
      `</div>`,

      `<div class="footer-space"></div>`,
    ].join("");

    runSequence();
  }

  /* ---- animation sequence ---- */

  function runSequence() {
    const divider    = document.getElementById("divider");
    const box        = document.getElementById("surpriseBox");
    const mystery    = document.getElementById("mystery");
    const frame      = document.getElementById("photoFrame");
    const caption    = document.getElementById("caption");
    const secretBox  = document.getElementById("secretBox");

    // Step 1: show divider + box
    setTimeout(() => {
      divider.classList.add("visible");
      box.classList.add("visible");
    }, DELAY_BOX);

    // Step 2: box shakes, "?" bounces
    setTimeout(() => {
      box.style.animation = "shake 0.6s ease";
      box.addEventListener("animationend", () => {
        box.style.animation = "";
      }, { once: true });
    }, DELAY_BOX + DELAY_SHAKE);

    // Step 3: "?" disappears, photo pops in
    setTimeout(() => {
      mystery.style.display = "none";
      frame.classList.add("pop");
    }, DELAY_BOX + DELAY_SHAKE + DELAY_PHOTO);

    // Step 4: caption fades in
    setTimeout(() => {
      if (caption) caption.classList.add("visible");
    }, DELAY_BOX + DELAY_SHAKE + DELAY_PHOTO + DELAY_CAP);

    // Step 5: secret message
    setTimeout(() => {
      if (secretBox) secretBox.classList.add("visible");
    }, DELAY_BOX + DELAY_SHAKE + DELAY_PHOTO + DELAY_CAP + DELAY_SECRET);
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
