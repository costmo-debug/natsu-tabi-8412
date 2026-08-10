/* affine.js — 緯度経度 ⇔ 絵地図のピクセル座標
 *
 * 移植元: _spike/affine/affine.js（検証済み）。ロジックは変えていない。
 * UMD ラッパーを ES module の export に置き換えただけ。
 */
"use strict";

var R = 6378137;
var D2R = Math.PI / 180;
var R2D = 180 / Math.PI;

export function project(lat, lon, mode) {
  var x = R * lon * D2R;
  var y = (mode === 'linear')
    ? R * lat * D2R
    : R * Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2));
  return [x, y];
}

export function unproject(x, y, mode) {
  var lon = x / R * R2D;
  var lat = (mode === 'linear')
    ? y / R * R2D
    : (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * R2D;
  return [lat, lon];
}

export function groundScale(lat, mode) {
  return (mode === 'linear') ? 1 : Math.cos(lat * D2R);
}

export function solve3(A, B) {
  var n = 3, m = B[0].length;
  var M = [];
  for (var i = 0; i < n; i++) M.push(A[i].slice().concat(B[i].slice()));
  for (var col = 0; col < n; col++) {
    var piv = col;
    for (var r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    if (Math.abs(M[piv][col]) < 1e-300) return null;
    var t = M[col]; M[col] = M[piv]; M[piv] = t;
    var d = M[col][col];
    for (var k = col; k < n + m; k++) M[col][k] /= d;
    for (var r2 = 0; r2 < n; r2++) {
      if (r2 === col) continue;
      var f = M[r2][col];
      if (f === 0) continue;
      for (var k2 = col; k2 < n + m; k2++) M[r2][k2] -= f * M[col][k2];
    }
  }
  var out = [];
  for (var i2 = 0; i2 < n; i2++) out.push(M[i2].slice(n));
  return out;
}

function eig2sym(sxx, sxy, syy) {
  var tr = sxx + syy, det = sxx * syy - sxy * sxy;
  var disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
  return [tr / 2 + disc, tr / 2 - disc];
}

export function decompose(coef) {
  var a = coef.a, b = coef.b, d = coef.d, e = coef.e;
  var flip = (a * e - b * d) < 0 ? 1 : -1;
  var A2 = a, B2 = b, D2 = -d * flip, E2 = -e * flip;
  var sx = Math.hypot(A2, D2);
  var rot = Math.atan2(D2, A2);
  var shear = (A2 * B2 + D2 * E2) / (sx * sx);
  var sy = Math.hypot(B2 - shear * A2, E2 - shear * D2);
  return {
    mirrored: (a * e - b * d) > 0,
    rotationDeg: -rot * R2D,
    scaleX_pxPerM: sx,
    scaleY_pxPerM: sy,
    aspect: sy !== 0 ? sx / sy : Infinity,
    shear: shear,
    shearDeg: Math.atan(shear) * R2D
  };
}

export function fit(pts, opts) {
  opts = opts || {};
  var mode = opts.mode || 'mercator';
  if (!pts || pts.length < 3) throw new Error('基準点が3点未満です（n=' + (pts ? pts.length : 0) + '）');

  var P = pts.map(function (p) {
    var xy = project(p.lat, p.lon, mode);
    return { x: xy[0], y: xy[1], u: p.u, v: p.v, w: (p.w == null ? 1 : p.w), lat: p.lat, lon: p.lon, id: p.id };
  });
  var W = P.reduce(function (s, p) { return s + p.w; }, 0);
  var x0 = P.reduce(function (s, p) { return s + p.w * p.x; }, 0) / W;
  var y0 = P.reduce(function (s, p) { return s + p.w * p.y; }, 0) / W;

  var Sxx = 0, Sxy = 0, Syy = 0, Sx = 0, Sy = 0, S1 = 0;
  var Sxu = 0, Syu = 0, Su = 0, Sxv = 0, Syv = 0, Sv = 0;
  P.forEach(function (p) {
    var dx = p.x - x0, dy = p.y - y0, w = p.w;
    Sxx += w * dx * dx; Sxy += w * dx * dy; Syy += w * dy * dy;
    Sx += w * dx; Sy += w * dy; S1 += w;
    Sxu += w * dx * p.u; Syu += w * dy * p.u; Su += w * p.u;
    Sxv += w * dx * p.v; Syv += w * dy * p.v; Sv += w * p.v;
  });
  var A = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, S1]];
  var B = [[Sxu, Sxv], [Syu, Syv], [Su, Sv]];
  var sol = solve3(A, B);
  if (!sol) throw new Error('係数を解けません（基準点が一直線／重複している可能性）');

  var a = sol[0][0], b = sol[1][0], cc = sol[2][0];
  var d = sol[0][1], e = sol[1][1], ff = sol[2][1];
  var coef = {
    mode: mode,
    a: a, b: b, c: cc - a * x0 - b * y0,
    d: d, e: e, f: ff - d * x0 - e * y0,
    n: pts.length,
    origin: { x: x0, y: y0 },
    centered: { a: a, b: b, c: cc, d: d, e: e, f: ff }
  };
  var ev = eig2sym(Sxx / S1, Sxy / S1, Syy / S1);
  coef.spread = {
    major_m: Math.sqrt(Math.max(ev[0], 0)),
    minor_m: Math.sqrt(Math.max(ev[1], 0)),
    linearity: ev[0] > 0 ? Math.sqrt(Math.max(ev[1], 0) / ev[0]) : 0
  };
  coef.det = a * e - b * d;
  coef.pxPerMetre = Math.sqrt(Math.abs(coef.det));
  coef.metrePerPx = coef.pxPerMetre > 0 ? 1 / coef.pxPerMetre : Infinity;
  coef.decomp = decompose(coef);
  return coef;
}

export function fitSimilarity(pts, opts) {
  opts = opts || {};
  var mode = opts.mode || 'mercator';
  if (!pts || pts.length < 2) throw new Error('基準点が2点未満です');
  var P = pts.map(function (p) {
    var xy = project(p.lat, p.lon, mode);
    return { x: xy[0], y: xy[1], u: p.u, v: p.v };
  });
  var n = P.length;
  var mx = 0, my = 0, mu = 0, mv = 0;
  P.forEach(function (p) { mx += p.x; my += p.y; mu += p.u; mv += p.v; });
  mx /= n; my /= n; mu /= n; mv /= n;
  var Sxu = 0, Syv = 0, Sxv = 0, Syu = 0, Sxx = 0, Syy = 0, Sxy = 0;
  P.forEach(function (p) {
    var dx = p.x - mx, dy = p.y - my, du = p.u - mu, dv = p.v - mv;
    Sxu += dx * du; Syv += dy * dv; Sxv += dx * dv; Syu += dy * du;
    Sxx += dx * dx; Syy += dy * dy; Sxy += dx * dy;
  });
  var S = Sxx + Syy;
  var cands = [
    { a: (Sxu + Syv) / S, b: null, d: (Sxv - Syu) / S, kind: 'direct' },
    { a: (Sxu - Syv) / S, b: null, d: null, kind: 'flip' }
  ];
  cands[0].b = -cands[0].d; cands[0].e = cands[0].a;
  cands[1].b = (Syu + Sxv) / S; cands[1].d = cands[1].b; cands[1].e = -cands[1].a;

  var best = null;
  cands.forEach(function (k) {
    var coef = {
      mode: mode, n: n, similarity: true, kind: k.kind,
      a: k.a, b: k.b, d: k.d, e: k.e,
      origin: { x: mx, y: my },
      centered: { a: k.a, b: k.b, c: mu, d: k.d, e: k.e, f: mv }
    };
    coef.c = mu - k.a * mx - k.b * my;
    coef.f = mv - k.d * mx - k.e * my;
    coef.det = k.a * k.e - k.b * k.d;
    coef.pxPerMetre = Math.sqrt(Math.abs(coef.det));
    coef.metrePerPx = 1 / coef.pxPerMetre;
    var ev = eig2sym(Sxx / n, Sxy / n, Syy / n);
    coef.spread = {
      major_m: Math.sqrt(Math.max(ev[0], 0)),
      minor_m: Math.sqrt(Math.max(ev[1], 0)),
      linearity: ev[0] > 0 ? Math.sqrt(Math.max(ev[1], 0) / ev[0]) : 0
    };
    coef.decomp = decompose(coef);
    var sse = 0;
    pts.forEach(function (p) {
      var q = forward(coef, p.lat, p.lon);
      sse += (q.u - p.u) * (q.u - p.u) + (q.v - p.v) * (q.v - p.v);
    });
    coef.sse = sse;
    if (!best || sse < best.sse) best = coef;
  });
  return best;
}

export function forward(coef, lat, lon) {
  var xy = project(lat, lon, coef.mode);
  var dx = xy[0] - coef.origin.x, dy = xy[1] - coef.origin.y;
  var k = coef.centered;
  return { u: k.a * dx + k.b * dy + k.c, v: k.d * dx + k.e * dy + k.f };
}

export function forwardRaw(coef, lat, lon) {
  var xy = project(lat, lon, coef.mode);
  return { u: coef.a * xy[0] + coef.b * xy[1] + coef.c, v: coef.d * xy[0] + coef.e * xy[1] + coef.f };
}

export function inverse(coef, u, v) {
  var k = coef.centered;
  var det = k.a * k.e - k.b * k.d;
  if (Math.abs(det) < 1e-300) throw new Error('逆変換できません（行列式が0）');
  var du = u - k.c, dv = v - k.f;
  var dx = (k.e * du - k.b * dv) / det;
  var dy = (-k.d * du + k.a * dv) / det;
  var ll = unproject(dx + coef.origin.x, dy + coef.origin.y, coef.mode);
  return { lat: ll[0], lon: ll[1] };
}

export function pxToMetres(coef, du, dv, lat) {
  var k = coef.centered;
  var det = k.a * k.e - k.b * k.d;
  var dx = (k.e * du - k.b * dv) / det;
  var dy = (-k.d * du + k.a * dv) / det;
  var s = groundScale(lat, coef.mode);
  return Math.hypot(dx, dy) * s;
}

export function metresPerPx(coef, lat) {
  var mu = pxToMetres(coef, 1, 0, lat);
  var mv = pxToMetres(coef, 0, 1, lat);
  return Math.sqrt((mu * mu + mv * mv) / 2);
}

export function residuals(coef, pts) {
  var rows = pts.map(function (p) {
    var q = forward(coef, p.lat, p.lon);
    var du = q.u - p.u, dv = q.v - p.v;
    return {
      id: p.id, u: p.u, v: p.v, uf: q.u, vf: q.v, du: du, dv: dv,
      px: Math.hypot(du, dv), m: pxToMetres(coef, du, dv, p.lat)
    };
  });
  var n = rows.length;
  var rmsPx = Math.sqrt(rows.reduce(function (s, r) { return s + r.px * r.px; }, 0) / n);
  var rmsM = Math.sqrt(rows.reduce(function (s, r) { return s + r.m * r.m; }, 0) / n);
  var maxPx = rows.reduce(function (s, r) { return Math.max(s, r.px); }, 0);
  var maxM = rows.reduce(function (s, r) { return Math.max(s, r.m); }, 0);
  return { rows: rows, rmsPx: rmsPx, rmsM: rmsM, maxPx: maxPx, maxM: maxM, n: n };
}

export function loocv(pts, opts) {
  var rows = [];
  for (var i = 0; i < pts.length; i++) {
    var train = pts.filter(function (_, j) { return j !== i; });
    if (train.length < 3) continue;
    var c = fit(train, opts);
    var r = residuals(c, [pts[i]]).rows[0];
    r.trainN = train.length;
    rows.push(r);
  }
  if (!rows.length) return null;
  var n = rows.length;
  return {
    rows: rows, n: n,
    rmsPx: Math.sqrt(rows.reduce(function (s, r) { return s + r.px * r.px; }, 0) / n),
    rmsM: Math.sqrt(rows.reduce(function (s, r) { return s + r.m * r.m; }, 0) / n),
    maxPx: rows.reduce(function (s, r) { return Math.max(s, r.px); }, 0),
    maxM: rows.reduce(function (s, r) { return Math.max(s, r.m); }, 0)
  };
}

export function makeLocal(pts, opts) {
  opts = opts || {};
  var mode = opts.mode || 'mercator';
  var sigma = opts.sigmaM || null;
  var ridge = opts.ridge == null ? 0.02 : opts.ridge;
  var global = fit(pts, { mode: mode });
  if (!sigma) sigma = Math.max(global.spread.major_m * 0.6, 1);

  function weightsAt(lat, lon) {
    var xy = project(lat, lon, mode);
    return pts.map(function (p) {
      var q = project(p.lat, p.lon, mode);
      var dd = (xy[0] - q[0]) * (xy[0] - q[0]) + (xy[1] - q[1]) * (xy[1] - q[1]);
      return Math.exp(-dd / (2 * sigma * sigma)) + ridge;
    });
  }

  function forwardLocal(lat, lon) {
    var w = weightsAt(lat, lon);
    var wp = pts.map(function (p, i) { return { lat: p.lat, lon: p.lon, u: p.u, v: p.v, w: w[i] }; });
    var c;
    try { c = fit(wp, { mode: mode }); } catch (err) { c = global; }
    return forward(c, lat, lon);
  }

  function inverseLocal(u, v) {
    var w = pts.map(function (p) {
      var q = forward(global, p.lat, p.lon);
      var dd = (u - q.u) * (u - q.u) + (v - q.v) * (v - q.v);
      var sp = sigma * global.pxPerMetre;
      return Math.exp(-dd / (2 * sp * sp)) + ridge;
    });
    var wp = pts.map(function (p, i) { return { lat: p.lat, lon: p.lon, u: p.u, v: p.v, w: w[i] }; });
    var c;
    try { c = fit(wp, { mode: mode }); } catch (err) { c = global; }
    var g = inverse(c, u, v);
    for (var it = 0; it < 3; it++) {
      var w2 = weightsAt(g.lat, g.lon);
      var wp2 = pts.map(function (p, i) { return { lat: p.lat, lon: p.lon, u: p.u, v: p.v, w: w2[i] }; });
      var c2;
      try { c2 = fit(wp2, { mode: mode }); } catch (err) { break; }
      g = inverse(c2, u, v);
    }
    return g;
  }

  return {
    mode: mode, sigmaM: sigma, ridge: ridge, global: global,
    forward: forwardLocal, inverse: inverseLocal,
    residuals: function (test) {
      var rows = test.map(function (p) {
        var q = forwardLocal(p.lat, p.lon);
        var du = q.u - p.u, dv = q.v - p.v;
        return { id: p.id, du: du, dv: dv, px: Math.hypot(du, dv), m: pxToMetres(global, du, dv, p.lat) };
      });
      var n = rows.length;
      return {
        rows: rows, n: n,
        rmsPx: Math.sqrt(rows.reduce(function (s, r) { return s + r.px * r.px; }, 0) / n),
        rmsM: Math.sqrt(rows.reduce(function (s, r) { return s + r.m * r.m; }, 0) / n),
        maxPx: rows.reduce(function (s, r) { return Math.max(s, r.px); }, 0),
        maxM: rows.reduce(function (s, r) { return Math.max(s, r.m); }, 0)
      };
    }
  };
}

export var R_EARTH_M = R;
