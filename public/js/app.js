(function () {
  "use strict";
  const D = window.BCSN;
  const CFG = window.BCSN_CONFIG || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const main = $("#main");

  /* ---------- lưu trữ (an toàn khi bị chặn) ---------- */
  const KEY = "bcsn.v1";
  let appReady = false;
  const defaults = { pos: {}, done: {}, prog: {}, autoSync: true, best: null, plays: 0, lang: "bi", speed: 1, vol: 1, last: null, dev: null, qxp: 0, rxp: 0, vstat: {}, vmode: "page", tfs: 0, lvl: null, cls: "", noTimer: false, bestStreak: 0 };
  let S = Object.assign({}, defaults);
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  if (!S.dev) S.dev = "d" + Math.random().toString(36).slice(2, 10);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} if (appReady) lvlCheck(); };
  save();

  /* ---------- tiện ích ---------- */
  const ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    vol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/></svg>',
  };
  const SOC = "img/soc.jpg", BC = "img/bocau.jpg";
  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 3200);
  }
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- audio dùng chung (một bản duy nhất, không phát chồng) ---------- */
  const au = new Audio();
  au.preload = "none";
  function stopAudio() { try { au.pause(); au.removeAttribute("src"); au.load(); } catch (e) {} }

  /* ---------- lightbox phóng to ---------- */
  const LB = { on: false, items: [], i: 0, zoom: false };
  function lbShow() {
    const it = LB.items[LB.i];
    $("#lb-img").src = it.src; $("#lb-img").alt = it.alt || "";
    $("#lb-ind").textContent = (LB.i + 1) + "/" + LB.items.length;
    $("#lb-prev").disabled = LB.i === 0; $("#lb-next").disabled = LB.i === LB.items.length - 1;
    $("#lb-prev").hidden = $("#lb-next").hidden = LB.items.length < 2;
    $("#lb-body").classList.toggle("zoom", LB.zoom);
    $("#lb-zoom").textContent = LB.zoom ? "🔍 Thu nhỏ" : "🔍 Phóng to hơn";
    $("#lb-body").scrollTop = 0;
  }
  function lbOpen(items, i, onMove) {
    LB.items = items; LB.i = i; LB.zoom = false; LB.on = true; LB.onMove = onMove;
    $("#lb").classList.add("on"); lbShow(); $("#lb-close").focus();
  }
  function lbClose() { if (!LB.on) return; LB.on = false; $("#lb").classList.remove("on"); if (LB.opener) LB.opener.focus(); }
  function lbMove(d) {
    const n = LB.i + d; if (n < 0 || n >= LB.items.length) return;
    LB.i = n; LB.zoom = false; lbShow(); if (LB.onMove) LB.onMove(n);
  }
  $("#lb-close").onclick = lbClose;
  $("#lb-prev").onclick = () => lbMove(-1);
  $("#lb-next").onclick = () => lbMove(1);
  $("#lb-zoom").onclick = () => { LB.zoom = !LB.zoom; lbShow(); };
  $("#lb-img").onclick = () => { LB.zoom = !LB.zoom; lbShow(); };
  $("#lb").addEventListener("click", (e) => { if (e.target.id === "lb" || e.target.id === "lb-body") lbClose(); });

  /* ---------- phiên bản (sửa dòng này mỗi lần cập nhật; nhớ đổi VERSION trong sw.js cho khớp) ---------- */
  const APP_VERSION = { v: "21", date: "27/10/2026", note: "Thêm trang Quản trị: thống kê trực tiếp trong app" };
  (() => { const f = document.querySelector("footer"); if (f) f.insertAdjacentHTML("beforeend", `<div class="ver" title="${APP_VERSION.note}">Phiên bản ${APP_VERSION.v} · cập nhật ${APP_VERSION.date}</div>`); })();

  /* ---------- nền tối / sáng ---------- */
  const THEME_KEY = "bcsn.theme";
  const getTheme = () => { try { const t = localStorage.getItem(THEME_KEY); if (t) return t; } catch (e) {} return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; };
  const applyTheme = (t) => { document.documentElement.dataset.theme = t; const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === "dark" ? "#141c2b" : "#f7b731"; const b = document.getElementById("themebtn"); if (b) b.textContent = t === "dark" ? "☀️ Nền sáng" : "🌙 Nền tối"; };
  (() => { const f = document.querySelector("footer"); if (f) f.insertAdjacentHTML("beforeend", `<div><button class="themebtn" id="themebtn" type="button"></button></div>`);
    applyTheme(getTheme());
    document.getElementById("themebtn").onclick = () => { const t = getTheme() === "dark" ? "light" : "dark"; try { localStorage.setItem(THEME_KEY, t); } catch (e) {} applyTheme(t); }; })();

  /* ---------- bộ xem tranh ---------- */
  let curViewer = null;
  function viewerHTML(id) {
    return `<div class="viewer" id="${id}">
      <div class="stage"><img alt="" decoding="async"></div>
      <div class="vlabel" aria-hidden="true"></div>
      <div class="vctl">
        <button class="btn alt sm v-prev" type="button">← Trước</button>
        <span class="ind" aria-live="polite">1/1</span>
        <button class="btn alt sm v-next" type="button">Sau →</button>
      </div>
      <div class="row c" style="margin-top:10px"><button class="btn sm v-zoom" type="button">🔍 Phóng to</button></div>
      <div class="dots" aria-hidden="true"></div>
    </div>`;
  }
  function mountViewer(id, items, start, onChange) {
    const root = $("#" + id); let i = Math.min(Math.max(start || 0, 0), items.length - 1);
    const img = $(".stage img", root), ind = $(".ind", root), prev = $(".v-prev", root), next = $(".v-next", root), lab = $(".vlabel", root), dots = $(".dots", root);
    dots.innerHTML = items.length > 1 && items.length <= 8 ? items.map(() => "<i></i>").join("") : "";
    let flipTok = 0;
    function render(dir) {
      const it = items[i];
      const oldSrc = img.getAttribute("src"), tok = ++flipTok, st0 = $(".stage", root);
      $$(".leaf", st0).forEach((l) => l.remove());
      img.alt = it.alt;
      if (dir && oldSrc && oldSrc !== it.src && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const leaf = document.createElement("img"); leaf.className = "leaf " + (dir > 0 ? "fwd" : "back"); leaf.alt = ""; leaf.setAttribute("aria-hidden", "true");
        if (dir > 0) { img.src = it.src; leaf.src = oldSrc; } else { leaf.src = it.src; }
        st0.appendChild(leaf);
        const fin = () => { if (!leaf.parentNode) return; if (dir < 0 && tok === flipTok) img.src = it.src; leaf.remove(); };
        leaf.addEventListener("animationend", fin); setTimeout(fin, 900);
      } else { img.src = it.src; img.classList.remove("fade"); void img.offsetWidth; img.classList.add("fade"); }
      ind.textContent = (i + 1) + "/" + items.length;
      lab.textContent = it.label || "";
      prev.disabled = i === 0; next.disabled = i === items.length - 1;
      $$("i", dots).forEach((d, k) => d.classList.toggle("on", k === i));
      [i - 1, i + 1].forEach((k) => { if (items[k]) { const p = new Image(); p.src = items[k].src; } });
      if (onChange) onChange(i);
    }
    const go = (d) => { const n = i + d; if (n < 0 || n >= items.length) return; i = n; render(d); };
    prev.onclick = () => go(-1); next.onclick = () => go(1);
    const openZoom = () => { LB.opener = $(".v-zoom", root); lbOpen(items, i, (n) => { i = n; render(); }); };
    $(".v-zoom", root).onclick = openZoom; img.onclick = openZoom;
    let x0 = null;
    const st = $(".stage", root);
    st.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    st.addEventListener("pointerup", (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); });
    st.addEventListener("pointercancel", () => { x0 = null; });
    const set = (n) => { if (n < 0 || n >= items.length || n === i) return; const d = n > i ? 1 : -1; i = n; render(d); };
    curViewer = { go, set };
    render();
  }
  document.addEventListener("keydown", (e) => {
    if (e.target.closest && e.target.closest("input,textarea,select")) return;
    if (e.key === "Escape") { lbClose(); return; }
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const d = e.key === "ArrowLeft" ? -1 : 1;
    if (LB.on) { lbMove(d); e.preventDefault(); } else if (curViewer) { curViewer.go(d); }
  });

  /* ---------- hộp thoại Sóc Nâu / Bồ Câu theo ngôn ngữ ---------- */
  function langSeg(cur) {
    const L = [["vi", "Tiếng Việt"], ["en", "English"], ["bi", "Song ngữ"]];
    return `<div class="seg" role="group" aria-label="Chọn ngôn ngữ lời đọc">${L.map(([k, t]) => `<button type="button" data-lang="${k}" aria-pressed="${cur === k}">${t}</button>`).join("")}</div>`;
  }
  /* từ vựng trong lời thoại: chạm để xem nghĩa */
  function enHTML(text, ch) {
    let h = esc(text);
    if (!ch || !ch.vocab) return h;
    const ws = ch.vocab.map((v, k) => [v[0], k]).sort((a, b) => b[0].length - a[0].length);
    const re = new RegExp("\\b(" + ws.map((w) => w[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?:s|es|ed|d|ing)?\\b", "gi");
    return h.replace(re, (m, w) => { const k = ws.find((x) => x[0].toLowerCase() === w.toLowerCase())[1]; return `<button type="button" class="vw" data-ch="${ch.id}" data-k="${k}">${m}</button>`; });
  }
  function sayHTML(lines, lang, ch) {
    // lines: [{av, vi, en}]
    return `<div class="say">${lines.map((l, k) => {
      const cls = l.who === "soc" ? "soc" : "bc";
      let body = "";
      if (lang === "vi") body = esc(l.vi);
      else if (lang === "en") body = `<span lang="en">${enHTML(l.en, ch)}</span>`;
      else body = esc(l.vi) + `<span class="l2" lang="en">${enHTML(l.en, ch)}</span>`;
      return `<div class="line"><img src="${l.who === "soc" ? SOC : BC}" alt="${l.who === "soc" ? "Sóc Nâu" : "Bồ Câu"}"><div class="bubble ${cls}">${body}</div></div>`;
    }).join("")}</div>`;
  }
  function chSayLines(ch) {
    return [0, 1].map((k) => ({ who: k === 0 ? "soc" : "bc", vi: ch.say.vi[k], en: ch.say.en[k] }));
  }
  function fullTextHTML(ch, lang) {
    const T = ch.text;
    const ti = lang === "vi" ? esc(T.title[0]) : lang === "en" ? `<span lang="en">${esc(T.title[1])}</span>` : `${esc(T.title[0])} · <span lang="en" class="en">${esc(T.title[1])}</span>`;
    const ps = T.paras.map((p, i) => {
      if (lang === "vi") return `<div class="bi-para" data-p="${i}"><p>${esc(p[0])}</p></div>`;
      if (lang === "en") return `<div class="bi-para" data-p="${i}"><p lang="en" class="en-p">${enHTML(p[1], ch)}</p></div>`;
      return `<div class="bi-para" data-p="${i}"><p>${esc(p[0])}</p><p lang="en" class="en-p">${enHTML(p[1], ch)}</p></div>`;
    }).join("");
    return `<h3>${ti}</h3><div class="parawrap" id="parawrap"><div class="${lang === "bi" ? "bi" : ""}">${ps}</div></div>
      <div class="src"><b>Nguồn chính thức / Official sources:</b><ul>${T.sources.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
      <p class="note"><a href="${ch.pdf}" target="_blank" rel="noopener">Mở bản PDF song ngữ trên Google Drive ↗</a></p>`;
  }

  /* ---------- tem hộ chiếu ---------- */
  const stampCount = () => Object.keys(S.done).length;
  const firstOpen = () => { for (let k = 1; k <= 5; k++) if (!S.done[k]) return k; return 5; };
  const canOpen = (n) => n <= 1 || !!S.done[n - 1];

  /* ---------- điểm kinh nghiệm (XP) và cấp độ ---------- */
  const LEVELS = [[0, "Tân binh khám phá", "🐣"], [40, "Bạn đồng hành", "🎒"], [120, "Người dẫn đường", "🧭"], [240, "Nhà thám hiểm", "🗺️"], [380, "Hướng dẫn viên", "📣"], [520, "Chuyên gia phố phường", "🏙️"], [660, "Đại sứ TP. Hồ Chí Minh", "🏅"]];
  function calcXP() {
    let x = 0;
    for (const c of D.chapters) {
      const P = S.prog[c.id];
      if (P) {
        x += Object.keys(P.seen || {}).filter((k) => P.seen[k] && +k < c.images.length).length * 2;
        x += Object.keys(P.vocab || {}).filter((k) => P.vocab[k]).length * 3;
        if (P.audio) x += 20;
      }
      if (S.done[c.id]) x += 50;
    }
    return x + (S.qxp || 0) + Math.min(S.rxp || 0, 100);
  }
  function levelInfo() {
    const x = calcXP(); let i = 0;
    while (i + 1 < LEVELS.length && x >= LEVELS[i + 1][0]) i++;
    const nx = LEVELS[i + 1] ? LEVELS[i + 1][0] : null, from = LEVELS[i][0];
    return { x, i, name: LEVELS[i][1], icon: LEVELS[i][2], from, next: nx, pct: nx ? Math.round(((x - from) / (nx - from)) * 100) : 100 };
  }
  function lvlCheck() {
    const L = levelInfo();
    if (S.lvl === null || S.lvl === undefined) { S.lvl = L.i; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} return; }
    if (L.i > S.lvl) { S.lvl = L.i; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} setTimeout(() => toast("⬆️ Lên cấp " + (L.i + 1) + ": " + L.icon + " " + L.name + "!"), 700); }
  }
  function levelHTML() {
    const L = levelInfo();
    return `<div class="lvl" role="group" aria-label="Cấp độ của bạn"><div class="ic" aria-hidden="true">${L.icon}</div><div class="in"><b>Cấp ${L.i + 1} · ${esc(L.name)}</b>
      <div class="bar" role="img" aria-label="${L.pct}% để lên cấp"><i style="width:${L.pct}%"></i></div>
      <small>${L.x} XP${L.next ? " · còn " + (L.next - L.x) + " XP để lên cấp" : " · cấp cao nhất!"}</small></div></div>`;
  }
  const NICK_A = ["Nhanh nhẹn", "Tò mò", "Dũng cảm", "Chăm chỉ", "Vui vẻ", "Thông thái", "Lanh lợi", "Kiên trì"];
  const NICK_B = ["Bồ Câu", "Sóc Nâu", "Cú Mèo", "Mèo Mướp", "Cá Heo", "Chú Voi", "Hải Âu", "Thỏ Trắng"];
  const nick = (dev) => { let h = 0; for (const ch of String(dev)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return NICK_B[h % 8] + " " + NICK_A[Math.floor(h / 8) % 8] + " #" + (h % 90 + 10); };
  const cleanCls = (v) => String(v || "").toUpperCase().replace(/\s+/g, "").slice(0, 12);

  /* ---------- gửi điểm ẩn danh về Google Sheets ---------- */
  const QKEY = "bcsn.queue";
  const getQ = () => { try { return JSON.parse(localStorage.getItem(QKEY)) || []; } catch (e) { return []; } };
  const setQ = (q) => { try { localStorage.setItem(QKEY, JSON.stringify(q)); } catch (e) {} };
  let flushing = false;
  async function flushQueue() {
    if (!CFG.SHEETS_URL || flushing) return;
    if (!getQ().length || !navigator.onLine) return;
    flushing = true;
    try {
      while (getQ().length) {
        const rec = getQ()[0];
        try { await fetch(CFG.SHEETS_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(rec) }); }
        catch (e) { break; }
        setQ(getQ().slice(1));
      }
    } finally { flushing = false; }
  }
  function send(rec) { if (!CFG.SHEETS_URL) return Promise.resolve(); const q = getQ(); q.push(rec); setQ(q); return flushQueue(); }
  function submitScore(rec) { return send(Object.assign({ type: "score" }, rec)); }
  window.addEventListener("online", () => flushQueue().then(loadStats));

  /* ---------- lượt truy cập & đánh giá (đọc từ Apps Script) ---------- */
  let STATS = null;
  try { STATS = JSON.parse(localStorage.getItem("bcsn.stats")); } catch (e) {}
  function renderStats() {
    const el = $("#stats"); if (!el) return;
    if (!STATS || !CFG.SHEETS_URL) { el.textContent = ""; return; }
    const nf = (n) => Number(n || 0).toLocaleString("vi-VN");
    let t = "👀 " + nf(STATS.visits) + " lượt truy cập";
    if (STATS.ratingCount > 0) t += " · ⭐ " + String(STATS.ratingAvg).replace(".", ",") + "/5 (" + nf(STATS.ratingCount) + " đánh giá)";
    el.textContent = t;
    $$(".rate-sum").forEach((x) => (x.textContent = STATS.ratingCount > 0 ? "Điểm trung bình " + String(STATS.ratingAvg).replace(".", ",") + "/5 từ " + nf(STATS.ratingCount) + " lượt đánh giá." : "Hãy là người đầu tiên đánh giá!"));
  }
  async function loadStats() {
    renderStats();
    if (!CFG.SHEETS_URL || !navigator.onLine) return;
    try {
      const r = await fetch(CFG.SHEETS_URL + "?action=stats", { cache: "no-store" });
      const j = await r.json();
      if (j && j.ok) { STATS = j; try { localStorage.setItem("bcsn.stats", JSON.stringify(j)); } catch (e) {} renderStats(); }
    } catch (e) {}
  }
  function countVisit() {
    if (!CFG.SHEETS_URL) return Promise.resolve();
    let seen = false;
    try { seen = sessionStorage.getItem("bcsn.visit") === "1"; sessionStorage.setItem("bcsn.visit", "1"); } catch (e) {}
    if (seen) return Promise.resolve();
    return send({ type: "visit", app: "bcsn", dev: S.dev, ts: new Date().toISOString() });
  }

  /* ---------- đánh giá bằng sao ---------- */
  const STAR_TXT = ["", "Chưa hay lắm", "Tạm được", "Khá hay", "Rất hay", "Tuyệt vời!"];
  function rateHTML() {
    return `<div class="card rate"><h3>⭐ Bạn thấy app thế nào?</h3>
      <div class="stars-in" role="radiogroup" aria-label="Chọn số sao đánh giá">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star" role="radio" data-s="${n}" aria-checked="false" aria-label="${n} sao">★</button>`).join("")}</div>
      <p class="rate-msg" aria-live="polite"></p><p class="note rate-sum"></p></div>`;
  }
  function mountRate() {
    const root = $(".rate"); if (!root) return;
    const btns = $$(".star", root), msg = $(".rate-msg", root);
    const paint = (n) => { btns.forEach((b) => { const on = +b.dataset.s <= n; b.classList.toggle("on", on); b.setAttribute("aria-checked", +b.dataset.s === S.rating); }); };
    const show = () => { paint(S.rating || 0); msg.textContent = S.rating ? "Bạn đã chọn " + S.rating + " sao – " + STAR_TXT[S.rating] + " (bấm sao khác để đổi)" : "Chạm vào ngôi sao để chọn."; };
    btns.forEach((b) => {
      b.onclick = () => {
        S.rating = +b.dataset.s; save(); show(); toast("💛 Cảm ơn bạn đã đánh giá!");
        send({ type: "rating", app: "bcsn", dev: S.dev, stars: S.rating, ts: new Date().toISOString() }).then(() => setTimeout(loadStats, 1500));
      };
      b.onmouseenter = () => paint(+b.dataset.s); b.onmouseleave = () => paint(S.rating || 0);
    });
    show(); renderStats();
  }

  /* ======================================================
     CÁC TRANG
     ====================================================== */
  const views = {};
  let cleanup = null;

  /* Trang 1 – Trang chủ */
  views.home = () => {
    const last = S.last && D.chapters.find((c) => c.id === S.last);
    main.innerHTML = `<section class="view hero">
      <div class="cover"><img src="img/p01.jpg" alt="${esc(D.fullBook[0].alt)}" width="700" height="991"></div>
      <div>
        <span class="kicker">Bồ Câu &amp; Sóc Nâu</span>
        <h1 class="vi-title">THÀNH PHỐ HỒ CHÍ MINH – THÀNH PHỐ TÔI YÊU</h1>
        <div class="en-title" lang="en">HO CHI MINH CITY – MY CITY</div>
        <p class="tagline">Cùng Bồ Câu và Sóc Nâu khám phá thành phố của chúng mình!</p>
        <p class="en tagline" lang="en" style="margin-top:0">Let’s explore Ho Chi Minh city!</p>
        <div class="chips"><span class="chip">5 chương khám phá</span><span class="chip">Việt - Anh</span><span class="chip">10 audio</span></div>
        <div class="row">
          <a class="btn" href="#/lam-quen">▶ Bắt đầu đọc</a>
          <a class="btn alt" href="#/muc-luc">Chọn chương</a>
        </div>
        ${last ? `<div class="resume"><span>📖 Bạn đang đọc dở <b>Chương ${last.id}: ${esc(last.vi)}</b></span><a class="btn sm leaf" href="#/chuong/${last.id}">Đọc tiếp</a></div>` : ""}
        <div class="duo"><div class="avs"><img class="av" src="${SOC}" alt="Sóc Nâu"><img class="av" src="${BC}" alt="Bồ Câu"></div>
          <b>Hai người bạn, một hành trình. Đi cùng chúng mình nhé!</b></div>
      </div></section>`;
  };

  /* Trang 2 – Mục lục */
  function chProg(c) {
    const P = S.prog[c.id]; if (S.done[c.id] || !P) return "";
    const ni = Object.keys(P.seen || {}).filter((k) => P.seen[k]).length, nv = Object.keys(P.vocab || {}).filter((k) => P.vocab[k]).length;
    const parts = Math.min(ni / c.images.length, 1) + Math.min(nv / c.vocab.length, 1) + (P.audio ? 1 : 0);
    if (!parts) return "";
    return `<div class="cprog" role="img" aria-label="Đã học ${Math.round(parts / 3 * 100)}%"><span class="bar"><i style="width:${(parts / 3 * 100).toFixed(0)}%"></i></span><small>Đang học dở · ${(parts / 3 * 100).toFixed(0)}%</small></div>`;
  }
  /* bản đồ hành trình */
  function mapHTML() {
    const pts = [[60, 224], [150, 190], [96, 124], [212, 98], [296, 48]];
    const icons = ["🏛️", "🗺️", "📸", "🍜", "🚇"], names = [["Lịch sử", "hình thành"], ["Vị trí địa lí"], ["Điểm du lịch"], ["Ẩm thực"], ["Giao thông"]];
    const cur = firstOpen(), allDone = !!S.done[5];
    const seg = (i) => { // đoạn cong từ điểm i tới i+1 (Catmull-Rom)
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, 4)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      return `M${p1[0]} ${p1[1]} C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
    };
    let path = ""; for (let i = 0; i < 4; i++) path += `<path class="seg${S.done[i + 1] ? " on" : ""}" d="${seg(i)}"/>`;
    const nodes = D.chapters.map((c, i) => {
      const [x, y] = pts[i], open = canOpen(c.id), done = !!S.done[c.id], isCur = !allDone && c.id === cur;
      const st = done ? "done" : open ? "cur" : "lock";
      const inner = `<circle class="halo" cx="${x}" cy="${y}" r="26"/><circle class="dot" cx="${x}" cy="${y}" r="22"/><text class="ico" x="${x}" y="${y + 8}" text-anchor="middle">${open ? icons[i] : "🔒"}</text>${done ? `<circle class="tick" cx="${x + 17}" cy="${y - 17}" r="9"/><text class="tk" x="${x + 17}" y="${y - 13}" text-anchor="middle">✓</text>` : ""}<text class="lab" x="${x}" y="${y + 41}" text-anchor="middle">${names[i].map((t, k) => `<tspan x="${x}" dy="${k ? 13 : 0}">${t}</tspan>`).join("")}</text>`;
      const av = isCur ? `<image href="${SOC}" x="${x - 34}" y="${y - 52}" width="28" height="28" clip-path="circle(14px at 14px 14px)" class="avmap"/>` : "";
      return open ? `<a href="#/chuong/${c.id}" class="mnode ${st}${isCur ? " here" : ""}" aria-label="Chương ${c.id}: ${esc(c.vi)}${done ? " – đã hoàn thành" : isCur ? " – đang học" : ""}">${inner}${av}</a>` : `<g class="mnode ${st}" aria-label="Chương ${c.id} chưa mở">${inner}</g>`;
    }).join("");
    return `<div class="mapwrap"><svg viewBox="0 0 360 290" role="group" aria-label="Bản đồ hành trình khám phá TP. Hồ Chí Minh" xmlns="http://www.w3.org/2000/svg">
      <rect class="land" x="2" y="2" width="356" height="286" rx="22"/>
      <path class="river" d="M-10 60 C 60 96, 130 20, 190 140 S 300 250, 380 214"/>
      <text class="rivlab" x="236" y="224" transform="rotate(-18 236 224)">sông Sài Gòn</text>
      <path class="route" d="${pts.map((q, i) => (i ? "L" : "M") + q[0] + " " + q[1]).join(" ")}" opacity="0"/>
      ${path}${nodes}</svg><p class="note" style="text-align:center;margin:6px 0 0">${allDone ? "🎉 Bạn đã đi hết hành trình!" : "Chạm vào điểm sáng để tiếp tục hành trình."}</p></div>`;
  }
  views.toc = () => {
    main.innerHTML = `<section class="view">
      <div class="title-wrap"><h1>Hôm nay, mình đi đâu?</h1><p class="en" lang="en" style="font-weight:700">Where shall we go today?</p></div>
      ${levelHTML()}${mapHTML()}
      <ol class="toc">${D.chapters.map((c) => { const open = canOpen(c.id); const tag = open ? "a" : "div"; return `<li><${tag} class="chcard${open ? "" : " locked"}" ${open ? `href="#/chuong/${c.id}"` : 'aria-disabled="true"'}>
        <div class="pic"><img src="${c.thumb}" alt="" loading="lazy"><span class="num">Chương ${c.id}</span>${S.done[c.id] ? '<span class="done">✓ Hoàn thành</span>' : !open ? '<span class="lock">🔒</span>' : ""}</div>
        <div class="bd">${chProg(c)}<h3>${esc(c.vi)}</h3><p class="e en" lang="en">${esc(c.en)}</p><p>${open ? esc(c.desc) : "Hoàn thành Chương " + (c.id - 1) + " để mở chương này."}</p></div></${tag}></li>`; }).join("")}</ol>
      <div class="minor"><div class="row c">
        <a class="btn alt sm" href="#/lam-quen">👋 Làm quen Bồ Câu và Sóc Nâu</a>
        <a class="btn alt sm" href="#/doc-truyen">📖 Đọc toàn bộ truyện</a>
        <a class="btn sm" href="#/thu-thach">⭐ Thử thách nhớ nhanh</a>
        <a class="btn alt sm" href="#/on-tu">🔤 Ôn từ vựng${needReview().length ? " (" + needReview().length + ")" : ""}</a>
        <a class="btn alt sm" href="#/xep-hang">🏆 Bảng xếp hạng lớp</a>
      </div></div></section>`;
  };

  /* Trang 3 – Làm quen */
  views.meet = () => {
    const items = [D.img(2), D.img(3)];
    main.innerHTML = `<section class="view">
      <div class="title-wrap"><h1>Ú òa! Làm quen nha!</h1></div>
      <div class="meet">
        ${viewerHTML("mv")}
        <div class="stack">
          <div class="card who"><img src="${BC}" alt="Bồ Câu"><div class="bubble bc">Mình là Bồ Câu. Mình thích tìm hiểu những câu chuyện phía sau mỗi góc phố.</div></div>
          <div class="card who"><img src="${SOC}" alt="Sóc Nâu"><div class="bubble soc">Còn mình là Sóc Nâu! Mình tò mò về mọi thứ… nhất là những món ngon!</div></div>
          <div class="row"><a class="btn" href="#/chuong/1">Bắt đầu Chương 1 →</a><a class="btn alt" href="#/muc-luc">Về mục lục</a></div>
        </div>
      </div></section>`;
    mountViewer("mv", items, 0);
  };

  /* Trang 4–8 – Chương */
  views.chapter = (n) => {
    const ch = D.chapters.find((c) => c.id === n);
    if (!ch) return location.replace("#/muc-luc");
    S.last = n; save();
    const P = (S.prog[n] = S.prog[n] || { seen: {}, vocab: {}, audio: false });
    const badTrack = {};
    let lastIdx = -1, lastP = -2;
    let lang = S.lang, track = "vi", playing = false, dragging = false;
    const nextHref = n < 5 ? "#/chuong/" + (n + 1) : "#/ket-thuc";
    main.innerHTML = `<section class="view">
      <div class="intro" id="intro"><span class="kicker">Chương ${n}</span><h1>${esc(ch.vi)}</h1><p class="e" lang="en">${esc(ch.en)}</p>
        <div class="introhd">💬 Hai bạn dẫn vào chương</div>
        <div id="say"></div>
        <div class="introfoot">${langSeg(lang)}<button class="btn go" type="button" id="introgo">Bắt đầu đọc chương →</button></div>
      </div>
      <div id="chmain" hidden>
      <div class="chhead"><span class="kicker">Chương ${n}</span><h1>${esc(ch.vi)}</h1><p class="e" lang="en">${esc(ch.en)}</p></div>
      ${viewerHTML("cv")}

      <div class="tools" role="toolbar" aria-label="Ngôn ngữ và cỡ chữ">${langSeg(lang)}<span class="fsz" role="group" aria-label="Cỡ chữ"><button type="button" id="fsm" aria-label="Chữ nhỏ lại">A−</button><button type="button" id="fsp" aria-label="Chữ to lên">A+</button></span></div>
      <div class="panel talk">
        <details class="full" id="full" open><summary>📖 Lời kể của chương <small>(sáng lên theo giọng đọc)</small></summary><div id="fulltxt"></div></details>
      </div>

      <p class="note warn" id="anote" hidden></p>

      <div class="panel"><h2>🔤 Từ vựng Anh–Việt</h2>
        <p class="note" style="margin-top:-6px">Chạm vào thẻ để xem nghĩa tiếng Việt. Bấm loa để nghe phát âm.</p>
        <div class="vgrid">${ch.vocab.map((v, k) => `<div style="position:relative"><button class="vcard" type="button" aria-pressed="false" data-k="${k}"><span class="w" lang="en">${esc(v[0])}</span><span class="hint">chạm để xem nghĩa</span><span class="m">${esc(v[1])}</span></button><button class="say-w" type="button" data-w="${esc(v[0])}" aria-label="Nghe phát âm ${esc(v[0])}">${ICON.vol}</button></div>`).join("")}</div>
        <div class="row c" style="margin-top:12px"><a class="btn sm alt" href="#/on-tu">🎮 Chơi ôn từ vựng</a></div>
      </div>

      <div class="panel"><div class="card req" id="req"><h3>🎯 Hoàn thành chương để mở tiếp</h3>
        <ul class="reqlist"><li data-r="img"></li><li data-r="vocab"></li><li data-r="audio"></li></ul>
        <div class="bar" aria-hidden="true"><i id="reqbar" style="width:0"></i></div><p class="note" id="reqmsg" style="margin:6px 0 0"></p></div></div>
      <div class="endnav"><a class="btn alt" href="#/muc-luc">☰ Về mục lục</a><a class="btn locked" id="nextbtn" href="${nextHref}">${n < 5 ? "Chương tiếp theo →" : "Kết thúc hành trình →"}</a></div>
      </div>
    </section>`;
    $("#introgo").onclick = () => { $("#intro").hidden = true; $("#chmain").hidden = false; window.scrollTo(0, 0); const h = $("#chmain .chhead h1"); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } };

    // tranh + lưu vị trí + tem
    mountViewer("cv", ch.images, S.pos[n] || 0, (i) => {
      S.pos[n] = i; if (!P.seen[i]) P.seen[i] = true; save(); updateReq();
    });
    // lời
    const renderText = () => {
      $("#say").innerHTML = sayHTML(chSayLines(ch), lang, ch);
      $("#fulltxt").innerHTML = fullTextHTML(ch, lang);
      $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
    };
    renderText();
    $$("[data-lang]").forEach((b) => (b.onclick = () => { lang = b.dataset.lang; S.lang = lang; save(); renderText(); lastP = -2; syncText(); }));
    // cỡ chữ
    const applyFs = () => { document.documentElement.style.setProperty("--tfs", FS[S.tfs || 0]); $("#fsm").disabled = (S.tfs || 0) === 0; $("#fsp").disabled = (S.tfs || 0) === FS.length - 1; };
    $("#fsm").onclick = () => { S.tfs = Math.max(0, (S.tfs || 0) - 1); save(); applyFs(); };
    $("#fsp").onclick = () => { S.tfs = Math.min(FS.length - 1, (S.tfs || 0) + 1); save(); applyFs(); };
    applyFs();

    // yêu cầu hoàn thành chương
    function updateReq() {
      const total = { img: ch.images.length, vocab: ch.vocab.length };
      const ni = Object.keys(P.seen).filter((k) => P.seen[k] && +k < total.img).length, nv = Object.keys(P.vocab).filter((k) => P.vocab[k]).length;
      const audioOk = P.audio || (badTrack.vi && badTrack.en);
      const items = { img: [ni >= total.img, "Xem hết tranh (" + Math.min(ni, total.img) + "/" + total.img + ")"], vocab: [nv >= total.vocab, "Lật hết thẻ từ vựng (" + Math.min(nv, total.vocab) + "/" + total.vocab + ")"], audio: [audioOk, "Nghe hết một bản audio" + (audioOk && !P.audio ? " (không tải được audio – bỏ qua)" : "")] };
      let okc = 0;
      $$("#req [data-r]").forEach((li) => { const [ok, t] = items[li.dataset.r]; if (ok) okc++; li.className = ok ? "ok" : ""; li.textContent = (ok ? "✅ " : "⬜ ") + t; });
      $("#reqbar").style.width = (okc / 3) * 100 + "%";
      const all = okc === 3;
      if (all && !S.done[n]) { S.done[n] = Date.now(); save(); toast("🏅 Hoàn thành Chương " + n + "! Bạn nhận được 1 tem."); }
      const done = !!S.done[n];
      const nb = $("#nextbtn"); if (nb) { nb.classList.toggle("locked", !done); nb.setAttribute("aria-disabled", String(!done)); }
      $("#reqmsg").textContent = done ? "Đã hoàn thành! Bạn có thể sang " + (n < 5 ? "chương tiếp theo." : "phần kết thúc.") : "Hoàn thành cả 3 mục để mở " + (n < 5 ? "chương tiếp theo." : "phần kết thúc.");
    }
    $("#nextbtn").onclick = (e) => { if (!S.done[n]) { e.preventDefault(); toast("🔒 Bạn cần hoàn thành cả 3 mục trước nhé!"); $("#req").scrollIntoView({ behavior: "smooth", block: "center" }); } };

    // audio
    const note = $("#anote");
    // thanh điều khiển ngay trên tranh (giống YouTube)
    const stageEl = $("#cv .stage");
    stageEl.insertAdjacentHTML("beforeend", `<button class="readbtn" id="readbtn" type="button">🔊 Đọc cho mình nghe</button>
      <div class="pbar" id="pbar">
        <input id="seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Thanh tua audio">
        <div class="prow">
          <button class="pb" id="play" type="button" aria-label="Phát">${ICON.play}</button>
          <span class="ptime" id="time">0:00 / 0:00</span>
          <span class="sp"></span>
          <label class="pb vol" title="Âm lượng">${ICON.vol}<span class="sr">Âm lượng</span><input id="vol" type="range" min="0" max="1" step="0.05" value="${S.vol}"></label>
          <button class="pb txt" id="spd" type="button" aria-label="Tốc độ đọc" title="Tốc độ đọc">${S.speed}×</button>
          <button class="pb txt" id="trk" type="button" aria-label="Đổi giọng đọc" title="Giọng đọc">Việt</button>
          ${ch.sync ? `<button class="pb txt" id="autosync" type="button" aria-pressed="${S.autoSync}" title="Tranh tự chuyển theo lời đọc">🖼<span class="atx"> Tự chuyển</span></button>` : ""}
          <button class="pb" id="fsbtn" type="button" aria-label="Xem toàn màn hình" title="Toàn màn hình">⛶</button>
        </div>
      </div>`);
    ["pointerdown", "pointerup", "click"].forEach((ev) => $("#pbar").addEventListener(ev, (e) => e.stopPropagation()));
    // tự ẩn thanh điều khiển khi đang đọc; chạm vào tranh để hiện lại
    let hideT = null;
    const showBar = () => { stageEl.classList.remove("idle"); clearTimeout(hideT); if (playing) hideT = setTimeout(() => stageEl.classList.add("idle"), 3000); };
    let wasIdle = false;
    stageEl.addEventListener("pointerdown", () => { wasIdle = stageEl.classList.contains("idle"); }, true);
    ["pointermove", "pointerdown", "focusin", "keydown"].forEach((ev) => stageEl.addEventListener(ev, showBar));
    stageEl.addEventListener("click", (e) => { if (wasIdle) { wasIdle = false; e.stopPropagation(); e.preventDefault(); showBar(); } }, true);
    // toàn màn hình
    const setFs = (on) => {
      stageEl.classList.toggle("fs", on); document.body.classList.toggle("noscroll", on);
      $("#fsbtn").textContent = on ? "✕" : "⛶"; $("#fsbtn").setAttribute("aria-label", on ? "Thoát toàn màn hình" : "Xem toàn màn hình");
      try { if (on && stageEl.requestFullscreen) stageEl.requestFullscreen().catch(() => {}); else if (!on && document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    };
    $("#fsbtn").onclick = () => setFs(!stageEl.classList.contains("fs"));
    document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && stageEl.classList.contains("fs")) setFs(false); });
    document.addEventListener("keydown", fsKey);
    function fsKey(e) { if (e.key === "Escape" && stageEl.classList.contains("fs")) setFs(false); }
    const rb = $("#readbtn"), play = $("#play"), seek = $("#seek"), time = $("#time");
    const setPlayUI = (p) => {
      playing = p; $("#play").innerHTML = p ? ICON.pause : ICON.play; $("#play").setAttribute("aria-label", p ? "Tạm dừng" : "Phát");
      rb.hidden = p; showBar();
      if (p) rafLoop();
    };
    const rafLoop = () => { if (!playing) return; syncImage(); requestAnimationFrame(rafLoop); };
    const loadTrack = (t) => {
      track = t; lastIdx = -1; lastP = -2; stopAudio(); setPlayUI(false); note.hidden = true;
      au.src = "audio/" + t + "-" + n + ".mp3"; au.preload = "metadata"; au.playbackRate = S.speed; au.volume = S.vol;
      seek.value = 0; time.textContent = "0:00 / 0:00";
      $("#trk").textContent = t === "vi" ? "Việt" : "English";
    };
    au.onloadedmetadata = () => { seek.max = au.duration || 100; time.textContent = fmt(au.currentTime) + " / " + fmt(au.duration); au.playbackRate = S.speed; };
    au.ontimeupdate = () => {
      if (!dragging) seek.value = au.currentTime;
      time.textContent = fmt(au.currentTime) + " / " + fmt(au.duration);
      if (au.duration && au.currentTime / au.duration >= 0.97 && !P.audio) { P.audio = true; save(); updateReq(); }
      syncImage();
    };
    au.onended = () => { setPlayUI(false); seek.value = 0; if (!P.audio) { P.audio = true; save(); updateReq(); } };
    au.onerror = () => {
      if (!au.getAttribute("src")) return;
      setPlayUI(false); badTrack[track] = true; updateReq();
      const lbl = track === "vi" ? "tiếng Việt" : "English";
      note.hidden = false;
      note.innerHTML = `Audio ${lbl} của chương này chưa tải được (có thể chưa có file hoặc đang mất mạng). ${ch.driveAudio[track] ? `<a href="${ch.driveAudio[track]}" target="_blank" rel="noopener">Nghe trên Google Drive ↗</a>` : ""}`;
    };
    au.onpause = () => setPlayUI(false);
    au.onplay = () => { lastIdx = -1; lastP = -2; setPlayUI(true); };
    au.onseeked = () => { lastIdx = -1; lastP = -2; syncImage(); };
    play.onclick = () => { if (au.paused) { note.hidden = true; au.play().catch(() => {}); } else au.pause(); };
    rb.onclick = (e) => { e.stopPropagation(); play.onclick(); };
    rb.onpointerdown = (e) => e.stopPropagation(); rb.onpointerup = (e) => e.stopPropagation();
    seek.oninput = () => { dragging = true; time.textContent = fmt(seek.value) + " / " + fmt(au.duration); };
    seek.onchange = () => { au.currentTime = +seek.value; dragging = false; };
    $("#vol").oninput = (e) => { S.vol = +e.target.value; au.volume = S.vol; save(); };
    const SPEEDS = [0.75, 1, 1.25, 1.5];
    $("#spd").onclick = () => { S.speed = SPEEDS[(SPEEDS.indexOf(S.speed) + 1) % SPEEDS.length]; au.playbackRate = S.speed; $("#spd").textContent = S.speed + "×"; save(); };
    $("#trk").onclick = () => { const t = track === "vi" ? "en" : "vi"; const was = !au.paused; loadTrack(t); if (was) au.play().catch(() => {}); };
    function syncText() {
      const pt = ch.ptimes && ch.ptimes[track], wrap = $("#parawrap");
      if (!pt || !wrap || (au.paused && au.currentTime < 0.05)) return;
      let k = -1; for (let i = 0; i < pt.length; i++) { if (au.currentTime >= pt[i] - 0.15) k = i; else break; }
      if (k === lastP) return; lastP = k;
      $$(".bi-para", wrap).forEach((e) => e.classList.toggle("cur", +e.dataset.p === k));
      const el = $('.bi-para[data-p="' + k + '"]', wrap);
      if (el && wrap.scrollHeight > wrap.clientHeight + 4) wrap.scrollTo({ top: Math.max(0, el.offsetTop - wrap.offsetTop - 6), behavior: "smooth" });
    }
    function syncImage() {
      syncText();
      const pts = ch.sync && ch.sync[track];
      if (!pts || !S.autoSync || !curViewer || (au.paused && au.currentTime < 0.05)) return;
      let idx = 0; for (const pt of pts) { if (au.currentTime >= pt[0]) idx = pt[1]; else break; }
      if (idx !== lastIdx) { lastIdx = idx; curViewer.set(idx); }
    }
    const as = $("#autosync"); if (as) as.onclick = () => { S.autoSync = !S.autoSync; as.setAttribute("aria-pressed", String(S.autoSync)); save(); lastIdx = -1; };
    loadTrack("vi");
    updateReq();

    // từ vựng
    $$(".vcard").forEach((b) => (b.onclick = () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); if (!P.vocab[b.dataset.k]) { P.vocab[b.dataset.k] = true; save(); updateReq(); } }));
    $$(".vcard").forEach((b) => { if (P.vocab[b.dataset.k]) b.setAttribute("aria-pressed", "true"); });
    const canSay = "speechSynthesis" in window;
    $$(".say-w").forEach((b) => { if (!canSay) { b.hidden = true; return; } b.onclick = () => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(b.dataset.w); u.lang = "en-US"; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) {} }; });

    cleanup = () => { hideWord(); try { speechSynthesis.cancel(); } catch (e) {} document.removeEventListener("keydown", fsKey); document.body.classList.remove("noscroll"); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} clearTimeout(hideT); };
  };

  /* Đọc toàn bộ truyện */
  views.book = () => {
    main.innerHTML = `<section class="view"><div class="title-wrap"><h1>Đọc toàn bộ truyện</h1><p class="note">24 trang tranh theo thứ tự cuốn sách.</p></div>
      ${viewerHTML("bv")}
      <div class="endnav" style="justify-content:center"><a class="btn alt" href="#/muc-luc">☰ Về mục lục</a><a class="btn" href="#/thu-thach">⭐ Thử thách</a></div></section>`;
    mountViewer("bv", D.fullBook, S.pos.book || 0, (i) => { S.pos.book = i; save(); });
  };

  /* Trang 9 – Kết thúc hành trình */
  views.end = () => {
    let lang = S.lang;
    main.innerHTML = `<section class="view">
      <div class="title-wrap"><h1>Hẹn gặp lại, Thành phố Hồ Chí Minh!</h1></div>
      <div class="endpic">${viewerHTML("ev")}</div>
      <div class="endsay"><div class="row c" style="margin-bottom:12px">${langSeg(lang)}</div><div id="say"></div></div>
      <div class="row c" style="margin-top:26px"><a class="btn" href="#/thu-thach">⭐ Làm thử thách</a><a class="btn alt" href="#/muc-luc">📖 Đọc lại các chương</a></div></section>`;
    mountViewer("ev", [D.img(22)], 0);
    $(".vctl").hidden = true;
    const lines = [
      { who: "bc", vi: "Bồ Câu: “Mỗi góc phố đều có một câu chuyện. Cảm ơn bạn đã khám phá cùng chúng mình!”", en: "Pigeon: “Every corner has a story. Thank you for exploring with us!”" },
      { who: "soc", vi: "Sóc Nâu: “Lần sau mình lại đi tiếp nhé… và nhớ ghé ăn nữa nha!”", en: "Squirrel: “Let’s explore again soon… and stop for some food too!”" },
    ];
    const r = () => { $("#say").innerHTML = sayHTML(lines, lang); $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang)); };
    r(); $$("[data-lang]").forEach((b) => (b.onclick = () => { lang = b.dataset.lang; S.lang = lang; save(); r(); }));
  };

  /* Trang 10 – Thử thách */
  let Q = null; // trạng thái lượt chơi
  const letters = ["A", "B", "C", "D"];
  const TIME_LIMIT = 20;
  const hashStr = (str) => { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; };
  const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const shuffleR = (arr, r) => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const cleanCode = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  function stopTimer() { if (Q) { clearTimeout(Q.tm); clearInterval(Q.iv); } }
  views.quiz = () => { Q = null; quizIntro(); };
  function quizIntro() {
    main.innerHTML = `<section class="view quiz-wrap">
      <div class="title-wrap"><span class="kicker">Thử thách nhớ nhanh</span><h1>Bạn hiểu thành phố đến đâu?</h1>
        <p style="font-size:1.15rem;font-weight:700">10 câu hỏi vui. Trả lời đúng liên tiếp để nhận thêm XP!</p></div>
      <div class="card"><div class="who"><img src="${SOC}" alt="Sóc Nâu"><div class="bubble soc">Mỗi câu có ${TIME_LIMIT} giây. Trả lời nhanh và đúng liên tiếp sẽ được thưởng thêm XP. Bồ Câu và Sóc Nâu sẽ bật mí lời giải ngay sau đó.</div></div></div>
      ${S.best !== null ? `<p class="row c" style="margin-top:14px"><span class="best">🏆 Thành tích tốt nhất: ${S.best}/10</span></p>` : ""}
      <div class="card qopts"><label>Mã lớp <small>(không bắt buộc, ví dụ 6/6)</small><input id="qcls" maxlength="12" autocomplete="off" value="${esc(S.cls || "")}" placeholder="để xem bảng xếp hạng lớp"></label>
        <label>Mã đố của bạn bè <small>(không bắt buộc)</small><input id="qcode" maxlength="8" autocomplete="off" inputmode="text" placeholder="nhập để cùng thi một đề"></label>
        <label class="chk"><input type="checkbox" id="qnt" ${S.noTimer ? "checked" : ""}> Chơi không đếm giờ</label>
        <p class="note" style="margin:0">Không cần nhập tên. Mã lớp chỉ dùng để xếp hạng ẩn danh trong lớp.</p></div>
      <div class="quiz-pics"><button type="button" data-q="22" aria-label="Xem tranh thử thách 1"><img src="img/p23.jpg" alt="${esc(D.img(23).alt)}" loading="lazy"></button><button type="button" data-q="23" aria-label="Xem tranh thử thách 2"><img src="img/p24.jpg" alt="${esc(D.img(24).alt)}" loading="lazy"></button></div>
      <div class="row c"><button class="btn" id="qstart" type="button">▶ Bắt đầu thử thách</button><a class="btn alt" href="#/muc-luc">Đọc các chương trước</a></div></section>`;
    $("#qstart").onclick = startQuiz;
    $$(".quiz-pics button").forEach((b) => (b.onclick = () => { LB.opener = b; lbOpen([D.img(23), D.img(24)], +b.dataset.q - 22); }));
  }
  function startQuiz() {
    S.cls = cleanCls($("#qcls").value); S.noTimer = $("#qnt").checked; save();
    const code = cleanCode($("#qcode").value) || String(1000 + Math.floor(Math.random() * 9000));
    const r = rng(hashStr(code));
    const qs = shuffleR(D.quiz.map((_, i) => i), r);
    Q = { i: 0, score: 0, ans: [], ansByQ: new Array(10).fill(0), wrongCh: [], t0: Date.now(), code, qs, order: qs.map(() => shuffleR([0, 1, 2, 3], r)), locked: false, streak: 0, bestStreak: 0, xp: 0, tm: null, iv: null };
    cleanup = stopTimer;
    quizQuestion();
  }
  function quizQuestion() {
    const q = D.quiz[Q.qs[Q.i]], ord = Q.order[Q.i];
    main.innerHTML = `<section class="view quiz-wrap">
      <div class="qhead"><span class="n" aria-label="Câu ${Q.i + 1} trên 10">${Q.i + 1}/10</span><span class="s">${Q.streak >= 2 ? `<span class="streak">🔥 x${Q.streak}</span> · ` : ""}✔ Đúng: <span id="sc">${Q.score}</span></span></div>
      <div class="bar" aria-hidden="true"><i style="width:${(Q.i / 10) * 100}%"></i></div>
      ${S.noTimer ? "" : `<div class="timer" role="timer" aria-label="Thời gian còn lại"><span class="tb"><i id="tbar"></i></span><b id="tnum">${TIME_LIMIT}</b>s</div>`}
      <h2 class="qtext" id="qt">${esc(q.q)}</h2>
      <ul class="opts" role="group" aria-labelledby="qt">${ord.map((oi, k) => `<li><button class="opt" type="button" data-k="${k}"><span class="L">${letters[k]}</span><span>${esc(q.o[oi])}</span></button></li>`).join("")}</ul>
      <div id="fb" aria-live="assertive"></div>
      <div class="row c" style="margin-top:18px" id="nxt"></div></section>`;
    $$(".opt").forEach((b) => (b.onclick = () => answer(+b.dataset.k)));
    Q.tq = Date.now();
    if (!S.noTimer) {
      const tb = $("#tbar"); tb.style.width = "100%"; void tb.offsetWidth; tb.style.transition = "width " + TIME_LIMIT + "s linear"; tb.style.width = "0%";
      let left = TIME_LIMIT;
      Q.iv = setInterval(() => { left--; const t = $("#tnum"); if (t) t.textContent = Math.max(left, 0); }, 1000);
      Q.tm = setTimeout(() => answer(-1), TIME_LIMIT * 1000);
    }
  }
  function answer(k) {
    if (Q.locked) return; Q.locked = true; stopTimer();
    const qi = Q.qs[Q.i], q = D.quiz[qi], ord = Q.order[Q.i];
    const timeout = k < 0, ok = !timeout && ord[k] === q.a, rightK = ord.indexOf(q.a);
    const secs = (Date.now() - Q.tq) / 1000;
    Q.ans.push(ok); Q.ansByQ[qi] = ok ? 1 : 0;
    let gain = 0;
    if (ok) { Q.score++; Q.streak++; Q.bestStreak = Math.max(Q.bestStreak, Q.streak); gain = 10 + Math.min(Q.streak - 1, 4) * 2 + (secs <= 8 ? 5 : 0); Q.xp += gain; }
    else { Q.streak = 0; Q.wrongCh.push(q.ch); }
    $$(".opt").forEach((b, i) => {
      b.disabled = true;
      if (i === rightK) b.classList.add("right"); else if (i === k) b.classList.add("wrong"); else b.classList.add("dim");
    });
    $("#sc").textContent = Q.score;
    const tn = $(".timer"); if (tn) tn.classList.add("stop");
    $("#fb").innerHTML = `<div class="feedback ${ok ? "ok" : "no"}"><img src="${ok ? SOC : BC}" alt="${ok ? "Sóc Nâu" : "Bồ Câu"}"><div><h3>${timeout ? "⏰ Hết giờ rồi!" : ok ? "Đúng rồi!" : "Cùng ghi nhớ nhé!"}</h3>${ok ? `<p class="gain">+${gain} XP${Q.streak >= 2 ? " · 🔥 chuỗi " + Q.streak + " câu" : ""}${secs <= 8 ? " · ⚡ trả lời nhanh" : ""}</p>` : ""}<p style="margin:0">${esc(q.e)}</p>${ok ? "" : `<p class="note" style="margin:6px 0 0">Đáp án đúng là <b>${letters[rightK]}</b>. Xem lại Chương ${q.ch} để nhớ kỹ hơn nhé.</p>`}</div></div>`;
    const last = Q.i === 9;
    $("#nxt").innerHTML = `<button class="btn ${last ? "coral" : ""}" id="nx" type="button">${last ? "Xem kết quả 🎉" : "Câu tiếp theo →"}</button>`;
    $("#nx").focus();
    $("#nx").onclick = () => {
      if (last) return finishQuiz();
      Q.i++; Q.locked = false; quizQuestion(); window.scrollTo(0, 0);
    };
  }
  function finishQuiz() {
    stopTimer();
    if (Q.score === 10) Q.xp += 20;
    S.plays = (S.plays || 0) + 1;
    if (S.best === null || Q.score > S.best) S.best = Q.score;
    S.qxp = Math.max(S.qxp || 0, Q.xp); S.bestStreak = Math.max(S.bestStreak || 0, Q.bestStreak);
    Q.done = true; Q.dur = Math.round((Date.now() - Q.t0) / 1000);
    S.lastScore = { score: Q.score, ans: Q.ansByQ, wrongCh: [...new Set(Q.wrongCh)], code: Q.code, streak: Q.bestStreak, xp: Q.xp, sec: Q.dur };
    save();
    submitScore({ app: "bcsn", dev: S.dev, attempt: S.plays, score: Q.score, total: 10, ans: Q.ansByQ, sec: Q.dur, cls: S.cls || "", streak: Q.bestStreak, code: Q.code, ts: new Date().toISOString() });
    location.hash = "#/ket-qua";
  }

  /* Trang 11 – Kết quả */
  views.result = () => {
    const R = S.lastScore;
    if (!R) return location.replace("#/thu-thach");
    const tier = D.results.find((r) => R.score >= r.min);
    const stars = tier.badge === "gold" ? 3 : tier.badge === "silver" ? 2 : 1;
    const wrongCh = R.wrongCh || [...new Set(R.ans.map((ok, i) => (ok ? null : D.quiz[i].ch)).filter(Boolean))];
    main.innerHTML = `<section class="view result">
      <div class="rpic"><img class="av" src="${SOC}" alt="Sóc Nâu"><img class="av" src="${BC}" alt="Bồ Câu"></div>
      <div class="stars" aria-label="${stars} trên 3 ngôi sao">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
      <h1>Hành trình đã hoàn thành!</h1>
      <div class="score">Bạn trả lời đúng <b>${R.score}</b>/10 câu</div>
      <div class="chips" style="justify-content:center;margin:8px 0"><span class="chip">✨ +${R.xp || 0} XP</span><span class="chip">🔥 Chuỗi dài nhất: ${R.streak || 0}</span>${R.sec ? `<span class="chip">⏱ ${R.sec} giây</span>` : ""}</div>
      <div class="card" style="margin:12px 0"><h3>${esc(tier.title)}</h3><p style="margin:0">${esc(tier.text)}</p></div>
      ${levelHTML()}
      <span class="best">🏆 Thành tích tốt nhất: ${S.best}/10</span>
      ${wrongCh.length ? `<div class="card review"><b>Muốn nhớ thêm? Đọc lại:</b><ul>${wrongCh.map((c) => `<li><a href="#/chuong/${c}">Chương ${c}: ${esc(D.chapters[c - 1].vi)}</a></li>`).join("")}</ul></div>` : `<p>Bạn không sai câu nào, thật tuyệt vời! 🎉</p>`}
      ${R.code ? `<div class="card codecard"><b>🎲 Mã đố của lượt này: <span class="code">${esc(R.code)}</span></b><p class="note" style="margin:4px 0 8px">Gửi mã này cho bạn bè. Bạn nhập vào ô “Mã đố” khi bắt đầu thì cả hai cùng thi một đề, cùng thứ tự đáp án.</p><button class="btn sm alt" id="cpcode" type="button">📋 Chép mã</button></div>` : ""}
      <div class="row c" style="margin-top:12px"><a class="btn leaf" href="#/xep-hang">🏆 ${S.cls ? "Xem xếp hạng lớp " + esc(S.cls) : "Xem bảng xếp hạng lớp"}</a><button class="btn alt" id="sharebtn" type="button">🖼 Tạo ảnh thành tích</button></div>
      <div id="sharebox"></div>
      ${CFG.SHEETS_URL ? '<p class="note">Điểm được ghi ẩn danh (không có tên) để thầy cô thống kê.</p>' : ""}
      <div style="margin-top:16px">${rateHTML()}</div>
      <div class="row c" style="margin-top:20px"><button class="btn" id="again" type="button">↻ Chơi lại</button><a class="btn leaf" href="#/muc-luc">Khám phá tiếp</a><a class="btn alt" href="#/">Về trang chủ</a></div></section>`;
    $("#again").onclick = () => { S.lastScore = null; save(); location.hash = "#/thu-thach"; };
    const cp = $("#cpcode"); if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(R.code); toast("📋 Đã chép mã " + R.code); } catch (e) { toast("Mã đố của bạn: " + R.code); } };
    mountShare();
    mountRate();
  };

  /* Bảng xếp hạng lớp (ẩn danh) */
  views.rank = () => {
    main.innerHTML = `<section class="view quiz-wrap">
      <div class="title-wrap"><span class="kicker">Bảng xếp hạng lớp</span><h1>Ai là nhà khám phá số 1?</h1><p class="note">Ẩn danh: chỉ hiện biệt danh vui, không có tên thật. Xếp theo điểm cao nhất, rồi đến thời gian làm bài.</p></div>
      <div class="card qopts"><label>Mã lớp <small>(ví dụ 6/6)</small><input id="rcls" maxlength="12" autocomplete="off" value="${esc(S.cls || "")}" placeholder="nhập mã lớp"></label>
        <div class="row"><button class="btn sm" id="rgo" type="button">Xem bảng</button><a class="btn sm alt" href="#/thu-thach">⭐ Làm thử thách</a></div></div>
      <div id="rlist" aria-live="polite"></div></section>`;
    const box = $("#rlist");
    async function load() {
      const cls = cleanCls($("#rcls").value);
      if (!cls) { box.innerHTML = '<p class="note">Hãy nhập mã lớp nhé.</p>'; return; }
      S.cls = cls; save();
      if (!CFG.SHEETS_URL) { box.innerHTML = '<p class="note">Bảng xếp hạng chưa được bật.</p>'; return; }
      if (!navigator.onLine) { box.innerHTML = '<p class="note">Cần có mạng để xem bảng xếp hạng.</p>'; return; }
      box.innerHTML = '<p class="note">Đang tải…</p>';
      try {
        await flushQueue();
        const r = await fetch(CFG.SHEETS_URL + "?action=top&cls=" + encodeURIComponent(cls) + "&dev=" + encodeURIComponent(S.dev) + "&t=" + Date.now(), { cache: "no-store" });
        const j = await r.json();
        if (!j || !j.ok || !Array.isArray(j.rows)) { box.innerHTML = '<p class="note">Bảng xếp hạng chưa được bật. Thầy cô cần cập nhật Apps Script theo hướng dẫn.</p>'; return; }
        if (!j.rows.length) { box.innerHTML = `<div class="card">Lớp <b>${esc(cls)}</b> chưa có ai làm thử thách. Hãy là người đầu tiên!</div>`; return; }
        const medal = ["🥇", "🥈", "🥉"], mine = String(S.dev).slice(0, 12);
        const row = (x, i, rank) => `<li class="${x.d === mine ? "me" : ""}"><span class="rk">${medal[rank - 1] || rank}</span><span class="nm">${esc(nick(x.d))}${x.d === mine ? " <em>(bạn)</em>" : ""}</span><span class="sc">${x.score}/10</span><span class="tm">${x.sec ? x.sec + " s" : ""}</span></li>`;
        let html = `<div class="card"><h3>Lớp ${esc(cls)} · ${j.n} bạn đã thi</h3><ol class="rank">${j.rows.map((x, i) => row(x, i, i + 1)).join("")}</ol>`;
        if (j.me && j.me.rank > j.rows.length) html += `<p class="note" style="margin:8px 0 0">Bạn đang đứng hạng <b>${j.me.rank}</b>/${j.n} với ${j.me.score}/10 điểm. Cố lên nào!</p>`;
        box.innerHTML = html + "</div>";
      } catch (e) { box.innerHTML = '<p class="note">Chưa tải được bảng xếp hạng. Bạn thử lại sau nhé.</p>'; }
    }
    $("#rgo").onclick = load;
    $("#rcls").onkeydown = (e) => { if (e.key === "Enter") load(); };
    if (S.cls) load();
  };

  /* ảnh thành tích để chia sẻ */
  async function makeShareCard() {
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    try { await Promise.all([document.fonts.load('800 64px "Baloo 2"'), document.fonts.load("700 36px Nunito")]); } catch (e) {}
    const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
    const [soc, bc] = await Promise.all([load(SOC), load(BC)]);
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    const txt = (t, x, y, font, col) => { g.font = font; g.fillStyle = col; g.textAlign = "center"; g.fillText(t, x, y); };
    const HEAD = '"Baloo 2","Trebuchet MS",sans-serif', BODY = "Nunito,system-ui,sans-serif";
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#bfe3f7"); gr.addColorStop(1, "#fffaf0"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    rr(50, 50, W - 100, H - 100, 48); g.fillStyle = "#ffffff"; g.fill(); g.lineWidth = 8; g.strokeStyle = "#24384a"; g.stroke();
    txt("HỘ CHIẾU KHÁM PHÁ", W / 2, 165, "800 78px " + HEAD, "#24384a");
    txt("Bồ Câu & Sóc Nâu · TP. Hồ Chí Minh", W / 2, 225, "700 38px " + BODY, "#4f6475");
    [[soc, 370], [bc, 710]].forEach(([im, x]) => { g.save(); g.beginPath(); g.arc(x, 360, 100, 0, Math.PI * 2); g.closePath(); g.clip(); if (im) g.drawImage(im, x - 100, 260, 200, 200); else { g.fillStyle = "#f7b731"; g.fillRect(x - 100, 260, 200, 200); } g.restore(); g.beginPath(); g.arc(x, 360, 100, 0, Math.PI * 2); g.lineWidth = 8; g.strokeStyle = "#24384a"; g.stroke(); });
    const L = levelInfo();
    rr(120, 510, W - 240, 210, 36); g.fillStyle = "#fff3cf"; g.fill(); g.lineWidth = 6; g.strokeStyle = "#24384a"; g.stroke();
    g.font = "100px sans-serif"; g.textAlign = "center"; g.fillText(L.icon, 230, 640);
    g.textAlign = "left"; g.font = "800 54px " + HEAD; g.fillStyle = "#24384a"; g.fillText("Cấp " + (L.i + 1) + " · " + L.name, 320, 590);
    rr(320, 615, 600, 28, 14); g.fillStyle = "#ffffff"; g.fill(); g.lineWidth = 4; g.stroke();
    if (L.pct > 0) { rr(320, 615, Math.max(28, 600 * L.pct / 100), 28, 14); g.fillStyle = "#2f9e63"; g.fill(); }
    g.font = "700 34px " + BODY; g.fillStyle = "#4f6475"; g.fillText(L.x + " XP", 320, 690);
    const icons = ["🏛️", "🗺️", "📸", "🍜", "🚇"];
    D.chapters.forEach((c, i) => {
      const x = 170 + i * 185, y = 870, got = !!S.done[c.id];
      g.beginPath(); g.arc(x, y, 72, 0, Math.PI * 2); g.fillStyle = got ? "#d9f2e3" : "#e8ecef"; g.fill(); g.lineWidth = 6; g.strokeStyle = got ? "#2f9e63" : "#a9b8c8"; g.stroke();
      g.textAlign = "center"; g.font = "70px sans-serif"; g.fillStyle = "#000"; g.globalAlpha = got ? 1 : 0.35; g.fillText(got ? icons[i] : "❔", x, y + 24); g.globalAlpha = 1;
      txt("Chương " + c.id, x, y + 118, "700 30px " + BODY, got ? "#24384a" : "#8a99a8");
    });
    txt(stampCount() + "/5 tem đã thu thập", W / 2, 1060, "800 46px " + HEAD, "#24384a");
    const medal = S.best === null ? null : D.results.find((r) => S.best >= r.min);
    g.font = "110px sans-serif"; g.textAlign = "center"; g.fillText(medal ? (medal.badge === "gold" ? "🥇" : medal.badge === "silver" ? "🥈" : "🥉") : "⭐", 300, 1190);
    g.textAlign = "left"; g.font = "800 50px " + HEAD; g.fillStyle = "#24384a"; g.fillText(S.best === null ? "Chưa làm thử thách" : "Thử thách: " + S.best + "/10", 390, 1170);
    g.font = "700 34px " + BODY; g.fillStyle = "#4f6475"; g.fillText(S.bestStreak ? "🔥 Chuỗi đúng dài nhất: " + S.bestStreak : "Cùng khám phá nhé!", 390, 1220);
    txt(location.host || "Bồ Câu & Sóc Nâu", W / 2, 1290, "700 34px " + BODY, "#4f6475");
    return new Promise((res) => cv.toBlob(res, "image/png"));
  }
  function mountShare() {
    const btn = $("#sharebtn"), box = $("#sharebox"); if (!btn || !box) return;
    btn.onclick = async () => {
      btn.disabled = true; box.innerHTML = '<p class="note">Đang vẽ ảnh…</p>';
      try {
        const blob = await makeShareCard(), url = URL.createObjectURL(blob);
        const file = new File([blob], "thanh-tich-bo-cau-soc-nau.png", { type: "image/png" });
        const canShare = !!(navigator.canShare && navigator.canShare({ files: [file] }));
        box.innerHTML = `<div class="sharebox"><img class="sharepic" src="${url}" alt="Ảnh thành tích của bạn"><div class="row c">${canShare ? '<button class="btn sm" id="doshare" type="button">📤 Chia sẻ</button>' : ""}<a class="btn sm alt" href="${url}" download="thanh-tich-bo-cau-soc-nau.png">⬇ Lưu ảnh</a></div><p class="note" style="text-align:center">Trên điện thoại: nhấn giữ vào ảnh để lưu.</p></div>`;
        const ds = $("#doshare"); if (ds) ds.onclick = () => navigator.share({ files: [file], title: "Thành tích của mình", text: "Mình đang khám phá TP. Hồ Chí Minh cùng Bồ Câu và Sóc Nâu!" }).catch(() => {});
      } catch (e) { box.innerHTML = '<p class="note">Chưa tạo được ảnh. Bạn thử lại nhé.</p>'; }
      btn.disabled = false;
    };
  }

  /* Trang 12 – Giới thiệu */
  views.about = () => {
    main.innerHTML = `<section class="view about">
      <div class="cover"><img src="img/p01.jpg" alt="Bìa sách Hồ Chí Minh City – My City" width="700" height="991"></div>
      <div class="stack">
        <h1>Một cuốn sách, một tình yêu thành phố.</h1>
        <p>Bồ Câu và Sóc Nâu là hai người bạn đồng hành, đưa bạn khám phá lịch sử, địa lý, văn hóa và nhịp sống Thành phố Hồ Chí Minh qua tranh truyện, lời Việt - Anh và audio. Mỗi trang sách là một lời mời tìm hiểu và yêu hơn thành phố của chúng mình.</p>
        <div class="authors"><b>Tác giả</b><br>Nguyễn Trần Mai Trân, lớp 9/6<br>Lê Cao Di Quỳnh, lớp 9/7<br>Trường THCS Gò Vấp</div>
        <div class="row"><a class="btn" href="${D.links.book}" target="_blank" rel="noopener">📘 Đọc sách gốc trên Google Drive</a>
        <a class="btn alt" href="${D.links.project}" target="_blank" rel="noopener">📁 Xem hồ sơ dự án và poster</a></div>
        ${rateHTML()}
        <details class="poster-d"><summary>Xem thêm về dự án (poster)</summary><img src="img/poster.jpg" alt="Poster dự án Bồ Câu và Sóc Nâu" loading="lazy"></details>
        <div class="row"><a class="btn alt sm" href="#/huong-dan">❓ Hướng dẫn sử dụng</a><a class="btn alt sm" href="#/">Về trang chủ</a></div>
        <p class="note" style="text-align:center;margin:6px 0 0"><a class="admlink" href="#/quan-tri">🔒 Quản trị</a></p>
      </div></section>`;
    mountRate();
  };


  /* Hướng dẫn sử dụng */
  views.help = () => {
    const sec = (ic, t, body, open) => `<details class="hsec"${open ? " open" : ""}><summary><span class="hic" aria-hidden="true">${ic}</span>${t}</summary><div class="hbody">${body}</div></details>`;
    main.innerHTML = `<section class="view help">
      <div class="title-wrap"><span class="kicker">Hướng dẫn</span><h1>Cách dùng Bồ Câu &amp; Sóc Nâu</h1><p class="note">Chạm vào từng mục để xem. Dành cho học sinh và thầy cô.</p></div>
      ${sec("🚀", "Bắt đầu nhanh", `<ol><li>Vào <b>Mục lục</b> (nút ☰ trên cùng), chọn <b>Chương 1</b>.</li><li>Đọc lời dẫn của Sóc Nâu và Bồ Câu, bấm <b>Bắt đầu đọc chương</b>.</li><li>Bấm <b>🔊 Đọc cho mình nghe</b> trên tranh. Giọng đọc chạy tới đâu, tranh tự lật tới đó.</li><li>Xem hết tranh, lật hết thẻ từ vựng, nghe hết một bản audio để mở <b>chương tiếp theo</b>.</li></ol>`, true)}
      ${sec("🖼", "Xem tranh và nghe đọc", `<ul><li><b>▶ / ⏸</b>: phát hoặc dừng. Kéo thanh thời gian để tua.</li><li><b>1×</b>: đổi tốc độ đọc. <b>Việt / English</b>: đổi giọng đọc. <b>🔊</b>: chỉnh âm lượng.</li><li><b>Nút hình bức tranh</b>: bật/tắt <i>tự lật trang theo giọng đọc</i>. Tắt đi nếu bạn muốn tự lật.</li><li><b>Lật tay</b>: bấm Trước / Sau hoặc vuốt sang trái, phải. Máy tính dùng phím ← →.</li><li><b>Phóng to</b>: chạm vào tranh, hoặc bấm nút toàn màn hình ⛶ ở góc phải thanh phát.</li><li>Khi đang phát, thanh điều khiển tự ẩn sau vài giây. Chạm vào tranh để hiện lại.</li></ul>`)}
      ${sec("💬", "Lời của hai bạn và lời kể", `<ul><li>Đầu mỗi chương, Sóc Nâu và Bồ Câu nói vài câu dẫn vào bài. Chọn <b>Tiếng Việt / English / Song ngữ</b> ngay tại đó.</li><li>Phần <b>Lời kể của chương</b> sáng lên đúng đoạn đang được đọc.</li><li><b>A− / A+</b>: chỉnh cỡ chữ cho dễ đọc.</li></ul>`)}
      ${sec("🔤", "Từ vựng Anh–Việt", `<ul><li>Trong lời tiếng Anh, từ có <b>gạch chấm đỏ</b> là từ vựng. <b>Chạm vào</b> để xem nghĩa tiếng Việt và nghe phát âm.</li><li>Cuối chương có các <b>thẻ từ vựng</b>: chạm để lật xem nghĩa, bấm loa để nghe.</li><li>Từ bạn đã chạm được lưu lại để ôn sau.</li></ul>`)}
      ${sec("🎮", "Ôn từ vựng", `<p>Vào <b>Mục lục → 🔤 Ôn từ vựng</b>. Có hai trò chơi:</p><ul><li><b>Nghe rồi chọn</b>: nghe một từ, chọn nghĩa đúng.</li><li><b>Ghép cặp</b>: nối từ tiếng Anh với nghĩa tiếng Việt.</li></ul><p>Từ nào trả lời sai sẽ được hỏi lại nhiều hơn. Số trong ngoặc là số từ đang cần ôn.</p>`)}
      ${sec("⭐", "Thử thách nhớ nhanh", `<ul><li>Trả lời câu hỏi về thành phố, có <b>đồng hồ đếm giờ</b> và <b>chuỗi đúng liên tiếp</b> để cộng thêm điểm.</li><li><b>Mã đố</b>: nhập cùng một mã với bạn bè để thi chung một đề. Sau khi làm xong, bạn nhận mã mới để gửi bạn.</li><li>Nhập <b>lớp</b> của mình để ghi tên lên <b>🏆 Bảng xếp hạng lớp</b> (chỉ hiện biệt danh, không lộ thông tin cá nhân).</li><li>Bấm <b>🖼 Tạo ảnh thành tích</b> để lưu hoặc chia sẻ kết quả.</li></ul>`)}
      ${sec("🏅", "Điểm kinh nghiệm, cấp độ và hộ chiếu", `<ul><li>Đọc chương, ôn từ, làm thử thách đều được <b>điểm kinh nghiệm</b> và lên <b>cấp</b>.</li><li>Hoàn thành mỗi chương được một <b>tem</b> trong <b>Hộ chiếu khám phá</b> (nút thứ hai trên cùng).</li><li>Trên <b>bản đồ hành trình</b> ở trang chủ, các điểm sáng dần khi bạn đi tiếp.</li></ul>`)}
      ${sec("📱", "Cài app và dùng ngoại tuyến", `<ul><li><b>iPhone (Safari)</b>: bấm nút Chia sẻ → <b>Thêm vào Màn hình chính</b>.</li><li><b>Android (Chrome)</b>: menu ⋮ → <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>.</li><li>Sau khi mở một lần có mạng, nhiều phần vẫn xem được khi mất mạng. Điểm sẽ gửi lên khi có mạng lại.</li><li><b>Nền tối</b>: nút 🌙 ở cuối trang, dễ nhìn khi đọc buổi tối.</li></ul>`)}
      ${sec("🧑‍🏫", "Gợi ý cho thầy cô", `<ul><li>Cho cả lớp cùng thi một <b>mã đố</b>, nhập đúng tên lớp để xem bảng xếp hạng chung.</li><li>Dùng chế độ <b>Song ngữ</b> khi dạy học kết hợp Tiếng Anh; <b>Tiếng Việt</b> khi cần tập trung nội dung.</li><li>Nên chiếu tranh ở chế độ toàn màn hình, bật tự lật trang để cả lớp nghe và xem.</li><li>Học sinh dùng chung một máy: điểm lưu theo từng máy và trình duyệt.</li></ul>`)}
      ${sec("🛠", "Gặp sự cố?", `<ul><li><b>Không nghe được tiếng</b>: kiểm tra nút gạt âm thanh, âm lượng điện thoại và nút 🔊 trên thanh phát.</li><li><b>App chưa cập nhật</b>: tắt hẳn app rồi mở lại. Cuối trang có dòng <i>Phiên bản…</i> để đối chiếu.</li><li><b>Tranh lật chưa khớp giọng đọc</b>: tắt nút tự lật và lật tay, rồi báo thầy cô để chỉnh.</li><li><b>Chưa có bảng xếp hạng</b>: cần có mạng và đã nhập tên lớp.</li></ul>`)}
      <div class="row c" style="margin-top:14px"><a class="btn" href="#/muc-luc">☰ Vào mục lục</a><a class="btn alt" href="#/">Về trang chủ</a></div>
    </section>`;
  };


  /* Trang Quản trị – thống kê trực tiếp (mật khẩu kiểm tra ở Google Apps Script) */
  views.admin = () => {
    const SK = "bcsn.adm";
    const getPw = () => { try { return sessionStorage.getItem(SK) || ""; } catch (e) { return ""; } };
    const setPw = (v) => { try { v ? sessionStorage.setItem(SK, v) : sessionStorage.removeItem(SK); } catch (e) {} };
    main.innerHTML = `<section class="view adm"><div class="title-wrap"><span class="kicker">Quản trị</span><h1>Thống kê thử thách</h1><p class="note">Chỉ thầy cô xem. Số liệu ẩn danh, lấy từ Google Sheets.</p></div><div id="admbox"></div></section>`;
    const box = $("#admbox");
    const bar = (pct, label, val, cls) => `<div class="abar"><span class="al">${esc(label)}</span><span class="at"><i class="${cls || ""}" style="width:${Math.max(0, Math.min(100, pct))}%"></i></span><span class="avl">${esc(val)}</span></div>`;
    const login = (msg) => {
      box.innerHTML = `<form class="card admlogin" id="admf"><label>Mật khẩu quản trị<input id="admpw" type="password" autocomplete="current-password" required></label><p class="note warn" id="admmsg" ${msg ? "" : "hidden"}>${esc(msg || "")}</p><div class="row c"><button class="btn" type="submit">🔓 Xem thống kê</button></div></form>`;
      $("#admf").onsubmit = (e) => { e.preventDefault(); setPw($("#admpw").value.trim()); load(); };
    };
    async function load() {
      if (!CFG.SHEETS_URL) { box.innerHTML = `<div class="card">Chưa cấu hình địa chỉ Google Sheets cho app.</div>`; return; }
      const pw = getPw(); if (!pw) { login(); return; }
      box.innerHTML = `<div class="card">⏳ Đang tải số liệu…</div>`;
      let j = null;
      try { const r = await fetch(CFG.SHEETS_URL + "?action=admin&pw=" + encodeURIComponent(pw) + "&t=" + Date.now(), { cache: "no-store" }); j = await r.json(); } catch (e) { box.innerHTML = `<div class="card">Không kết nối được. Kiểm tra mạng rồi <button class="btn sm" id="admretry" type="button">Thử lại</button></div>`; $("#admretry").onclick = load; return; }
      if (!j || !j.ok) {
        setPw("");
        const m = { badpw: "Mật khẩu chưa đúng.", locked: "Nhập sai nhiều lần. Chờ khoảng 10 phút rồi thử lại.", nopw: "Chưa đặt mật khẩu ở Apps Script (thuộc tính ADMIN_PW)." }[j && j.error] || "Chưa có tính năng này trên Apps Script. Hãy dán Code.gs mới và triển khai phiên bản mới (xem HUONG-DAN.md).";
        login(m); return;
      }
      render(j);
    }
    function render(j) {
      const days = j.days || [], mx = Math.max(1, ...days.map((d) => Math.max(d.v, d.p)));
      const qs = D.quiz.map((q, i) => ({ i, ch: q.ch, q: q.q, p: j.perQ[i] })).filter((x) => x.p !== null);
      const hard = qs.slice().sort((a, b) => a.p - b.p).slice(0, 3);
      const chap = [1, 2, 3, 4, 5].map((c) => { const l = qs.filter((x) => x.ch === c); return { c, p: l.length ? Math.round(l.reduce((a, x) => a + x.p, 0) / l.length) : null }; });
      const bt = j.bucket || [0, 0, 0], bs = Math.max(1, bt[0] + bt[1] + bt[2]);
      const rd = (j.rating && j.rating.dist) || [0, 0, 0, 0, 0], rm = Math.max(1, ...rd);
      const mm = (sec) => (sec ? Math.floor(sec / 60) + " phút " + (sec % 60) + " giây" : "–");
      box.innerHTML = `
        <div class="row c" style="margin-bottom:10px"><button class="btn alt sm" id="admref" type="button">🔄 Cập nhật</button><button class="btn alt sm" id="admout" type="button">🔒 Thoát</button></div>
        <p class="note" style="text-align:center">Cập nhật lúc ${esc(j.at || "")}</p>
        <div class="kpis">
          <div class="kpi"><b>${j.visits}</b><span>Lượt truy cập</span></div>
          <div class="kpi"><b>${j.devices}</b><span>Thiết bị</span></div>
          <div class="kpi"><b>${j.plays}</b><span>Lượt làm thử thách</span></div>
          <div class="kpi"><b>${j.players}</b><span>Em đã làm</span></div>
          <div class="kpi"><b>${j.avgScore}</b><span>Điểm TB /10</span></div>
          <div class="kpi"><b>${j.rating.avg || "–"}★</b><span>${j.rating.n} đánh giá</span></div>
        </div>
        <div class="card"><h3>📅 14 ngày gần nhất</h3><div class="dchart" role="img" aria-label="Biểu đồ lượt truy cập và lượt làm thử thách 14 ngày">${days.map((d) => `<div class="dc"><div class="dcb"><i class="v" style="height:${Math.round(100 * d.v / mx)}%" title="${d.v} lượt truy cập"></i><i class="p" style="height:${Math.round(100 * d.p / mx)}%" title="${d.p} lượt làm"></i></div><span>${esc(d.d.slice(0, 5))}</span></div>`).join("")}</div><p class="note legend"><i class="v"></i> Truy cập <i class="p"></i> Làm thử thách</p></div>
        <div class="card"><h3>🎯 Phân bố điểm</h3>${bar(100 * bt[2] / bs, "8–10 điểm", bt[2] + " lượt", "g")}${bar(100 * bt[1] / bs, "5–7 điểm", bt[1] + " lượt", "y")}${bar(100 * bt[0] / bs, "Dưới 5", bt[0] + " lượt", "r")}<p class="note">Thời gian làm bài trung bình: ${mm(j.avgSec)}</p></div>
        <div class="card"><h3>📚 Tỉ lệ đúng theo chương</h3>${chap.map((c) => bar(c.p || 0, "Chương " + c.c, c.p === null ? "–" : c.p + "%", c.p !== null && c.p < 50 ? "r" : c.p !== null && c.p < 75 ? "y" : "g")).join("")}</div>
        ${hard.length ? `<div class="card"><h3>⚠️ Câu các em hay sai</h3><ol class="hardq">${hard.map((x) => `<li><b>${x.p}% đúng</b> · Chương ${x.ch}<br>${esc(x.q)}</li>`).join("")}</ol><p class="note">Gợi ý ôn lại các nội dung này trên lớp.</p></div>` : ""}
        <div class="card"><h3>🏫 Theo lớp</h3>${j.classes.length ? `<div class="tblwrap"><table class="adtbl"><thead><tr><th>Lớp</th><th>Lượt làm</th><th>Số em*</th><th>Điểm TB</th><th>Cao nhất</th></tr></thead><tbody>${j.classes.map((c) => `<tr><td>${esc(c.c)}</td><td>${c.n}</td><td>${c.devs}</td><td>${c.avg}</td><td>${c.best}</td></tr>`).join("")}</tbody></table></div><p class="note">*Số thiết bị đã làm (mỗi em thường dùng một thiết bị).</p>` : `<p class="note">Chưa có lớp nào nhập mã lớp.</p>`}</div>
        <div class="card"><h3>⭐ Đánh giá</h3>${[5, 4, 3, 2, 1].map((s) => bar(100 * rd[s - 1] / rm, s + " sao", rd[s - 1] + "", "y")).join("")}</div>
        <div class="row c"><button class="btn alt sm" id="admcsv" type="button">⬇️ Tải bảng theo lớp (CSV)</button></div>`;
      $("#admref").onclick = load; $("#admout").onclick = () => { setPw(""); login(); };
      $("#admcsv").onclick = () => {
        const rows = [["Lớp", "Lượt làm", "Số thiết bị", "Điểm TB", "Cao nhất"]].concat(j.classes.map((c) => [c.c, c.n, c.devs, c.avg, c.best]));
        const csv = "\ufeff" + rows.map((r) => r.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(",")).join("\r\n");
        const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "thong-ke-theo-lop.csv"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      };
    }
    load();
  };

  /* ---------- cỡ chữ + bảng nghĩa từ vựng ---------- */
  const FS = [1, 1.15, 1.3, 1.5];
  const canSay = "speechSynthesis" in window;
  function speakEn(w) { if (!canSay) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(w); u.lang = "en-US"; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) {} }
  let wsheet = null, wsT = null;
  function hideWord() { clearTimeout(wsT); if (wsheet) wsheet.classList.remove("on"); }
  function showWord(chId, k) {
    const c = D.chapters.find((x) => x.id === +chId); if (!c || !c.vocab[k]) return;
    const v = c.vocab[k];
    if (!S.vstat[v[0]]) { S.vstat[v[0]] = { b: 0, w: 0, t: Date.now() }; save(); }
    if (!wsheet) { wsheet = document.createElement("div"); wsheet.className = "wsheet"; wsheet.setAttribute("role", "status"); document.body.appendChild(wsheet); }
    wsheet.innerHTML = `<div class="wtxt"><b lang="en">${esc(v[0])}</b><span>${esc(v[1])}</span></div>${canSay ? `<button type="button" class="wsay" aria-label="Nghe phát âm ${esc(v[0])}">${ICON.vol}</button>` : ""}<button type="button" class="wx" aria-label="Đóng">✕</button>`;
    wsheet.classList.add("on");
    const sb = $(".wsay", wsheet); if (sb) sb.onclick = () => speakEn(v[0]);
    $(".wx", wsheet).onclick = hideWord;
    speakEn(v[0]);
    clearTimeout(wsT); wsT = setTimeout(hideWord, 9000);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".vw");
    if (b) { e.preventDefault(); showWord(b.dataset.ch, +b.dataset.k); }
    else if (wsheet && wsheet.classList.contains("on") && !(e.target.closest && e.target.closest(".wsheet"))) hideWord();
  });

  /* ---------- ôn từ vựng (lặp lại ngắt quãng đơn giản) ---------- */
  const allVocab = () => { const out = []; D.chapters.forEach((c) => c.vocab.forEach((v, k) => out.push({ w: v[0], m: v[1], ch: c.id, k, open: canOpen(c.id) }))); return out; };
  const isMet = (x) => { const P = S.prog[x.ch]; return !!(S.vstat[x.w] || (P && P.vocab && P.vocab[x.k])); };
  const boxOf = (x) => (S.vstat[x.w] ? S.vstat[x.w].b || 0 : 0);
  const needReview = () => allVocab().filter((x) => x.open && isMet(x) && boxOf(x) < 3);
  function markWord(x, ok) {
    const st = (S.vstat[x.w] = S.vstat[x.w] || { b: 0, w: 0 });
    if (ok) st.b = Math.min(4, (st.b || 0) + 1); else { st.b = 0; st.w = (st.w || 0) + 1; }
    st.t = Date.now();
  }
  const byBox = (arr) => shuffle(arr).sort((a, b) => boxOf(a) - boxOf(b));
  let R = null, M = null;
  views.review = () => {
    R = null; M = null;
    const V = allVocab(), met = V.filter((x) => x.open && isMet(x)), need = needReview();
    const dots = (x) => "●".repeat(Math.min(boxOf(x), 4)) + "○".repeat(4 - Math.min(boxOf(x), 4));
    main.innerHTML = `<section class="view quiz-wrap">
      <div class="title-wrap"><span class="kicker">Ôn từ vựng</span><h1>Từ nào cần ôn lại?</h1>
        <p class="note">Đã gặp <b>${met.length}</b>/${V.length} từ · <b>${need.length}</b> từ cần ôn. Từ nào sai nhiều sẽ được hỏi lại nhiều hơn.</p></div>
      ${levelHTML()}
      ${met.length < 3 ? `<div class="card">Bạn cần gặp ít nhất 3 từ để chơi. Hãy lật thẻ từ vựng hoặc chạm vào từ gạch chân trong lời thoại ở <a href="#/chuong/${firstOpen()}">chương đang học</a> nhé.</div>` : ""}
      <div class="gamegrid">
        <button class="btn gcard" id="gmc" type="button" ${met.length < 3 ? "disabled" : ""}><span class="gi">🎯</span><b>Trắc nghiệm</b><small>Nghe, đọc, chọn đúng · ${Math.min(8, met.length)} câu</small></button>
        <button class="btn gcard alt" id="gmt" type="button" ${met.length < 3 ? "disabled" : ""}><span class="gi">🧩</span><b>Ghép cặp</b><small>Nối từ với nghĩa · 6 cặp</small></button>
      </div>
      ${met.length ? `<div class="card"><h3>Từ của bạn</h3><ul class="wlist">${met.map((x) => `<li class="${boxOf(x) >= 3 ? "ok" : ""}"><b lang="en">${esc(x.w)}</b> <span>${esc(x.m)}</span><i aria-label="Mức nhớ ${boxOf(x)}/4">${dots(x)}</i></li>`).join("")}</ul></div>` : ""}
      <div class="row c"><a class="btn alt sm" href="#/muc-luc">☰ Về mục lục</a></div></section>`;
    $("#gmc").onclick = startReview; $("#gmt").onclick = startMatch;
  };
  function startReview() {
    const V = allVocab(), met = V.filter((x) => x.open && isMet(x));
    const items = byBox(met).slice(0, 8);
    const kinds = ["en2vi", "hear", "vi2en"];
    R = { i: 0, items, ok: 0, xp: 0, wrong: [], types: items.map((_, i) => { const t = kinds[i % 3]; return t === "hear" && !canSay ? "en2vi" : t; }), locked: false };
    reviewQ();
  }
  function reviewQ() {
    const V = allVocab(), x = R.items[R.i], t = R.types[R.i];
    const others = shuffle(V.filter((y) => y.w !== x.w && (t === "vi2en" || t === "hear" ? true : y.m !== x.m))).slice(0, 3);
    const opts = shuffle([x].concat(others));
    const txt = (y) => (t === "en2vi" ? y.m : y.w);
    const prompt = t === "en2vi" ? `Từ <b lang="en" class="bigw">${esc(x.w)}</b> nghĩa là gì? ${canSay ? `<button type="button" class="wsay inl" id="rsay" aria-label="Nghe phát âm">${ICON.vol}</button>` : ""}`
      : t === "hear" ? `Nghe và chọn từ đúng: <button type="button" class="btn sm" id="rsay">${ICON.vol} Nghe lại</button>`
      : `Từ tiếng Anh nào có nghĩa là <b class="bigw">“${esc(x.m)}”</b>?`;
    main.innerHTML = `<section class="view quiz-wrap">
      <div class="qhead"><span class="n">${R.i + 1}/${R.items.length}</span><span class="s">✔ Đúng: <span id="sc">${R.ok}</span></span></div>
      <div class="bar" aria-hidden="true"><i style="width:${(R.i / R.items.length) * 100}%"></i></div>
      <h2 class="qtext" id="qt">${prompt}</h2>
      <ul class="opts" role="group" aria-labelledby="qt">${opts.map((y, k) => `<li><button class="opt" type="button" data-w="${esc(y.w)}"><span class="L">${letters[k]}</span><span ${t === "en2vi" ? "" : 'lang="en"'}>${esc(txt(y))}</span></button></li>`).join("")}</ul>
      <div id="fb" aria-live="assertive"></div><div class="row c" style="margin-top:18px" id="nxt"></div></section>`;
    const rs = $("#rsay"); if (rs) rs.onclick = () => speakEn(x.w);
    if (t === "hear" || t === "en2vi") speakEn(x.w);
    R.locked = false;
    $$(".opt").forEach((b) => (b.onclick = () => {
      if (R.locked) return; R.locked = true;
      const ok = b.dataset.w === x.w;
      markWord(x, ok); if (ok) { R.ok++; R.xp += 2; } else R.wrong.push(x);
      $$(".opt").forEach((o) => { o.disabled = true; if (o.dataset.w === x.w) o.classList.add("right"); else if (o === b) o.classList.add("wrong"); else o.classList.add("dim"); });
      $("#sc").textContent = R.ok;
      $("#fb").innerHTML = `<div class="feedback ${ok ? "ok" : "no"}"><img src="${ok ? SOC : BC}" alt=""><div><h3>${ok ? "Chính xác! +2 XP" : "Cùng ghi nhớ nhé!"}</h3><p style="margin:0"><b lang="en">${esc(x.w)}</b> = ${esc(x.m)}</p></div></div>`;
      const last = R.i === R.items.length - 1;
      $("#nxt").innerHTML = `<button class="btn ${last ? "coral" : ""}" id="nx" type="button">${last ? "Xem kết quả 🎉" : "Câu tiếp theo →"}</button>`;
      $("#nx").focus(); save();
      $("#nx").onclick = () => { if (last) return reviewDone(R.ok + "/" + R.items.length + " câu đúng", R.xp, R.wrong); R.i++; reviewQ(); window.scrollTo(0, 0); };
    }));
  }
  function reviewDone(summary, xp, wrong) {
    S.rxp = (S.rxp || 0) + xp; save();
    main.innerHTML = `<section class="view result"><div class="rpic"><img class="av" src="${SOC}" alt="Sóc Nâu"><img class="av" src="${BC}" alt="Bồ Câu"></div>
      <h1>Ôn xong rồi!</h1><div class="score"><b>${esc(summary)}</b></div>
      <div class="chips" style="justify-content:center;margin:8px 0"><span class="chip">✨ +${xp} XP</span></div>${levelHTML()}
      ${wrong.length ? `<div class="card review"><b>Những từ cần nhớ thêm:</b><ul>${wrong.map((x) => `<li><b lang="en">${esc(x.w)}</b> = ${esc(x.m)} · <a href="#/chuong/${x.ch}">Chương ${x.ch}</a></li>`).join("")}</ul></div>` : `<p>Không sai từ nào, thật tuyệt vời! 🎉</p>`}
      <div class="row c" style="margin-top:20px"><button class="btn" id="again" type="button">↻ Ôn tiếp</button><a class="btn alt" href="#/muc-luc">Về mục lục</a></div></section>`;
    $("#again").onclick = () => views.review();
  }
  function startMatch() {
    const V = allVocab(), open = V.filter((x) => x.open);
    let pool = byBox(open.filter(isMet)).slice(0, 6);
    if (pool.length < 6) pool = pool.concat(shuffle(open.filter((x) => !pool.includes(x))).slice(0, 6 - pool.length));
    M = { items: pool, left: shuffle(pool), right: shuffle(pool), sel: null, done: {}, bad: {}, mistakes: 0, t0: Date.now() };
    matchRender();
  }
  function matchRender() {
    const sel = M.sel;
    const btn = (x, side) => `<button type="button" class="mbtn${M.done[x.w] ? " done" : ""}${sel && sel.side === side && sel.w === x.w ? " sel" : ""}" data-side="${side}" data-w="${esc(x.w)}" ${M.done[x.w] ? "disabled" : ""} ${side === "L" ? 'lang="en"' : ""}>${esc(side === "L" ? x.w : x.m)}</button>`;
    main.innerHTML = `<section class="view quiz-wrap"><div class="qhead"><span class="n">Ghép cặp</span><span class="s">Đã ghép: ${Object.keys(M.done).length}/${M.items.length} · Nhầm: ${M.mistakes}</span></div>
      <p class="note" style="text-align:center">Chạm một từ, rồi chạm nghĩa tương ứng.</p>
      <div class="mgrid"><div class="mcol">${M.left.map((x) => btn(x, "L")).join("")}</div><div class="mcol">${M.right.map((x) => btn(x, "R")).join("")}</div></div></section>`;
    $$(".mbtn").forEach((b) => (b.onclick = () => {
      const side = b.dataset.side, w = b.dataset.w;
      if (side === "L") speakEn(w);
      if (!M.sel || M.sel.side === side) { M.sel = { side, w }; return matchRender(); }
      const ok = M.sel.w === w; const first = M.sel.w;
      if (ok) { M.done[w] = true; M.sel = null; if (Object.keys(M.done).length === M.items.length) return matchDone(); matchRender(); }
      else { M.mistakes++; M.bad[first] = true; M.bad[w] = true; M.sel = null; matchRender(); $$(".mbtn").forEach((o) => { if (o.dataset.w === first || o.dataset.w === w) o.classList.add("shake"); }); }
    }));
  }
  function matchDone() {
    let xp = 0; const wrong = [];
    M.items.forEach((x) => { const ok = !M.bad[x.w]; markWord(x, ok); if (ok) xp += 1; else wrong.push(x); });
    reviewDone("Ghép đủ " + M.items.length + " cặp · nhầm " + M.mistakes + " lần · " + Math.round((Date.now() - M.t0) / 1000) + " giây", xp, wrong);
  }

  /* Hộ chiếu khám phá */
  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; });
  views.passport = () => {
    const medal = S.best === null ? null : D.results.find((r) => S.best >= r.min);
    const icons = ["🏛️", "🗺️", "📸", "🍜", "🚇"];
    const n = stampCount();
    main.innerHTML = `<section class="view stack">
      <div class="title-wrap"><span class="kicker">Hộ chiếu khám phá</span><h1>Bạn đã thu thập ${n}/5 tem</h1><p class="note">Xem hết tranh, lật hết từ vựng và nghe hết audio của một chương để nhận tem. Không cần nhập tên!</p></div>
      ${levelHTML()}
      <div class="stamps">${D.chapters.map((c, i) => `<div class="stamp ${S.done[c.id] ? "got" : ""}"><div class="ic" aria-hidden="true">${icons[i]}</div><b>Chương ${c.id}</b><small>${esc(c.vi)}</small><br><small>${S.done[c.id] ? "✓ Đã nhận" : "Chưa nhận"}</small></div>`).join("")}</div>
      <div class="card badge"><div class="medal ${medal ? medal.badge : ""}" aria-hidden="true">${medal ? (medal.badge === "gold" ? "🥇" : medal.badge === "silver" ? "🥈" : "🥉") : "❔"}</div>
        <div>${medal ? `<b>${esc(medal.title)}</b><br>Thành tích tốt nhất: ${S.best}/10 · Đã chơi ${S.plays} lần` : `<b>Chưa có huy hiệu</b><br>Hoàn thành thử thách để nhận huy hiệu nhé!`}</div></div>
      ${n === 5 ? '<div class="card" style="background:var(--leaf-l)"><b>🎉 Bạn đã đủ 5 tem! Nhà khám phá TP. Hồ Chí Minh thực thụ.</b></div>' : ""}
      <div class="row c"><button class="btn" id="sharebtn" type="button">🖼 Tạo ảnh thành tích</button><a class="btn alt" href="#/xep-hang">🏆 Xếp hạng lớp</a></div><div id="sharebox"></div>
      <div class="card"><h3>📲 Dùng không cần mạng</h3>
        <p class="note" style="margin-top:0">Tải trước audio để nghe offline trong lớp học hoặc trên xe.</p>
        <div class="row"><button class="btn sm" id="dl" type="button">⬇ Tải audio về máy</button><button class="btn sm alt" id="inst" type="button" hidden>Cài app lên màn hình</button></div>
        <p class="note" id="dlnote"></p>
        <p class="note">iPhone/iPad: mở bằng Safari → nút Chia sẻ → “Thêm vào Màn hình chính”.</p></div>
      <div class="row c"><button class="btn sm alt" id="reset" type="button">Xóa tiến trình trên máy này</button></div>
    </section>`;
    if (deferredInstall) { $("#inst").hidden = false; $("#inst").onclick = () => { deferredInstall.prompt(); deferredInstall = null; $("#inst").hidden = true; }; }
    $("#dl").onclick = downloadAudio; mountShare();
    $("#reset").onclick = () => {
      if (!confirm("Xóa các tem, vị trí đang đọc và thành tích trên máy này?")) return;
      const dev = S.dev; S = Object.assign({}, defaults, { dev }); save(); views.passport();
    };
  };
  async function downloadAudio() {
    const note = $("#dlnote"), btn = $("#dl");
    if (!("caches" in window)) { note.textContent = "Trình duyệt này chưa hỗ trợ tải offline."; return; }
    btn.disabled = true; let ok = 0, miss = 0;
    try {
      const c = await caches.open("bcsn-audio-v1");
      const files = []; for (let i = 1; i <= 5; i++) files.push("audio/vi-" + i + ".mp3", "audio/en-" + i + ".mp3");
      for (const f of files) {
        note.textContent = "Đang tải… " + (ok + miss) + "/" + files.length;
        try { const r = await fetch(f, { cache: "no-store" }); if (r.ok && (r.headers.get("content-type") || "").includes("audio")) { await c.put(f, r.clone()); ok++; } else miss++; } catch (e) { miss++; }
      }
    } catch (e) {}
    note.textContent = "Đã tải " + ok + " audio." + (miss ? " " + miss + " file chưa có hoặc tải lỗi." : " Giờ có thể nghe offline!");
    btn.disabled = false;
  }

  /* ---------- bộ định tuyến ---------- */
  const titles = { home: "Bồ Câu & Sóc Nâu – TP. Hồ Chí Minh, thành phố tôi yêu", toc: "Mục lục", meet: "Làm quen", book: "Đọc toàn bộ truyện", end: "Hẹn gặp lại", quiz: "Thử thách", result: "Kết quả", about: "Giới thiệu", passport: "Hộ chiếu khám phá", rank: "Bảng xếp hạng lớp", review: "Ôn từ vựng", help: "Hướng dẫn sử dụng", admin: "Quản trị" };
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    stopAudio(); lbClose(); curViewer = null; hideWord();
    au.onerror = au.onended = au.onpause = au.onplay = au.ontimeupdate = au.onloadedmetadata = au.onseeked = null;
    const h = (location.hash || "#/").replace(/^#\/?/, "").split("/");
    let name = "home", arg;
    switch (h[0]) {
      case "": name = "home"; break;
      case "muc-luc": name = "toc"; break;
      case "lam-quen": name = "meet"; break;
      case "chuong": name = "chapter"; arg = parseInt(h[1], 10); break;
      case "doc-truyen": name = "book"; break;
      case "ket-thuc": name = "end"; break;
      case "thu-thach": name = "quiz"; break;
      case "ket-qua": name = "result"; break;
      case "gioi-thieu": name = "about"; break;
      case "ho-chieu": name = "passport"; break;
      case "xep-hang": name = "rank"; break;
      case "on-tu": name = "review"; break;
      case "huong-dan": name = "help"; break;
      case "quan-tri": name = "admin"; break;
      default: name = "home";
    }
    if (name === "chapter" && arg >= 1 && arg <= 5 && !canOpen(arg)) { const f = firstOpen(); toast("🔒 Hãy hoàn thành Chương " + f + " trước nhé!"); location.replace("#/chuong/" + f); return; }
    if (name === "end" && !S.done[5]) { const f = firstOpen(); toast("🔒 Hãy hoàn thành Chương " + f + " trước nhé!"); location.replace("#/chuong/" + f); return; }
    views[name](arg);
    const ch = name === "chapter" && D.chapters.find((c) => c.id === arg);
    document.title = (ch ? "Chương " + arg + ": " + ch.vi : titles[name]) + (name === "home" ? "" : " – Bồ Câu & Sóc Nâu");
    window.scrollTo(0, 0);
    if (name !== "quiz") main.focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", route);
  appReady = true; lvlCheck();
  route();
  renderStats();
  countVisit().then(loadStats);
  flushQueue();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
