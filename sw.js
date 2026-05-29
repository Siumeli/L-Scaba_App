const CACHE_NAME = 'loscaba-v8'; // Nostetaan versiota, jotta selain päivittää välimuistin
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
  'LöScaba.png' // <-- Muutettu vastaamaan juurikansiota
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Käytetään erillistä lisäystä, jotta puuttuvat sivut (esim. jos kaikkia js-tiedostoja ei vielä ole luotu) eivät riko koko asennusta
      return cache.addAll(ASSETS).catch(err => console.log("Cache addAll varoitus:", err));
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); })
  )));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
