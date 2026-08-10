"use strict";
export var CAT_POSES=['cat-guide','cat-travel','cat-cheer','cat-trouble','cat-sleep','cat-trophy'];
export function catId(pose){
  if(CAT_POSES.indexOf(pose)>=0 && document.getElementById(pose)) return pose;
  return 'cat-guide';
}
/* ちずの 中（SVG）に おく とき。x,y＝足もとの ばしょ。
   sc は もとの かりシルエット（たて38px）と おなじ 大きさ が 1.0 になるよう そろえてある */
export var CAT_UNIT=0.633;
export function catUse(pose,x,y,sc){
  var s=(sc||1)*CAT_UNIT;
  return '<use href="#'+catId(pose)+'" x="0" y="0" width="120" height="120" '
       + 'transform="translate('+(x-60*s).toFixed(1)+','+(y-112*s).toFixed(1)+') scale('+s.toFixed(3)+')"/>';
}
/* HTML の 中に おく とき */
export function catBlock(pose,px){
  var p=px||132;
  return '<svg viewBox="0 0 120 120" width="'+p+'" height="'+p+'" aria-hidden="true">'
       + '<use href="#'+catId(pose)+'" width="120" height="120"/></svg>';
}
export var CAT_PROV='';

/* ---------- 2. しらせ・触覚・音 ---------- */
export function catRect(x,y,sc){   /* ふだが 重ならない ように する ための 当たり判定（ちず座標） */
  var s=(sc||1)*CAT_UNIT;
  return {x:x-42*s, y:y-112*s, w:84*s, h:112*s};
}

/* ---------- 5. ひろい ちず（立体ジオラマ） ---------- */
/* りく の かたち（マス座標／よこ＝東西・たて＝南北）。
   きた の へり ＝ 日本海の なぎさ。みなみ の へり ＝ 瀬戸内海。
   みぎ下 の へこみ ＝ 大阪湾（さかい は その 東がわ の きしに ある）。 */
