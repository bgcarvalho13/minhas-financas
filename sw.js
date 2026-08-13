const CACHE = 'minhas-financas-v5';
const APP_SHELL = [
  './', './index.html', './styles.css', './app.js', './db.js', './seed.js',
  './manifest.json', './assets/icon-192.png', './assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  const arquivosDinamicos = [
    'index.html',
    'app.js',
    'db.js',
    'seed.js',
    'styles.css',
    'manifest.json'
  ];

  const deveAtualizar =
    event.request.mode === 'navigate' ||
    arquivosDinamicos.some(arquivo => url.pathname.endsWith(arquivo));

  if (deveAtualizar) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copia = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copia));
          return response;
        })
        .catch(() =>
          caches.match(event.request).then(cache =>
            cache || caches.match('./index.html')
          )
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cache => cache || fetch(event.request))
  );
});
