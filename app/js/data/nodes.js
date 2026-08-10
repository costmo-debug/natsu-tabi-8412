"use strict";
export var NP = {
  izumo:[90,110], yonago:[300,110], tottori:[520,110],
  hiruzen:[300,210], yubara:[300,300], mochigase:[520,230],
  kitabo:[160,470], ochiai:[300,470], shoo:[410,470],
  sayo:[520,470], harima:[600,470], kasai:[680,470], kobe:[770,470],
  takarazukaN:[770,380], takatsuki:[900,380], kyoto:[900,270],
  suitaSA:[900,460], suita:[900,530], najio:[830,530],
  sakai:[900,652], himeji:[600,592], taishi:[470,592],
  takahashi:[160,570], bisei:[160,672]
};
export var NODES = [
  {k:'izumo',      t:'land', art:'shrine', n:'いずも',            day:'d14'},
  {k:'yonago',     t:'jct',  n:'よなごJCT'},
  {k:'tottori',    t:'ic',   n:'とっとり'},
  {k:'hiruzen',    t:'sa',   n:'ひるぜんSA',       ic:'🐄', s:'sa7', day:'d14'},
  {k:'yubara',     t:'land', art:'onsen',  n:'ゆばら おんせん',   day:'d13'},
  {k:'mochigase',  t:'land', art:'camp',   n:'もちがせ',          day:'d14'},
  {k:'ochiai',     t:'jct',  n:'おちあいJCT'},
  {k:'kitabo',     t:'jct',  n:'きたぼうJCT'},
  {k:'shoo',       t:'sa',   n:'しょうおうSA',     ic:'⛽', s:'sa4', day:'d13'},
  {k:'sayo',       t:'jct',  n:'さようJCT'},
  {k:'harima',     t:'jct',  n:'はりまJCT'},
  {k:'kasai',      t:'sa',   n:'かさいSA',         ic:'🍽', s:'sa3', day:'d13'},
  {k:'kobe',       t:'jct',  n:'こうべJCT'},
  {k:'takarazukaN',t:'sa',   n:'たからづかきたSA', ic:'⚡', s:'sa2', day:'d13'},
  {k:'takatsuki',  t:'jct',  n:'たかつきJCT'},
  {k:'kyoto',      t:'land', art:'tower',  n:'きょうと',          day:'d12'},
  {k:'suitaSA',    t:'sa',   n:'すいたSA',         ic:'📄', s:'sa1', day:'d12'},
  {k:'suita',      t:'jct',  n:'すいたJCT'},
  {k:'najio',      t:'sa',   n:'なじおSA',         ic:'🏁', s:'sa9', day:'d15'},
  {k:'sakai',      t:'land', art:'exit',   n:'さかい',            day:'d12'},
  {k:'himeji',     t:'land', art:'castle', n:'ひめじ',            day:'d15'},
  {k:'taishi',     t:'ic',   n:'たいし'},
  {k:'takahashi',  t:'sa',   n:'たかはしSA',       ic:'☄️', s:'sa5', day:'d13'},
  {k:'bisei',      t:'land', art:'dome',   n:'びせい てんもんだい', day:'d13'}
];
export var BASE = [
  ['izumo','yonago','tottori'],
  ['yonago','hiruzen','yubara','ochiai'],
  ['tottori','mochigase','sayo'],
  ['kitabo','ochiai','shoo','sayo','harima','kasai','kobe','najio','suita'],
  ['kobe','takarazukaN','takatsuki'],
  ['kyoto','takatsuki','suitaSA','suita'],
  ['suita','sakai'],
  ['harima','himeji'],
  ['himeji','taishi'],
  ['kitabo','takahashi'],
  ['takahashi','bisei']
];
/* 行きと帰りが重なる区間は off（道からの ずらし量）を逆にして2本に分ける */
export var ROUTES = [
  {day:'d12', segs:[{p:['sakai','suita','suitaSA','takatsuki','kyoto'], off:-1.35}]},
  {day:'d13', segs:[
      {p:['kyoto','takatsuki','takarazukaN','kobe','kasai','harima','sayo','shoo','ochiai','yubara'], off:-1.35},
      {p:['yubara','ochiai','kitabo','takahashi','bisei'], off:-1.35},
      {p:['bisei','takahashi','kitabo','ochiai','yubara'], off:1.35}]},
  {day:'d14', segs:[
      {p:['yubara','hiruzen','yonago','izumo'], off:-1.35},
      {p:['izumo','yonago','tottori','mochigase'], off:1.35}]},
  {day:'d15', segs:[
      {p:['mochigase','sayo','harima','himeji'], off:-1.35},
      {p:['himeji','taishi'], off:-1.35},
      {p:['taishi','himeji','harima','kasai','kobe','najio','suita','sakai'], off:1.35}]}
];
