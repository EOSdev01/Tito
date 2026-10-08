// Service worker de pun.Tito
// Si cambiás archivos de la app, subí el número de versión para forzar la actualización.
var VERSION = 'pun-tito-v1';
var ARCHIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ARCHIVOS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // Tipografías de Google: se guardan para que funcionen sin conexión
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(VERSION).then(function (c) {
        return c.match(req).then(function (hit) {
          var red = fetch(req).then(function (r) { c.put(req, r.clone()); return r; }).catch(function () { return hit; });
          return hit || red;
        });
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Archivos de la app: primero la red (así llegan las actualizaciones), y sin conexión usa lo guardado
  e.respondWith(
    fetch(req).then(function (r) {
      var copia = r.clone();
      caches.open(VERSION).then(function (c) { c.put(req, copia); });
      return r;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || caches.match('index.html'); });
    })
  );
});
