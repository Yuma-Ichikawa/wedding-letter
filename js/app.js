(() => {
  const SECRET_DELAY_MS = 6000;

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
    } catch {
      return null;
    }
  }

  function esc(s) {
    if (!s) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function render(d) {
    const app = document.getElementById("app");
    app.innerHTML =
      `<div class="letter">` +
        `<h1 class="letter-to">${esc(d.n)}${esc(d.h || "さん")}へ</h1>` +
        `<div class="letter-body">${esc(d.l)}</div>` +
        `<div class="letter-from">${esc(d.from || "")}</div>` +
      `</div>` +
      (d.secret
        ? `<div class="divider">` +
            `<span class="divider-line"></span>` +
            `<span class="divider-dot"></span>` +
            `<span class="divider-line"></span>` +
          `</div>` +
          `<div class="secret-box" id="secretBox">` +
            `<div class="secret-label">secret message</div>` +
            `<div class="secret-text">${esc(d.secret)}</div>` +
          `</div>`
        : "");

    if (d.secret) {
      setTimeout(() => {
        const box = document.getElementById("secretBox");
        if (box) box.classList.add("visible");
      }, SECRET_DELAY_MS);
    }
  }

  function showError() {
    document.getElementById("app").innerHTML =
      `<div class="error">` +
        `<p class="error-text">このリンクは無効です。<br>QRコードをもう一度スキャンしてください。</p>` +
      `</div>`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const data = decode();
    if (data && data.n) render(data);
    else showError();
  });
})();
