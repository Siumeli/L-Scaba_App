const CACHE_NAME = 'v1.0.2'; // <-- Muista nostaa tätä aina kun päivität!
const ASSETS = [
  './',
  'index.html',
  'tietoa.html',
  'profiili.html',
  'turnaus.html',
  'admin.html',
  'asetukset.html',
  'css/style.css',
  'js/app.js',
  'js/index-home.js',
  'js/profiili.js',
  'js/turnaus.js',
  'js/admin.js',
  'js/asetukset.js',
  'manifest.json',
  'LöScaba.png'
];

// 1. ASENNUS
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.log("Cache addAll varoitus:", err));
    })
  );
  // PAKOTETAAN UUSI SERVICE WORKER AKTIIVISEKSI HETI
  self.skipWaiting();
});

// 2. AKTIVOINTI
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Poistetaan vanha välimuisti:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // OTETAAN KAIKKI SIVUN SULJETUT/AVOIMET VÄLILEHDET HETI HALTUUN
      return self.clients.claim();
    })
  );
});

// 3. PYYNNÖT
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});