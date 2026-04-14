/* ============================================================
   app.js - Main application
   ハッシュデコード / テンプレート描画 / インタラクション管理
   ============================================================ */

const App = (() => {
  let guestData = null;
  let discoveredCount = 0;
  let totalSecrets = 0;
  let allFoundShown = false;

  /* ---------- Hash decode ---------- */

  function decodeHash() {
    const hash = location.hash.slice(1);
    if (!hash) return null;
    try {
      const json = decodeURIComponent(escape(atob(hash)));
      return JSON.parse(json);
    } catch {
      try {
        return JSON.parse(decodeURIComponent(hash));
      } catch {
        return null;
      }
    }
  }

  /* ---------- Render ---------- */

  function showError() {
    document.getElementById("app").innerHTML = `
      <div class="error-screen">
        <div class="error-emoji">💌</div>
        <p class="error-text">
          このリンクは無効です。<br>
          QRコードをもう一度スキャンしてください。
        </p>
      </div>`;
  }

  function renderLetter(data) {
    guestData = data;

    const secretCount =
      (data.s ? data.s.length : 0) +
      (data.sw ? 1 : 0) +
      (data.lps ? 1 : 0) +
      (data.ss ? 1 : 0);
    totalSecrets = secretCount;

    const letterHtml = buildLetterWithSecretWord(data.l, data.sw);

    const hiddenButtonsHtml = (data.s || [])
      .map(
        (secret, i) => `
        <button class="hidden-btn" data-idx="${i}" aria-label="隠しメッセージ ${i + 1}">
          <span class="btn-emoji">${secret.e || "🎁"}</span>
          <span class="btn-label">${escHtml(secret.title || "ここを押してね")}</span>
        </button>
        <div class="hidden-reveal" id="reveal-${i}">
          <div class="hidden-card">
            <div class="card-emoji">${secret.e || "🎁"}</div>
            ${secret.title ? `<div class="card-title">${escHtml(secret.title)}</div>` : ""}
            <div class="card-text">${escHtml(secret.t)}</div>
          </div>
        </div>`
      )
      .join("");

    const today = formatDate(new Date());

    document.getElementById("app").innerHTML = `
      <!-- Envelope -->
      <div class="envelope-screen" id="envelopeScreen">
        <div class="envelope" id="envelope">
          <div class="envelope-body"></div>
          <div class="envelope-flap"></div>
          <div class="wax-seal"></div>
        </div>
        <p class="envelope-hint">タップして開封</p>
      </div>

      <!-- Letter -->
      <div class="letter-container" id="letterContainer">
        <div class="letter-header">
          <h1>💌 ${escHtml(data.n)}${escHtml(data.h || "さん")}へ</h1>
          <div class="letter-date">${today}</div>
        </div>

        <div class="letter-body">
          <div class="letter-text">${letterHtml}</div>
          <div class="letter-signature" id="signature">
            ${escHtml(data.from || "")}
          </div>
        </div>

        <div class="hidden-section">
          ${hiddenButtonsHtml}
        </div>

        <!-- Scroll secret (見えない位置に配置) -->
        <div style="height: 80px"></div>
        <div class="scroll-secret" id="scrollSecret">
          <div class="scroll-secret-divider"></div>
          <div class="scroll-secret-text">${escHtml(data.ss || "")}</div>
        </div>
      </div>

      <!-- Long-press tooltip -->
      <div class="long-press-overlay" id="lpOverlay"></div>
      <div class="long-press-tooltip" id="lpTooltip"></div>

      <!-- All-found banner -->
      <div class="all-found-overlay" id="afOverlay"></div>
      <div class="all-found-banner" id="afBanner">
        <div class="banner-emoji">🎉🎊🥳</div>
        <div class="banner-text">${escHtml(data.af || "全部見つけてくれてありがとう！")}</div>
        <button class="banner-close" id="afClose">とじる</button>
      </div>

      <!-- Discovery counter -->
      <div class="discovery-counter" id="counter">
        🔍 <span class="counter-fill" id="counterText">0</span> / ${totalSecrets}
      </div>

      <!-- Shake hint -->
      <div class="shake-hint" id="shakeHint">📱 スマホを振ってみて！</div>

      <!-- Effects canvas -->
      <canvas class="effects-canvas"></canvas>`;

    Effects.init();
    bindEnvelope();
    bindHiddenButtons();
    bindLongPress();
    bindShake();
    bindScrollSecret();
    bindAllFoundClose();

    setTimeout(showShakeHint, 8000);
  }

  function buildLetterWithSecretWord(text, sw) {
    if (!sw || !sw.w) return escHtml(text);
    const escaped = escHtml(text);
    const word = escHtml(sw.w);
    return escaped.replace(
      word,
      `<span class="secret-word" id="secretWord">${word}<span class="secret-word-bubble" id="swBubble">${escHtml(sw.m)}</span></span>`
    );
  }

  function escHtml(s) {
    if (!s) return "";
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(d) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}年${m}月${day}日`;
  }

  /* ---------- Envelope interaction ---------- */

  function bindEnvelope() {
    const screen = document.getElementById("envelopeScreen");
    const envelope = document.getElementById("envelope");
    if (!screen || !envelope) return;

    envelope.addEventListener("click", () => {
      envelope.classList.add("opening");
      setTimeout(() => {
        screen.classList.add("opened");
        const container = document.getElementById("letterContainer");
        if (container) container.classList.add("visible");
        Effects.sakura(30);
      }, 800);
    });
  }

  /* ---------- Hidden buttons ---------- */

  function bindHiddenButtons() {
    document.querySelectorAll(".hidden-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = btn.dataset.idx;
        const reveal = document.getElementById(`reveal-${idx}`);
        if (!reveal) return;

        const wasHidden = !reveal.classList.contains("show");
        reveal.classList.toggle("show");
        btn.classList.toggle("discovered");

        if (wasHidden) {
          discover();
          const rect = btn.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top;
          Effects.confetti(cx, cy, 30);
          Effects.emojiBurst(cx, cy, "🎉✨🌸💫🎊", 8);
        }
      });
    });
  }

  /* ---------- Secret word ---------- */

  // Secret word binding is done through event delegation
  document.addEventListener("click", (e) => {
    const sw = e.target.closest("#secretWord");
    if (!sw) return;
    const bubble = document.getElementById("swBubble");
    if (!bubble) return;

    const wasHidden = !bubble.classList.contains("show");
    bubble.classList.toggle("show");

    if (wasHidden) {
      discover();
      const rect = sw.getBoundingClientRect();
      Effects.emojiBurst(
        rect.left + rect.width / 2,
        rect.top,
        "💡🌟✨",
        6
      );
    }
  });

  /* ---------- Long-press on signature ---------- */

  function bindLongPress() {
    const sig = document.getElementById("signature");
    if (!sig) return;

    let timer = null;
    let triggered = false;

    const start = () => {
      if (triggered) return;
      timer = setTimeout(() => {
        triggered = true;
        showLongPressTooltip();
        discover();
      }, 800);
    };

    const cancel = () => {
      if (timer) clearTimeout(timer);
    };

    sig.addEventListener("touchstart", start, { passive: true });
    sig.addEventListener("touchend", cancel);
    sig.addEventListener("touchcancel", cancel);
    sig.addEventListener("mousedown", start);
    sig.addEventListener("mouseup", cancel);
    sig.addEventListener("mouseleave", cancel);
  }

  function showLongPressTooltip() {
    const tooltip = document.getElementById("lpTooltip");
    const overlay = document.getElementById("lpOverlay");
    if (!tooltip || !overlay) return;

    tooltip.innerHTML = `
      <div style="font-size:2rem;margin-bottom:8px">🤫</div>
      <p style="font-family:var(--font-cursive);line-height:1.8">
        ${escHtml(guestData.lps || "ここは秘密だよ！")}
      </p>`;
    tooltip.classList.add("show");
    overlay.classList.add("show");

    Effects.emojiBurst(
      window.innerWidth / 2,
      window.innerHeight / 2,
      "😂🤣😆",
      10
    );

    const close = () => {
      tooltip.classList.remove("show");
      overlay.classList.remove("show");
      overlay.removeEventListener("click", close);
    };
    overlay.addEventListener("click", close);
  }

  /* ---------- Shake detection ---------- */

  function bindShake() {
    let lastX = 0, lastY = 0, lastZ = 0;
    let shakeTriggered = false;
    const threshold = 25;

    if (typeof DeviceMotionEvent === "undefined") return;

    // iOS 13+ requires permission
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      document.addEventListener(
        "click",
        function reqPerm() {
          DeviceMotionEvent.requestPermission()
            .then((state) => {
              if (state === "granted") {
                window.addEventListener("devicemotion", onMotion);
              }
            })
            .catch(() => {});
          document.removeEventListener("click", reqPerm);
        },
        { once: true }
      );
    } else {
      window.addEventListener("devicemotion", onMotion);
    }

    function onMotion(e) {
      if (shakeTriggered) return;
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const dx = Math.abs(a.x - lastX);
      const dy = Math.abs(a.y - lastY);
      const dz = Math.abs(a.z - lastZ);
      lastX = a.x;
      lastY = a.y;
      lastZ = a.z;

      if (dx + dy + dz > threshold) {
        shakeTriggered = true;
        onShake();
      }
    }
  }

  function onShake() {
    discover();
    Effects.sakura(60);
    Effects.confetti(window.innerWidth / 2, window.innerHeight / 3, 80);
    hideShakeHint();

    const msg = document.createElement("div");
    msg.className = "long-press-tooltip show";
    msg.innerHTML = `
      <div style="font-size:2rem;margin-bottom:8px">🌸</div>
      <p style="font-family:var(--font-cursive);line-height:1.8">
        おめでとうを<br>桜の花びらに乗せて🌸
      </p>`;
    msg.style.zIndex = "600";
    document.body.appendChild(msg);
    setTimeout(() => {
      msg.classList.remove("show");
      setTimeout(() => msg.remove(), 400);
    }, 3000);
  }

  function showShakeHint() {
    const hint = document.getElementById("shakeHint");
    if (!hint) return;
    hint.classList.add("show");
    setTimeout(() => hint.classList.remove("show"), 4000);
  }

  function hideShakeHint() {
    const hint = document.getElementById("shakeHint");
    if (hint) hint.classList.remove("show");
  }

  /* ---------- Scroll secret ---------- */

  function bindScrollSecret() {
    const el = document.getElementById("scrollSecret");
    if (!el || !guestData.ss) return;

    let triggered = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !triggered) {
          triggered = true;
          el.classList.add("revealed");
          discover();
          Effects.emojiBurst(
            window.innerWidth / 2,
            el.getBoundingClientRect().top,
            "👀🔍🤫",
            8
          );
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
  }

  /* ---------- Discovery tracker ---------- */

  function discover() {
    discoveredCount++;
    updateCounter();
    if (discoveredCount >= totalSecrets && !allFoundShown) {
      allFoundShown = true;
      setTimeout(showAllFound, 600);
    }
  }

  function updateCounter() {
    const counter = document.getElementById("counter");
    const text = document.getElementById("counterText");
    if (!counter || !text) return;
    counter.classList.add("visible");
    text.textContent = discoveredCount;
  }

  function showAllFound() {
    const banner = document.getElementById("afBanner");
    const overlay = document.getElementById("afOverlay");
    if (!banner || !overlay) return;
    banner.classList.add("show");
    overlay.classList.add("show");
    Effects.fireworks(5);
  }

  function bindAllFoundClose() {
    document.addEventListener("click", (e) => {
      if (e.target.id === "afClose") {
        document.getElementById("afBanner")?.classList.remove("show");
        document.getElementById("afOverlay")?.classList.remove("show");
      }
    });
  }

  /* ---------- Init ---------- */

  function init() {
    const data = decodeHash();
    if (!data || !data.n) {
      showError();
      return;
    }
    renderLetter(data);
  }

  return { init, decodeHash };
})();

document.addEventListener("DOMContentLoaded", App.init);
