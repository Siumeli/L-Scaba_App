const CACHE_NAME = 'loscaba-v3';
const ASSETS = [
  './',
  './index.html',
  './tietoa.html',
  './profiili.html',
  './turnaus.html',
  './admin.html',
  './asetukset.html',
  './css/style.css',
  './js/app.js',
  './js/index-home.js',
  './js/profiili.js',
  './js/turnaus.js',
  './js/admin.js',
  './js/asetukset.js',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })
  )));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});