/* ============================================================
   app.js - Main application (v2)
   ============================================================ */

const App = (() => {
  let guestData = null;
  const discovered = new Set();
  let totalSecrets = 0;
  let allFoundShown = false;

  /* ---------- URL-safe base64 decode ---------- */

  function b64Decode(str) {
    let s = str.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function decodeHash() {
    let hash = location.hash.slice(1);
    if (!hash) return null;
    try {
      hash = decodeURIComponent(hash);
    } catch { /* already decoded */ }
    try {
      return JSON.parse(b64Decode(hash));
    } catch {
      try {
        return JSON.parse(b64Decode(hash.replace(/\+/g, "-").replace(/\//g, "_")));
      } catch {
        return null;
      }
    }
  }

  /* ---------- Demo data for testing ---------- */

  function getDemoData() {
    return {
      n: "太郎", h: "くん",
      l: "太郎くんには学生時代から本当にお世話になりました。\nいつも温かく見守ってくれて、本当にありがとう。\nあの頃の楽しかった日々を思い出すと、自然と笑顔になります。\nこれからも末永くよろしくお願いします。",
      from: "花子 & 一郎",
      sw: { w: "楽しかった日々", m: "特にあの文化祭の打ち上げは最高だったね！🎶" },
      s: [
        { e: "📸", t: "今日は二人のベストショットをたくさん撮ってね！\nカメラマンより良い写真を期待してます📷", title: "今日のミッション" },
        { e: "😂🏕️", t: "大学3年のあの合宿...\n太郎くんの寝顔の写真、まだ持ってます（笑）", title: "あの日の思い出" },
        { e: "🥂", t: "太郎くんにも素敵な出会いがありますように...\n...なんてね！今日は一緒に楽しもう！", title: "最後の秘密" },
      ],
      ss: "ここまでスクロールしてくれたの？！\nさすが太郎くん、探究心の塊だね（笑）\n二次会では隣に座ってね🍻",
      lps: "実は花子がこの手紙を書くのに3時間かかりました😂",
      af: "全部見つけてくれてありがとう！\nさすが太郎くん！\n今日は最高の一日にしよう🎉",
    };
  }

  /* ---------- Error / Demo screen ---------- */

  function showError() {
    document.getElementById("app").innerHTML = `
      <div class="error-screen">
        <div class="error-emoji">💌</div>
        <p class="error-text">
          このリンクは無効です。<br>
          QRコードをもう一度スキャンしてください。
        </p>
        <button class="demo-btn" id="demoBtn">デモを見る</button>
      </div>`;
    document.getElementById("demoBtn")?.addEventListener("click", () => {
      renderLetter(getDemoData());
    });
  }

  /* ---------- Render ---------- */

  function renderLetter(data) {
    guestData = data;
    discovered.clear();
    allFoundShown = false;

    totalSecrets =
      (data.s ? data.s.length : 0) +
      (data.sw ? 1 : 0) +
      (data.lps ? 1 : 0) +
      (data.ss ? 1 : 0) +
      1; // header easter egg

    const letterHtml = buildLetterWithSecretWord(data.l, data.sw);

    const hiddenButtonsHtml = (data.s || [])
      .map((sec, i) => `
        <div class="hidden-item">
          <button class="hidden-btn" data-idx="${i}">
            <span class="btn-emoji">${sec.e || "🎁"}</span>
            <span class="btn-label">${esc(sec.title || "ここを押してね")}</span>
            <span class="btn-arrow">›</span>
          </button>
          <div class="hidden-reveal" id="reveal-${i}">
            <div class="hidden-card">
              <div class="card-emoji">${sec.e || "🎁"}</div>
              ${sec.title ? `<div class="card-title">${esc(sec.title)}</div>` : ""}
              <div class="card-text">${esc(sec.t)}</div>
            </div>
          </div>
        </div>`
      ).join("");

    const today = formatDate(new Date());

    document.getElementById("app").innerHTML = `
      <div class="envelope-screen" id="envelopeScreen">
        <div class="envelope-wrapper">
          <div class="envelope" id="envelope">
            <div class="envelope-back"></div>
            <div class="envelope-letter-peek"></div>
            <div class="envelope-front"></div>
            <div class="envelope-flap"></div>
            <div class="wax-seal" id="waxSeal"></div>
          </div>
          <p class="envelope-hint">タップして開封</p>
        </div>
      </div>

      <div class="letter-container" id="letterContainer">
        <header class="letter-header">
          <div class="header-emoji" id="headerEmoji">💌</div>
          <h1><span id="guestTitle">${esc(data.n)}${esc(data.h || "さん")}</span>へ</h1>
          <div class="letter-date">${today}</div>
        </header>

        <article class="letter-body">
          <div class="letter-text" id="letterText">${letterHtml}</div>
          <div class="letter-signature" id="signature">${esc(data.from || "")}</div>
        </article>

        <section class="hidden-section" id="hiddenSection">
          ${hiddenButtonsHtml}
        </section>

        <div class="scroll-gap"></div>
        <div class="scroll-secret" id="scrollSecret">
          <div class="scroll-secret-divider"></div>
          <div class="scroll-secret-text">${esc(data.ss || "")}</div>
        </div>
      </div>

      <div class="modal-overlay" id="modalOverlay"></div>
      <div class="modal-box" id="modalBox"></div>

      <div class="all-found-overlay" id="afOverlay"></div>
      <div class="all-found-banner" id="afBanner">
        <div class="banner-emoji">🎉🎊🥳</div>
        <div class="banner-text">${esc(data.af || "全部見つけてくれてありがとう！")}</div>
        <button class="banner-close" id="afClose">とじる</button>
      </div>

      <div class="discovery-counter" id="counter">
        <div class="counter-bar"><div class="counter-fill" id="counterBar"></div></div>
        <span class="counter-label">🔍 <span id="counterText">0</span> / ${totalSecrets}</span>
      </div>

      <div class="toast" id="toast"></div>
      <canvas class="effects-canvas"></canvas>`;

    Effects.init();
    bindEnvelope();
    bindHiddenButtons();
    bindSecretWord();
    bindLongPress();
    bindShake();
    bindScrollSecret();
    bindHeaderEasterEgg();
    bindModalClose();
    bindAllFoundClose();
    scheduleHints();
  }

  /* ---------- Letter builder ---------- */

  function buildLetterWithSecretWord(text, sw) {
    if (!sw || !sw.w) return esc(text);
    const escaped = esc(text);
    const word = esc(sw.w);
    return escaped.replace(
      word,
      `<span class="secret-word" id="secretWord">${word}</span>`
    );
  }

  function esc(s) {
    if (!s) return "";
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatDate(d) {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  /* ---------- Envelope ---------- */

  function bindEnvelope() {
    const screen = document.getElementById("envelopeScreen");
    const envelope = document.getElementById("envelope");
    if (!screen || !envelope) return;

    let opened = false;
    envelope.addEventListener("click", () => {
      if (opened) return;
      opened = true;
      vibrate(30);
      envelope.classList.add("opening");

      setTimeout(() => {
        envelope.classList.add("letter-rising");
      }, 500);

      setTimeout(() => {
        screen.classList.add("opened");
        const cont = document.getElementById("letterContainer");
        if (cont) {
          cont.classList.add("visible");
          typewriterEffect();
        }
        Effects.sakura(35);
        Effects.hearts(window.innerWidth / 2, window.innerHeight * 0.3, 6);
      }, 1200);
    });
  }

  /* ---------- Typewriter effect ---------- */

  function typewriterEffect() {
    const el = document.getElementById("letterText");
    if (!el) return;

    const fullHtml = el.innerHTML;
    const textNodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    if (textNodes.length === 0) return;

    const originals = textNodes.map(n => n.textContent);
    const totalChars = originals.reduce((sum, t) => sum + t.length, 0);
    textNodes.forEach(n => { n.textContent = ""; });

    el.classList.add("typing");

    let charIdx = 0;
    let nodeIdx = 0;
    let localIdx = 0;
    let skipped = false;

    const speed = Math.max(20, Math.min(45, 2000 / totalChars));

    function type() {
      if (skipped || charIdx >= totalChars) {
        finish();
        return;
      }
      if (localIdx >= originals[nodeIdx].length) {
        nodeIdx++;
        localIdx = 0;
      }
      if (nodeIdx < textNodes.length) {
        textNodes[nodeIdx].textContent += originals[nodeIdx][localIdx];
        localIdx++;
        charIdx++;
      }
      setTimeout(type, speed);
    }

    function finish() {
      textNodes.forEach((n, i) => { n.textContent = originals[i]; });
      el.classList.remove("typing");
    }

    el.addEventListener("click", () => { skipped = true; }, { once: true });

    setTimeout(type, 400);
  }

  /* ---------- Hidden buttons ---------- */

  function bindHiddenButtons() {
    document.querySelectorAll(".hidden-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.dataset.idx;
        const reveal = document.getElementById(`reveal-${idx}`);
        if (!reveal) return;

        const isOpen = reveal.classList.contains("show");
        if (isOpen) {
          reveal.classList.remove("show");
          btn.querySelector(".btn-arrow").textContent = "›";
          return;
        }

        reveal.classList.add("show");
        btn.classList.add("discovered");
        btn.querySelector(".btn-arrow").textContent = "⌄";

        if (!discovered.has(`btn-${idx}`)) {
          discovered.add(`btn-${idx}`);
          vibrate(20);
          const rect = btn.getBoundingClientRect();
          Effects.confetti(rect.left + rect.width / 2, rect.top, 35);
          Effects.emojiBurst(rect.left + rect.width / 2, rect.top, "🎉✨🌸💫", 6);
          updateCounter();
          checkAllFound();
        }
      });
    });
  }

  /* ---------- Secret word ---------- */

  function bindSecretWord() {
    const sw = document.getElementById("secretWord");
    if (!sw) return;

    sw.addEventListener("click", (e) => {
      e.stopPropagation();
      showModal(guestData.sw.m, "💡");

      if (!discovered.has("sw")) {
        discovered.add("sw");
        vibrate(20);
        const rect = sw.getBoundingClientRect();
        Effects.emojiBurst(rect.left + rect.width / 2, rect.top, "💡🌟✨", 6);
        sw.classList.add("found");
        updateCounter();
        checkAllFound();
      }
    });
  }

  /* ---------- Long press on signature ---------- */

  function bindLongPress() {
    const sig = document.getElementById("signature");
    if (!sig || !guestData.lps) return;

    let timer = null;
    const dur = 700;

    function start(e) {
      if (discovered.has("lp")) return;
      e.preventDefault();
      sig.classList.add("pressing");
      timer = setTimeout(() => {
        sig.classList.remove("pressing");
        showModal(guestData.lps, "🤫");
        if (!discovered.has("lp")) {
          discovered.add("lp");
          vibrate(40);
          Effects.emojiBurst(window.innerWidth / 2, window.innerHeight / 2, "😂🤣😆", 10);
          updateCounter();
          checkAllFound();
        }
      }, dur);
    }

    function cancel() {
      sig.classList.remove("pressing");
      if (timer) clearTimeout(timer);
    }

    sig.addEventListener("touchstart", start, { passive: false });
    sig.addEventListener("touchend", cancel);
    sig.addEventListener("touchcancel", cancel);
    sig.addEventListener("mousedown", start);
    sig.addEventListener("mouseup", cancel);
    sig.addEventListener("mouseleave", cancel);
  }

  /* ---------- Shake ---------- */

  function bindShake() {
    let lastX = 0, lastY = 0, lastZ = 0;
    let lastTime = 0;
    const threshold = 28;

    if (typeof DeviceMotionEvent === "undefined") return;

    function listen() {
      window.addEventListener("devicemotion", onMotion);
    }

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      document.addEventListener("click", function req() {
        DeviceMotionEvent.requestPermission().then(s => {
          if (s === "granted") listen();
        }).catch(() => {});
        document.removeEventListener("click", req);
      }, { once: true });
    } else {
      listen();
    }

    function onMotion(e) {
      if (discovered.has("shake")) return;
      const now = Date.now();
      if (now - lastTime < 200) return;
      lastTime = now;
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const d = Math.abs(a.x - lastX) + Math.abs(a.y - lastY) + Math.abs(a.z - lastZ);
      lastX = a.x; lastY = a.y; lastZ = a.z;
      if (d > threshold) {
        discovered.add("shake");
        vibrate(50);
        Effects.sakura(60);
        Effects.confetti(window.innerWidth / 2, window.innerHeight / 3, 80);
        showToast("🌸 おめでとうを桜の花びらに乗せて");
        updateCounter();
        checkAllFound();
      }
    }
  }

  /* ---------- Scroll secret ---------- */

  function bindScrollSecret() {
    const el = document.getElementById("scrollSecret");
    if (!el || !guestData.ss) return;

    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !discovered.has("scroll")) {
        discovered.add("scroll");
        el.classList.add("revealed");
        vibrate(15);
        Effects.emojiBurst(window.innerWidth / 2, el.getBoundingClientRect().top, "👀🔍🤫", 8);
        updateCounter();
        checkAllFound();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
  }

  /* ---------- Header easter egg (5-tap) ---------- */

  function bindHeaderEasterEgg() {
    const emoji = document.getElementById("headerEmoji");
    if (!emoji) return;

    let taps = 0;
    let timer = null;

    emoji.addEventListener("click", () => {
      taps++;
      if (timer) clearTimeout(timer);

      if (taps >= 5) {
        taps = 0;
        if (!discovered.has("header")) {
          discovered.add("header");
          vibrate(60);
          Effects.starShower(40);
          Effects.hearts(window.innerWidth / 2, window.innerHeight * 0.2, 12);
          showToast("⭐ 隠しコマンド発見！おめでとう！");
          emoji.classList.add("rainbow");
          updateCounter();
          checkAllFound();
        } else {
          Effects.starShower(20);
        }
      } else {
        emoji.style.transform = `scale(${1 + taps * 0.15}) rotate(${taps * 10}deg)`;
        timer = setTimeout(() => {
          taps = 0;
          emoji.style.transform = "";
        }, 800);
      }
    });
  }

  /* ---------- Modal ---------- */

  function showModal(text, emoji) {
    const box = document.getElementById("modalBox");
    const overlay = document.getElementById("modalOverlay");
    if (!box || !overlay) return;

    box.innerHTML = `
      <div class="modal-emoji">${emoji || "💬"}</div>
      <p class="modal-text">${esc(text)}</p>`;
    box.classList.add("show");
    overlay.classList.add("show");
  }

  function bindModalClose() {
    const overlay = document.getElementById("modalOverlay");
    const box = document.getElementById("modalBox");
    if (!overlay) return;

    function close() {
      box?.classList.remove("show");
      overlay.classList.remove("show");
    }
    overlay.addEventListener("click", close);
    box?.addEventListener("click", close);
  }

  /* ---------- Toast ---------- */

  function showToast(msg) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 3500);
  }

  /* ---------- Hints ---------- */

  function scheduleHints() {
    setTimeout(() => {
      if (discovered.size === 0) {
        showToast("💡 ページのどこかに秘密が隠されています...");
      }
    }, 12000);

    setTimeout(() => {
      document.querySelectorAll(".hidden-btn:not(.discovered)").forEach(btn => {
        btn.classList.add("hint-glow");
      });
    }, 25000);

    setTimeout(() => {
      if (!discovered.has("shake")) {
        showToast("📱 スマホを振ってみて！");
      }
    }, 35000);
  }

  /* ---------- Discovery tracker ---------- */

  function updateCounter() {
    const counter = document.getElementById("counter");
    const text = document.getElementById("counterText");
    const bar = document.getElementById("counterBar");
    if (!counter || !text) return;

    counter.classList.add("visible");
    text.textContent = discovered.size;
    if (bar) bar.style.width = `${(discovered.size / totalSecrets) * 100}%`;
  }

  function checkAllFound() {
    if (discovered.size >= totalSecrets && !allFoundShown) {
      allFoundShown = true;
      setTimeout(showAllFound, 800);
    }
  }

  function showAllFound() {
    const banner = document.getElementById("afBanner");
    const overlay = document.getElementById("afOverlay");
    if (!banner || !overlay) return;
    banner.classList.add("show");
    overlay.classList.add("show");
    vibrate(100);
    Effects.fireworks(6);
    setTimeout(() => Effects.confetti(window.innerWidth / 2, window.innerHeight / 3, 100), 500);
  }

  function bindAllFoundClose() {
    document.addEventListener("click", e => {
      if (e.target.id === "afClose") {
        document.getElementById("afBanner")?.classList.remove("show");
        document.getElementById("afOverlay")?.classList.remove("show");
      }
    });
  }

  /* ---------- Haptic ---------- */

  function vibrate(ms) {
    try { navigator.vibrate?.(ms); } catch {}
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

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
