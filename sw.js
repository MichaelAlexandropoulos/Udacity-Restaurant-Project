/* ------------ INSTALL EVENT ------------ */
self.addEventListener('install', function(event) {
  var ThingsToCache = [
    '/',
    'index.html',
    'restaurant.html',
    'sw.js',
    'manifest.json',
    'js/workers/idb.js',
    'js/workers/init_worker.js',
    'js/workers/info_worker.js',
    'js/main.js',
    'js/restaurant_info.js',
    'img/1.jpg',
    'img/2.jpg',
    'img/3.jpg',
    'img/4.jpg',
    'img/5.jpg',
    'img/6.jpg',
    'img/7.jpg',
    'img/8.jpg',
    'img/9.jpg',
    'img/10.jpg',
    'img/add-icon.png',
    'img/fav-icon.png',
    'img/nofav-icon.png',
    'img/undefined.jpg'
  ];
  event.waitUntil(
    caches.open('restaurant-cache')
    .then(function(cache) {
      return cache.addAll(ThingsToCache);
    })
    .catch(function(data) {
      console.log(data);
    })
  );
});
/* ------------ FETCH EVENT ------------ */
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
    .then(function(response) {
      if (response) return response;
      return fetch(event.request);
    })
    .catch(function(error) {
      console.log(error);
    })
  )
});
