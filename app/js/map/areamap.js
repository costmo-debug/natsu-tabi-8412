"use strict";
import { T, iso, pt, G, shade, isoBox, isoRoof, hexClamp, isoCone, isoShadow, offsetPts, isoPath, roadLadder, dirArrows, rnd, projR } from '../map/iso.js';
import { el, esc } from '../util.js';
import { zones, mpdLon, MPD_LAT, got, findStamp, PUSHABLE, getManualMode, metersBetween } from '../data/stamps.js';
import { catUse, catRect } from '../ui/cat.js';
import { art_tower, art_dome, art_castle, art_camp } from './landmarks.js';
import { steamG } from './motion.js';
import { LIVE, lastGoodText } from '../geo/state.js';
export var SPOT_LABELS = [];
export var AREAS = {
  kyoto:{ ttl:'きょうとえき の まわり', chip:'きょうと', day:'d12', mpp:40, K:11,
    ref:{k:'k3', gx:28, gy:55}, plate:[-3,-7,43,63],
    ks:['k1','k3','k2','k4'], focus:'k3', cat:[28,55],
    art:{k1:{f:'dept',  top:46}, k2:{f:'ryokan',top:40},
         k3:{f:'porta', top:40}, k4:{f:'aqua',  top:42}} },
  yubara:{ ttl:'ゆばら おんせん の まわり', chip:'ゆばら', day:'d13', mpp:12, K:11,
    ref:{k:'y1', gx:14, gy:30}, plate:[1,-2,37,62],
    ks:['y2','y1','y3'], focus:'y1', cat:[14,30],
    art:{y1:{f:'bath',top:44}, y2:{f:'bridge',top:34}, y3:{f:'museum',top:42}} },
  izumo:{ ttl:'いずもたいしゃ の まわり', chip:'いずも', day:'d14', mpp:12, K:11,
    ref:{k:'i2', gx:14, gy:12}, plate:[-3,-3,43,112],
    ks:['i2','i3','i1','i4'], focus:'i2', cat:[9.0,17.6], poseAll:false,
    art:{i2:{f:'kagura',top:86}, i3:{f:'honden',top:82},
         i1:{f:'soba',  top:52}, i4:{f:'torii', top:82}} },
  mochigase:{ ttl:'もちがせ の まわり', chip:'もちがせ', day:'d14', mpp:12, K:11,
    ref:{k:'f1', gx:18, gy:30}, plate:[1,3,37,59],
    ks:['f1','f3','f2','f4'], focus:'f1', cat:[18,30],
    nudge:{f1:[-4.5,-3.5], f2:[6,5], f3:[4.5,-10]},
    manual:{f4:[7,45]},
    art:{f1:{f:'bbq',top:40}, f2:{f:'fireworks',top:44}, f3:{f:'deck',top:34}, f4:{f:'river',top:26}} },
  himeji:{ ttl:'ひめじじょう の まわり', chip:'ひめじ', day:'d15', mpp:18, K:11,
    ref:{k:'h2', gx:16, gy:10}, plate:[-1,-4,35,62],
    ks:['h2','h1'], focus:'h2', cat:[16,10],
    away:[{k:'h3', g:[3,58], d:'2.5km みなみにし'},{k:'h4', g:[1,40], d:'10km にし'}],
    art:{h2:{f:'castle',top:96}, h1:{f:'teahouse',top:44}} },
  bisei:{ ttl:'びせい てんもんだい の まわり', chip:'びせい', day:'d13', mpp:12, K:11,
    ref:{k:'y4', gx:18, gy:26}, plate:[1,1,35,51],
    ks:['y4'], focus:'y4', cat:[18,26],
    art:{y4:{f:'obs',top:64}} }
};
export var AREA_ORDER=['kyoto','yubara','bisei','izumo','mochigase','himeji'];
export function areaOf(k){
  for(var a in AREAS){ if(AREAS[a].ks.indexOf(k)>=0) return a; }
  return null;
}
/* いど・けいど → マス。ref の スタンプ を 基準に する */
export function geo2grid(A, lat, lon){
  var z0=zones(A.ref.k)[0];
  var dE=(lon-z0[1])*mpdLon(z0[0]), dN=(lat-z0[0])*MPD_LAT;
  return [A.ref.gx+dE/A.mpp, A.ref.gy-dN/A.mpp];
}
/* スタンプの はんてい円 ぜんぶ を マス に なおす。円が 無い ものは manual を つかう */
export function areaZones(A,k){
  var zs=zones(k), out=[], nd=(A.nudge&&A.nudge[k])||[0,0];
  zs.forEach(function(z){
    var g=geo2grid(A,z[0],z[1]);
    out.push({g:[g[0]+nd[0],g[1]+nd[1]], r:z[2], n:z[3], real:1});
  });
  if(!out.length && A.manual && A.manual[k]) out.push({g:A.manual[k], r:150, n:'まだ きまっていません', real:0});
  return out;
}

export function art_hall(g,big){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,big?4.6:3.8));
  s.push(isoBox(x,y,big?3.8:3.0,big?2.9:2.3,7,'#cdbd9a'));
  s.push(isoBox(x,y,big?2.6:2.0,big?2.0:1.6,big?30:34,'#efe3c8',7));
  s.push(isoRoof(x,y,big?3.6:2.9,big?2.9:2.3,big?37:41,big?38:32,'#7a5a41'));
  if(big){
    var c=iso(x,y+2.9,26);
    s.push('<ellipse cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)
         + '" rx="40" ry="15" fill="#d8c79c" stroke="#a98f63" stroke-width="3"/>');
    s.push('<path d="M'+(c[0]-19).toFixed(1)+' '+(c[1]+12).toFixed(1)+' l0 16" stroke="#d8c79c" stroke-width="8" stroke-linecap="round"/>');
    s.push('<path d="M'+(c[0]+19).toFixed(1)+' '+(c[1]+12).toFixed(1)+' l0 16" stroke="#d8c79c" stroke-width="8" stroke-linecap="round"/>');
  }
  return s.join('');
}
export function art_torii(g,sc){
  var x=g[0],y=g[1],h=44*sc,s=[];
  s.push(isoShadow(x,y,2.6*sc));
  s.push('<path d="M'+pt(iso(x-2.6*sc,y,0))+'L'+pt(iso(x-2.6*sc,y,h))+'" stroke="#d1332e" stroke-width="'+(8*sc)+'" stroke-linecap="round"/>');
  s.push('<path d="M'+pt(iso(x+2.6*sc,y,0))+'L'+pt(iso(x+2.6*sc,y,h))+'" stroke="#d1332e" stroke-width="'+(8*sc)+'" stroke-linecap="round"/>');
  s.push('<path d="M'+pt(iso(x-3.9*sc,y,h+3))+'L'+pt(iso(x+3.9*sc,y,h+3))+'" stroke="#b02a26" stroke-width="'+(9*sc)+'" stroke-linecap="round"/>');
  s.push('<path d="M'+pt(iso(x-3.1*sc,y,h-6))+'L'+pt(iso(x+3.1*sc,y,h-6))+'" stroke="#d1332e" stroke-width="'+(6*sc)+'" stroke-linecap="round"/>');
  return s.join('');
}
export function art_shop(g){
  var x=g[0],y=g[1],s=[];
  s.push(isoShadow(x,y,2.8));
  s.push(isoBox(x,y,2.2,1.7,24,'#f6ead4'));
  s.push(isoRoof(x,y,2.8,2.2,24,20,'#4d6b8a'));
  var c=iso(x,y+1.7,20);
  s.push('<rect x="'+(c[0]-18).toFixed(1)+'" y="'+(c[1]-4).toFixed(1)+'" width="36" height="13" rx="3" fill="#1d2b3a"/>');
  s.push('<text x="'+c[0].toFixed(1)+'" y="'+(c[1]+6).toFixed(1)+'" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">そば</text>');
  return s.join('');
}
export function art_park(g){
  var x=g[0],y=g[1],s=[];
  var A=iso(x-5,y-3.6,0.4),B=iso(x+5,y-3.6,0.4),C=iso(x+5,y+3.6,0.4),D=iso(x-5,y+3.6,0.4);
  s.push('<path d="M'+pt(A)+'L'+pt(B)+'L'+pt(C)+'L'+pt(D)+'Z" fill="#b9bfc7" stroke="#a3aab4" stroke-width="2"/>');
  var cars=[[-3.2,-1.8,'#e2544a'],[-1,-1.8,'#4fb3f0'],[1.2,-1.8,'#ffb400'],
            [-3.2,1.6,'#62c15f'],[-1,1.6,'#ffffff'],[1.2,1.6,'#f280b0'],[3.4,1.6,'#8a97a8']];
  cars.forEach(function(cc){ s.push(isoBox(x+cc[0],y+cc[1],0.62,0.36,6,cc[2],1)); });
  return s.join('');
}

/* --- 6-1. エリア地図で つかう かたちの ぶひん --- */
export function bldG(x,y,w,d,h,wall,roof,rh,z0){
  z0=z0||0;
  var s=[isoShadow(x,y,Math.max(w,d)*1.15), isoBox(x,y,w,d,h,wall,z0)];
  if(rh) s.push(isoRoof(x,y,w*1.16,d*1.16,z0+h,rh,roof));
  else   s.push(isoBox(x,y,w*1.06,d*1.06,1.4,roof,z0+h));
  return s.join('');
}
export function signG(x,y,z,txt,bg,fg){
  var c=iso(x,y,z), w=txt.length*11+14;
  return '<rect x="'+(c[0]-w/2).toFixed(1)+'" y="'+(c[1]-9).toFixed(1)+'" width="'+w
       + '" height="18" rx="4" fill="'+bg+'"/>'
       + '<text x="'+c[0].toFixed(1)+'" y="'+(c[1]+4.5).toFixed(1)
       + '" font-size="11" font-weight="700" fill="'+fg+'" text-anchor="middle">'+esc(txt)+'</text>';
}
export function pathG(pts,z){ return pts.map(function(p,i){return (i?'L':'M')+pt(iso(p[0],p[1],z||0));}).join(''); }
export function roadG(pts,w,col,edge){
  var d=pathG(pts,0), s='';
  if(edge) s+='<path d="'+d+'" fill="none" stroke="'+edge+'" stroke-width="'+(w+7)
             + '" stroke-linecap="round" stroke-linejoin="round"/>';
  return s+'<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+w
       + '" stroke-linecap="round" stroke-linejoin="round"/>';
}
export function scaleAt(x,y,k,inner){
  var c=iso(x,y,0);
  return '<g transform="translate('+c[0].toFixed(1)+','+c[1].toFixed(1)+') scale('+k+') translate('
    + (-c[0]).toFixed(1)+','+(-c[1]).toFixed(1)+')">'+inner+'</g>';
}
export function greenPatch(x,y,w,d,col){
  var A=iso(x-w,y-d,0.3),B=iso(x+w,y-d,0.3),C=iso(x+w,y+d,0.3),D=iso(x-w,y+d,0.3);
  return '<path d="M'+pt(A)+'L'+pt(B)+'L'+pt(C)+'L'+pt(D)+'Z" fill="'+(col||'#bcdc96')+'"/>';
}
export function waterPatch(pts){ return '<path d="'+pathG(pts,0.2)+'Z" fill="#8ecbe8"/>'; }
export function treesAlong(pts,n,seed,props,rmin,hmin,side){
  var TR=rnd(seed);
  for(var i=0;i<n;i++){
    var t=i/(n-1||1), si=Math.floor(t*(pts.length-1)), ft=t*(pts.length-1)-si;
    var a=pts[si], b=pts[Math.min(pts.length-1,si+1)];
    var bx=a[0]+(b[0]-a[0])*ft, by=a[1]+(b[1]-a[1])*ft;
    var sd=(side!==undefined)?side:((i%2)?1:-1), ox2=sd*(rmin+TR()*0.8), oy2=sd*0.8;
    var gx=bx+ox2, gy=by+oy2;
    props.push({z:gx+gy, svg:isoShadow(gx,gy,1.1)
      + isoCone(gx,gy,1.4+TR()*0.5,hmin+TR()*16,TR()>0.5?'#5aa05f':'#6cb26a')});
  }
}
export function treesFill(box,n,seed,props,avoid){
  var TR=rnd(seed), made=0;
  for(var q=0;q<n*14 && made<n;q++){
    var gx=box[0]+TR()*(box[2]-box[0]), gy=box[1]+TR()*(box[3]-box[1]), bad=false;
    for(var j=0;j<avoid.length;j++){
      if(Math.abs(avoid[j][0]-gx)<avoid[j][2] && Math.abs(avoid[j][1]-gy)<avoid[j][2]){bad=true;break;}
    }
    if(bad) continue;
    var rr=1.0+TR()*0.6, hh=14+TR()*12;
    props.push({z:gx+gy, svg:isoShadow(gx,gy,rr*0.8)
      + isoCone(gx,gy,rr,hh,TR()>0.5?'#5aa05f':'#6cb26a')});
    made++;
  }
}

/* --- 6-2. スタンプ1つ ぶんの かたち --- */
export var SART = {
  dept:function(g){ return bldG(g[0],g[1],2.6,2.1,26,'#f4efe4','#c8bda8')
      + signG(g[0],g[1]+2.1,20,'デパート','#1d2b3a','#ffffff'); },
  porta:function(g){ return bldG(g[0],g[1],5.4,1.7,15,'#e9eef4','#9fb0c4')
      + bldG(g[0]-2.4,g[1]+2.4,1.6,0.9,5,'#cfd8e2','#b6c2cf')
      + signG(g[0],g[1]+1.7,11,'えき','#1d2b3a','#ffffff'); },
  ryokan:function(g){ var s=bldG(g[0],g[1],2.2,1.7,9,'#f6ead4','#8a6a4e',11);
    var c=iso(g[0],g[1]+1.7,7);
    return s+'<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)
      + '" r="6" fill="#d1332e"/>'; },
  aqua:function(g){ var s=bldG(g[0],g[1],3.0,2.2,13,'#dff0fb','#7fb8de');
    var c=iso(g[0],g[1]+2.2,10);
    return s+'<path d="M'+(c[0]-14).toFixed(1)+' '+c[1].toFixed(1)
      + ' q7 -6 14 0 q7 6 14 0" fill="none" stroke="#4fb3f0" stroke-width="3.4" stroke-linecap="round"/>'; },
  bath:function(g){ return bldG(g[0],g[1],2.6,2.0,9,'#f0e2c6','#55707f',12)
      + steamG(g[0],g[1],26,3,11); },
  bridge:function(g){ var s=[], x=g[0], y=g[1];
    var A=iso(x-4.2,y,1.2), B=iso(x+4.2,y,1.2);
    s.push('<path d="M'+pt(A)+'L'+pt(B)+'" stroke="#c2a276" stroke-width="11" stroke-linecap="round"/>');
    s.push('<path d="M'+pt(iso(x-4.2,y,8))+'L'+pt(iso(x+4.2,y,8))
      + '" stroke="#d1332e" stroke-width="3.4" stroke-linecap="round"/>');
    [-4.2,0,4.2].forEach(function(o){
      s.push('<path d="M'+pt(iso(x+o,y,1.2))+'L'+pt(iso(x+o,y,9))
        + '" stroke="#d1332e" stroke-width="3.4" stroke-linecap="round"/>'); });
    return s.join(''); },
  museum:function(g){ return bldG(g[0],g[1],2.6,2.0,12,'#eceff3','#8a97a8')
      + signG(g[0],g[1]+2.0,9,'てんじ','#4a5b6e','#ffffff'); },
  kagura:function(g){ return art_hall(g,true); },
  honden:function(g){ return art_hall(g,false); },
  soba:function(g){ return art_shop(g); },
  torii:function(g){ return art_torii(g,1.6); },
  torii2:function(g){ return art_torii(g,2.1); },
  bbq:function(g){ var s=bldG(g[0],g[1],2.2,1.7,8,'#e8d6b4','#7a5a41',9);
    return s+isoCone(g[0]+2.6,g[1]+1.4,0.9,7,'#f08a2e'); },
  fireworks:function(g){ var c=iso(g[0],g[1],34), s=[greenPatch(g[0],g[1],3.4,2.6,'#c9e3a4')];
    s.push(isoCone(g[0]-1.2,g[1]+1.2,0.8,6,'#f08a2e'));
    for(var i=0;i<8;i++){ var a=i*Math.PI/4;
      s.push('<path d="M'+c[0].toFixed(1)+' '+c[1].toFixed(1)+'l'+(Math.cos(a)*15).toFixed(1)
        + ' '+(Math.sin(a)*9).toFixed(1)+'" stroke="#ffb400" stroke-width="3" stroke-linecap="round"/>'); }
    s.push('<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="4.4" fill="#f280b0"/>');
    return s.join(''); },
  deck:function(g){ var s=[isoShadow(g[0],g[1],2.6), isoBox(g[0],g[1],2.6,2.0,2.4,'#c2a276')];
    var c=iso(g[0],g[1],2.4);
    s.push('<path d="M'+c[0].toFixed(1)+' '+c[1].toFixed(1)+'l10 -20" stroke="#4a5b6e" stroke-width="4" stroke-linecap="round"/>');
    s.push('<circle cx="'+(c[0]+11).toFixed(1)+'" cy="'+(c[1]-22).toFixed(1)+'" r="4.4" fill="#63758a"/>');
    return s.join(''); },
  river:function(g){ var c=iso(g[0],g[1],0);
    return '<ellipse cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)
      + '" rx="26" ry="13" fill="#8ecbe8" opacity=".55" stroke="#4fb3f0" '
      + 'stroke-width="2.4" stroke-dasharray="8 8"/>'; },
  castle:function(g){ return scaleAt(g[0],g[1],1.9,art_castle(g)); },
  teahouse:function(g){ return bldG(g[0],g[1],2.4,1.9,11,'#f6ead4','#a5643e')
      + signG(g[0],g[1]+1.9,8,'ちゃや','#7a5a41','#ffffff'); },
  obs:function(g){ var s=[isoShadow(g[0],g[1],7), isoCone(g[0],g[1],7.2,10,'#8fbe74')];
    return s.join('')+art_dome(g,10); }
};

/* --- 6-3. エリアごとの けしき（たてもの いがい） --- */
export var SCENE = {
  kyoto:function(A,flat,props){
    flat.push(roadG([[30,-7],[30,63]],17,'#dfe4ea','#c7cfd8'));   /* からすま どおり */
    flat.push(roadG([[-3,6],[43,6]],14,'#dfe4ea','#c7cfd8'));     /* しじょう どおり */
    flat.push(roadG([[-3,44],[43,44]],12,'#dfe4ea','#c7cfd8'));   /* しちじょう どおり */
    flat.push(roadG([[-3,55],[43,55]],16,'#dfe4ea','#c7cfd8'));   /* えきまえ どおり */
    flat.push(roadG([[3.5,55],[3.5,50]],10,'#dfe4ea','#c7cfd8'));
    flat.push(greenPatch(4.5,50.5,6,4.2));                        /* うめこうじ こうえん */
    props.push({z:29.2+51.1, svg:art_tower([29.2,51.1])});        /* きょうとタワー */
    props.push({z:24+57.5, svg:bldG(24,57.5,6.5,1.6,9,'#e2e7ee','#aab6c4')});
    treesFill([2,47,9,54],7,7311,props,[[3.5,51,3],[3.5,55,2]]);
    treesAlong([[30,10],[30,42]],6,4242,props,2.6,10);
  },
  yubara:function(A,flat,props){
    flat.push(waterPatch([[27.5,-2],[26.4,14],[25.4,30],[26.2,46],[27.6,62],[31.5,62],[30.5,30],[31.5,-2]]));
    flat.push(roadG([[12,62],[13,46],[14,30],[17,16],[21,2]],13,'#dfe4ea','#c7cfd8'));
    flat.push(roadG([[14,30],[23.8,48.6]],9,'#dfe4ea','#c7cfd8'));
    flat.push(roadG([[21,12],[26,11]],9,'#dfe4ea','#c7cfd8'));
    props.push({z:28+13, svg:'<g>'+steamG(28.6,13,2,3,9)+'</g>'});   /* すなゆ の ゆけむり */
    props.push({z:18+40, svg:bldG(18,40,2.0,1.6,8,'#f0e2c6','#8a6a4e',9)});
    props.push({z:19+22, svg:bldG(19,22,1.8,1.4,7,'#f6ead4','#8a6a4e',8)});
    treesFill([3,2,11,58],10,991,props,[[14,30,4]]);
    treesFill([32,4,36,58],8,992,props,[]);
  },
  bisei:function(A,flat,props){
    flat.push(roadG([[12,50],[13,42],[16,34],[18,29]],11,'#dfe4ea','#c7cfd8'));
    flat.push(greenPatch(11.5,41,3.6,2.4,'#b9bfc7'));   /* ちゅうしゃじょう */
    props.push({z:24+24, svg:bldG(24,24,1.6,1.4,7,'#eceff3','#9fb0c4')});
    props.push({z:12+34, svg:bldG(12,34,2.0,1.6,7,'#f6ead4','#7a5a41',8)});
    treesFill([3,3,33,49],16,555,props,[[18,26,8],[11.5,41,5],[24,24,3],[12,34,3]]);
  },
  izumo:function(A,flat,props){
    /* まつの さんどう（大鳥居から 本殿へ）＋ しんもん どおり（宇迦橋まで） */
    var sando=[[28.6,56.3],[25.5,44],[22.5,32],[19.5,22],[16.5,15.5]];
    var omote=[[35.6,103.5],[33.4,88],[31.2,72],[28.6,56.3]];
    flat.push('<path d="'+pathG(omote,0)+'" fill="none" stroke="#e0e6ec" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/>');
    flat.push('<path d="'+pathG(omote,0)+'" fill="none" stroke="#cdd5de" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>');
    flat.push('<path d="'+pathG(sando,0)+'" fill="none" stroke="#e9dcbb" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>');
    flat.push('<path d="'+pathG(sando,0)+'" fill="none" stroke="#d8c79c" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>');
    flat.push(roadG([[6,9],[10,10.5],[14,12]],16,'#c7cfd8'));
    var route=[[6,9],[14,12],[21.8,7.4],[24,26],[28.6,56.3]];
    flat.push('<path d="'+pathG(route,0)+'" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>');
    flat.push('<path d="'+pathG(route,0)+'" fill="none" stroke="#62c15f" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>');
    flat.push(dirArrows(route));
    props.push({z:6+9, svg:art_park([6,9])});
    treesAlong(sando,26,314159,props,3.4,32);
    treesAlong(omote,14,271828,props,3.2,26);
    treesFill([2,66,14,108],7,161803,props,[]);
  },
  mochigase:function(A,flat,props){
    flat.push(waterPatch([[3,7],[5,26],[7,45],[9,59],[13,59],[11,45],[9,26],[7,7]]));
    flat.push(roadG([[13,59],[15,46],[17,36],[18,31]],12,'#dfe4ea','#c7cfd8'));
    flat.push(greenPatch(24,34,4.4,3.2,'#c9e3a4'));
    props.push({z:18+31, svg:bldG(18,31,3.0,2.3,9,'#f0e2c6','#7a5a41',12)});  /* コテージ */
    props.push({z:21+37, svg:art_camp([21,37])});
    props.push({z:13+34, svg:art_camp([13,34])});
    treesFill([14,6,35,26],11,777,props,[[18,30,5],[22,20,4]]);
    treesFill([2,48,34,58],7,778,props,[[7,45,5]]);
  },
  himeji:function(A,flat,props){
    flat.push(waterPatch([[7,15],[25,15],[25,20],[7,20]]));       /* うちぼり */
    flat.push(greenPatch(16,25,7.5,3.2,'#bcdc96'));               /* さんのまる ひろば */
    flat.push(roadG([[16,22],[16,62]],20,'#dfe4ea','#c7cfd8'));   /* おおてまえ どおり */
    flat.push(roadG([[16,17.5],[16,15]],8,'#e9dcbb'));            /* さくらもん ばし */
    props.push({z:16+21, svg:art_torii([16,21],0.9)});            /* おおてもん（かたち だけ） */
    props.push({z:9+56, svg:bldG(9,56,2.2,1.7,10,'#e9eef4','#aab6c4')});
    props.push({z:24+50, svg:bldG(24,50,2.0,1.6,12,'#e9eef4','#aab6c4')});
    treesAlong([[16,26],[16,44]],8,3141,props,4.6,14);
    treesFill([2,4,10,14],5,3142,props,[]);
  }
};

/* --- 6-4. エリア地図を つくる（ふだ は SVG に 書かず ラベル層 へ わたす） --- */
export function buildAreaMap(key){
  var A=AREAS[key];
  var PJ=T.PROJ, KO=T.K, OXO=T.OX, OYO=T.OY, TKXO=T.TKX, TKYO=T.TKY;
  T.PROJ='top';   /* スポットの ちず 6まいも、ひろい ちずと 同じ 真上寄りの 視点に そろえた */
  T.K=A.K;
  T.TKX=A.K*T.TOP_RX; T.TKY=A.K*T.TOP_RY;  /* ひろい ちずと 同じ 比で、この エリアの T.K に 合わせた ばい率 */
  /* まず 台の 四すみ から 絵の 大きさ を 出し、はみ出さない viewBox を きめる */
  T.OX=0; T.OY=0;
  var p=A.plate, xs=[], ys=[];
  [[p[0],p[1]],[p[2],p[1]],[p[2],p[3]],[p[0],p[3]]].forEach(function(c){
    var ip=iso(c[0],c[1],0); xs.push(ip[0]); ys.push(ip[1]);
  });
  var M=80;
  var x0=Math.min.apply(null,xs)-M, x1=Math.max.apply(null,xs)+M;
  var y0=Math.min.apply(null,ys)-M-40, y1=Math.max.apply(null,ys)+M;
  var W=Math.round(x1-x0), H=Math.round(y1-y0);
  T.OX=-x0; T.OY=-y0;

  var s=[], flat=[], props=[];
  SPOT_LABELS=[];
  s.push('<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" xmlns="http://www.w3.org/2000/svg" '
       + 'role="img" aria-label="'+esc(A.ttl)+'（ななめ上から見た立体の ちず）">');
  s.push('<defs><filter id="sSoft" x="-30%" y="-30%" width="160%" height="160%">'
       + '<feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#2f4a63" flood-opacity="0.20"/></filter></defs>');
  s.push('<rect width="'+W+'" height="'+H+'" fill="#e8f2fb"/>');

  /* ジオラマの台 */
  var b0=iso(p[0],p[1],0), b1=iso(p[2],p[1],0), b2=iso(p[2],p[3],0), b3=iso(p[0],p[3],0), WALL=20;
  s.push('<g filter="url(#sSoft)">');
  s.push('<path d="M'+pt(b1)+'L'+pt(b2)+'L'+pt(b3)+'L'+b3[0].toFixed(1)+' '+(b3[1]+WALL).toFixed(1)
       + 'L'+b2[0].toFixed(1)+' '+(b2[1]+WALL).toFixed(1)+'L'+b1[0].toFixed(1)+' '+(b1[1]+WALL).toFixed(1)+'Z" fill="#bcae86"/>');
  s.push('<path d="M'+pt(b0)+'L'+pt(b1)+'L'+pt(b2)+'L'+pt(b3)+'Z" fill="#cfe6a4"/>');
  s.push('</g>');

  /* はんてい円（1スタンプ ＝ 1つ いじょう）。じめんに 楕円で 見せる */
  A.ks.forEach(function(k){
    var g2=got(k), now=(!g2 && (getManualMode() || k===PUSHABLE));
    areaZones(A,k).forEach(function(zz){
      var c=iso(zz.g[0],zz.g[1],0), rp=projR(zz.r/A.mpp), rr=rp[0], rry=rp[1];
      s.push('<ellipse cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" rx="'+rr.toFixed(1)
           + '" ry="'+rry.toFixed(1)+'" fill="'+(now?'#d1332e':'#4a5b6e')+'" opacity="'
           + (now?'.10':'.05')+'" stroke="'+(now?'#d1332e':'#8a97a8')
           + '" stroke-width="2.4" stroke-dasharray="9 9"/>');
    });
    /* 円が 2つ いじょう ある スタンプ は、円どうしを 点線で つなぐ */
    var zs=areaZones(A,k);
    if(zs.length>1){
      for(var i=0;i<zs.length-1;i++){
        s.push('<path d="'+pathG([zs[i].g,zs[i+1].g],0)+'" fill="none" stroke="'+(now?'#d1332e':'#8a97a8')
             + '" stroke-width="2.4" stroke-dasharray="4 8" opacity=".7"/>');
      }
    }
  });

  if(SCENE[key]) SCENE[key](A,flat,props);
  s.push(flat.join(''));

  /* たてもの（おくから 手前へ ならべる） */
  A.ks.forEach(function(k){
    var cfg=A.art[k]; if(!cfg||!SART[cfg.f]) return;
    areaZones(A,k).forEach(function(zz,zi){
      var f=(zi>0 && SART[cfg.f+'2']) ? SART[cfg.f+'2'] : SART[cfg.f];
      props.push({z:zz.g[0]+zz.g[1], svg:f(zz.g)});
    });
  });
  props.sort(function(a,b){return a.z-b.z;});
  s.push(props.map(function(x){return x.svg;}).join(''));

  /* ピン（アイコン＋じょうたいバッジ・タップできる）。1つの円 に 1つ */
  A.ks.forEach(function(k){
    var st=findStamp(k), g2=got(k), now=(!g2 && (getManualMode() || k===PUSHABLE));
    var cfg=A.art[k]||{top:60};
    var zs=areaZones(A,k);
    zs.forEach(function(zz,zi){
      var c=iso(zz.g[0],zz.g[1],cfg.top);
      var ring = g2 ? '#17773d' : (now ? '#d1332e' : (zz.real ? '#8a97a8' : '#c05621'));
      s.push('<g class="pin" data-k="'+k+'" tabindex="0" role="button" aria-label="'+esc(st.n)+'">');
      s.push('<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="34" fill="transparent" pointer-events="all"/>');
      s.push('<path d="M'+pt(iso(zz.g[0],zz.g[1],0))+'L'+c[0].toFixed(1)+' '+(c[1]+18).toFixed(1)
           + '" stroke="'+ring+'" stroke-width="3" opacity=".55"/>');
      s.push('<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="22" fill="#ffffff" stroke="'
           + ring+'" stroke-width="5"'+(zz.real?'':' stroke-dasharray="6 5"')+'/>');
      s.push('<text x="'+c[0].toFixed(1)+'" y="'+(c[1]+8).toFixed(1)+'" font-size="22" text-anchor="middle">'+st.e+'</text>');
      if(g2){
        s.push('<circle cx="'+(c[0]+19).toFixed(1)+'" cy="'+(c[1]-19).toFixed(1)+'" r="11" fill="#17773d" stroke="#ffffff" stroke-width="3"/>');
        s.push('<path d="M'+(c[0]+13.6).toFixed(1)+' '+(c[1]-19).toFixed(1)
             + ' l3.6 4.2 l7 -8" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>');
      }else if(now){
        s.push('<circle cx="'+(c[0]+19).toFixed(1)+'" cy="'+(c[1]-19).toFixed(1)+'" r="11" fill="#d1332e" stroke="#ffffff" stroke-width="3">'
             + '<animate attributeName="r" values="11;13;11" dur="600ms" repeatCount="indefinite"/></circle>');
        s.push('<text x="'+(c[0]+19).toFixed(1)+'" y="'+(c[1]-14.6).toFixed(1)
             + '" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">!</text>');
      }
      s.push('</g>');
      var nm = (zs.length>1) ? (zz.n5||zonesKana(k,zi)) : st.n;
      SPOT_LABELS.push({t:nm, x:c[0], y:c[1]-26, prio:(now?110:(g2?60:70)),
                        col:(g2?'#17773d':(now?'#d1332e':'#8a97a8')), got:g2,
                        keep:[26,26,52,52]});
    });
  });

  /* この エリアに 絵を おけない スタンプ は、台の へり に 矢じるし で 出す */
  (A.away||[]).forEach(function(aw){
    var st=findStamp(aw.k), c=iso(aw.g[0],aw.g[1],26);
    s.push('<g class="pin" data-k="'+aw.k+'" tabindex="0" role="button" aria-label="'+esc(st.n)+'">');
    s.push('<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="30" fill="transparent" pointer-events="all"/>');
    s.push('<circle cx="'+c[0].toFixed(1)+'" cy="'+c[1].toFixed(1)+'" r="19" fill="#ffffff" stroke="'
         + (got(aw.k)?'#17773d':'#8a97a8')+'" stroke-width="4" stroke-dasharray="7 5"/>');
    s.push('<text x="'+c[0].toFixed(1)+'" y="'+(c[1]+7).toFixed(1)+'" font-size="19" text-anchor="middle">'+st.e+'</text>');
    s.push('</g>');
    SPOT_LABELS.push({t:st.n+' '+aw.d, x:c[0], y:c[1]-22, prio:40,
                      col:'#c9d3de', got:got(aw.k), keep:[22,22,44,44]});
  });

  /* エリアの けしきに ついた ふだ（ちゅうしゃじょう など）も おなじ しくみ で よける */
  (AREA_TAGS[key]||[]).forEach(function(tg){
    var c=iso(tg.g[0],tg.g[1],tg.z||18);
    SPOT_LABELS.push({t:tg.t, x:c[0], y:c[1], prio:tg.p||30, col:'#c9d3de', keep:[14,10,28,20]});
  });

  /* いま いるところ＝ねこ。GPS が とれた ときは そこを (geo2grid で この エリアの マス目に なおして) つかい、
     まだ とれて いない ときは デモの ちてん（いずも だけ 用意ずみ）に おちる */
  var haveLive=(LIVE.lat!=null && LIVE.lon!=null);
  var meG = haveLive ? geo2grid(A, LIVE.lat, LIVE.lon) : A.cat;
  if(meG){
    var MRG=3;
    var cx0=p[0]+MRG, cx1=p[2]-MRG, cy0=p[1]+MRG, cy1=p[3]-MRG;
    var farAway=haveLive && (meG[0]<cx0-6 || meG[0]>cx1+6 || meG[1]<cy0-6 || meG[1]>cy1+6);
    var showG=[Math.max(cx0,Math.min(cx1,meG[0])), Math.max(cy0,Math.min(cy1,meG[1]))];
    var mp=iso(showG[0],showG[1],0);
    s.push('<g><ellipse cx="'+mp[0].toFixed(1)+'" cy="'+mp[1].toFixed(1)+'" rx="18" ry="9" fill="#d1332e" opacity=".28">'
         + '<animate attributeName="rx" values="14;40;14" dur="1s" repeatCount="indefinite"/>'
         + '<animate attributeName="ry" values="7;20;7" dur="1s" repeatCount="indefinite"/>'
         + '<animate attributeName="opacity" values=".38;0;.38" dur="1s" repeatCount="indefinite"/></ellipse>');
    s.push(catUse(LIVE.moving?'cat-travel':'cat-guide',mp[0],mp[1],1.5));
    s.push('</g>');
    var cr=catRect(mp[0],mp[1],1.5);
    var freshTxt2=lastGoodText();
    var meTxt;
    if(farAway){
      var z0=zones(A.ref.k)[0];
      var dm=z0 ? metersBetween([LIVE.lat,LIVE.lon],[z0[0],z0[1]]) : null;
      var dTxt = dm==null ? '' : (dm<1000 ? Math.round(dm/10)*10+' m' : (dm/1000).toFixed(dm<10000?1:0)+' km');
      meTxt='ここから '+dTxt+' はなれています';
    }else{
      meTxt='いま ここ！'+(freshTxt2?'（さいご取得：'+freshTxt2+'）':'');
    }
    SPOT_LABELS.push({t:meTxt, kind:'me', prio:120, col:'#d1332e',
                      x:mp[0], y:cr.y+2, keep:[mp[0]-cr.x,2,cr.w,cr.h]});
  }

  s.push('</svg>');
  /* さいしょに 見せる ばしょ と 大きさ（スタンプ が ぜんぶ 入る ように） */
  var bx0=1e9,by0=1e9,bx1=-1e9,by1=-1e9;
  A.ks.forEach(function(k){
    var cfg=A.art[k], zs=areaZones(A,k), top=(cfg&&cfg.top)||26;
    if(!zs.length) return;
    zs.forEach(function(zz){
      var c=iso(zz.g[0],zz.g[1],top);
      bx0=Math.min(bx0,c[0]); bx1=Math.max(bx1,c[0]);
      by0=Math.min(by0,c[1]); by1=Math.max(by1,c[1]);
    });
  });
  var fz=areaZones(A,A.focus)[0];
  var fc=fz? iso(fz.g[0],fz.g[1],(A.art[A.focus]&&A.art[A.focus].top)||40) : [W/2,H/2];
  T.PROJ=PJ; T.K=KO; T.OX=OXO; T.OY=OYO; T.TKX=TKXO; T.TKY=TKYO;
  return {svg:s.join(''), w:W, h:H,
          box:{x:bx0,y:by0,w:Math.max(1,bx1-bx0),h:Math.max(1,by1-by0)},
          focus:fc};
}
/* 円が 2つ いじょう ある スタンプ の、円ごとの よびかた（ひらがな） */
export function zonesKana(k,zi){
  var z=zones(k)[zi];
  return (z && z[4]) ? z[4] : (findStamp(k).n);
}
/* けしきの ふだ（たてもの では ない もの） */
export var AREA_TAGS = {
  izumo:[{g:[6,9], z:18, t:'おおちゅうしゃじょう', p:35}],
  kyoto:[{g:[29.2,51.1], z:50, t:'きょうとタワー', p:32},
         {g:[24,57.5], z:14, t:'きょうとえき', p:34}],
  yubara:[{g:[28.6,13], z:8, t:'すなゆ', p:32}],
  bisei:[{g:[11.5,41], z:4, t:'ちゅうしゃじょう', p:30}],
  mochigase:[{g:[7,26], z:2, t:'あかなみがわ', p:30}],
  himeji:[{g:[16,25], z:2, t:'さんのまる ひろば', p:30},
          {g:[16,52], z:2, t:'おおてまえ どおり', p:28}]
};

/* ---------- 7. したから 出る パネル ---------- */
