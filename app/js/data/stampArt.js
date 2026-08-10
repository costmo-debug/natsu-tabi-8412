"use strict";
/* ばしょID → がぞうファイル名の たいおうひょう（1か所に まとめる）
   絵が とどいたら、この STAMP_ART に 1行 足すだけで さしかわる。
   まだ 絵が 無い ばしょは ここに 書かない（グレーの ？ に なる） */
export var STAMP_ART = {
  k1:'k1.png', k2:'k2.png', k3:'k3.png', k4:'k4.png',
  y1:'y1.png', y2:'y2.png', y3:'y3.png', y4:'y4.png',
  i1:'i1.png', i2:'i2.png', i3:'i3.png', i4:'i4.png',
  f1:'f1.png', f2:'f2.png', f3:'f3.png', f4:'f4.png',
  h1:'h1.png', h2:'h2.png', h3:'h3.png', h4:'h4.png',
  sa1:'sa1.png', sa2:'sa2.png', sa3:'sa3.png', sa4:'sa4.png',
  sa5:'sa5.png', sa6:'sa6.png', sa7:'sa7.png', sa8:'sa8.png', sa9:'sa9.png'
};
export var STAMP_ART_DIR = './assets/stamps/';
export function stampArtSrc(k){
  var f = STAMP_ART[k];
  return f ? (STAMP_ART_DIR + f) : '';
}
export function hasStampArt(k){ return !!STAMP_ART[k]; }
