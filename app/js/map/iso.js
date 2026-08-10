"use strict";
import { NP } from '../data/nodes.js';
export var T = { K:7.2, OX:724, OY:44, PROJ:'iso', TKX:13.2, TKY:8.4, TZ:0.9,
  NODE_SC:0.8, BASE_ISO_K:7.2 };
T.TOP_RX = T.TKX / T.BASE_ISO_K; T.TOP_RY = T.TKY / T.BASE_ISO_K;
export function projR(r){                 /* 半径r（グリッド単位）を 見おろし方に 合わせて px の rx,ry に */
  var rx=(T.PROJ==='top')? r*T.TKX : r*T.K*1.414;
  var ry=(T.PROJ==='top')? r*T.TKY : rx*0.5;
  return [rx,ry];
}
export function iso(gx,gy,z){
  if(T.PROJ==='top') return [T.OX+gx*T.TKX, T.OY+gy*T.TKY-(z||0)*T.TZ];
  return [T.OX+(gx-gy)*T.K, T.OY+(gx+gy)*T.K*0.5-(z||0)];
}
export function pt(a){ return a[0].toFixed(1)+' '+a[1].toFixed(1); }
export function G(key){ var p=NP[key]; return [p[0]/10, p[1]/7.3]; }
export function shade(hex,f){
  var n=parseInt(hex.slice(1),16);
  var r=Math.min(255,Math.round(((n>>16)&255)*f));
  var g=Math.min(255,Math.round(((n>>8)&255)*f));
  var b=Math.min(255,Math.round((n&255)*f));
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
export function isoBox(gx,gy,w,d,h,col,z0){
  z0=z0||0;
  var A=iso(gx-w,gy-d,z0+h), B=iso(gx+w,gy-d,z0+h), C=iso(gx+w,gy+d,z0+h), D=iso(gx-w,gy+d,z0+h);
  var Bb=iso(gx+w,gy-d,z0), Cb=iso(gx+w,gy+d,z0), Db=iso(gx-w,gy+d,z0);
  return '<path d="M'+pt(D)+'L'+pt(C)+'L'+pt(Cb)+'L'+pt(Db)+'Z" fill="'+shade(col,.68)+'"/>'
       + '<path d="M'+pt(C)+'L'+pt(B)+'L'+pt(Bb)+'L'+pt(Cb)+'Z" fill="'+shade(col,.84)+'"/>'
       + '<path d="M'+pt(A)+'L'+pt(B)+'L'+pt(C)+'L'+pt(D)+'Z" fill="'+col+'"/>';
}
export function isoRoof(gx,gy,w,d,z0,rh,col){
  var A=iso(gx-w,gy-d,z0), B=iso(gx+w,gy-d,z0), C=iso(gx+w,gy+d,z0), D=iso(gx-w,gy+d,z0);
  var T=iso(gx,gy,z0+rh);
  var s='<path d="M'+pt(A)+'L'+pt(B)+'L'+pt(T)+'Z" fill="'+shade(hexClamp(col),1.08)+'"/>'
      + '<path d="M'+pt(B)+'L'+pt(C)+'L'+pt(T)+'Z" fill="'+shade(col,.86)+'"/>'
      + '<path d="M'+pt(C)+'L'+pt(D)+'L'+pt(T)+'Z" fill="'+shade(col,.64)+'"/>';
  /* 真上から 見る ときは 西の 面 も 見える。ななめ の ときは 見えない ので 足さない */
  if(T.PROJ==='top') s+='<path d="M'+pt(D)+'L'+pt(A)+'L'+pt(T)+'Z" fill="'+shade(col,.90)+'"/>';
  return s;
}
export function hexClamp(c){return c;}
export function isoCone(gx,gy,r,h,col){
  var c=iso(gx,gy,0), ap=iso(gx,gy,h);
  var rx=(T.PROJ==='top')? r*T.TKX : r*T.K*1.414;
  var ry=(T.PROJ==='top')? r*T.TKY : rx*0.5;
  return '<path d="M'+(c[0]-rx).toFixed(1)+' '+c[1].toFixed(1)
       + 'L'+pt(ap)+'L'+(c[0]+rx).toFixed(1)+' '+c[1].toFixed(1)
       + 'A'+rx.toFixed(1)+' '+ry.toFixed(1)+' 0 0 1 '+(c[0]-rx).toFixed(1)+' '+c[1].toFixed(1)+'Z" fill="'+col+'"/>'
       + '<path d="M'+pt(ap)+'L'+(c[0]+rx).toFixed(1)+' '+c[1].toFixed(1)
       + 'A'+rx.toFixed(1)+' '+ry.toFixed(1)+' 0 0 1 '+c[0].toFixed(1)+' '+(c[1]+ry).toFixed(1)+'Z" fill="'+shade(col,.72)+'"/>';
}
export function isoShadow(gx,gy,r){
  var c=iso(gx,gy,0);
  var rx=(T.PROJ==='top')? r*T.TKX*1.06 : r*T.K*1.5;
  var ry=(T.PROJ==='top')? r*T.TKY*1.06 : r*T.K*0.75;
  return '<ellipse cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" rx="'+rx.toFixed(1)
       + '" ry="'+ry.toFixed(1)+'" fill="#2f4a63" opacity=".13"/>';
}
export function offsetPts(gpts, off){
  if(!off) return gpts;
  var out=[];
  for(var i=0;i<gpts.length;i++){
    var a=gpts[Math.max(0,i-1)], b=gpts[i], c=gpts[Math.min(gpts.length-1,i+1)], dx,dy;
    if(i===0){dx=c[0]-b[0];dy=c[1]-b[1];}
    else if(i===gpts.length-1){dx=b[0]-a[0];dy=b[1]-a[1];}
    else {dx=c[0]-a[0];dy=c[1]-a[1];}
    var L=Math.sqrt(dx*dx+dy*dy)||1;
    out.push([b[0]+(-dy/L)*off, b[1]+(dx/L)*off]);
  }
  return out;
}
export function isoPath(gpts){
  return gpts.map(function(p,i){return (i?'L':'M')+pt(iso(p[0],p[1],0));}).join('');
}
/* 段4：道を 帯にする。黒白の 梯子模様（ろくおんじ の 参考画像の 作り方＝ふちを ますめで きざむ） */
export function roadLadder(gpts, half, gap){
  var out=[], toggle=0;
  for(var i=0;i<gpts.length-1;i++){
    var a=gpts[i], b=gpts[i+1], dx=b[0]-a[0], dy=b[1]-a[1], L=Math.sqrt(dx*dx+dy*dy)||1;
    var steps=Math.max(1, Math.round(L/gap)), nx=-dy/L, ny=dx/L;
    for(var k=0;k<steps;k++){
      var t=k/steps, gx=a[0]+dx*t, gy=a[1]+dy*t;
      var p1=iso(gx+nx*half, gy+ny*half, 0.06), p2=iso(gx-nx*half, gy-ny*half, 0.06);
      out.push('<path d="M'+pt(p1)+'L'+pt(p2)+'" stroke="'+(toggle%2?'#22303f':'#ffffff')
        + '" stroke-width="2.4" stroke-linecap="round"/>');
      toggle++;
    }
  }
  return out.join('');
}
export function dirArrows(gpts){
  var out=[];
  for(var i=0;i<gpts.length-1;i++){
    var s0=iso(gpts[i][0],gpts[i][1],0), s1=iso(gpts[i+1][0],gpts[i+1][1],0);
    var dx=s1[0]-s0[0], dy=s1[1]-s0[1], L=Math.sqrt(dx*dx+dy*dy);
    if(L<44) continue;
    var n=Math.max(1,Math.round(L/130)), a=Math.atan2(dy,dx)*180/Math.PI;
    for(var j=1;j<=n;j++){
      var t=j/(n+1), x=s0[0]+dx*t, y=s0[1]+dy*t;
      out.push('<path d="M-4.6 -5.2 L6.4 0 L-4.6 5.2 Z" fill="#ffffff" opacity=".96" '
             + 'transform="translate('+x.toFixed(1)+','+y.toFixed(1)+') rotate('+a.toFixed(1)+')"/>');
    }
  }
  return out.join('');
}
/* 毎回おなじ絵になる かんたんな乱数 */
export function rnd(seed){ var s=seed; return function(){ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; }

/* ---------- 4. 案内やくの ねこ ----------
   すがたの 中身は <svg id="catDefs"> の <symbol> だけ。
   ここには もう 絵を 書かない（イラスト担当が つくった cat.svg を そこへ 入れれば 切りかわる） */
