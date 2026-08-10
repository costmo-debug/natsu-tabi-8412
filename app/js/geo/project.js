/* project.js — GPSの緯度経度を、抽象的な路線図の上の座標に置き換える
 *
 * 移植元: _spike/route_projection/project.js（検証済み・区間正解100%・折り返し100%）。
 * ロジックは変えていない。UMD ラッパーを ES module の export に置き換えただけ。
 */
"use strict";

var R_EARTH = 6378137;
var DEG = Math.PI / 180;

export var DEFAULTS = {
  offRouteM: 5000,
  backM: 300,
  fwdDefaultM: 30000,
  maxSpeedMps: 45,
  fwdMinM: 2000,
  fwdMaxM: 80000,
  relocalizeM: 1000,
  relocalizeAfter: 3,
  relocalizeAgreeM: 5000,
  lambdaAlong: 0.6,
  lostAfter: 5,
  weakAboveM: 500,
  reacquireForwardBias: 0.02,
  speedEmaAlpha: 0.3
};

export function makeFrame(lat0, lon0) {
  var kx = R_EARTH * Math.cos(lat0 * DEG) * DEG;
  var ky = R_EARTH * DEG;
  return {
    lat0: lat0, lon0: lon0, kx: kx, ky: ky,
    toXY: function (lat, lon) { return { x: (lon - lon0) * kx, y: (lat - lat0) * ky }; },
    toLatLon: function (x, y) { return { lat: y / ky + lat0, lon: x / kx + lon0 }; }
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

function pointToSegment(px, py, ax, ay, bx, by) {
  var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  var t = L2 > 0 ? clamp(((px - ax) * dx + (py - ay) * dy) / L2, 0, 1) : 0;
  var qx = ax + dx * t, qy = ay + dy * t;
  return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
}

export function buildRoute(spec, routeId) {
  var route = spec.routes[routeId];
  if (!route) throw new Error('unknown routeId: ' + routeId);
  var keys = route.nodes;
  if (!keys || keys.length < 2) throw new Error('route needs 2+ nodes: ' + routeId);

  var lats = [], lons = [];
  for (var i = 0; i < keys.length; i++) {
    var nd = spec.nodes[keys[i]];
    if (!nd) throw new Error('unknown node: ' + keys[i]);
    if (!nd.real || typeof nd.real.lat !== 'number' || typeof nd.real.lon !== 'number') {
      throw new Error('node has no real coordinates: ' + keys[i]);
    }
    lats.push(nd.real.lat); lons.push(nd.real.lon);
  }
  var frame = makeFrame(
    (Math.min.apply(null, lats) + Math.max.apply(null, lats)) / 2,
    (Math.min.apply(null, lons) + Math.max.apply(null, lons)) / 2
  );

  var abstractPts = keys.map(function (k) {
    var a = spec.nodes[k].abstract;
    return { x: a[0], y: a[1] };
  });

  var via = route.via || {};
  var parts = [];
  var s = 0;

  for (var seg = 0; seg < keys.length - 1; seg++) {
    var a = spec.nodes[keys[seg]].real, b = spec.nodes[keys[seg + 1]].real;
    var shape = [[a.lat, a.lon]];
    var mid = via[String(seg)] || via[seg] || [];
    for (var m = 0; m < mid.length; m++) shape.push([mid[m][0], mid[m][1]]);
    shape.push([b.lat, b.lon]);

    var xy = shape.map(function (p) { return frame.toXY(p[0], p[1]); });
    var lens = [], segTotal = 0;
    for (var j = 0; j < xy.length - 1; j++) {
      var dx = xy[j + 1].x - xy[j].x, dy = xy[j + 1].y - xy[j].y;
      var L = Math.sqrt(dx * dx + dy * dy);
      lens.push(L); segTotal += L;
    }
    var acc = 0;
    for (var j2 = 0; j2 < lens.length; j2++) {
      var u0 = segTotal > 0 ? acc / segTotal : 0;
      var u1 = segTotal > 0 ? (acc + lens[j2]) / segTotal : 1;
      parts.push({
        segIndex: seg,
        fromKey: keys[seg], toKey: keys[seg + 1],
        x1: xy[j2].x, y1: xy[j2].y, x2: xy[j2 + 1].x, y2: xy[j2 + 1].y,
        len: lens[j2], s0: s, u0: u0, u1: u1
      });
      acc += lens[j2];
      s += lens[j2];
    }
  }

  var nodeXY = [];
  for (var n = 0; n < keys.length; n++) nodeXY.push(frame.toXY(lats[n], lons[n]));

  var pxPerKm = [];
  for (var g = 0; g < keys.length - 1; g++) {
    var ax = abstractPts[g + 1].x - abstractPts[g].x, ay = abstractPts[g + 1].y - abstractPts[g].y;
    var apx = Math.sqrt(ax * ax + ay * ay);
    var realLen = 0, segParts = [];
    for (var p2 = 0; p2 < parts.length; p2++) if (parts[p2].segIndex === g) { realLen += parts[p2].len; segParts.push(parts[p2]); }

    var A = frame.toXY(lats[g], lons[g]), B = frame.toXY(lats[g + 1], lons[g + 1]);
    var chordLen = Math.sqrt((B.x - A.x) * (B.x - A.x) + (B.y - A.y) * (B.y - A.y));
    var dev = 0;
    for (var q = 1; q < segParts.length; q++) {
      var d = pointToSegment(segParts[q].x1, segParts[q].y1, A.x, A.y, B.x, B.y);
      if (d > dev) dev = d;
    }
    pxPerKm.push({
      segIndex: g, from: keys[g], to: keys[g + 1],
      abstractPx: apx, realM: realLen, pxPerKm: realLen > 0 ? apx / (realLen / 1000) : null,
      viaPoints: segParts.length - 1, chordM: chordLen, chordDev_m: dev,
      detourRatio: chordLen > 0 ? realLen / chordLen : null
    });
  }

  return {
    id: routeId, keys: keys, frame: frame, parts: parts, totalM: s,
    abstractPts: abstractPts, nodeXY: nodeXY, pxPerKm: pxPerKm
  };
}

function footOnPart(part, px, py) {
  var dx = part.x2 - part.x1, dy = part.y2 - part.y1;
  var L2 = dx * dx + dy * dy;
  var t = L2 > 0 ? ((px - part.x1) * dx + (py - part.y1) * dy) / L2 : 0;
  t = clamp(t, 0, 1);
  var qx = part.x1 + dx * t, qy = part.y1 + dy * t;
  var ex = px - qx, ey = py - qy;
  return { t: t, x: qx, y: qy, dist: Math.sqrt(ex * ex + ey * ey) };
}

function footOnPartClamped(part, px, py, sLo, sHi) {
  var f = footOnPart(part, px, py);
  var s = part.s0 + f.t * part.len;
  if (s < sLo || s > sHi) {
    var sc = clamp(s, sLo, sHi);
    var t2 = part.len > 0 ? clamp((sc - part.s0) / part.len, 0, 1) : 0;
    var qx = part.x1 + (part.x2 - part.x1) * t2, qy = part.y1 + (part.y2 - part.y1) * t2;
    var ex = px - qx, ey = py - qy;
    f = { t: t2, x: qx, y: qy, dist: Math.sqrt(ex * ex + ey * ey) };
    s = sc;
  }
  return { foot: f, s: s };
}

function makeResult(route, part, foot, s, dist, method, opt) {
  var u = lerp(part.u0, part.u1, foot.t);
  var A0 = route.abstractPts[part.segIndex], A1 = route.abstractPts[part.segIndex + 1];
  var ll = route.frame.toLatLon(foot.x, foot.y);
  return {
    status: dist <= opt.offRouteM ? 'on_route' : 'off_route',
    quality: dist <= opt.weakAboveM ? 'good' : 'weak',
    routeId: route.id,
    method: method,
    segIndex: part.segIndex,
    fromKey: part.fromKey,
    toKey: part.toKey,
    segFraction: u,
    abstract: { x: lerp(A0.x, A1.x, u), y: lerp(A0.y, A1.y, u) },
    snapped: { lat: ll.lat, lon: ll.lon },
    distance_m: dist,
    progress_m: s,
    progress_ratio: route.totalM > 0 ? s / route.totalM : 0
  };
}

export function create(spec, options) {
  var opt = {};
  for (var k in DEFAULTS) opt[k] = DEFAULTS[k];
  if (options) for (var k2 in options) if (options.hasOwnProperty(k2)) opt[k2] = options[k2];

  var cache = {};
  function route(routeId) {
    if (!cache[routeId]) cache[routeId] = buildRoute(spec, routeId);
    return cache[routeId];
  }

  function projectStateless(routeId, lat, lon) {
    var rt = route(routeId);
    var P = rt.frame.toXY(lat, lon);
    var best = null;
    for (var i = 0; i < rt.parts.length; i++) {
      var f = footOnPart(rt.parts[i], P.x, P.y);
      if (!best || f.dist < best.f.dist) best = { f: f, part: rt.parts[i] };
    }
    var s = best.part.s0 + best.f.t * best.part.len;
    return makeResult(rt, best.part, best.f, s, best.f.dist, 'stateless', opt);
  }

  function searchWindow(rt, P, sLo, sHi, sExpect) {
    var best = null;
    for (var i = 0; i < rt.parts.length; i++) {
      var part = rt.parts[i];
      if (part.s0 + part.len < sLo || part.s0 > sHi) continue;
      var r = footOnPartClamped(part, P.x, P.y, sLo, sHi);
      var cost = r.foot.dist + opt.lambdaAlong * Math.abs(r.s - sExpect);
      if (!best || cost < best.cost) best = { cost: cost, foot: r.foot, s: r.s, part: part };
    }
    return best;
  }

  function createTracker(routeId, trackerOptions) {
    var rt = route(routeId);
    var o = {};
    for (var k3 in opt) o[k3] = opt[k3];
    if (trackerOptions) for (var k4 in trackerOptions) if (trackerOptions.hasOwnProperty(k4)) o[k4] = trackerOptions[k4];

    var st = { s: null, t: null, v: 0, offStreak: 0, pending: null };
    var everFixed = false;
    var lastGoodS = null;

    function reset() { st = { s: null, t: null, v: 0, offStreak: 0, pending: null }; }

    function globalBest(P) {
      var g = null;
      for (var i = 0; i < rt.parts.length; i++) {
        var f = footOnPart(rt.parts[i], P.x, P.y);
        if (!g || f.dist < g.foot.dist) g = { foot: f, part: rt.parts[i] };
      }
      g.s = g.part.s0 + g.foot.t * g.part.len;
      return g;
    }

    function reacquireBest(P) {
      if (lastGoodS == null) return globalBest(P);
      var best = null;
      for (var i = 0; i < rt.parts.length; i++) {
        var f = footOnPart(rt.parts[i], P.x, P.y);
        var s = rt.parts[i].s0 + f.t * rt.parts[i].len;
        var cost = f.dist + o.reacquireForwardBias * Math.max(0, lastGoodS - s);
        if (!best || cost < best.cost) best = { cost: cost, foot: f, part: rt.parts[i], s: s };
      }
      return best;
    }

    function agree(sCand) {
      if (st.pending && Math.abs(st.pending.s - sCand) <= o.relocalizeAgreeM) { st.pending.count++; st.pending.s = sCand; }
      else st.pending = { s: sCand, count: 1 };
      return st.pending.count >= o.relocalizeAfter;
    }

    function update(lat, lon, tMs) {
      var P = rt.frame.toXY(lat, lon);

      if (st.s === null) {
        var g0 = everFixed ? reacquireBest(P) : globalBest(P);
        var res0 = makeResult(rt, g0.part, g0.foot, g0.s, g0.foot.dist, everFixed ? 'reacquire' : 'initial', o);
        if (res0.status === 'on_route') {
          if (!everFixed || agree(g0.s)) {
            st.s = g0.s; st.t = (tMs == null ? null : tMs); st.offStreak = 0; st.pending = null;
            everFixed = true; lastGoodS = g0.s;
          } else {
            res0.status = 'off_route';
            res0.method = 'reacquire_pending';
          }
        } else { st.offStreak++; }
        return res0;
      }

      var dtSec = (tMs != null && st.t != null) ? (tMs - st.t) / 1000 : null;
      var fwd = o.fwdDefaultM;
      if (dtSec != null && dtSec >= 0) fwd = clamp(o.maxSpeedMps * dtSec, o.fwdMinM, o.fwdMaxM);
      var sExpect = st.s + ((dtSec != null && dtSec >= 0) ? st.v * dtSec : 0);
      var sLo = Math.max(0, st.s - o.backM);
      var sHi = Math.min(rt.totalM, st.s + fwd);

      var best = searchWindow(rt, P, sLo, sHi, clamp(sExpect, sLo, sHi));

      var method = 'sequential';
      if (!best || best.foot.dist > o.offRouteM) {
        var g = globalBest(P);
        var jump = (g.foot.dist <= o.relocalizeM) ? agree(g.s) : (st.pending = null, false);

        if (jump) { best = { foot: g.foot, s: g.s, part: g.part }; method = 'relocalize'; st.v = 0; st.pending = null; }
        else {
          var why = (g.foot.dist <= o.relocalizeM) ? 'confirming' : 'off_route';
          var res1 = makeResult(rt, g.part, g.foot, g.s, g.foot.dist, why, o);
          res1.status = 'off_route';
          st.offStreak++;
          if (st.offStreak >= o.lostAfter) reset();
          return res1;
        }
      } else if (best.foot.dist > o.weakAboveM) {
        var g2 = globalBest(P);
        if (g2.foot.dist <= o.relocalizeM && g2.foot.dist < best.foot.dist * 0.3) {
          if (agree(g2.s)) { best = { foot: g2.foot, s: g2.s, part: g2.part }; method = 'relocalize'; st.v = 0; st.pending = null; }
        } else {
          st.pending = null;
        }
      } else {
        st.pending = null;
      }

      var res = makeResult(rt, best.part, best.foot, best.s, best.foot.dist, method, o);
      if (res.status === 'on_route') {
        if (dtSec != null && dtSec > 0) {
          var vNow = (best.s - st.s) / dtSec;
          if (vNow < 0) vNow = 0;
          st.v = st.v * (1 - o.speedEmaAlpha) + vNow * o.speedEmaAlpha;
        }
        st.s = best.s;
        st.t = (tMs == null ? null : tMs);
        st.offStreak = 0;
        lastGoodS = best.s;
      } else {
        st.offStreak++;
        if (st.offStreak >= o.lostAfter) reset();
      }
      return res;
    }

    function fullReset() { reset(); everFixed = false; lastGoodS = null; }

    return {
      update: update, reset: reset, fullReset: fullReset,
      state: function () { return { s: st.s, v: st.v, offStreak: st.offStreak, everFixed: everFixed, lastGoodS: lastGoodS }; },
      route: rt
    };
  }

  function nearestNode(routeId, lat, lon) {
    var rt = route(routeId);
    var P = rt.frame.toXY(lat, lon);
    var best = null;
    for (var i = 0; i < rt.keys.length; i++) {
      var dx = P.x - rt.nodeXY[i].x, dy = P.y - rt.nodeXY[i].y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (!best || d < best.dist_m) best = { index: i, key: rt.keys[i], dist_m: d, abstract: rt.abstractPts[i] };
    }
    return best;
  }

  return {
    options: opt,
    routeIds: function () { return Object.keys(spec.routes); },
    route: route,
    projectStateless: projectStateless,
    createTracker: createTracker,
    nearestNode: nearestNode
  };
}
