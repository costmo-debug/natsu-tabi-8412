/* sw.js — アプリ本体（HTML/CSS/JS）と 絵（猫・スタンプ・地図の部品）を 先に 保存して、
 * 圏内が 無くても ページが 開くようにする（段4）。
 * 移植元: _spike/offline_queue/sw.js（考え方は そのまま）。classic worker（importScripts なし）。
 *   ※ module 形式の Service Worker は Safari 16.4 未満で 動かないため、あえて 使っていない。
 */
'use strict';

var CACHE = 'tabi-shell-v17';

/* アプリ本体。HTML / CSS / JS / 画像を すべて 先に 入れる。
   地図そのものは SVG を JS が その場で 組み立てる ので、絵の 部品（猫・スタンプ）だけ 入れればよい。 */
var SHELL = [
  './',
  './index.html',
  './css/base.css',
  './css/fx.css',
  './css/layout.css',
  './css/map.css',
  './js/boot.js',
  './js/util.js',
  './js/core/person.js',
  './js/core/store.js',
  './js/data/nodes.js',
  './js/data/stampArt.js',
  './js/data/stamps.js',
  './js/data/tokens.js',
  './js/fx/confetti.js',
  './js/fx/sound.js',
  './js/fx/stampanim.js',
  './js/geo/affine.js',
  './js/geo/live.js',
  './js/geo/project.js',
  './js/geo/routeData.js',
  './js/geo/state.js',
  './js/map/areamap.js',
  './js/map/iso.js',
  './js/map/labels.js',
  './js/map/landmarks.js',
  './js/map/motion.js',
  './js/map/netmap.js',
  './js/map/terrain.js',
  './js/map/view.js',
  './js/ui/acquire.js',
  './js/ui/book.js',
  './js/ui/cat.js',
  './js/ui/nextcard.js',
  './js/ui/passcode.js',
  './js/ui/photo.js',
  './js/ui/screens.js',
  './js/ui/settings.js',
  './js/ui/sheet.js',
  './js/ui/states.js',
  './js/ui/toast.js',
  './assets/cat/cat_guide.png',
  './assets/cat/cat_travel.png',
  './assets/cat/cat_cheer.png',
  './assets/cat/cat_trouble.png',
  './assets/cat/cat_sleep.png',
  './assets/cat/cat_trophy.png',
  './assets/stamps/k1.png',
  './assets/stamps/k2.png',
  './assets/stamps/k3.png',
  './assets/stamps/k4.png',
  './assets/stamps/y2.png',
  './assets/stamps/y4.png',
  './assets/stamps/i1.png',
  './assets/stamps/i2.png',
  './assets/stamps/i4.png',
  './assets/stamps/f1.png',
  './assets/stamps/f2.png',
  './assets/stamps/f4.png',
  './assets/stamps/h2.png',
  './assets/stamps/h3.png',
  './assets/stamps/sa1.png'
];

self.addEventListener('install', function (ev) {
  ev.waitUntil((async function () {
    var cache = await caches.open(CACHE);
    var failed = [];
    for (var i = 0; i < SHELL.length; i++) {
      try {
        await cache.add(new Request(SHELL[i], { cache: 'reload' }));
      } catch (e) {
        failed.push({ url: SHELL[i], error: String((e && e.message) || e) });
      }
    }
    if (failed.length) {
      try {
        var c2 = await caches.open(CACHE);
        await c2.put('./__install_report__', new Response(JSON.stringify({ at: new Date().toISOString(), failed: failed }), { headers: { 'Content-Type': 'application/json' } }));
      } catch (e2) { /* noop */ }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) {
      return (k !== CACHE && k.indexOf('tabi-') === 0) ? caches.delete(k) : null;
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (ev) {
  var req = ev.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/__') >= 0 || url.pathname.indexOf('/api/') === 0) return;

  if (req.mode === 'navigate') {
    ev.respondWith((async function () {
      try {
        var fresh = await fetch(req);
        var c = await caches.open(CACHE);
        c.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        var hit = await caches.match(req);
        if (hit) return hit;
        var fallback = await caches.match('./index.html');
        if (fallback) return fallback;
        return new Response('offline and not cached', { status: 503 });
      }
    })());
    return;
  }

  ev.respondWith((async function () {
    var hit = await caches.match(req);
    if (hit) {
      fetch(req).then(function (fresh) {
        if (fresh && fresh.ok) caches.open(CACHE).then(function (c) { c.put(req, fresh); });
      }).catch(function () { /* 圏外なら何もしない */ });
      return hit;
    }
    try {
      var fresh2 = await fetch(req);
      if (fresh2 && fresh2.ok) {
        var c3 = await caches.open(CACHE);
        c3.put(req, fresh2.clone());
      }
      return fresh2;
    } catch (e) {
      return new Response('offline and not cached: ' + url.pathname, { status: 503 });
    }
  })());
});

self.addEventListener('message', function (ev) {
  var msg = ev.data || {};
  if (msg.type === 'skip-waiting') { self.skipWaiting(); return; }
  if (msg.type === 'shell-status') {
    ev.waitUntil((async function () {
      var cache = await caches.open(CACHE);
      var items = [];
      for (var i = 0; i < SHELL.length; i++) {
        var hit = await cache.match(SHELL[i]);
        items.push({ url: SHELL[i], cached: !!hit });
      }
      var report = await cache.match('./__install_report__');
      var reportJson = report ? await report.json() : null;
      var reply = { type: 'shell-status', cacheName: CACHE, items: items, installReport: reportJson };
      if (ev.ports && ev.ports[0]) ev.ports[0].postMessage(reply);
      else {
        var cs = await self.clients.matchAll();
        cs.forEach(function (c) { c.postMessage(reply); });
      }
    })());
  }
});
