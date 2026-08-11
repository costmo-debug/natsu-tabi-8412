"use strict";
import { el, esc } from '../util.js';
import { got, findStamp, PUSHABLE, distText, zoneText, llText, zones, plRuby, rb, getManualMode } from '../data/stamps.js';
import { DAYCOL } from '../data/tokens.js';
import { AREAS, AREA_ORDER, areaOf, buildAreaMap, SPOT_LABELS } from '../map/areamap.js';
import { acquire } from './acquire.js';
import { V2, LBL2, AREA_M0 } from '../boot.js';
import { stampArtSrc, hasStampArt } from '../data/stampArt.js';
import { renderPhotoSlot } from './photo.js';
function artOrPh(k,st){
  return hasStampArt(k)
    ? '<img src="'+stampArtSrc(k)+'" alt="'+esc(st.n)+'" loading="lazy">'
    : '<span class="enph" aria-hidden="true">？</span>';
}
export var curArea='izumo';

export var curSpot='i2';
export var NOTES={
 i2:'<b>おおしめなわ は 13.6 m。</b>にほんで いちばん おおきい しめなわ です。したから 見あげてみて ください。',
 i3:'<b>ここだけ にれい しはくしゅ いちれい。</b>ふつうの じんじゃ は にはくしゅ ですが、いずもたいしゃ は よんはくしゅ です。',
 i1:'<b>11:30 の かいてんと どうじに 入ります。</b>おぼん は こむので、はやめに ならびます。',
 i4:'<b>とりい は 2かしょ。どちらでも おせます。</b>せいだまり の おおとりい と、うかばし の おおとりい。'
   +'2つは 578 m はなれています。まん中に 大きい 円を 1つ おく やりかた は とりません（さんどうの とちゅうで おせて しまう ため）。',
 k1:'<b>ケーキうりばは ちか。</b>ちかは いちじょうほう が とれません。てで おす ボタン を つかいます。',
 k3:'<b>おみせは ポルタの ちか1かい。</b>ここも ちか なので、てで おす ほう が たしかです。',
 k4:'<b>よるの すいぞくかん。</b>たてものの 中は いちじょうほう が とれません。いりぐち の まえ で おします。',
 y2:'<b>はしの ばしょは その ばで たしかめます。</b>いまは すなゆ を かりの まん中 に して、はんいを 250 m に ひろげて います。',
 y3:'<b>てんじしつ の 中は いちじょうほう が とれません。</b>いりぐち の まえ で おします。',
 y4:'<b>かんさつ は そと です。</b>そら が ひらけて いるので、いちじょうほう は とれます。',
 f1:'<b>3つとも おなじ いど・けいど（しせつの だいひょう点）。</b>ちずの 上の おきばしょ は かり です。とうじつ その ばで きめます。',
 f2:'<b>おなじ しせつ の 中。</b>いど・けいど は f1 と おなじ です。',
 f3:'<b>おなじ しせつ の 中。</b>いど・けいど は f1 と おなじ です。',
 f4:'<b>ばしょが まだ きまっていません。</b>やど（フォレストリア'+rb('用瀬','もちがせ')+'）が あかなみがわ ぞい なので、とうじつ 川で きめて てで おします。',
 h2:'<b>てんしゅの 中は いちじょうほう が とれません。</b>にゅうじょうぐち（てんしゅ から 185 m みなみにし）も はんい 300 m に 入ります。',
 h1:'<b>イーグレひめじ の 1かい。</b>まど から とおい と いちじょうほう が よわく なる ことが あります。',
 h3:'<b>この ちず の そと。</b>ひめじじょう から 2.5 km みなみにし です。',
 h4:'<b>この ちず の そと。</b>ひめじじょう から 10 km にし（たいしちょう）です。'
};
export var AREA_HINT={
 izumo:'<b>「ぎゃくまわり」が ラクです。</b>おおちゅうしゃじょう が かぐらでん の すぐ ちかく なので、'
   +'かぐらでん → ごほんでん → さんどう を くだって おおとりい の じゅんに すると、かえりの のぼりざか が わかれます。',
 kyoto:'<b>4つは ひろく はなれて います。</b>だいまる（きた）→ やど → ポルタ → すいぞくかん（にし）の じゅん。'
   +'えき から すいぞくかん まで 1 km ほど あります。',
 yubara:'<b>かわ ぞいに 3つ ならんで います。</b>きくのゆ → よりそいばし → ミュージアム で 500 m ぐらい。あるいて まわれます。',
 bisei:'<b>ここは 1つ だけ。</b>よる 20:45 の かんさつ に あわせて 行きます。まわりに あかり が すくないので 足もと に 気をつけて。',
 mochigase:'<b>3つは おなじ しせつ の 中。</b>いど・けいど が おなじ なので、ちずの 上の おきばしょ は かり です。'
   +'かわあそび の ばしょ だけ まだ きまって いません。',
 himeji:'<b>ちず に あるのは 2つ。</b>すいぞくかん と わぎゅう は はなれて いるので、台の へり に 出して います。'
};
export function areaStamps(a){ return AREAS[a].ks.concat((AREAS[a].away||[]).map(function(x){return x.k;})); }

export function renderSheet(){
  var A=AREAS[curArea], st=findStamp(curSpot), g=got(curSpot);
  var manual=getManualMode();
  var now=(!g && (manual || curSpot===PUSHABLE));
  var dist=distText(curSpot);
  var h=[];
  if(manual){
    h.push('<p class="manualnote" style="margin:0 0 8px;font-size:11px;font-weight:700;color:var(--pop)">'
         + '今は おせる モードです</p>');
  }
  h.push('<button class="getbtn" id="getBtn"'+(now?'':' disabled')+'>');
  h.push('<span class="disk">'+artOrPh(curSpot,st)+'</span><span class="tx">');
  if(g){ h.push('<b>スタンプ ゲット ずみ</b><span>'+st.d+' '+st.t+' に おしました</span>'); }
  else if(now){ h.push('<b>いま おせます！</b><span>'+esc(st.n)+' の スタンプを おす</span>'); }
  else { h.push('<b>ちかづくと おせます</b><span>ここから '+dist+'</span>'); }
  h.push('</span></button>');

  h.push('<div class="detail">');
  h.push('<h3>'+esc(st.n)+'</h3>');
  h.push('<dl class="kv pl"><dt>ばしょ</dt><dd>'+plRuby(curSpot)+'</dd></dl>');
  h.push('<dl class="kv"><dt>よてい</dt><dd>'+esc(st.d)+' '+esc(st.t)+'</dd></dl>');
  h.push('<dl class="kv"><dt>ここから</dt><dd>'+esc(dist)+' <small>ちょくせん</small></dd></dl>');
  var zs=zones(curSpot);
  h.push('<dl class="kv"><dt>おせる はんい</dt><dd>'+esc(zoneText(curSpot))+'</dd></dl>');
  if(zs.length>1){
    h.push('<dl class="kv"><dt>おせる ばしょ</dt><dd>'
      + zs.map(function(z,i){ return rb(z[3], z[4]||'') ; }).join('<br>')+'</dd></dl>');
  }
  h.push('<dl class="kv"><dt>いど・けいど</dt><dd><small>'+llText(curSpot)+'</small></dd></dl>');
  if(NOTES[curSpot]) h.push('<p class="note">'+NOTES[curSpot]+'</p>');
  h.push('</div>');

  h.push('<div class="photoarea" id="photoArea" data-k="' + curSpot + '"></div>');

  var ks=areaStamps(curArea);
  h.push('<div class="slist">');
  ks.forEach(function(k){
    var t2=findStamp(k), g2=got(k), n2=(!g2 && (manual || k===PUSHABLE));
    h.push('<button class="srow" data-k="'+k+'" aria-current="'+(k===curSpot)+'">');
    h.push('<span class="ic">'+artOrPh(k,t2)+'</span><span class="tx"><b>'+esc(t2.n)+'</b>'
         + '<span>'+esc(t2.d)+' '+esc(t2.t)+' ・ '+esc(t2.pk)+'</span></span>');
    h.push('<span class="badge '+(g2?'got':(n2?'now':'yet'))+'">'
         + (g2?'ゲット':(n2?'いま おせる':'まだ'))+'</span>');
    h.push('</button>');
  });
  h.push('</div>');
  if(AREA_HINT[curArea]) h.push('<p class="note">'+AREA_HINT[curArea]+'</p>');

  el('sheetBody').innerHTML=h.join('');
  el('sheetBody').scrollTop=0;
  renderPhotoSlot(curSpot);
  var n=0; ks.forEach(function(k){if(got(k))n++;});
  el('izCnt').textContent='スタンプ '+n+' / '+ks.length;
  el('areaTtl').innerHTML=esc(A.ttl).replace('用瀬', rb('用瀬','もちがせ'));

  var gb=el('getBtn');
  if(gb && !gb.disabled) gb.addEventListener('click',function(){ acquire(curSpot); });
  Array.prototype.forEach.call(el('sheetBody').querySelectorAll('.srow'),function(b){
    b.addEventListener('click',function(){
      var k=b.getAttribute('data-k'), a=areaOf(k);
      if(a && a!==curArea){ setArea(a,k); return; }
      curSpot=k; renderSheet(); snap(1);
      if(LBL2) LBL2.update();
    });
  });
}

/* エリアを 切りかえる（ちずを 作りなおして・大きさを 入れかえて・まん中を あわせる） */
export var AREA_S0=0.575;   /* しょうにんずみ の いずも の 見え方 と おなじ 大きさ */
export function poseArea(m){
  if(!V2) return;
  V2.setSize(m.w,m.h); V2.fit(false);
  var v=el('spotv'), vw=v.clientWidth, vh=v.clientHeight-48;
  if(!vw||!vh) return;
  var all=(AREAS[curArea].poseAll!==false);
  var need=all ? Math.min(vw/(m.box.w+140), vh/(m.box.h+140)) : AREA_S0;
  var s0=Math.max(V2.minScale(), Math.min(AREA_S0, need));
  var wide=(all && need<AREA_S0);
  var cx = wide ? (m.box.x+m.box.w/2) : m.focus[0];
  var cy = wide ? (m.box.y+m.box.h/2) : m.focus[1];
  V2.centerOn(cx,cy,s0,false);
}
export function setArea(a,focusK){
  curArea=a;
  var A=AREAS[a];
  curSpot=focusK && A.ks.indexOf(focusK)>=0 ? focusK
        : (A.ks.indexOf(PUSHABLE)>=0 ? PUSHABLE : A.focus);
  var m=buildAreaMap(a);
  el('spotfit').innerHTML=m.svg;
  bindPins();
  poseArea(m);
  renderSheet();
  buildAreaBar();
  if(LBL2) LBL2.now();
}
export function buildAreaBar(){
  el('areaBar').innerHTML=AREA_ORDER.map(function(a){
    var A=AREAS[a], n=0, ks=areaStamps(a);
    ks.forEach(function(k){if(got(k))n++;});
    return '<button class="chip c'+A.day.slice(1)+'" data-area="'+a+'" aria-pressed="'+(a===curArea)+'">'
      + '<span class="sw" style="background:'+DAYCOL[A.day]+'"></span>'+esc(A.chip)
      + ' <span style="color:var(--ink3)">'+n+'/'+ks.length+'</span></button>';
  }).join('');
  Array.prototype.forEach.call(el('areaBar').querySelectorAll('[data-area]'),function(b){
    b.addEventListener('click',function(){ setArea(b.getAttribute('data-area')); snap(0); });
  });
}

/* ---------- 8. パネルの たかさ（3だん） ---------- */
export var sheet, sheetStops=[], sheetIdx=0;
export function calcStops(){
  var h=sheet.parentElement.clientHeight||600, full=h*0.92;
  sheetStops=[full-48, full-h*0.52, 0];
}
export function snap(i){
  sheetIdx=Math.max(0,Math.min(2,i));
  calcStops();
  sheet.classList.remove('nomove');
  sheet.style.transform='translateY('+sheetStops[sheetIdx]+'px)';
  sheet.classList.remove('bounce'); void sheet.offsetWidth; sheet.classList.add('bounce');
  if(typeof LBL2!=='undefined' && LBL2) setTimeout(function(){LBL2.now();},360);
}
export function initSheet(){
  sheet=el('sheet');
  var grip=el('grip'), body=el('sheetBody');
  var dragging=false, y0=0, t0=0, moved=false;
  grip.addEventListener('pointerdown',function(e){
    dragging=true; moved=false; y0=e.clientY; calcStops(); t0=sheetStops[sheetIdx];
    sheet.classList.add('nomove');
    if(grip.setPointerCapture) grip.setPointerCapture(e.pointerId);
  });
  grip.addEventListener('pointermove',function(e){
    if(!dragging) return;
    if(Math.abs(e.clientY-y0)>6) moved=true;
    sheet.style.transform='translateY('+Math.max(0,Math.min(sheetStops[0]+80,t0+(e.clientY-y0)))+'px)';
  });
  function up(e){
    if(!dragging) return; dragging=false;
    if(!moved){ snap(sheetIdx===2?0:sheetIdx+1); return; }
    var cur=t0+(e.clientY-y0), best=0, bd=Infinity;
    sheetStops.forEach(function(v,i){var d=Math.abs(v-cur); if(d<bd){bd=d;best=i;}});
    snap(best);
  }
  grip.addEventListener('pointerup',up);
  grip.addEventListener('pointercancel',up);
  body.addEventListener('scroll',function(){ if(body.scrollTop>4 && sheetIdx<2) snap(2); });
  window.addEventListener('resize',function(){ snap(sheetIdx); });
  snap(0);
}

/* ---------- 9. スタンプちょう（ページが うまっていく） ---------- */
export function bindPins(){
  Array.prototype.forEach.call(el('spotfit').querySelectorAll('.pin'),function(g){
    var k=g.getAttribute('data-k');
    var open=function(ev){ if(ev) ev.stopPropagation();
      var a=areaOf(k);
      if(a && a!==curArea){ setArea(a,k); snap(1); return; }
      curSpot=k; renderSheet(); snap(1); if(LBL2) LBL2.update(); };
    g.addEventListener('click',open);
    g.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();open();} });
  });
}
/* スクロール連動は たいおうしている ばしょ だけ（iOS 17 では 何も おきない） */

export function setCurSpot(k){ curSpot=k; renderSheet(); }
