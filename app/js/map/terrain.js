"use strict";
import { T, iso, pt, G, shade, isoBox, isoRoof, hexClamp, isoCone, isoShadow, offsetPts, isoPath, roadLadder, dirArrows, rnd, projR } from '../map/iso.js';
import { BASE } from '../data/nodes.js';
export var LAND = [[-4,13.5],[4,10.6],[11,12.4],[18,9.6],[25,11.4],[32,8.8],[39,10.4],[46,9.4],
            [53,11.0],[59,12.8],[65,14.4],[71,16.4],[77,19.2],[83,23.0],[88,27.6],[93,33.4],
            [98,39.6],[104,46.0],
            [104,104],[97,101],[93,96.5],[90,92.6],[88,88.0],[86,83.6],
            [83,88.2],[81,93.0],[79,98.2],[74,96.6],[68,93.8],[62,91.2],
            [56,93.0],[50,95.8],[44,98.0],[38,96.8],[32,99.0],[25,100.6],
            [18,99.6],[10,100.8],[2,99.2],[-4,100.4]];
export function inLand(px,py){
  var c=false;
  for(var i=0,j=LAND.length-1;i<LAND.length;j=i++){
    var xi=LAND[i][0],yi=LAND[i][1],xj=LAND[j][0],yj=LAND[j][1];
    if(((yi>py)!==(yj>py)) && (px < (xj-xi)*(py-yi)/(yj-yi)+xi)) c=!c;
  }
  return c;
}
export function distToRoads(px,py){
  var best=1e9;
  BASE.forEach(function(r){
    for(var i=0;i<r.length-1;i++){
      var a=G(r[i]), b=G(r[i+1]);
      var vx=b[0]-a[0], vy=b[1]-a[1], L2=vx*vx+vy*vy;
      var t=L2? Math.max(0,Math.min(1,((px-a[0])*vx+(py-a[1])*vy)/L2)) : 0;
      var dx=px-(a[0]+vx*t), dy=py-(a[1]+vy*t);
      best=Math.min(best,Math.sqrt(dx*dx+dy*dy));
    }
  });
  return best;
}

/* =====================================================================
   じめん を すみずみまで うめる ための 道具（真上から 見た ちず むけ）
   ---------------------------------------------------------------------
   みどり の 平原 が 大きく あく のが「さびしい」の 正体 だった。
   ここで つくる のは 4しゅるい。
     いちがい（まちなみ）／たはた／みずうみ・かわ／はやし
   おなじ かたち の くりかえし に ならない よう、
   大きさ・むき・いろ を 1つずつ ずらす（もとに する 乱数は 毎回 おなじ）。
   ===================================================================== */
export function gPoly(pts,z,fill,extra){
  return '<path d="'+pts.map(function(p,i){return (i?'L':'M')+pt(iso(p[0],p[1],z||0));}).join('')
       + 'Z" fill="'+fill+'"'+(extra||'')+'/>';
}
export function gQuad(gx,gy,w,d,z,fill,extra){
  return gPoly([[gx-w,gy-d],[gx+w,gy-d],[gx+w,gy+d],[gx-w,gy+d]],z,fill,extra);
}
export function gEllipse(gx,gy,rx,ry,fill,extra,z){
  var c=iso(gx,gy,z||0);
  return '<ellipse cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" rx="'+(rx*T.TKX).toFixed(1)
       + '" ry="'+(ry*T.TKY).toFixed(1)+'" fill="'+fill+'"'+(extra||'')+'/>';
}
/* 真上から 見た き ＝ まるい こずえ。三角の 山の くりかえし には しない */
export function treeTop(gx,gy,r,col,dark){
  var c=iso(gx,gy,0), a=iso(gx,gy,r*7);
  return '<ellipse cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" rx="'+(r*T.TKX*1.05).toFixed(1)
       + '" ry="'+(r*T.TKY*1.05).toFixed(1)+'" fill="'+dark+'"/>'
       + '<ellipse cx="'+a[0].toFixed(1)+'" cy="'+a[1].toFixed(1)+'" rx="'+(r*T.TKX*0.9).toFixed(1)
       + '" ry="'+(r*T.TKY*0.9).toFixed(1)+'" fill="'+col+'"/>';
}

/* 真上から 見た 山。まるい すそ の 上に 明るい 面 を 3まい かさねる */
export function mountTop(gx,gy,r,h,seed){
  var R=rnd(1000+seed*37), o=[isoShadow(gx,gy,r*0.95)];
  var e1=0.86+R()*0.22, e2=0.62+R()*0.14;   /* 1つずつ かたち を ずらす */
  o.push(gEllipse(gx,gy,r,r*e1*0.86,'#3d8639'));
  o.push(gEllipse(gx,gy,r*0.88,r*e1*0.70,'#4f9c42',null,h*0.34));
  o.push(gEllipse(gx,gy,r*e2,r*e1*0.48,'#65b352',null,h*0.66));
  o.push(gEllipse(gx,gy,r*e2*0.48,r*e1*0.26,'#7fc763',null,h*0.90));
  return o.join('');
}
/* 大山。円すいの すそ ＋ みなみ面の くずれた 岩かべ */
export function daisenTop(gx,gy){
  var r=5.6, h=46, o=[isoShadow(gx,gy,r)];
  o.push(gEllipse(gx,gy,r,r*0.80,'#3d8639'));
  o.push(gEllipse(gx,gy,r*0.84,r*0.64,'#4f9c42',null,h*0.30));
  o.push(gEllipse(gx,gy,r*0.60,r*0.44,'#65b352',null,h*0.60));
  o.push(gEllipse(gx,gy,r*0.28,r*0.20,'#8ed06d',null,h*0.88));
  /* 岩かべ ＝ みなみ の へり に そった ぎざぎざ の おび。
     山ぜんたい を おおうと ただの 三角 に 見える ので、へり だけ に する */
  var a1=iso(gx-r*0.44,gy+r*0.34,h*0.26), a2=iso(gx+r*0.44,gy+r*0.34,h*0.26);
  var b1=iso(gx-r*0.52,gy+r*0.54,h*0.02), b2=iso(gx+r*0.52,gy+r*0.54,h*0.02);
  var crest='l5 6 l4 -7 l5 7 l4 -6 l5 7 l5 -6';
  o.push('<path d="M'+pt(a1)+crest+'L'+pt(a2)+'L'+pt(b2)+'L'+pt(b1)+'Z" fill="#a3957a" opacity=".92"/>');
  o.push('<path d="M'+pt(a1)+crest+'L'+pt(a2)+'" fill="none" stroke="#7d7157" stroke-width="2"/>');
  return o.join('');
}

/* くさち の きめ。まったいらな みどり を のこさない ための したじき。
   たはた・いちがい・はやし の どれでもない ところ に、
   こい みどり と うすい みどり の むら を まく */
export function ellD(gx,gy,rx,ry,z){
  var c=iso(gx,gy,z||0), a=(rx*T.TKX).toFixed(1), b=(ry*T.TKY).toFixed(1);
  return 'M'+(c[0]-rx*T.TKX).toFixed(1)+' '+c[1].toFixed(1)
       + 'a'+a+' '+b+' 0 1 0 '+(rx*T.TKX*2).toFixed(1)+' 0'
       + 'a'+a+' '+b+' 0 1 0 '+(-rx*T.TKX*2).toFixed(1)+' 0';
}
export function grassTexture(){
  /* 1つずつ <ellipse> に すると 部品が 2000こ を こえて 実機の こま数 が 心配 に なる。
     おなじ いろ・こさ の ものは 1本の <path> に まとめる（見た目は 変わらない） */
  var bag={}, R=rnd(60543);
  for(var q=0;q<2600;q++){
    var x=-2+R()*106, y=6+R()*96;
    if(!inLand(x,y)) continue;
    if(inLake(x,y,0.3)) continue;
    if(inAnyCity(x,y,0.1)) continue;
    var big=R()>0.72;
    var rx=big?(1.0+R()*1.2):(0.28+R()*0.3), ry=big?(0.7+R()*0.8):(0.20+R()*0.22);
    var key=(R()>0.5?'#7ec24a':'#9ad55f')+'|'+(big?'.55':'.8');
    (bag[key]=bag[key]||[]).push(ellD(x,y,rx,ry));
  }
  return Object.keys(bag).map(function(k){
    var a=k.split('|');
    return '<path d="'+bag[k].join('')+'" fill="'+a[0]+'" opacity="'+a[1]+'"/>';
  }).join('');
}

/* たはた を しく ばしょ（マス座標の 四角） */
export var FARM_ZONES = [
  [1,13.0,27,22.5],[27,13.0,45,21.5],[45,12.5,60,21.0],[60,15.0,72,24.0],
  [4,64,24,88],[24,78,50,97],[50,72,74,91],[72,52,98,86],[28,62,50,78],
  [22,34,46,44],[46,36,62,46],[62,26,80,38],[76,20,92,34],[6,40,22,50]
];
/* はやし・もり を しく ばしょ */
export var WOOD_ZONES = [
  [2,23,26,34],[30,22,48,32],[52,22,66,32],[3,50,30,62],[34,50,58,62],
  [60,44,78,58],[82,36,98,50],[6,88,22,97],[54,90,72,98],[64,62,78,74],
  [10,54,30,64],[38,40,52,50]
];
/* まちなみ（いちがい）の かたまり ＝ [中心x, 中心y, よこ半径, たて半径, たてもの数] */
export var CITY_ZONES = [
  [9.0,15.4,5.4,3.1,46],[30.0,15.6,6.0,3.4,54],[52.0,15.2,5.6,3.2,50],
  [90.0,37.0,8.0,4.8,96],[89.0,86.0,7.4,4.4,88],[90.0,72.6,5.6,3.4,56],
  [78.0,66.0,5.0,3.0,44],[60.0,81.1,6.6,4.0,72],[47.0,81.1,3.6,2.2,26],
  [16.0,78.1,3.8,2.3,28],[41.0,63.0,4.0,2.4,30],[30.0,41.1,3.2,2.0,22],
  [16.0,92.1,2.8,1.8,18],[52.0,31.5,3.0,1.9,20],[68.0,64.4,3.4,2.1,24],
  [83.0,72.6,3.6,2.2,26],[22.6,15.0,2.6,1.6,16],[40.0,16.5,2.6,1.7,15],
  [62.0,18.5,3.0,1.9,20],[70.0,22.5,2.6,1.7,15],[85.0,28.0,3.4,2.1,26],
  [86.0,52.0,3.4,2.1,26],[77.0,55.0,2.8,1.8,17],[54.0,64.4,2.8,1.8,17],
  [30.0,64.4,2.8,1.8,17],[16.0,64.4,2.6,1.7,15],[36.0,86.0,2.6,1.7,15],
  [24.0,70.0,2.4,1.6,13],[68.0,86.0,2.6,1.7,15],[44.0,30.0,2.4,1.6,13]
];
/* たてもの の やね の いろ（1とう ずつ ちがう ように えらぶ） */
export var ROOF_COLS = ['#f2f5f8','#cfd8e2','#9fb6c6','#f0c39a','#e8ecef','#b8c4cd',
                 '#7fa8c4','#f7dcc2','#d6dde4','#a9bccb'];
export var WALL_COLS = ['#ffffff','#eef2f6','#e2e8ee','#f6efe6'];

/* みずうみ ＝ [中心x, 中心y, よこ半径, たて半径]。ここには 家も 田も 木も おかない */
export var LAKES = [[18.5,19.2,4.6,2.4],[27.5,20.2,3.0,1.9]];
export function inLake(x,y,pad){
  for(var i=0;i<LAKES.length;i++){
    var L=LAKES[i], dx=(x-L[0])/(L[2]+(pad||0)), dy=(y-L[1])/(L[3]+(pad||0)*0.62);
    if(dx*dx+dy*dy<=1) return true;
  }
  return false;
}
export function inZone(z,x,y){ return x>=z[0]&&x<=z[2]&&y>=z[1]&&y<=z[3]; }
export function inAnyCity(x,y,pad){
  for(var i=0;i<CITY_ZONES.length;i++){
    var c=CITY_ZONES[i];
    var dx=(x-c[0])/(c[2]+(pad||0)), dy=(y-c[1])/(c[3]+(pad||0)*0.62);
    if(dx*dx+dy*dy<=1) return true;
  }
  return false;
}

/* たはた ＝ 小さい 四角の あつまり。いろ を 3しゅるい で ずらす */
export function farmPatches(){
  var out=[], R=rnd(70119);
  var COL=['#cfe27a','#b6d861','#dfe98f','#a8cf58','#e6eca0'];
  FARM_ZONES.forEach(function(z,zi){
    var w=1.35+zi*0.02, d=0.85;
    for(var x=z[0]+w; x<z[2]; x+=w*2+0.18){
      for(var y=z[1]+d; y<z[3]; y+=d*2+0.16){
        var jx=x+(R()-0.5)*0.25, jy=y+(R()-0.5)*0.18;
        if(!inLand(jx,jy)) continue;
        if(distToRoads(jx,jy)<1.7) continue;
        if(inAnyCity(jx,jy,0.5)||inLake(jx,jy,0.4)) continue;
        var c=COL[Math.floor(R()*COL.length)];
        out.push(gQuad(jx,jy,w*(0.82+R()*0.16),d*(0.8+R()*0.2),0,c));
      }
    }
  });
  return out.join('');
}
/* はやし ＝ こい みどり の 面 ＋ まるい こずえ */
export function woodPatches(props){
  var out=[], R=rnd(80231), dd=[[],[]];
  WOOD_ZONES.forEach(function(z){
    for(var q=0;q<70;q++){
      var x=z[0]+R()*(z[2]-z[0]), y=z[1]+R()*(z[3]-z[1]);
      if(!inLand(x,y)) continue;
      if(distToRoads(x,y)<1.9) continue;
      if(inAnyCity(x,y,0.8)||inLake(x,y,0.4)) continue;
      dd[R()>0.5?0:1].push(ellD(x,y,0.9+R()*1.0,0.7+R()*0.7));
    }
    for(var t=0;t<34;t++){
      var tx=z[0]+R()*(z[2]-z[0]), ty=z[1]+R()*(z[3]-z[1]);
      if(!inLand(tx,ty)) continue;
      if(distToRoads(tx,ty)<2.0) continue;
      if(inAnyCity(tx,ty,0.8)||inLake(tx,ty,0.4)) continue;
      var rr=0.34+R()*0.24;
      props.push({z:ty, svg:treeTop(tx,ty,rr,R()>0.5?'#4cae4f':'#3f9a45','#2f7a3a')});
    }
  });
  out.push('<path d="'+dd[0].join('')+'" fill="#59a84b"/>');
  out.push('<path d="'+dd[1].join('')+'" fill="#63b354"/>');
  return out.join('');
}
/* まちなみ ＝ うすい 灰白の 地 ＋ 白い 道の ます目 ＋ 1とうずつ ちがう たてもの */
export function cityPatches(props){
  var out=[], R=rnd(90417);
  CITY_ZONES.forEach(function(c,ci){
    var cx=c[0], cy=c[1], rx=c[2], ry=c[3], n=c[4];
    out.push(gEllipse(cx,cy,rx*1.04,ry*1.04,'#dfe4e2'));
    out.push(gEllipse(cx,cy,rx*0.76,ry*0.76,'#ecefee'));
    /* まちの みち（ます目） */
    var g=[];
    for(var i=-2;i<=2;i++){
      g.push('<path d="'+[[cx+i*rx*0.42,cy-ry],[cx+i*rx*0.42,cy+ry]]
        .map(function(p,k){return (k?'L':'M')+pt(iso(p[0],p[1],0));}).join('')+'"/>');
      g.push('<path d="'+[[cx-rx,cy+i*ry*0.42],[cx+rx,cy+i*ry*0.42]]
        .map(function(p,k){return (k?'L':'M')+pt(iso(p[0],p[1],0));}).join('')+'"/>');
    }
    out.push('<g fill="none" stroke="#ffffff" stroke-width="3.4" opacity=".95" '
           + 'clip-path="url(#cityClip'+ci+')">'+g.join('')+'</g>');
    /* たてもの。おなじ かたち の くりかえし に ならない ように
       よこ幅・おく行き・たかさ・やねの いろ・むき を 1とうずつ ずらす */
    var made=0;
    for(var q=0;q<n*10 && made<n;q++){
      var a=R()*Math.PI*2, rr=Math.sqrt(R());
      var bx=cx+Math.cos(a)*rx*rr*0.94, by=cy+Math.sin(a)*ry*rr*0.94;
      if(!inLand(bx,by)) continue;
      if(distToRoads(bx,by)<1.5) continue;
      if(inLake(bx,by,0.25)) continue;
      var wide=R()>0.5;
      var w=(wide?0.56:0.32)+R()*0.34, d=(wide?0.26:0.42)+R()*0.22;
      var h=4+R()*R()*26;
      var roof=ROOF_COLS[Math.floor(R()*ROOF_COLS.length)];
      var wall=WALL_COLS[Math.floor(R()*WALL_COLS.length)];
      var svg=isoBox(bx,by,w,d,h,wall);
      svg+=gQuad(bx,by,w,d,h,roof);
      if(h>16) svg+=gQuad(bx,by,w*0.42,d*0.42,h+1.2,shade(roof,0.86));
      props.push({z:by, svg:svg});
      made++;
    }
  });
  return out.join('');
}
export function cityClips(){
  return CITY_ZONES.map(function(c,ci){
    var p=iso(c[0],c[1],0);
    return '<clipPath id="cityClip'+ci+'"><ellipse cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)
         + '" rx="'+(c[2]*1.04*T.TKX).toFixed(1)+'" ry="'+(c[3]*1.04*T.TKY).toFixed(1)+'"/></clipPath>';
  }).join('');
}

/* =====================================================================
   ふだ（ラベル）を 画面の 座標で おき直す しくみ
   ---------------------------------------------------------------------
   手で 座標を なおす やりかたは とらない。つぎの 3つで きかいてきに よける。
     (1) ふだは 当たり判定の 四角を もつ。重なったら 8ほうこう へ 順に にがす
     (2) 上のタブ・右上の＋−ぜんぶ・下のパネル・タブバー が のる ところを
         「きんしたい」として 先に とっておく（画面から 実さいの 四角を 読む）
     (3) どこにも おけない ふだは、大きくするまで
         「ひきだし線つきの 点」だけ にする（画面の 外に はみ出す ふだ は 0まい）
   ちずを うごかす・大きくする たびに もう一度 計算する。
   ===================================================================== */
