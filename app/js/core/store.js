/* store.js — 端末の中だけで完結する記録（IndexedDB）
 * 移植元: _spike/offline_queue/store.js（検証済み・1台=1人分に簡略化されている前提）。
 * 送り先のサーバーは無い（2026-08-10 Sir 承認で廃止）。記録は端末の中だけに残る。
 * UMD/global 版を ES module の export に置き換えただけで、ロジックは変えていない。
 *
 * この層が守ること
 *  1. 押した瞬間に端末へ書き、その値を返す。画面はその返り値だけで描く。
 *  2. 主キーを 人 + スタンプ にする。同じ人が同じスタンプを二度押しても記録は1件に落ちる。
 *  3. 人ごとに記録を分ける。1台の中で人を切り替えても、互いの記録が混ざらない。
 *  4. 容量が尽きた時に黙って成功と返さない。押せなかったことを必ず呼び出し側へ返す。
 */
"use strict";

var DB_NAME = 'tabi-stamp';
var DB_VERSION = 2;
var S_STAMPS = 'stamps';
var S_PEOPLE = 'people';
var S_META = 'meta';
var S_BALLAST = 'ballast';
var S_PHOTOS = 'photos';
var LS_EMERGENCY = 'tabi.emergency.stamps';

export var EXPORT_SCHEMA = 'tabi-stamp-export/1';
var APP_NAME = '旅行スタンプラリー';

var dbPromise = null;
var idbFactory = self.indexedDB;

export async function useFactory(f) {
  if (dbPromise) { try { (await dbPromise).close(); } catch (e) { /* noop */ } }
  dbPromise = null;
  idbFactory = f || self.indexedDB;
  return true;
}

function req(r) {
  return new Promise(function (res, rej) {
    r.onsuccess = function () { res(r.result); };
    r.onerror = function () { rej(r.error); };
  });
}

function done(t) {
  return new Promise(function (res, rej) {
    t.oncomplete = function () { res(); };
    t.onabort = function () { rej(t.error || new Error('transaction aborted')); };
    t.onerror = function () { rej(t.error || new Error('transaction error')); };
  });
}

export function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise(function (res, rej) {
    var r = idbFactory.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = function () {
      var db = r.result;
      if (!db.objectStoreNames.contains(S_STAMPS)) {
        var s = db.createObjectStore(S_STAMPS, { keyPath: 'id' });
        s.createIndex('personId', 'personId', { unique: false });
        s.createIndex('seq', 'seq', { unique: false });
      }
      if (!db.objectStoreNames.contains(S_PEOPLE)) {
        db.createObjectStore(S_PEOPLE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(S_META)) {
        db.createObjectStore(S_META, { keyPath: 'k' });
      }
      if (!db.objectStoreNames.contains(S_BALLAST)) {
        db.createObjectStore(S_BALLAST, { keyPath: 'k' });
      }
      if (!db.objectStoreNames.contains(S_PHOTOS)) {
        var ph = db.createObjectStore(S_PHOTOS, { keyPath: 'id' });
        ph.createIndex('personId', 'personId', { unique: false });
        ph.createIndex('personStamp', 'personStamp', { unique: false });
      }
    };
    r.onsuccess = function () { res(r.result); };
    r.onerror = function () { rej(r.error); };
  });
  return dbPromise;
}

export function isQuotaError(e) {
  if (!e) return false;
  return e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    (typeof e.message === 'string' && e.message.indexOf('quota') >= 0);
}

function keyOf(personId, stampId) { return String(personId) + '::' + String(stampId); }

/* ---------- meta ---------- */

export async function metaGet(k, dflt) {
  var db = await open();
  var t = db.transaction([S_META], 'readonly');
  var row = await req(t.objectStore(S_META).get(k));
  return row ? row.v : dflt;
}

export async function metaSet(k, v) {
  var db = await open();
  var t = db.transaction([S_META], 'readwrite');
  t.objectStore(S_META).put({ k: k, v: v });
  await done(t);
  return v;
}

/* ---------- 人（1台の中に何人でも持てる） ---------- */

export async function addPerson(person) {
  var db = await open();
  var t = db.transaction([S_PEOPLE], 'readwrite');
  var os = t.objectStore(S_PEOPLE);
  var existing = await req(os.get(String(person.id)));
  if (existing) { await done(t); return { status: 'exists', person: existing }; }
  var n = await req(os.count());
  var rec = { id: String(person.id), name: String(person.name || person.id), order: n, createdAt: new Date().toISOString() };
  os.put(rec);
  await done(t);
  return { status: 'created', person: rec };
}

export async function listPeople() {
  var db = await open();
  var t = db.transaction([S_PEOPLE], 'readonly');
  var all = await req(t.objectStore(S_PEOPLE).getAll());
  all.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  return all;
}

export async function removePerson(personId) {
  var db = await open();
  var t = db.transaction([S_PEOPLE, S_STAMPS], 'readwrite');
  t.objectStore(S_PEOPLE).delete(String(personId));
  var idx = t.objectStore(S_STAMPS).index('personId');
  var n = 0;
  await new Promise(function (res, rej) {
    var c = idx.openCursor(IDBKeyRange.only(String(personId)));
    c.onsuccess = function () {
      var cur = c.result;
      if (!cur) { res(); return; }
      cur.delete(); n++; cur.continue();
    };
    c.onerror = function () { rej(c.error); };
  });
  await done(t);
  return { removedStamps: n };
}

export async function setCurrentPerson(personId) { return await metaSet('currentPersonId', String(personId)); }
export async function getCurrentPerson() { return await metaGet('currentPersonId', null); }

/* ---------- 押す ---------- */

export async function pressStamp(input, opts) {
  opts = opts || {};
  var attemptFree = opts.autoFree !== false;
  try {
    return await writePress(input);
  } catch (e) {
    if (!isQuotaError(e)) throw e;
    if (attemptFree) {
      var freed = await clearBallast();
      try {
        var r = await writePress(input);
        r.recoveredBy = 'ballast-cleared';
        r.freedEntries = freed;
        return r;
      } catch (e2) {
        if (!isQuotaError(e2)) throw e2;
        e = e2;
      }
    }
    if (opts.emergencyFallback !== false) {
      var rec = buildRecord(input, -1);
      var saved = pushEmergency(rec);
      return {
        status: saved ? 'emergency' : 'failed',
        emergencySaved: saved,
        record: rec,
        error: String((e && e.name) || e)
      };
    }
    throw e;
  }
}

function buildRecord(input, seq) {
  var now = input.at || new Date().toISOString();
  return {
    id: keyOf(input.personId, input.stampId),
    personId: String(input.personId),
    stampId: String(input.stampId),
    method: input.method || 'manual',
    acquiredAt: now,
    seq: seq
  };
}

async function writePress(input) {
  if (!input || !input.personId) throw new Error('personId is required');
  var db = await open();
  var id = keyOf(input.personId, input.stampId);
  var t = db.transaction([S_STAMPS, S_META], 'readwrite');
  var stamps = t.objectStore(S_STAMPS);
  var meta = t.objectStore(S_META);

  var existing = await req(stamps.get(id));
  if (existing) {
    await done(t);
    return { status: 'duplicate', record: existing };
  }
  var seqRow = await req(meta.get('seq'));
  var seq = ((seqRow && seqRow.v) || 0) + 1;
  meta.put({ k: 'seq', v: seq });

  var rec = buildRecord(input, seq);
  stamps.put(rec);
  await done(t);
  return { status: 'created', record: rec };
}

export async function removeStamp(personId, stampId) {
  var db = await open();
  var t = db.transaction([S_STAMPS], 'readwrite');
  var os = t.objectStore(S_STAMPS);
  var id = keyOf(personId, stampId);
  var existing = await req(os.get(id));
  if (existing) os.delete(id);
  await done(t);
  removeEmergency(id);
  return { removed: !!existing };
}

/* ---------- 読み ---------- */

export async function listStamps(personId) {
  var db = await open();
  var t = db.transaction([S_STAMPS], 'readonly');
  var os = t.objectStore(S_STAMPS);
  var all;
  if (personId) all = await req(os.index('personId').getAll(IDBKeyRange.only(String(personId))));
  else all = await req(os.getAll());
  all.sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
  return all;
}

export async function countStamps(personId) { return (await listStamps(personId)).length; }

/* ---------- 写真（F-48：位置情報は含めず、押したスポットに紐づけるだけ） ---------- */

function photoKeyOf(personId, stampId) { return String(personId) + '::' + String(stampId); }

export async function addPhoto(personId, stampId, blob) {
  var db = await open();
  var t = db.transaction([S_PHOTOS], 'readwrite');
  var os = t.objectStore(S_PHOTOS);
  var id = photoKeyOf(personId, stampId) + '::' + Date.now() + '_' + Math.random().toString(16).slice(2);
  var rec = {
    id: id,
    personId: String(personId),
    stampId: String(stampId),
    personStamp: photoKeyOf(personId, stampId),
    blob: blob,
    capturedAt: new Date().toISOString()
  };
  os.put(rec);
  await done(t);
  return rec;
}

export async function listPhotosForStamp(personId, stampId) {
  var db = await open();
  var t = db.transaction([S_PHOTOS], 'readonly');
  var idx = t.objectStore(S_PHOTOS).index('personStamp');
  var all = await req(idx.getAll(IDBKeyRange.only(photoKeyOf(personId, stampId))));
  all.sort(function (a, b) { return String(a.capturedAt || '').localeCompare(String(b.capturedAt || '')); });
  return all;
}

export async function listAllPhotos(personId) {
  var db = await open();
  var t = db.transaction([S_PHOTOS], 'readonly');
  var idx = t.objectStore(S_PHOTOS).index('personId');
  return await req(idx.getAll(IDBKeyRange.only(String(personId))));
}

export async function deletePhoto(id) {
  var db = await open();
  var t = db.transaction([S_PHOTOS], 'readwrite');
  t.objectStore(S_PHOTOS).delete(id);
  await done(t);
  return true;
}

/* ---------- 合言葉（F-53：初回に「使わない」を選べる。強さは求めない＝Q-13） ---------- */

async function sha256Hex(text) {
  try {
    if (self.crypto && self.crypto.subtle) {
      var buf = await self.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    }
  } catch (e) { /* subtle が使えない環境は下のフォールバックへ */ }
  return 'plain:' + text;
}

export async function getPasscodeSetting() {
  return await metaGet('passcode', null);
}

export async function setPasscodeDisabled() {
  return await metaSet('passcode', { enabled: false });
}

export async function setPasscodeEnabled(fourDigits) {
  var hash = await sha256Hex(String(fourDigits));
  return await metaSet('passcode', { enabled: true, hash: hash });
}

export async function checkPasscode(fourDigits) {
  var s = await getPasscodeSetting();
  if (!s || !s.enabled) return true;
  var hash = await sha256Hex(String(fourDigits));
  return hash === s.hash;
}

/* ---------- 書き出し・読み戻し ---------- */

function blobToDataURL(blob) {
  return new Promise(function (res, rej) {
    var r = new FileReader();
    r.onloadend = function () { res(r.result); };
    r.onerror = function () { rej(r.error); };
    r.readAsDataURL(blob);
  });
}

export async function exportAll() {
  var people = await listPeople();
  var nameOf = {};
  people.forEach(function (p) { nameOf[p.id] = p.name; });
  var stamps = await listStamps(null);
  var db = await open();
  var pt = db.transaction([S_PHOTOS], 'readonly');
  var photoRows = await req(pt.objectStore(S_PHOTOS).getAll());
  var photos = [];
  for (var i = 0; i < photoRows.length; i++) {
    var p = photoRows[i];
    var dataUrl = await blobToDataURL(p.blob);
    photos.push({
      personId: p.personId,
      personName: nameOf[p.personId] || null,
      stampId: p.stampId,
      capturedAt: p.capturedAt,
      dataUrl: dataUrl
    });
  }
  return {
    schema: EXPORT_SCHEMA,
    app: APP_NAME,
    exportedAt: new Date().toISOString(),
    installedAt: await metaGet('installedAt', null),
    people: people.map(function (p) { return { id: p.id, name: p.name, order: p.order }; }),
    stamps: stamps.map(function (s) {
      return {
        personId: s.personId,
        personName: nameOf[s.personId] || null,
        stampId: s.stampId,
        acquiredAt: s.acquiredAt,
        method: s.method
      };
    }),
    photos: photos,
    counts: { people: people.length, stamps: stamps.length, photos: photos.length }
  };
}

export function exportFileName(now) {
  var d = now || new Date();
  function p(n) { return (n < 10 ? '0' : '') + n; }
  return '旅行スタンプラリー_記録_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()) + '.json';
}

export async function importAll(data) {
  if (!data || data.schema !== EXPORT_SCHEMA) {
    return { ok: false, error: '読み込める形ではありません（schema=' + (data && data.schema) + '）' };
  }
  var peopleAdded = 0, peopleSkipped = 0, stampsAdded = 0, stampsSkipped = 0;
  var i;
  for (i = 0; i < (data.people || []).length; i++) {
    var r = await addPerson(data.people[i]);
    if (r.status === 'created') peopleAdded++; else peopleSkipped++;
  }
  for (i = 0; i < (data.stamps || []).length; i++) {
    var s = data.stamps[i];
    var w = await pressStamp({ personId: s.personId, stampId: s.stampId, method: s.method, at: s.acquiredAt }, { autoFree: true });
    if (w.status === 'created') stampsAdded++; else stampsSkipped++;
  }
  return { ok: true, peopleAdded: peopleAdded, peopleSkipped: peopleSkipped, stampsAdded: stampsAdded, stampsSkipped: stampsSkipped };
}

/* ---------- 容量を意図的に埋めるための置き場（捨ててよいデータ） ---------- */

export async function addBallast(bytes) {
  var db = await open();
  var buf = new Uint8Array(bytes);
  var c = (self.crypto || self.msCrypto);
  for (var off = 0; off < bytes; off += 65536) {
    c.getRandomValues(buf.subarray(off, Math.min(off + 65536, bytes)));
  }
  var t = db.transaction([S_BALLAST], 'readwrite');
  t.objectStore(S_BALLAST).put({ k: 'b' + Date.now() + '_' + Math.random(), blob: buf });
  await done(t);
  return bytes;
}

export async function clearBallast() {
  var db = await open();
  var t = db.transaction([S_BALLAST], 'readwrite');
  var os = t.objectStore(S_BALLAST);
  var n = await req(os.count());
  os.clear();
  await done(t);
  return n;
}

export async function ballastCount() {
  var db = await open();
  var t = db.transaction([S_BALLAST], 'readonly');
  return await req(t.objectStore(S_BALLAST).count());
}

/* ---------- 容量が尽きた時の最後の逃げ道（小さい記録のみ） ---------- */

function readEmergency() {
  try {
    var raw = self.localStorage && self.localStorage.getItem(LS_EMERGENCY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function pushEmergency(rec) {
  try {
    var arr = readEmergency();
    if (!arr.some(function (r) { return r.id === rec.id; })) arr.push(rec);
    self.localStorage.setItem(LS_EMERGENCY, JSON.stringify(arr));
    return true;
  } catch (e) { return false; }
}

/* けした スタンプが、ひなん場所（localStorage）に のこっていたら、
   つぎに 開いた ときに 書きもどされて 復活する バグを ふせぐ */
function removeEmergency(id) {
  try {
    var arr = readEmergency();
    var left = arr.filter(function (r) { return r.id !== id; });
    if (left.length !== arr.length) {
      if (left.length) self.localStorage.setItem(LS_EMERGENCY, JSON.stringify(left));
      else self.localStorage.removeItem(LS_EMERGENCY);
    }
  } catch (e) { /* noop */ }
}

/* 段6是正・重要：ひなん場所（localStorage）を 書きもどす しくみ が、
   けした あとに 復活する バグの げんいん だった（removeStamp は 同じ id の ぶんしか けさない ので、
   古い たんまつ に 残った ぶんが 消しきれない ことが あった）。
   この きろく（スタンプの おす・けす）は 容量が とても 小さく、容量オーバーで
   ひなん場所を つかう ケースは 現実には ほぼ 起きない。害の ほうが 大きいと 判断し、
   起動の たびに ひなん場所は まるごと 消す（書きもどしを しない）ことに した。 */
export function purgeEmergencyQueue() {
  try { self.localStorage.removeItem(LS_EMERGENCY); } catch (e) { /* noop */ }
}

export async function drainEmergency() {
  var arr = readEmergency();
  if (!arr.length) return { moved: 0, left: 0 };
  var left = [];
  var moved = 0;
  for (var i = 0; i < arr.length; i++) {
    try {
      var r = await writePress({
        personId: arr[i].personId, stampId: arr[i].stampId,
        method: arr[i].method, at: arr[i].acquiredAt
      });
      if (r.status === 'created' || r.status === 'duplicate') moved++;
      else left.push(arr[i]);
    } catch (e) {
      left.push(arr[i]);
    }
  }
  try {
    if (left.length) self.localStorage.setItem(LS_EMERGENCY, JSON.stringify(left));
    else self.localStorage.removeItem(LS_EMERGENCY);
  } catch (e) { /* localStorage も死んでいる場合は何もしない */ }
  return { moved: moved, left: left.length };
}

/* ---------- 容量まわり ---------- */

export async function estimate() {
  if (!self.navigator || !navigator.storage || !navigator.storage.estimate) {
    return { supported: false };
  }
  var e = await navigator.storage.estimate();
  return {
    supported: true,
    usage: e.usage,
    quota: e.quota,
    usageDetails: e.usageDetails || null,
    freeBytes: (typeof e.quota === 'number' && typeof e.usage === 'number') ? (e.quota - e.usage) : null
  };
}

export async function persisted() {
  if (!self.navigator || !navigator.storage || !navigator.storage.persisted) return null;
  return await navigator.storage.persisted();
}

export async function requestPersist() {
  if (!self.navigator || !navigator.storage || !navigator.storage.persist) return null;
  return await navigator.storage.persist();
}

/* ---------- 全消し（検証用） ---------- */

export async function wipe() {
  var db = await open();
  var t = db.transaction([S_STAMPS, S_PEOPLE, S_META, S_BALLAST, S_PHOTOS], 'readwrite');
  t.objectStore(S_STAMPS).clear();
  t.objectStore(S_PEOPLE).clear();
  t.objectStore(S_META).clear();
  t.objectStore(S_BALLAST).clear();
  t.objectStore(S_PHOTOS).clear();
  await done(t);
  try { self.localStorage.removeItem(LS_EMERGENCY); } catch (e) { /* noop */ }
}

export var DB_NAME_EXPORT = DB_NAME;
