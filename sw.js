// Service Worker: เก็บ app shell + ไลบรารี CDN ไว้ใช้ออฟไลน์ (เปลี่ยนเลข V เมื่ออัปเดตไฟล์)
const V = 'nsk-v1', SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (/script\.google|googleusercontent/.test(u.hostname)) return; // API ไม่เก็บแคช
  if (u.origin === location.origin) { // ไฟล์ของระบบ: ออนไลน์ใช้ตัวใหม่ ออฟไลน์ใช้ที่เก็บไว้
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
  } else { // ไลบรารี/ฟอนต์ CDN: ใช้แคชก่อน
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })));
  }
});
