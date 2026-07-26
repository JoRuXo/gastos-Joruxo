// Service worker de AUTODESTRUCCIÓN.
//
// Esta app se mudó a https://joruxo.github.io/gastos/
//
// El service worker antiguo guardaba una copia de la app dentro del móvil, y esa
// copia es la que abría el icono de la pantalla de inicio. Este fichero lo
// sustituye: en cuanto el navegador lo detecta, borra todas las copias guardadas,
// se da de baja a sí mismo y recarga las ventanas abiertas. Al recargar,
// index.html ya redirige a la app nueva.
//
// No tiene manejador 'fetch' a propósito: así ninguna petición se sirve desde la
// caché vieja, todas van directas a la red.

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (claves) {
        return Promise.all(claves.map(function (k) { return caches.delete(k); }));
      })
      .catch(function () {})
      .then(function () {
        return self.registration.unregister();
      })
      .catch(function () {})
      .then(function () {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function (ventanas) {
        ventanas.forEach(function (v) {
          try { v.navigate(v.url); } catch (err) {}
        });
      })
      .catch(function () {})
  );
});
