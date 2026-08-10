"use strict";
import { T, iso, pt, G, shade, isoBox, isoRoof, hexClamp, isoCone, isoShadow, offsetPts, isoPath, roadLadder, dirArrows, rnd, projR } from '../map/iso.js';
import { el, esc } from '../util.js';
import { NODES, BASE, ROUTES } from '../data/nodes.js';
import { DAYCOL } from '../data/tokens.js';
import { LAND, inLand, distToRoads, grassTexture, farmPatches, woodPatches,
  cityPatches, cityClips, mountTop, daisenTop, gEllipse } from './terrain.js';
import { drawLandmarks, art_shrine, art_onsen, art_camp, art_tower, art_exit, art_castle, art_dome, art_sa, art_jct, art_ic } from './landmarks.js';
import { scaleAt } from './areamap.js';
import { got } from '../data/stamps.js';
import { catUse, catRect } from '../ui/cat.js';
import { LIVE, lastGoodText } from '../geo/state.js';
export var NET_LABELS = [], NET_ME = [0,0];
export var PREF_NAMES = [
  [86.0,78.0,'おおさかふ','#8a5a2a'], [84.0,30.0,'きょうとふ','#8a5a2a'],
  [60.0,66.0,'ひょうごけん','#2f6b3f'], [30.0,52.0,'おかやまけん','#2f6b3f'],
  [48.0,18.0,'とっとりけん','#2b5f8a'], [10.0,10.0,'しまねけん','#2b5f8a']
];

export var NETW=1400, NETH=900;
export function buildNetMap(){
  var PJ=T.PROJ, KO=T.K, OXO=T.OX, OYO=T.OY;
  T.PROJ='top'; T.OX=34; T.OY=28;
  var W=NETW, H=NETH, s=[];
  s.push('<svg viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" xmlns="http://www.w3.org/2000/svg" '
       + 'role="img" aria-label="たびの ぜんたい ちず（ほぼ 真上から 見た ちず）">');
  s.push('<defs>'+cityClips()+'</defs>');

  /* うみ（画面ぜんたいを うめる。空白を のこさない） */
  s.push('<rect width="'+W+'" height="'+H+'" fill="#1f96e0"/>');
  var wv=[];
  for(var i=-2;i<104;i+=4.6){ for(var j=-2;j<104;j+=3.4){
    if(inLand(i,j)) continue;
    var w0=iso(i,j,0);
    wv.push('M'+(w0[0]-9).toFixed(1)+' '+w0[1].toFixed(1)+' q4.5 -3.4 9 0 q4.5 3.4 9 0');
  }}
  s.push('<path d="'+wv.join('')+'" fill="none" stroke="#ffffff" stroke-width="2.2" '
       + 'opacity=".38" stroke-linecap="round"/>');

  /* りく。なぎさ を 砂いろ で ふちどる */
  var lp=LAND.map(function(p,k){return (k?'L':'M')+pt(iso(p[0],p[1],0));}).join('')+'Z';
  s.push('<path d="'+lp+'" fill="none" stroke="#7fd0f0" stroke-width="16" stroke-linejoin="round"/>');
  s.push('<path d="'+lp+'" fill="#78d43a"/>');
  s.push('<path d="'+lp+'" fill="none" stroke="#e6cf7c" stroke-width="6" stroke-linejoin="round"/>');
  s.push('<path d="'+lp+'" fill="none" stroke="#79b845" stroke-width="2" stroke-linejoin="round"/>');

  /* くさち の きめ（したじき） */
  s.push(grassTexture());

  /* たはた（じめん を うめる 1つめ） */
  s.push(farmPatches());

  var props=[];
  /* はやし（じめん を うめる 2つめ）。面 は ここ、こずえ は props へ */
  s.push(woodPatches(props));

  /* かわ */
  var rivers=[[[23.4,19.6],[24.8,19.9]],                    /* 大橋川 */
              [[9.5,23.5],[12.5,21.4],[14.4,20.0]],          /* 斐伊川（西から 東へ） */
              [[52,31],[51.6,24],[52.2,16]],                 /* 千代川 */
              [[30,41],[32.5,55],[36,72],[39,88],[41,96]],   /* 旭川 */
              [[16,74],[18.5,84],[20.5,95]],                 /* 高梁川 */
              [[60,66],[59.4,76],[59,88]],                   /* 市川（姫路） */
              [[86,44],[87.5,58],[88.5,72],[88,84]]];        /* 淀川すじ */
  s.push('<g fill="none" stroke="#1f96e0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">');
  rivers.forEach(function(r){ s.push('<path d="'+r.map(function(p,k){return (k?'L':'M')+pt(iso(p[0],p[1],0));}).join('')+'"/>'); });
  s.push('</g>');
  s.push('<g fill="none" stroke="#5cbcee" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">');
  rivers.forEach(function(r){ s.push('<path d="'+r.map(function(p,k){return (k?'L':'M')+pt(iso(p[0],p[1],0));}).join('')+'"/>'); });
  s.push('</g>');

  /* いちがい（じめん を うめる 4つめ）。地 と 道の ます目 は ここ、たてもの は props へ */
  s.push(cityPatches(props));

  /* みずうみ（宍道湖・中海）。まちなみ の あとに 描く ＝ 湖が 家に うもれない。
     宍道湖 は よこに ながい 楕円。中海 は その 東どなり。大橋川 で つながる */
  s.push(gEllipse(18.5,19.2,4.6,2.4,'#2f92c8'));
  s.push(gEllipse(18.5,19.2,4.3,2.1,'#4fb6ea'));
  s.push(gEllipse(27.5,20.2,3.0,1.9,'#2f92c8'));
  s.push(gEllipse(27.5,20.2,2.75,1.62,'#4fb6ea'));
  /* しじみ を とる こぶね（ランドマーク台帳：宍道湖の ヤマトシジミ は 日本一） */
  [[16.0,19.0],[20.6,19.6],[18.2,20.2]].forEach(function(b){
    var c=iso(b[0],b[1],0);
    s.push('<path d="M'+(c[0]-9).toFixed(1)+' '+c[1].toFixed(1)+'q9 6 18 0q-9 3 -18 0Z" fill="#f2f5f8"/>'
         + '<path d="M'+c[0].toFixed(1)+' '+c[1].toFixed(1)+'l0 -9" stroke="#4a5b6e" stroke-width="2"/>');
  });

  /* ふつうの みち（したじき） */
  s.push('<g fill="none" stroke="#ffffff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round">');
  BASE.forEach(function(r){ s.push('<path d="'+isoPath(r.map(G).map(function(p){return [p[0],p[1]];}))+'"/>'); });
  s.push('</g>');
  s.push('<g fill="none" stroke="#c7cfd8" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">');
  BASE.forEach(function(r){ s.push('<path d="'+isoPath(r.map(G))+'"/>'); });
  s.push('</g>');
  BASE.forEach(function(r){ s.push(roadLadder(r.map(G), 0.5, 0.9)); });

  /* ひごとの ルート（いき・かえりを 2ほんに 分ける） */
  ROUTES.forEach(function(rt){
    var col=DAYCOL[rt.day];
    s.push('<g class="rt '+rt.day+'">');
    rt.segs.forEach(function(sg){
      var gp=offsetPts(sg.p.map(G), sg.off), d=isoPath(gp);
      s.push('<path d="'+d+'" fill="none" stroke="#ffffff" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>');
      s.push('<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>');
      s.push(roadLadder(gp, 0.62, 0.72));
      s.push(dirArrows(gp));
    });
    s.push('</g>');
  });

  /* 中国山地。真上から 見た 山 ＝ まるい こんもり。
     おくへ いくほど 明るい 面 を かさねて 高さ を 出す（三角の 山 の くりかえし は しない） */
  var mt=[[7,45,4.2,26],[13,50,5.0,34],[19,46,3.9,22],[25,53,4.6,30],[31,48,3.6,20],
          [37,54,4.2,28],[43,49,3.8,22],[49,55,4.1,27],[55,50,3.5,19],[61,54,3.8,24],
          [67,48,3.2,18],[73,43,2.9,16],[79,38,2.7,15],[22,64,3.0,15],[12,86,2.8,14],
          [64,90,3.0,16],[70,63,3.2,18]];
  mt.forEach(function(m,mi){ props.push({z:m[1], svg:mountTop(m[0],m[1],m[2],m[3],mi)}); });
  /* 大山（この ちほうで いちばん 目立つ 山）。
     西（米子がわ）から 見ると 円すい ＝ 伯耆富士。
     みなみ・きた の 面 は 大くずれ の 岩かべ なので ぎざぎざ の 岩はだ を 足す。
     ※ 8月なかば の 雪 は 出所が とれていない ので 描かない（ランドマーク台帳 §0） */
  props.push({z:26.5, svg:daisenTop(34.0,26.5)});
  /* ノード。ふだ は SVG に 書かず、画面の 座標で おき直す 層 に わたす */
  NET_LABELS=[];
  NODES.forEach(function(nd){
    var g=G(nd.k), svg='', top=0, prio=20, keep=[20,20,40,40];
    if(nd.t==='land'){
      svg = ({shrine:art_shrine,onsen:art_onsen,camp:art_camp,tower:art_tower,
              exit:art_exit,castle:art_castle,dome:art_dome})[nd.art](g);
      top = ({shrine:34,onsen:24,camp:16,tower:46,exit:20,castle:44,dome:28})[nd.art];
      prio=60; keep=[18,8,36,34];
    }else if(nd.t==='sa'){ svg=art_sa(g,nd.ic,got(nd.s)); top=46; prio=50; keep=[22,22,44,44]; }
    else if(nd.t==='jct'){ svg=art_jct(g); top=4; prio=20; keep=[12,10,24,20]; }
    else { svg=art_ic(g); top=12; prio=25; keep=[12,12,24,24]; }
    props.push({z:g[1]+0.5, svg:scaleAt(g[0],g[1],T.NODE_SC,svg)});
    var head=iso(g[0],g[1],top*T.NODE_SC);
    NET_LABELS.push({t:nd.n, x:head[0], y:head[1], day:nd.day||'', prio:prio, keep:keep,
                     col:(nd.day?DAYCOL[nd.day]:'#c9d3de'),
                     got:(nd.t==='sa'? got(nd.s) : null)});
  });
  /* 段3：脇役ランドマーク（ランドマーク台帳 §2） */
  drawLandmarks(props, NET_LABELS);

  props.sort(function(a,b){return a.z-b.z;});
  s.push(props.map(function(p){return p.svg;}).join(''));

  /* うみ の なまえ（海は 画面いっぱいで 隠れにくい ので そのまま 書く） */
  [[50,4.0,'にほんかい',0],[46,98.6,'せとないかい',0],[84,95.0,'おおさかわん',0]].forEach(function(t){
    var c=iso(t[0],t[1],0);
    s.push('<text x="'+c[0].toFixed(1)+'" y="'+c[1].toFixed(1)+'" font-size="21" font-weight="700" '
         + 'fill="#e8f6ff" stroke="#2b7fae" stroke-width="4" paint-order="stroke" '
         + 'text-anchor="middle">'+t[2]+'</text>');
  });
  /* みずうみ の なまえ ＝ 判断待ち#2 の main 回答（札の層に含める）に従い ラベル層へ わたす */
  [[18.5,19.4,'しんじこ'],[27.5,23.6,'なかうみ']].forEach(function(t){
    var c=iso(t[0],t[1],0);
    NET_LABELS.push({t:t[2], x:c[0], y:c[1], prio:55, keep:[0,0,0,0], col:'#2b7fae'});
  });
  /* 段4：府県名（main 裁定＝画面に入っている県名だけ・それぞれ大きく・2〜3個 同時可） */
  PREF_NAMES.forEach(function(pn){
    var c=iso(pn[0],pn[1],0);
    NET_LABELS.push({t:pn[2], x:c[0], y:c[1], prio:90, kind:'pref', keep:[0,0,0,0], col:pn[3]});
  });

  /* いま いるところ＝ねこ。GPS から とれた ときは その ちてん（LIVE.abstract）を つかい、
     まだ とれて いない ときは デモの ちてん（8/14 12:25・出雲大社の けいだい）に おちる。
     「いま ここ！」の ふきだし は ふだ の 層 で あつかう ので、ねこ と 札 に かぶらない */
  var me=G('izumo'), meG=(LIVE.abstract) ? [LIVE.abstract.x/10, LIVE.abstract.y/7.3] : [me[0]-1.0,me[1]+6.4];
  var mp=iso(meG[0],meG[1],0);
  s.push('<g id="mMe"><ellipse cx="'+mp[0].toFixed(1)+'" cy="'+mp[1].toFixed(1)
       + '" rx="16" ry="8" fill="#d1332e" opacity=".28">'
       + '<animate attributeName="rx" values="12;34;12" dur="1s" repeatCount="indefinite"/>'
       + '<animate attributeName="ry" values="6;17;6" dur="1s" repeatCount="indefinite"/>'
       + '<animate attributeName="opacity" values=".38;0;.38" dur="1s" repeatCount="indefinite"/></ellipse>');
  /* 段4：うごいている あいだは cat-travel、止まっている／まだ とれていない ときは cat-guide */
  s.push(catUse(LIVE.moving?'cat-travel':'cat-guide',mp[0],mp[1],1.25));
  s.push('</g>');
  var cr=catRect(mp[0],mp[1],1.25);
  var freshTxt=lastGoodText();
  NET_LABELS.push({t:'いま ここ！'+(freshTxt?'（さいご取得：'+freshTxt+'）':''), kind:'me', prio:100, col:'#d1332e',
                   x:mp[0], y:cr.y+2,
                   keep:[mp[0]-cr.x, 2, cr.w, cr.h]});
  NET_ME=[mp[0],mp[1]];

  /* ほうい。この ちずは ほぼ 真上から 見ている ので きた が そのまま 上 */
  s.push('<g transform="translate(84,86)"><circle r="30" fill="#ffffff" opacity=".92"/>'
    + '<path d="M0 14 L0 -12 M-7 -5 L0 -14 L7 -5 Z" fill="#d1332e" stroke="#d1332e" '
    + 'stroke-width="3" stroke-linejoin="round"/>'
    + '<text x="0" y="26" font-size="13" font-weight="700" fill="#1d2b3a" text-anchor="middle">きた</text></g>');

  s.push('</svg>');
  T.PROJ=PJ; T.K=KO; T.OX=OXO; T.OY=OYO;
  return s.join('');
}

/* ---------- 6. スポットの まわり（6かしょ・立体・しせつの 中は 作らない＝Q27） ----------
   ばしょは すべて 地点座標_v0.1.tsv の いど・けいど から 計算する（手で おかない）。
   1マスの 大きさ（mpp）だけ エリアごとに 変える。 */
