'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "d23a7ead14295f2aa0f405f268814583",
"assets/assets/fonts/Silkscreen-Bold.ttf": "fd3bfe91d4b413d3f68d73b8e1cdf846",
"assets/assets/fonts/Silkscreen-Regular.ttf": "5bed8502768fedf857a0ec8b81350f39",
"assets/assets/imgs/background.png": "a162d71da76fff1f69c3876c4102bf8c",
"assets/assets/imgs/github.png": "0c153492a71e823618033bcc2414c34a",
"assets/assets/imgs/linkedin.png": "0b6c0843bd51573dccec85dc7cf7f148",
"assets/assets/imgs/profile.png": "8c380e77fe0ebd5e28b4b6d780e135e7",
"assets/assets/imgs/profile_down.png": "8eca0c43dfbf0bcd0db98367addf7627",
"assets/assets/imgs/profile_left.png": "5814e10c26a6bca054d04eee09b6ae93",
"assets/assets/imgs/profile_left_down.png": "8eca0c43dfbf0bcd0db98367addf7627",
"assets/assets/imgs/profile_left_up.png": "6e75aa6407a0dd35b3138b971c605191",
"assets/assets/imgs/profile_right.png": "40f8102604ed385f1e532fb2aef22e97",
"assets/assets/imgs/profile_right_down.png": "4be293db0dff4db30fa63f8eefc4f0b4",
"assets/assets/imgs/profile_right_up.png": "fcd28841f495cd123b71df5eab9cbce3",
"assets/assets/imgs/profile_up.png": "518e8793dd2cb6cfb43ea588209cade1",
"assets/assets/imgs/twitter.png": "169de94d75903521b4a21f8bf37b2f36",
"assets/FontManifest.json": "17c4cf215a23efaea79ce984cbd0796a",
"assets/fonts/MaterialIcons-Regular.otf": "95db9098c58fd6db106f1116bae85a0b",
"assets/NOTICES": "4bbe1f3cd1cab45811e36194baaca208",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"canvaskit/canvaskit.js": "c2b4e5f3d7a3d82aed024e7249a78487",
"canvaskit/canvaskit.wasm": "4b83d89d9fecbea8ca46f2f760c5a9ba",
"canvaskit/profiling/canvaskit.js": "ae2949af4efc61d28a4a80fffa1db900",
"canvaskit/profiling/canvaskit.wasm": "95e736ab31147d1b2c7b25f11d4c32cd",
"flutter.js": "eb2682e33f25cd8f1fc59011497c35f8",
"icons/android-chrome-192x192.png": "f33be158154f152aa6149954ad7a35af",
"icons/android-chrome-512x512.png": "c6da410cb73378be12a5e9c0e59fdbdf",
"icons/apple-touch-icon.png": "9f282394249684511ae2bf2d4efb1869",
"icons/favicon-16x16.png": "c3bc78344f563dc57fa7f85952313ae9",
"icons/favicon-32x32.png": "6694a064025d5c90618ea98df10207ba",
"icons/favicon.ico": "ed3db5019c405bb323cfa43bab18a42a",
"index.html": "f56f4cd3b7383f3293597b9b917cbe43",
"/": "f56f4cd3b7383f3293597b9b917cbe43",
"main.dart.js": "43b286bdf6310d4d01e0cb051d8fd068",
"manifest.json": "2be14ab378b21ea7c2562d980e20a89e",
"version.json": "397c58d6a589ccb59b22fdccc9565313"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
