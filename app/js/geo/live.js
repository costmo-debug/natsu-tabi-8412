"use strict";
/* live.js — GPS を 実際の 地図の うごきに つなぐ（段2〜3）。
 *  ・Geolocation API（watchPosition）で いちを とる。画面が hidden の あいだは とらない（NFR）。
 *  ・project.js の RouteProjection で、その日の ルートに あわせた 抽象座標を もとめる。
 *    どの ルートに 合うか わからない ときは、4本の ルート すべてで ためして いちばん 近い ものを えらぶ。
 *  ・data/stamps.js の ME を 書きかえ、F-20・F-44・F-54・F-55 の 判定（nearestPushable）を まわす。
 *  ・地図（ひろい ちず・スポットの まわり）を 作りなおして、うごいた いちを 見せる。
 */
import { create } from './project.js';
import { SPEC } from './routeData.js';
import { LIVE, setLive } from './state.js';
import { setME, nearestPushable, setPushable } from '../data/stamps.js';
import { showState, hideState } from '../ui/states.js';

var RP = create(SPEC);
var ROUTE_IDS = RP.routeIds();

var watchId = null;
var lastRebuildAt = 0;
var REBUILD_MIN_MS = 2500;     /* 地図の作りなおしは 重いので 間引く */
var onUpdate = null;           /* boot 側から わたされる「地図を作りなおす」関数 */
var deniedShown = false, failShown = false;

/* 段4：accuracy フィルタ（調査まとめ「accuracyフィルタ」）。
   accuracy は 95%の確率で その円の中に おさまる 半径。200m を こえる 測位は
   Wi-Fi・基地局からの おおまかな 推定の 可能性が 高いので、その 1回は 捨てて
   古い いちの まま にする（ジオフェンスの 誤爆・地図上の 点の 飛びはね を ふせぐ）。 */
var ACCURACY_MAX_M = 200;

/* 段4：cat-travel の 判定に つかう「うごいているか」。
   speed（m/s）が とれれば それを つかい、とれない ときは 直前の いちからの
   きょり ÷ 経過時間 で 推定する。しきい値は 徒歩の 速さ（時速1.8km≒0.5m/s）を 目安。 */
var MOVING_MPS = 0.5;
var lastFix = null; /* {lat,lon,t} */

function computeMoving(pos){
  var speed = pos.coords.speed;
  if (typeof speed === 'number' && !isNaN(speed) && speed !== null) {
    return speed >= MOVING_MPS;
  }
  var lat = pos.coords.latitude, lon = pos.coords.longitude, t = Date.now();
  var moving = false;
  if (lastFix) {
    var dtSec = (t - lastFix.t) / 1000;
    if (dtSec > 0.5) {
      var dN=(lat-lastFix.lat)*110574, dE=(lon-lastFix.lon)*111320*Math.cos(lat*Math.PI/180);
      var distM = Math.sqrt(dN*dN+dE*dE);
      moving = (distM / dtSec) >= MOVING_MPS;
    } else {
      moving = LIVE.moving;
    }
  }
  lastFix = { lat: lat, lon: lon, t: t };
  return moving;
}

function pickBestProjection(lat, lon){
  var best = null;
  for (var i = 0; i < ROUTE_IDS.length; i++) {
    try {
      var r = RP.projectStateless(ROUTE_IDS[i], lat, lon);
      if (!best || r.distance_m < best.distance_m) best = r;
    } catch (e) { /* このルートは組み立てられない（データ不備）。無視して次へ */ }
  }
  return best;
}

function onPosition(pos){
  var acc = pos.coords.accuracy;
  if (typeof acc === 'number' && acc > ACCURACY_MAX_M) {
    /* 段4：精度が わるい 測位は 捨てて、古い いち（LIVE.lat/lon・地図上の点）を そのまま つかい続ける。
       accuracy の 値だけは 新しく して、画面の「精度が わるい」表示に つかえる ように する。 */
    setLive({ accuracy: acc }, false);
    return;
  }

  var lat = pos.coords.latitude, lon = pos.coords.longitude;
  var moving = computeMoving(pos);
  var proj = pickBestProjection(lat, lon);
  setME([lat, lon]);
  var pk = nearestPushable([lat, lon]);
  if (pk) setPushable(pk);

  setLive({
    have: true,
    status: proj ? proj.status : 'off_route',
    lat: lat, lon: lon,
    abstract: proj ? proj.abstract : LIVE.abstract,
    routeId: proj ? proj.routeId : null,
    accuracy: acc,
    moving: moving
  }, true);

  if (deniedShown || failShown) { hideState(); deniedShown = false; failShown = false; }

  var now = Date.now();
  if (now - lastRebuildAt >= REBUILD_MIN_MS) {
    lastRebuildAt = now;
    if (onUpdate) onUpdate();
  }
}

function onError(err){
  if (err.code === err.PERMISSION_DENIED) {
    setLive({ status: 'denied' });
    if (!deniedShown) { showState('denied'); deniedShown = true; }
  } else {
    setLive({ status: 'gpsfail' });
    if (!failShown && !LIVE.have) { showState('gpsfail'); failShown = true; }
  }
}

function startWatch(){
  if (watchId != null) return;
  if (!('geolocation' in navigator)) { setLive({ status: 'gpsfail' }); return; }
  watchId = navigator.geolocation.watchPosition(onPosition, onError, {
    enableHighAccuracy: true, maximumAge: 5000, timeout: 20000
  });
}
function stopWatch(){
  if (watchId == null) return;
  navigator.geolocation.clearWatch(watchId);
  watchId = null;
}

/* 段4 コードレビュー確認（2026-08-10）：
   document.hidden は「タブが裏に回った／画面ロック／別アプリに切替」で true になる
   （Page Visibility 仕様）。visibilitychange イベントは その 切りかわりの たびに 発火する。
   hidden の あいだは stopWatch() で watchPosition を 明示的に とめる
   （W3C Geolocation 仕様が「hidden な document には 位置更新を 配信しない」と定めており、
   呼びっぱなしでも 更新は 来ないが、とめないと 電池を むだに 使う）。
   visible に 戻ったら startWatch() で 再開する。
   Playwright（自動テスト）は 真の OS レベルの hidden 化（画面ロック・タブ切替）を
   起こせないため、この 往復が 実機で 正しく 動くかは 未確認のまま。 */
function onVisibility(){
  if (document.hidden) { stopWatch(); setLive({ status: 'hidden' }); }
  else startWatch();
}

export function startLiveTracking(rebuildFn){
  onUpdate = rebuildFn || null;
  if (!('geolocation' in navigator)) { setLive({ status: 'gpsfail' }); return; }
  document.addEventListener('visibilitychange', onVisibility);
  if (!document.hidden) startWatch();
}

export function stopLiveTracking(){
  document.removeEventListener('visibilitychange', onVisibility);
  stopWatch();
}
