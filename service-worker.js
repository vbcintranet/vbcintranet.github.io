const CACHE_NAME = 'vbc-intranet-v2.4.3';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/def/def.json',
  '/def/map.svg',
  '/images/Favicon.ico',
  '/images/Favicon.webp',
  '/fonts/arialroundedmtbold.ttf',
  '/images/icons/ACERLogo.webp',
  '/images/icons/AddPrinters.webp',
  '/images/icons/Blooket.webp',
  '/images/icons/ClassSync.webp',
  '/images/icons/Compass.webp',
  '/images/icons/eduPass.webp',
  '/images/icons/GaleOneFile.webp',
  '/images/icons/Gimkit.webp',
  '/images/icons/Guides.webp',
  '/images/icons/Helpdesk.webp',
  '/images/icons/Hotmaths.webp',
  '/images/icons/JacPLUS.webp',
  '/images/icons/LDB.webp',
  '/images/icons/LibrarySearch.webp',
  '/images/icons/MailHelpdesk.webp',
  '/images/icons/MicrosoftTeams.webp',
  '/images/icons/MyConnect2.webp',
  '/images/icons/OnDemand.webp',
  '/images/icons/OneDrive.webp',
  '/images/icons/OneDrive_Legacy.webp',
  '/images/icons/Outlook.webp',
  '/images/icons/PaperCut.webp',
  '/images/icons/QuizletLive.webp',
  '/images/icons/Stile.webp',
  '/images/icons/Tinkercad.webp',
  '/images/icons/Trello.webp',
  '/images/icons/Unknown.webp',
  '/images/icons/VBCCareers.webp',
  '/images/icons/VBCLogo.webp',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function cacheKey(url) {
  const u = new URL(url);
  if (u.pathname !== '/' && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.slice(0, -1);
  }
  return u.href;
}

// On fetch: stale-while-revalidate for same-origin, network-first for cross-origin
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  if (url.hostname === 'viewbank-vic.compass.education' && url.pathname.startsWith('/download/sharedCalendar.aspx')) return;

  if (url.origin === self.location.origin) {
    const key = cacheKey(request.url);
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(key).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            if (response.ok) {
              cache.put(key, response.clone());
            }
            return response;
          });
          
          return cached || fetchPromise;
        });
      })
    );
  } else {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
