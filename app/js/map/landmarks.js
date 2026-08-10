"use strict";
import { T, iso, pt, G, shade, isoBox, isoRoof, hexClamp, isoCone, isoShadow, offsetPts, isoPath, roadLadder, dirArrows, rnd, projR } from '../map/iso.js';
import { gEllipse, mountTop } from '../map/terrain.js';
import { scaleAt, pathG, art_torii } from './areamap.js';
export function art_shrine(g){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,4.4));
  s.push(isoBox(x,y,3.4,2.6,3,'#cdbd9a'));
  s.push(isoBox(x,y,2.1,1.6,11,'#efe3c8',3));
  s.push(isoRoof(x,y,3.1,2.4,14,17,'#7a5a41'));
  var c=iso(x,y+2.4,10);
  s.push('<ellipse cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" rx="17" ry="7" fill="#d8c79c" stroke="#a98f63" stroke-width="2"/>');
  var p1=iso(x-2.2,y+4.6,0), p2=iso(x+2.2,y+4.6,0);
  s.push('<path d="M'+pt(p1)+'L'+pt(iso(x-2.2,y+4.6,13))+'" stroke="#d1332e" stroke-width="5" stroke-linecap="round"/>');
  s.push('<path d="M'+pt(p2)+'L'+pt(iso(x+2.2,y+4.6,13))+'" stroke="#d1332e" stroke-width="5" stroke-linecap="round"/>');
  s.push('<path d="M'+pt(iso(x-3.2,y+4.6,14.5))+'L'+pt(iso(x+3.2,y+4.6,14.5))+'" stroke="#d1332e" stroke-width="5" stroke-linecap="round"/>');
  s.push('<path d="M'+pt(iso(x-2.6,y+4.6,11))+'L'+pt(iso(x+2.6,y+4.6,11))+'" stroke="#d1332e" stroke-width="3.4" stroke-linecap="round"/>');
  return s.join('');
}
export function art_onsen(g){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,3.6));
  s.push(isoBox(x,y,2.5,1.9,9,'#e6d2ae'));
  s.push(isoRoof(x,y,3.1,2.4,9,12,'#55707f'));
  var c=iso(x,y,26);
  for(var i=-1;i<=1;i++){
    s.push('<path d="M'+(c[0]+i*11)+' '+c[1]+' c -5 -8 5 -12 0 -20" fill="none" stroke="#ffffff" '
         + 'stroke-width="4" stroke-linecap="round" opacity=".85"/>');
  }
  return s.join('');
}
export function art_camp(g){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,3.4));
  var A=iso(x-2.4,y-1.8,0),B=iso(x+2.4,y-1.8,0),C=iso(x+2.4,y+1.8,0),D=iso(x-2.4,y+1.8,0);
  var T1=iso(x,y-1.8,13),T2=iso(x,y+1.8,13);
  s.push('<path d="M'+pt(A)+'L'+pt(T1)+'L'+pt(T2)+'L'+pt(D)+'Z" fill="#4fa38e"/>');
  s.push('<path d="M'+pt(B)+'L'+pt(T1)+'L'+pt(T2)+'L'+pt(C)+'Z" fill="#3d8474"/>');
  s.push('<path d="M'+pt(D)+'L'+pt(C)+'L'+pt(T2)+'Z" fill="#2f6b5e"/>');
  s.push(isoCone(x-4.6,y+2.4,0.9,7,'#f08a2e'));
  s.push(isoCone(x+4.4,y-1.2,1.5,15,'#4f9e57'));
  return s.join('');
}
export function art_tower(g){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,2.6));
  s.push(isoBox(x,y,2.4,1.9,5,'#e9e3d6'));
  s.push(isoBox(x,y,0.95,0.95,22,'#ffffff',5));
  s.push(isoBox(x,y,1.35,1.35,3,'#e2544a',22));
  s.push(isoBox(x,y,0.55,0.55,9,'#f4f4f4',27));
  var a=iso(x,y,36),b=iso(x,y,44);
  s.push('<path d="M'+pt(a)+'L'+pt(b)+'" stroke="#8a97a8" stroke-width="2.4" stroke-linecap="round"/>');
  return s.join('');
}
/* 高速の 出口（料金所）。家の 絵 では ない ＝「いえが ここに ある」と 読まれない ため */
export function art_exit(g){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,3.4));
  s.push(isoBox(x,y,2.8,1.6,2,'#c9d3dc'));                 /* 料金所の しま */
  s.push(isoBox(x-1.55,y,0.5,0.8,8,'#f4f6f8',2));          /* ブース ひだり */
  s.push(isoBox(x+1.55,y,0.5,0.8,8,'#f4f6f8',2));          /* ブース みぎ */
  s.push(isoBox(x,y,2.45,1.15,1.4,'#e2544a',13));          /* ひらたい やね（家の 三角やね と 見分ける・ブースが 見える 幅に する） */
  var a=iso(x-3.6,y-0.9,0), b=iso(x-3.6,y-0.9,15);
  s.push('<path d="M'+pt(a)+'L'+pt(b)+'" stroke="#8a97a8" stroke-width="2.2" stroke-linecap="round"/>');
  s.push(isoBox(x-3.6,y-0.9,0.15,1.15,2.6,'#2f8f5b',15));  /* みどりの あんない標識 */
  return s.join('');
}
export function art_castle(g){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,5.2));
  s.push(isoBox(x,y,4.2,3.3,4,'#cfc7b4'));
  s.push(isoBox(x,y,2.9,2.3,8,'#f8f4ea',4));
  s.push(isoRoof(x,y,3.3,2.7,12,6,'#46516a'));
  s.push(isoBox(x,y,2.1,1.6,7,'#f8f4ea',17));
  s.push(isoRoof(x,y,2.4,1.9,24,5,'#46516a'));
  s.push(isoBox(x,y,1.3,1.0,6,'#f8f4ea',28));
  s.push(isoRoof(x,y,1.6,1.3,34,8,'#46516a'));
  return s.join('');
}
export function art_dome(g,z0){
  var x=g[0],y=g[1],s=[]; z0=z0||0;
  s.push(isoShadow(x,y,3.0));
  s.push(isoBox(x,y,2.0,2.0,8+z0,'#eaf0f6'));
  var c=iso(x,y,8+z0);
  s.push('<path d="M'+(c[0]-20).toFixed(1)+' '+c[1].toFixed(1)
       + ' a20 17 0 0 1 40 0 Z" fill="#f7fafd"/>');
  s.push('<path d="M'+(c[0]-20).toFixed(1)+' '+c[1].toFixed(1)
       + ' a20 17 0 0 1 20 -17 l0 17 Z" fill="#dfe8f1"/>');
  s.push('<path d="M'+c[0].toFixed(1)+' '+(c[1]-17).toFixed(1)+' l0 17" stroke="#9fb0c4" stroke-width="2.4"/>');
  return s.join('');
}
export function art_sa(g,icon,isGot){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,3.4));
  s.push(isoBox(x,y,2.6,2.0,5,'#f6e7c8'));
  s.push(isoBox(x,y,3.0,2.4,1.4,'#ff9f45',5));
  var c=iso(x,y,24);
  s.push('<path d="M'+pt(iso(x,y,6.4))+'L'+pt(iso(x,y,20))+'" stroke="#b9a887" stroke-width="3"/>');
  s.push('<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="18" fill="#ffffff" stroke="'
       + (isGot?'#17773d':'#ff9f45')+'" stroke-width="4"/>');
  s.push('<text x="'+c[0].toFixed(1)+'" y="'+(c[1]+7).toFixed(1)+'" font-size="20" text-anchor="middle">'+icon+'</text>');
  if(isGot){
    s.push('<circle cx="'+(c[0]+15).toFixed(1)+'" cy="'+(c[1]-14).toFixed(1)+'" r="10" fill="#17773d" stroke="#ffffff" stroke-width="3"/>');
    s.push('<path d="M'+(c[0]+10).toFixed(1)+' '+(c[1]-14).toFixed(1)
         + ' l3.4 4 l6.6 -7.6" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>');
  }else{
    s.push('<circle cx="'+(c[0]+15).toFixed(1)+'" cy="'+(c[1]-14).toFixed(1)+'" r="10" fill="#ffffff" stroke="#c9d3de" stroke-width="3"/>');
  }
  return s.join('');
}
export function art_jct(g){
  var x=g[0],y=g[1];
  return isoShadow(x,y,1.7)+isoBox(x,y,1.7,1.7,1.6,'#cfd8e2');
}
export function art_ic(g){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,1.7));
  s.push(isoBox(x,y,1.4,1.4,2.4,'#e4ebf2'));
  var c=iso(x,y,2.4);
  s.push('<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="7" fill="#ffffff" stroke="#8a97a8" stroke-width="3"/>');
  return s.join('');
}

/* 段3：脇役ランドマーク（ランドマーク台帳 §2 から。台帳に無いものは描かない・§0の禁止は守る）
   大きさは 主役の 0.45〜0.55倍（LM_SC= NODE_SC*0.5 を scaleAt で掛ける） */
export var LM_SC = T.NODE_SC*0.5;
export function art_lm_kofun(x,y){
  var s=[];
  s.push(isoShadow(x,y,3.4));
  s.push(gEllipse(x,y,2.9,1.9,'#8ecbe8'));
  s.push(gEllipse(x,y,2.3,1.5,'#78d43a'));
  s.push(gEllipse(x-1.9,y+0.15,1.05,0.85,'#8ecbe8'));
  s.push(gEllipse(x-1.9,y+0.15,0.7,0.55,'#78d43a'));
  return s.join('');
}
export function art_lm_taiyo(x,y){
  var s=[];
  s.push(isoShadow(x,y,2.2));
  s.push(isoCone(x,y,1.6,20,'#e2544a'));
  var c1=iso(x,y,20), c2=iso(x,y,8);
  s.push('<circle cx="'+c1[0].toFixed(1)+'" cy="'+c1[1].toFixed(1)+'" r="6.5" fill="#f4c94a" stroke="#ffffff" stroke-width="1.6"/>');
  s.push('<circle cx="'+c2[0].toFixed(1)+'" cy="'+c2[1].toFixed(1)+'" r="5.5" fill="#f4f4f4" stroke="#8a97a8" stroke-width="1.4"/>');
  return s.join('');
}
export function art_lm_toji(x,y){
  var s=[];
  s.push(isoShadow(x,y,2.6));
  s.push(isoBox(x,y,1.8,1.5,5,'#c9b48a'));
  s.push(isoRoof(x,y,2.1,1.8,5,3.4,'#5a4634'));
  s.push(isoBox(x,y,1.2,1.0,5,'#c9b48a',8.4));
  s.push(isoRoof(x,y,1.5,1.3,8.4,2.8,'#5a4634'));
  s.push(isoBox(x,y,0.6,0.5,4,'#c9b48a',11.2));
  s.push(isoRoof(x,y,0.9,0.8,11.2,4,'#5a4634'));
  return s.join('');
}
export function art_lm_akashi(x,y){
  var s=[];
  s.push(isoShadow(x,y,2.4));
  s.push(isoBox(x-1.6,y,0.35,0.35,20,'#e4ebf2'));
  s.push(isoBox(x+1.6,y,0.35,0.35,20,'#e4ebf2'));
  var a=iso(x-1.6,y,19), b=iso(x+1.6,y,19), a0=iso(x-1.6,y,0), b0=iso(x+1.6,y,0);
  s.push('<path d="M'+pt(a)+'Q'+pt(iso(x,y,10))+' '+pt(b)+'" fill="none" stroke="#8a97a8" stroke-width="2"/>');
  s.push('<path d="M'+pt(a0)+'L'+pt(a)+'M'+pt(b0)+'L'+pt(b)+'" stroke="#c9d3de" stroke-width="1.2"/>');
  return s.join('');
}
export function art_lm_ichijoji(x,y){
  var s=[];
  s.push(isoShadow(x,y,2.0));
  s.push(isoBox(x,y,1.3,1.1,4,'#c9b48a'));
  s.push(isoRoof(x,y,1.6,1.35,4,2.6,'#46516a'));
  s.push(isoBox(x,y,0.8,0.7,3.4,'#c9b48a',6.6));
  s.push(isoRoof(x,y,1.05,0.9,6.6,3.2,'#46516a'));
  return s.join('');
}
export function art_lm_hiruzen(x,y){
  var s=[];
  s.push(mountTop(x-1.6,y,1.6,9,501));
  s.push(mountTop(x,y-0.3,1.9,11,502));
  s.push(mountTop(x+1.7,y,1.5,8,503));
  s.push(gEllipse(x-0.4,y+2.6,0.55,0.35,'#8a6a4a'));
  s.push(gEllipse(x-0.4,y+2.6,0.36,0.22,'#c9a876'));
  return s.join('');
}
export function art_lm_kanba(x,y){
  var s=[];
  s.push(isoBox(x,y,1.0,0.6,2,'#9aa4ad'));
  var top=iso(x,y-0.5,10), bot=iso(x,y+0.5,0);
  s.push('<path d="M'+(top[0]-3.4).toFixed(1)+' '+top[1].toFixed(1)
       + ' L'+(bot[0]-1.6).toFixed(1)+' '+bot[1].toFixed(1)
       + ' L'+(bot[0]+1.6).toFixed(1)+' '+bot[1].toFixed(1)
       + ' L'+(top[0]+3.4).toFixed(1)+' '+top[1].toFixed(1)+' Z" fill="#bfe6f7" opacity=".85"/>');
  s.push('<path d="M'+(top[0]-1.6).toFixed(1)+' '+top[1].toFixed(1)
       + ' L'+(bot[0]-0.7).toFixed(1)+' '+bot[1].toFixed(1)
       + ' L'+(bot[0]+0.7).toFixed(1)+' '+bot[1].toFixed(1)
       + ' L'+(top[0]+1.6).toFixed(1)+' '+top[1].toFixed(1)+' Z" fill="#ffffff" opacity=".9"/>');
  return s.join('');
}
export function art_lm_shirousagi(x,y){
  var s=[];
  s.push('<path d="'+pathG([[x-2.6,y-0.7],[x+2.6,y-0.9],[x+2.4,y+0.6],[x-2.4,y+0.9]],0.15)+'Z" fill="#e6cf7c"/>');
  s.push(art_torii([x+0.6,y-1.6],0.42));
  return s.join('');
}
export function art_lm_taki(x,y){
  var s=[];
  s.push(isoBox(x-0.9,y,1.1,0.9,3,'#9aa4ad'));
  s.push(isoBox(x+0.9,y,1.1,0.9,4.2,'#9aa4ad'));
  var top=iso(x,y-0.2,8), bot=iso(x,y+0.6,0.3);
  s.push('<path d="M'+top[0].toFixed(1)+' '+top[1].toFixed(1)
       + 'C'+(top[0]-1.5).toFixed(1)+' '+(top[1]+8).toFixed(1)+' '
       + (bot[0]+1.5).toFixed(1)+' '+(bot[1]-8).toFixed(1)+' '+bot[0].toFixed(1)+' '+bot[1].toFixed(1)
       + '" fill="none" stroke="#eaf6fc" stroke-width="5" stroke-linecap="round" opacity=".92"/>');
  return s.join('');
}
export function art_lm_izumohi(x,y){
  var s=[];
  s.push(isoShadow(x,y,1.6));
  s.push(isoBox(x,y,0.7,0.7,16,'#ffffff'));
  s.push(isoBox(x,y,0.8,0.8,2,'#e2544a',9));
  s.push(isoCone(x,y,0.9,3,'#f4f4f4'));
  return s.join('');
}
export function art_lm_inasa(x,y){
  var s=[];
  s.push(isoShadow(x,y,1.4));
  s.push(isoBox(x,y,1.0,0.9,3,'#9aa4ad'));
  s.push(isoCone(x,y,0.7,4,'#3a6b45'));
  return s.join('');
}
/* まつえじょう。国宝・現存12天守。ほかの しろ絵（白い姫路系）と ちがい、
   下見板張り＝こげ茶〜黒の 壁が いちばんの 特ちょう。屋根も 段が すくない 望楼型 */
export function art_lm_matsue(x,y){
  var s=[];
  s.push(isoShadow(x,y,3.0));
  s.push(isoBox(x,y,2.4,1.9,3,'#efe9d8'));
  s.push(isoBox(x,y,1.7,1.35,7,'#2b2622',3));
  s.push(isoRoof(x,y,2.0,1.6,10,7,'#46516a'));
  s.push(isoBox(x,y,1.05,0.85,3.6,'#2b2622',10));
  s.push(isoRoof(x,y,1.35,1.1,13.6,6,'#46516a'));
  return s.join('');
}
/* びっちゅうまつやまじょう。現存12天守で いちばん高い やまじろ（標高430m）。
   小さな 天守を、山の 上に のせて 表す（雲海は 8月に 出ないので 描かない＝台帳§0） */
export function art_lm_bitchu(x,y){
  var s=[];
  s.push(mountTop(x,y+0.6,2.6,10,777));
  s.push(isoBox(x,y-0.1,0.9,0.75,9.4,'#cfc7b4'));
  s.push(isoRoof(x,y-0.1,1.05,0.9,12.2,3.6,'#46516a'));
  return s.join('');
}
/* にしはりまてんもんだい。日本最大の 公開用望遠鏡（口径2m なゆた）。
   びせいてんもんだい（art_dome）と おなじ形を 使い回さない よう、
   ドームを 大きめ・低めにし、のぞき出た 望遠鏡の 筒を つける */
export function art_lm_nishiharima(x,y){
  var s=[];
  s.push(isoShadow(x,y,3.2));
  s.push(isoBox(x,y,2.3,2.3,5,'#dfe6ee'));
  var c=iso(x,y,5);
  s.push('<path d="M'+(c[0]-22).toFixed(1)+' '+c[1].toFixed(1)
       + ' a22 13 0 0 1 44 0 Z" fill="#f7fafd"/>');
  s.push('<path d="M'+(c[0]-22).toFixed(1)+' '+c[1].toFixed(1)
       + ' a22 13 0 0 1 22 -13 l0 13 Z" fill="#c9d6e4"/>');
  var slitA=iso(x+0.3,y,5), slitB=iso(x+1.9,y-1.7,17);
  s.push('<path d="M'+pt(slitA)+'L'+pt(slitB)+'" stroke="#5f707f" stroke-width="4.4" stroke-linecap="round"/>');
  s.push('<path d="M'+pt(slitA)+'L'+pt(slitB)+'" stroke="#a9b8c6" stroke-width="1.6" stroke-linecap="round"/>');
  return s.join('');
}
export var LANDMARKS = [
  {x:86.0,y:83.0, n:'にんとくてんのうりょう', svg:art_lm_kofun},
  {x:86.0,y:69.0, n:'たいようの とう',        svg:art_lm_taiyo},
  {x:84.0,y:40.0, n:'とうじ ごじゅうのとう',    svg:art_lm_toji},
  {x:74.0,y:68.0, n:'あかしかいきょうおおはし', svg:art_lm_akashi},
  {x:54.0,y:61.0, n:'にしはりまてんもんだい',   svg:function(x,y){ return scaleAt(x,y,0.6,art_lm_nishiharima(x,y)); }},
  {x:70.0,y:60.0, n:'いちじょうじ さんじゅうのとう', svg:art_lm_ichijoji},
  {x:30.0,y:25.0, n:'ひるぜんさんざ',          svg:art_lm_hiruzen},
  {x:34.0,y:44.0, n:'かんばのたき',            svg:art_lm_taki},
  {x:13.0,y:74.0, n:'びっちゅうまつやまじょう', svg:function(x,y){ return scaleAt(x,y,0.62,art_lm_bitchu(x,y)); }},
  {x:58.0,y:12.0, n:'はくとかいがん',           svg:art_lm_shirousagi},
  {x:20.0,y:15.0, n:'まつえじょう',             svg:function(x,y){ return scaleAt(x,y,0.7,art_lm_matsue(x,y)); }},
  {x:5.0, y:17.0, n:'いずもひのみさきとうだい',  svg:art_lm_izumohi},
  {x:6.0, y:14.0, n:'いなさのはま',             svg:art_lm_inasa}
];
export function drawLandmarks(props, labels){
  LANDMARKS.forEach(function(lm){
    props.push({z:lm.x+lm.y-0.2, svg:scaleAt(lm.x,lm.y,LM_SC,lm.svg(lm.x,lm.y))});
    var head=iso(lm.x,lm.y,10*LM_SC);
    labels.push({t:lm.n, x:head[0], y:head[1], prio:60, keep:[10,6,20,18], col:'#7a8ba0'});
  });
}

/* 段4：府県名（main 裁定＝画面に入っている県名だけ、それぞれ大きく置く。1画面に2〜3個 出てもよい）
   [x, y, なまえ, いろ] */
/* かなで 書く（地図の 中の 文字は 図形要素・ほかの 地名も ひらがな で 統一している ため。
   漢字だと ⑩「240字の外に 100%ルビ」を SVG 文字に まで 及ぼす ことに なり 別枠の 方針〔§6⑩〕と ずれる） */
