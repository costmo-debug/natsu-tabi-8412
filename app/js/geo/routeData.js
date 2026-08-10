/* routeData.js — 実座標(GPS)⇔抽象座標(路線図)の対応表。
 * 出所: _spike/route_projection/nodes.json（v2・2026-08-10）。
 * abstract の値は app/js/data/nodes.js の NP と同じ（同じ路線図なので一致させてある）。
 * project.js の create(SPEC) にそのまま渡す。
 */
"use strict";
export var SPEC = {
  nodes: {
    izumo:      { abstract: [90, 110],  real: { lat: 35.401995, lon: 132.685459 } },
    yonago:     { abstract: [300, 110], real: { lat: 35.423319, lon: 133.396477 } },
    tottori:    { abstract: [520, 110], real: { lat: 35.478629, lon: 134.196944 } },
    hiruzen:    { abstract: [300, 210], real: { lat: 35.271023, lon: 133.629485 } },
    yubara:     { abstract: [300, 300], real: { lat: 35.203193, lon: 133.731084 } },
    mochigase:  { abstract: [520, 230], real: { lat: 35.298887, lon: 134.237375 } },
    kitabo:     { abstract: [160, 470], real: { lat: 34.982842, lon: 133.682616 } },
    ochiai:     { abstract: [300, 470], real: { lat: 35.052164, lon: 133.807147 } },
    shoo:       { abstract: [410, 470], real: { lat: 35.043418, lon: 134.106264 } },
    sayo:       { abstract: [520, 470], real: { lat: 35.022964, lon: 134.389189 } },
    harima:     { abstract: [600, 470], real: { lat: 34.830864, lon: 134.490183 } },
    kasai:      { abstract: [680, 470], real: { lat: 34.947116, lon: 134.800767 } },
    kobe:       { abstract: [770, 470], real: { lat: 34.848798, lon: 135.223421 } },
    takarazukaN:{ abstract: [770, 380], real: { lat: 34.866531, lon: 135.303764 } },
    takatsuki:  { abstract: [900, 380], real: { lat: 34.87255,  lon: 135.62707  } },
    kyoto:      { abstract: [900, 270], real: { lat: 34.98775,  lon: 135.758112 } },
    suitaSA:    { abstract: [900, 460], real: { lat: 34.783084, lon: 135.526675 } },
    suita:      { abstract: [900, 530], real: { lat: 34.807732, lon: 135.543553 } },
    najio:      { abstract: [830, 530], real: { lat: 34.828805, lon: 135.295702 } },
    sakai:      { abstract: [900, 652], real: { lat: 34.578876, lon: 135.481808 } },
    himeji:     { abstract: [600, 592], real: { lat: 34.839331, lon: 134.69402  } },
    taishi:     { abstract: [470, 592], real: { lat: 34.8476,   lon: 134.5888   } },
    takahashi:  { abstract: [160, 570], real: { lat: 34.876193, lon: 133.661595 } },
    bisei:      { abstract: [160, 672], real: { lat: 34.672032, lon: 133.545392 } }
  },
  routes: {
    'rt-d12': {
      day: '8/12',
      nodes: ['sakai', 'suita', 'suitaSA', 'takatsuki', 'kyoto'],
      via: {}
    },
    'rt-d13': {
      day: '8/13',
      nodes: ['kyoto', 'takatsuki', 'takarazukaN', 'kobe', 'kasai', 'harima', 'sayo', 'shoo', 'ochiai', 'yubara'],
      via: {}
    },
    'rt-d13n': {
      day: '8/13夜',
      nodes: ['yubara', 'ochiai', 'kitabo', 'takahashi', 'bisei'],
      via: {}
    },
    'rt-d14': {
      day: '8/14',
      nodes: ['yubara', 'hiruzen', 'yonago', 'izumo', 'yonago', 'tottori', 'mochigase'],
      via: {
        '2': [
          [35.408601, 133.325269], [35.42683, 133.13213], [35.449117, 133.091572],
          [35.38669, 132.88419], [35.32566, 132.71527]
        ],
        '3': [
          [35.32566, 132.71527], [35.38669, 132.88419], [35.449117, 133.091572],
          [35.42683, 133.13213], [35.408601, 133.325269]
        ],
        '4': [
          [35.46034, 133.43912], [35.50115, 133.50686], [35.50876, 133.5997],
          [35.498091, 133.714554], [35.496345, 133.869879], [35.51141, 134.00527], [35.49314, 134.19073]
        ]
      }
    },
    'rt-d15': {
      day: '8/15',
      nodes: ['mochigase', 'sayo', 'harima', 'himeji', 'taishi', 'himeji', 'harima', 'kasai', 'kobe', 'najio', 'suita', 'sakai'],
      via: {}
    }
  }
};
/* きょうの日付に対応する route id（複数当てはまる日は配列） */
export var DAY_ROUTES = {
  '8/12': ['rt-d12'],
  '8/13': ['rt-d13', 'rt-d13n'],
  '8/14': ['rt-d14'],
  '8/15': ['rt-d15']
};
