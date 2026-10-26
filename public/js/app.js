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
  const defaults = { pos: {}, done: {}, prog: {}, autoSync: true, best: null, plays: 0, lang: "bi", speed: 1, vol: 1, last: null, dev: null };
  let S = Object.assign({}, defaults);
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  if (!S.dev) S.dev = "d" + Math.random().toString(36).slice(2, 10);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
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
  const APP_VERSION = { v: "5", date: "26/10/2026", note: "Nút đọc trên tranh, ảnh tự chuyển theo lời đọc" };
  (() => { const f = document.querySelector("footer"); if (f) f.insertAdjacentHTML("beforeend", `<div class="ver" title="${APP_VERSION.note}">Phiên bản ${APP_VERSION.v} · cập nhật ${APP_VERSION.date}</div>`); })();

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
    function render() {
      const it = items[i];
      img.src = it.src; img.alt = it.alt;
      ind.textContent = (i + 1) + "/" + items.length;
      lab.textContent = it.label || "";
      prev.disabled = i === 0; next.disabled = i === items.length - 1;
      $$("i", dots).forEach((d, k) => d.classList.toggle("on", k === i));
      [i - 1, i + 1].forEach((k) => { if (items[k]) { const p = new Image(); p.src = items[k].src; } });
      if (onChange) onChange(i);
    }
    const go = (d) => { const n = i + d; if (n < 0 || n >= items.length) return; i = n; render(); };
    prev.onclick = () => go(-1); next.onclick = () => go(1);
    const openZoom = () => { LB.opener = $(".v-zoom", root); lbOpen(items, i, (n) => { i = n; render(); }); };
    $(".v-zoom", root).onclick = openZoom; img.onclick = openZoom;
    let x0 = null;
    const st = $(".stage", root);
    st.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    st.addEventListener("pointerup", (e) => { if (x0 === null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); });
    st.addEventListener("pointercancel", () => { x0 = null; });
    const set = (n) => { if (n < 0 || n >= items.length || n === i) return; i = n; render(); };
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
  function sayHTML(lines, lang) {
    // lines: [{av, vi, en}]
    return `<div class="say">${lines.map((l, k) => {
      const cls = l.who === "soc" ? "soc" : "bc";
      let body = "";
      if (lang === "vi") body = esc(l.vi);
      else if (lang === "en") body = `<span lang="en">${esc(l.en)}</span>`;
      else body = esc(l.vi) + `<span class="l2" lang="en">${esc(l.en)}</span>`;
      return `<div class="line"><img src="${l.who === "soc" ? SOC : BC}" alt="${l.who === "soc" ? "Sóc Nâu" : "Bồ Câu"}"><div class="bubble ${cls}">${body}</div></div>`;
    }).join("")}</div>`;
  }
  function chSayLines(ch) {
    return [0, 1].map((k) => ({ who: k === 0 ? "soc" : "bc", vi: ch.say.vi[k], en: ch.say.en[k] }));
  }
  function fullTextHTML(ch, lang) {
    const T = ch.text;
    const ti = lang === "vi" ? esc(T.title[0]) : lang === "en" ? `<span lang="en">${esc(T.title[1])}</span>` : `${esc(T.title[0])} · <span lang="en" class="en">${esc(T.title[1])}</span>`;
    const ps = T.paras.map((p) => {
      if (lang === "vi") return `<div class="bi-para"><p>${esc(p[0])}</p></div>`;
      if (lang === "en") return `<div class="bi-para"><p lang="en" class="en-p">${esc(p[1])}</p></div>`;
      return `<div class="bi-para"><p>${esc(p[0])}</p><p lang="en" class="en-p">${esc(p[1])}</p></div>`;
    }).join("");
    return `<h3>${ti}</h3><div class="${lang === "bi" ? "bi" : ""}">${ps}</div>
      <div class="src"><b>Nguồn chính thức / Official sources:</b><ul>${T.sources.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
      <p class="note"><a href="${ch.pdf}" target="_blank" rel="noopener">Mở bản PDF song ngữ trên Google Drive ↗</a></p>`;
  }

  /* ---------- tem hộ chiếu ---------- */
  const stampCount = () => Object.keys(S.done).length;
  const firstOpen = () => { for (let k = 1; k <= 5; k++) if (!S.done[k]) return k; return 5; };
  const canOpen = (n) => n <= 1 || !!S.done[n - 1];

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
  views.toc = () => {
    main.innerHTML = `<section class="view">
      <div class="title-wrap"><h1>Hôm nay, mình đi đâu?</h1><p class="en" lang="en" style="font-weight:700">Where shall we go today?</p></div>
      <ol class="toc">${D.chapters.map((c) => { const open = canOpen(c.id); const tag = open ? "a" : "div"; return `<li><${tag} class="chcard${open ? "" : " locked"}" ${open ? `href="#/chuong/${c.id}"` : 'aria-disabled="true"'}>
        <div class="pic"><img src="${c.thumb}" alt="" loading="lazy"><span class="num">Chương ${c.id}</span>${S.done[c.id] ? '<span class="done">✓ Hoàn thành</span>' : !open ? '<span class="lock">🔒</span>' : ""}</div>
        <div class="bd"><h3>${esc(c.vi)}</h3><p class="e en" lang="en">${esc(c.en)}</p><p>${open ? esc(c.desc) : "Hoàn thành Chương " + (c.id - 1) + " để mở chương này."}</p></div></${tag}></li>`; }).join("")}</ol>
      <div class="minor"><div class="row c">
        <a class="btn alt sm" href="#/lam-quen">👋 Làm quen Bồ Câu và Sóc Nâu</a>
        <a class="btn alt sm" href="#/doc-truyen">📖 Đọc toàn bộ truyện</a>
        <a class="btn sm" href="#/thu-thach">⭐ Thử thách nhớ nhanh</a>
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
    let lastIdx = -1;
    let lang = S.lang, track = "vi", playing = false, dragging = false;
    const nextHref = n < 5 ? "#/chuong/" + (n + 1) : "#/ket-thuc";
    main.innerHTML = `<section class="view">
      <div class="chhead"><span class="kicker">Chương ${n}</span><h1>${esc(ch.vi)}</h1><p class="e" lang="en">${esc(ch.en)}</p></div>
      ${viewerHTML("cv")}

      <div class="panel"><div class="row" style="justify-content:space-between"><h2>💬 Lời của hai bạn</h2>${langSeg(lang)}</div>
        <div id="say"></div>
        <details class="full" id="full"><summary>Đọc lời đầy đủ của chương</summary><div id="fulltxt"></div></details>
      </div>

      <div class="panel"><h2>🎧 Nghe audio</h2>
        <div class="audio">
          <div class="seg" role="group" aria-label="Chọn giọng audio" style="margin-bottom:12px">
            <button type="button" data-track="vi" aria-pressed="true">Việt</button><button type="button" data-track="en" aria-pressed="false">English</button></div>
          <div class="aud-row">
            <button class="play" id="play" type="button" aria-label="Phát">${ICON.play}</button>
            <div class="seek"><input id="seek" type="range" min="0" max="100" step="0.1" value="0" aria-label="Thanh tua audio"></div>
            <span class="time" id="time">0:00 / 0:00</span>
          </div>
          <div class="aud-opts">
            <label class="vol">${ICON.vol}<span class="sr">Âm lượng</span><input id="vol" type="range" min="0" max="1" step="0.05" value="${S.vol}"></label>
            <div class="seg speed" role="group" aria-label="Tốc độ">${[0.75, 1, 1.25, 1.5].map((v) => `<button type="button" data-speed="${v}" aria-pressed="${S.speed === v}">${v}×</button>`).join("")}</div>
          </div>
          ${ch.sync ? `<label class="sync"><input type="checkbox" id="autosync" ${S.autoSync ? "checked" : ""}> Tranh tự chuyển theo lời đọc</label>` : ""}
          <p class="note warn" id="anote" hidden></p>
        </div>
      </div>

      <div class="panel"><h2>🔤 Từ vựng Anh–Việt</h2>
        <p class="note" style="margin-top:-6px">Chạm vào thẻ để xem nghĩa tiếng Việt. Bấm loa để nghe phát âm.</p>
        <div class="vgrid">${ch.vocab.map((v, k) => `<div style="position:relative"><button class="vcard" type="button" aria-pressed="false" data-k="${k}"><span class="w" lang="en">${esc(v[0])}</span><span class="hint">chạm để xem nghĩa</span><span class="m">${esc(v[1])}</span></button><button class="say-w" type="button" data-w="${esc(v[0])}" aria-label="Nghe phát âm ${esc(v[0])}">${ICON.vol}</button></div>`).join("")}</div>
      </div>

      <div class="panel"><div class="card req" id="req"><h3>🎯 Hoàn thành chương để mở tiếp</h3>
        <ul class="reqlist"><li data-r="img"></li><li data-r="vocab"></li><li data-r="audio"></li></ul>
        <div class="bar" aria-hidden="true"><i id="reqbar" style="width:0"></i></div><p class="note" id="reqmsg" style="margin:6px 0 0"></p></div></div>
      <div class="endnav"><a class="btn alt" href="#/muc-luc">☰ Về mục lục</a><a class="btn locked" id="nextbtn" href="${nextHref}">${n < 5 ? "Chương tiếp theo →" : "Kết thúc hành trình →"}</a></div>
    </section>`;

    // tranh + lưu vị trí + tem
    mountViewer("cv", ch.images, S.pos[n] || 0, (i) => {
      S.pos[n] = i; if (!P.seen[i]) P.seen[i] = true; save(); updateReq();
    });

    // lời
    const renderText = () => {
      $("#say").innerHTML = sayHTML(chSayLines(ch), lang);
      $("#fulltxt").innerHTML = fullTextHTML(ch, lang);
      $$("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
    };
    renderText();
    $$("[data-lang]").forEach((b) => (b.onclick = () => { lang = b.dataset.lang; S.lang = lang; save(); renderText(); }));

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
    const play = $("#play"), seek = $("#seek"), time = $("#time"), note = $("#anote");
    // nút đọc ngay trên tranh
    const stageEl = $("#cv .stage");
    stageEl.insertAdjacentHTML("beforeend", `<button class="readbtn" id="readbtn" type="button"></button><div class="readprog" aria-hidden="true"><i id="readbar"></i></div>`);
    const rb = $("#readbtn");
    const setPlayUI = (p) => {
      playing = p; play.innerHTML = p ? ICON.pause : ICON.play; play.setAttribute("aria-label", p ? "Tạm dừng" : "Phát");
      rb.innerHTML = p ? "⏸ Tạm dừng" : "🔊 Đọc cho mình nghe"; rb.setAttribute("aria-pressed", String(p)); rb.classList.toggle("on", p);
      if (p) rafLoop(); 
    };
    const rafLoop = () => { if (!playing) return; syncImage(); const b = $("#readbar"); if (b && au.duration) b.style.width = (au.currentTime / au.duration) * 100 + "%"; requestAnimationFrame(rafLoop); };
    const loadTrack = (t) => {
      track = t; lastIdx = -1; stopAudio(); setPlayUI(false); note.hidden = true;
      au.src = "audio/" + t + "-" + n + ".mp3"; au.preload = "metadata"; au.playbackRate = S.speed; au.volume = S.vol;
      seek.value = 0; time.textContent = "0:00 / 0:00";
      $$("[data-track]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.track === t));
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
    au.onplay = () => { lastIdx = -1; setPlayUI(true); };
    au.onseeked = () => { lastIdx = -1; syncImage(); };
    play.onclick = () => { if (au.paused) { note.hidden = true; au.play().catch(() => {}); } else au.pause(); };
    rb.onclick = (e) => { e.stopPropagation(); play.onclick(); };
    rb.onpointerdown = (e) => e.stopPropagation(); rb.onpointerup = (e) => e.stopPropagation();
    seek.oninput = () => { dragging = true; time.textContent = fmt(seek.value) + " / " + fmt(au.duration); };
    seek.onchange = () => { au.currentTime = +seek.value; dragging = false; };
    $("#vol").oninput = (e) => { S.vol = +e.target.value; au.volume = S.vol; save(); };
    $$("[data-speed]").forEach((b) => (b.onclick = () => { S.speed = +b.dataset.speed; au.playbackRate = S.speed; save(); $$("[data-speed]").forEach((x) => x.setAttribute("aria-pressed", x === b)); }));
    $$("[data-track]").forEach((b) => (b.onclick = () => { if (b.dataset.track !== track) loadTrack(b.dataset.track); }));
    function syncImage() {
      const pts = ch.sync && ch.sync[track];
      if (!pts || !S.autoSync || !curViewer || (au.paused && au.currentTime < 0.05)) return;
      let idx = 0; for (const pt of pts) { if (au.currentTime >= pt[0]) idx = pt[1]; else break; }
      if (idx !== lastIdx) { lastIdx = idx; curViewer.set(idx); }
    }
    const as = $("#autosync"); if (as) as.onchange = () => { S.autoSync = as.checked; save(); lastIdx = -1; };
    loadTrack("vi");
    updateReq();

    // từ vựng
    $$(".vcard").forEach((b) => (b.onclick = () => { b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); if (!P.vocab[b.dataset.k]) { P.vocab[b.dataset.k] = true; save(); updateReq(); } }));
    $$(".vcard").forEach((b) => { if (P.vocab[b.dataset.k]) b.setAttribute("aria-pressed", "true"); });
    const canSay = "speechSynthesis" in window;
    $$(".say-w").forEach((b) => { if (!canSay) { b.hidden = true; return; } b.onclick = () => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(b.dataset.w); u.lang = "en-US"; u.rate = 0.85; speechSynthesis.speak(u); } catch (e) {} }; });

    cleanup = () => { try { speechSynthesis.cancel(); } catch (e) {} };
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
  views.quiz = () => {
    Q = null;
    quizIntro();
  };
  function quizIntro() {
    main.innerHTML = `<section class="view quiz-wrap">
      <div class="title-wrap"><span class="kicker">Thử thách nhớ nhanh</span><h1>Bạn hiểu thành phố đến đâu?</h1>
        <p style="font-size:1.15rem;font-weight:700">10 câu hỏi vui. Mỗi câu trả lời là một điều mình nhớ thêm!</p></div>
      <div class="card"><div class="who"><img src="${SOC}" alt="Sóc Nâu"><div class="bubble soc">Chọn một đáp án cho mỗi câu hỏi. Bồ Câu và Sóc Nâu sẽ bật mí lời giải ngay sau đó.</div></div></div>
      ${S.best !== null ? `<p class="row c" style="margin-top:14px"><span class="best">🏆 Thành tích tốt nhất: ${S.best}/10</span></p>` : ""}
      <div class="quiz-pics"><button type="button" data-q="22" aria-label="Xem tranh thử thách 1"><img src="img/p23.jpg" alt="${esc(D.img(23).alt)}" loading="lazy"></button><button type="button" data-q="23" aria-label="Xem tranh thử thách 2"><img src="img/p24.jpg" alt="${esc(D.img(24).alt)}" loading="lazy"></button></div>
      <div class="row c"><button class="btn" id="qstart" type="button">▶ Bắt đầu thử thách</button><a class="btn alt" href="#/muc-luc">Đọc các chương trước</a></div></section>`;
    $("#qstart").onclick = startQuiz;
    $$(".quiz-pics button").forEach((b) => (b.onclick = () => { LB.opener = b; lbOpen([D.img(23), D.img(24)], +b.dataset.q - 22); }));
  }
  function startQuiz() {
    Q = { i: 0, score: 0, ans: [], t0: Date.now(), order: D.quiz.map((q) => shuffle([0, 1, 2, 3])), locked: false };
    quizQuestion();
  }
  function quizQuestion() {
    const q = D.quiz[Q.i], ord = Q.order[Q.i];
    main.innerHTML = `<section class="view quiz-wrap">
      <div class="qhead"><span class="n" aria-label="Câu ${Q.i + 1} trên 10">${Q.i + 1}/10</span><span class="s">✔ Đúng: <span id="sc">${Q.score}</span></span></div>
      <div class="bar" aria-hidden="true"><i style="width:${(Q.i / 10) * 100}%"></i></div>
      <h2 class="qtext" id="qt">${esc(q.q)}</h2>
      <ul class="opts" role="group" aria-labelledby="qt">${ord.map((oi, k) => `<li><button class="opt" type="button" data-k="${k}"><span class="L">${letters[k]}</span><span>${esc(q.o[oi])}</span></button></li>`).join("")}</ul>
      <div id="fb" aria-live="assertive"></div>
      <div class="row c" style="margin-top:18px" id="nxt"></div></section>`;
    $$(".opt").forEach((b) => (b.onclick = () => answer(+b.dataset.k)));
  }
  function answer(k) {
    if (Q.locked) return; Q.locked = true;
    const q = D.quiz[Q.i], ord = Q.order[Q.i];
    const ok = ord[k] === q.a;
    const rightK = ord.indexOf(q.a);
    Q.ans.push(ok); if (ok) Q.score++;
    $$(".opt").forEach((b, i) => {
      b.disabled = true;
      if (i === rightK) b.classList.add("right"); else if (i === k) b.classList.add("wrong"); else b.classList.add("dim");
    });
    $("#sc").textContent = Q.score;
    $("#fb").innerHTML = `<div class="feedback ${ok ? "ok" : "no"}"><img src="${ok ? SOC : BC}" alt="${ok ? "Sóc Nâu" : "Bồ Câu"}"><div><h3>${ok ? "Đúng rồi!" : "Cùng ghi nhớ nhé!"}</h3><p style="margin:0">${esc(q.e)}</p>${ok ? "" : `<p class="note" style="margin:6px 0 0">Đáp án đúng là <b>${letters[rightK]}</b>. Xem lại Chương ${q.ch} để nhớ kỹ hơn nhé.</p>`}</div></div>`;
    const last = Q.i === 9;
    $("#nxt").innerHTML = `<button class="btn ${last ? "coral" : ""}" id="nx" type="button">${last ? "Xem kết quả 🎉" : "Câu tiếp theo →"}</button>`;
    $("#nx").focus();
    $("#nx").onclick = () => {
      if (last) return finishQuiz();
      Q.i++; Q.locked = false; quizQuestion(); window.scrollTo(0, 0);
    };
  }
  function finishQuiz() {
    S.plays = (S.plays || 0) + 1;
    if (S.best === null || Q.score > S.best) S.best = Q.score;
    Q.done = true; Q.dur = Math.round((Date.now() - Q.t0) / 1000);
    S.lastScore = { score: Q.score, ans: Q.ans };
    save();
    submitScore({ app: "bcsn", dev: S.dev, attempt: S.plays, score: Q.score, total: 10, ans: Q.ans.map((x) => (x ? 1 : 0)), sec: Q.dur, ts: new Date().toISOString() });
    location.hash = "#/ket-qua";
  }

  /* Trang 11 – Kết quả */
  views.result = () => {
    const R = S.lastScore;
    if (!R) return location.replace("#/thu-thach");
    const tier = D.results.find((r) => R.score >= r.min);
    const stars = tier.badge === "gold" ? 3 : tier.badge === "silver" ? 2 : 1;
    const wrongCh = [...new Set(R.ans.map((ok, i) => (ok ? null : D.quiz[i].ch)).filter(Boolean))];
    main.innerHTML = `<section class="view result">
      <div class="rpic"><img class="av" src="${SOC}" alt="Sóc Nâu"><img class="av" src="${BC}" alt="Bồ Câu"></div>
      <div class="stars" aria-label="${stars} trên 3 ngôi sao">${"⭐".repeat(stars)}${"☆".repeat(3 - stars)}</div>
      <h1>Hành trình đã hoàn thành!</h1>
      <div class="score">Bạn trả lời đúng <b>${R.score}</b>/10 câu</div>
      <div class="card" style="margin:12px 0"><h3>${esc(tier.title)}</h3><p style="margin:0">${esc(tier.text)}</p></div>
      <span class="best">🏆 Thành tích tốt nhất: ${S.best}/10</span>
      ${wrongCh.length ? `<div class="card review"><b>Muốn nhớ thêm? Đọc lại:</b><ul>${wrongCh.map((c) => `<li><a href="#/chuong/${c}">Chương ${c}: ${esc(D.chapters[c - 1].vi)}</a></li>`).join("")}</ul></div>` : `<p>Bạn không sai câu nào, thật tuyệt vời! 🎉</p>`}
      ${CFG.SHEETS_URL ? '<p class="note">Điểm được ghi ẩn danh (không có tên) để thầy cô thống kê.</p>' : ""}
      <div style="margin-top:16px">${rateHTML()}</div>
      <div class="row c" style="margin-top:20px"><button class="btn" id="again" type="button">↻ Chơi lại</button><a class="btn leaf" href="#/muc-luc">Khám phá tiếp</a><a class="btn alt" href="#/">Về trang chủ</a></div></section>`;
    $("#again").onclick = () => { S.lastScore = null; save(); location.hash = "#/thu-thach"; };
    mountRate();
  };

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
        <div class="row"><a class="btn alt sm" href="#/">Về trang chủ</a></div>
      </div></section>`;
    mountRate();
  };

  /* Hộ chiếu khám phá */
  let deferredInstall = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; });
  views.passport = () => {
    const medal = S.best === null ? null : D.results.find((r) => S.best >= r.min);
    const icons = ["🏛️", "🗺️", "📸", "🍜", "🚇"];
    const n = stampCount();
    main.innerHTML = `<section class="view stack">
      <div class="title-wrap"><span class="kicker">Hộ chiếu khám phá</span><h1>Bạn đã thu thập ${n}/5 tem</h1><p class="note">Xem hết tranh, lật hết từ vựng và nghe hết audio của một chương để nhận tem. Không cần nhập tên!</p></div>
      <div class="stamps">${D.chapters.map((c, i) => `<div class="stamp ${S.done[c.id] ? "got" : ""}"><div class="ic" aria-hidden="true">${icons[i]}</div><b>Chương ${c.id}</b><small>${esc(c.vi)}</small><br><small>${S.done[c.id] ? "✓ Đã nhận" : "Chưa nhận"}</small></div>`).join("")}</div>
      <div class="card badge"><div class="medal ${medal ? medal.badge : ""}" aria-hidden="true">${medal ? (medal.badge === "gold" ? "🥇" : medal.badge === "silver" ? "🥈" : "🥉") : "❔"}</div>
        <div>${medal ? `<b>${esc(medal.title)}</b><br>Thành tích tốt nhất: ${S.best}/10 · Đã chơi ${S.plays} lần` : `<b>Chưa có huy hiệu</b><br>Hoàn thành thử thách để nhận huy hiệu nhé!`}</div></div>
      ${n === 5 ? '<div class="card" style="background:var(--leaf-l)"><b>🎉 Bạn đã đủ 5 tem! Nhà khám phá TP.HCM thực thụ.</b></div>' : ""}
      <div class="card"><h3>📲 Dùng không cần mạng</h3>
        <p class="note" style="margin-top:0">Tải trước audio để nghe offline trong lớp học hoặc trên xe.</p>
        <div class="row"><button class="btn sm" id="dl" type="button">⬇ Tải audio về máy</button><button class="btn sm alt" id="inst" type="button" hidden>Cài app lên màn hình</button></div>
        <p class="note" id="dlnote"></p>
        <p class="note">iPhone/iPad: mở bằng Safari → nút Chia sẻ → “Thêm vào Màn hình chính”.</p></div>
      <div class="row c"><button class="btn sm alt" id="reset" type="button">Xóa tiến trình trên máy này</button></div>
    </section>`;
    if (deferredInstall) { $("#inst").hidden = false; $("#inst").onclick = () => { deferredInstall.prompt(); deferredInstall = null; $("#inst").hidden = true; }; }
    $("#dl").onclick = downloadAudio;
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
  const titles = { home: "Bồ Câu & Sóc Nâu – TP.HCM, thành phố tôi yêu", toc: "Mục lục", meet: "Làm quen", book: "Đọc toàn bộ truyện", end: "Hẹn gặp lại", quiz: "Thử thách", result: "Kết quả", about: "Giới thiệu", passport: "Hộ chiếu khám phá" };
  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    stopAudio(); lbClose(); curViewer = null;
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
  route();
  renderStats();
  countVisit().then(loadStats);
  flushQueue();

  if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
