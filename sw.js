// Grana — service worker (network-first p/ atualizar sozinho, cache só offline)
const V = 'grana-v4';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  // limpa todos os caches antigos ao ativar a nova versão
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isDoc = e.request.mode === 'navigate'
             || url.pathname.endsWith('/')
             || url.pathname.endsWith('index.html');

  if (isDoc) {
    // network-first: tenta a versão nova; se estiver offline, usa o cache
    e.respondWith(
      fetch(e.request)
        .then(res => { const c = res.clone(); caches.open(V).then(x => x.put(e.request, c)); return res; })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  } else {
    // demais arquivos (fontes, ícones): cache-first é ok
    e.respondWith(
      caches.match(e.request).then(hit => hit ||
        fetch(e.request).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(e.request, c)); return res; })
      )
    );
  }
});
