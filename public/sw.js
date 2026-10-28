/* Service worker: dùng offline. Đổi VERSION mỗi lần cập nhật nội dung. */
const VERSION = "v26";
const SHELL = "bcsn-shell-" + VERSION;
const AUDIO = "bcsn-audio-v1";
const ASSETS = [
 "./",
 "config.js",
 "css/style.css",
 "fonts/baloo-2-latin-600-normal.woff2",
 "fonts/baloo-2-latin-800-normal.woff2",
 "fonts/baloo-2-latin-ext-600-normal.woff2",
 "fonts/baloo-2-latin-ext-800-normal.woff2",
 "fonts/baloo-2-vietnamese-600-normal.woff2",
 "fonts/baloo-2-vietnamese-800-normal.woff2",
 "fonts/nunito-latin-400-normal.woff2",
 "fonts/nunito-latin-700-normal.woff2",
 "fonts/nunito-latin-ext-400-normal.woff2",
 "fonts/nunito-latin-ext-700-normal.woff2",
 "fonts/nunito-vietnamese-400-normal.woff2",
 "fonts/nunito-vietnamese-700-normal.woff2",
 "icon-192.png",
 "icon-512.png",
 "img/bocau.jpg",
 "img/p01.jpg",
 "img/p02.jpg",
 "img/p03.jpg",
 "img/p04.jpg",
 "img/p05.jpg",
 "img/p06.jpg",
 "img/p07.jpg",
 "img/p08.jpg",
 "img/p09.jpg",
 "img/p10.jpg",
 "img/p11.jpg",
 "img/p12.jpg",
 "img/p13.jpg",
 "img/p14.jpg",
 "img/p15.jpg",
 "img/p16.jpg",
 "img/p17.jpg",
 "img/p18.jpg",
 "img/p19.jpg",
 "img/p20.jpg",
 "img/p21.jpg",
 "img/p22.jpg",
 "img/p23.jpg",
 "img/p24.jpg",
 "img/poster.jpg",
 "img/soc.jpg",
 "index.html",
 "js/app.js",
 "js/data.js",
 "manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("bcsn-shell-") && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

async function rangeFromCache(req, res) {
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  const size = buf.byteLength;
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (end >= size) end = size - 1;
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: { "Content-Type": res.headers.get("Content-Type") || "audio/mpeg", "Content-Range": "bytes " + start + "-" + end + "/" + size, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" },
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.includes("/audio/")) {
    e.respondWith((async () => {
      const c = await caches.open(AUDIO);
      const hit = await c.match(url.pathname.replace(/^.*\/audio\//, "audio/"), { ignoreSearch: true });
      if (hit) return req.headers.get("range") ? rangeFromCache(req, hit) : hit;
      return fetch(req);
    })());
    return;
  }

  // trang & tài nguyên: ưu tiên bộ nhớ, đồng thời cập nhật ngầm
  e.respondWith((async () => {
    const c = await caches.open(SHELL);
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await c.match("index.html") : null);
    const net = fetch(req).then((r) => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
