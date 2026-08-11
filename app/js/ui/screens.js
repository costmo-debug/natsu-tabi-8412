"use strict";
import { el, RM } from '../util.js';
import { NET_LABELS } from '../map/netmap.js';
import { DAYCOL } from '../data/tokens.js';
import { snap, sheetIdx } from './sheet.js';
import { V1, V2, LBL1, LBL2, AREA_M0 } from '../boot.js';
import { poseArea } from './sheet.js';
export var TTL={1:['旅行スタンプラリー','8がつ14にち（きん）12:25 ・ いずも'],
         2:['スポットの まわり','8がつ14にち（きん）12:25 ・ けいだい'],
         3:['スタンプちょう','たび20こ ＋ サービスエリア10こ'],
         4:['せってい','きろく・あいことば・あとから おす']};
export function go(n){
  var run=function(){
    [1,2,3,4].forEach(function(i){ el('scr'+i).classList.toggle('on',i===n); });
    Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(b){
      b.setAttribute('aria-selected', String(b.getAttribute('data-scr')===String(n)));
    });
    el('topName').innerHTML=TTL[n][0];
    el('topSub').textContent=TTL[n][1];
    el('toast').classList.toggle('up', n===2);
    if(n===1) requestAnimationFrame(function(){ if(V1){ V1.ready(); } if(LBL1) LBL1.now(); });
    if(n===2) requestAnimationFrame(function(){
      if(V2){ V2.ready(); if(!V2.posed){ V2.posed=true; if(AREA_M0) poseArea(AREA_M0); } }
      snap(sheetIdx); if(LBL2) LBL2.now(); });
  };
  if(document.startViewTransition && !RM.matches){ document.startViewTransition(run); }
  else { run(); }
}

/* ---------- 14. ひごとの きりかえ ---------- */
export var curDay='all';
export function buildBar(){
  var days=[['all','ぜんぶ',''],['d12','8/12','c12'],['d13','8/13','c13'],
            ['d14','8/14','c14'],['d15','8/15','c15']];
  el('dayBar').innerHTML=days.map(function(d){
    return '<button class="chip '+d[2]+'" data-day="'+d[0]+'" aria-pressed="'+(d[0]===curDay)+'">'
      + (d[2]?'<span class="sw" style="background:'+DAYCOL[d[0]]+'"></span>':'')+d[1]+'</button>';
  }).join('');
  Array.prototype.forEach.call(el('dayBar').querySelectorAll('[data-day]'),function(b){
    b.addEventListener('click',function(){ curDay=b.getAttribute('data-day'); buildBar(); applyFilter(); });
  });
}
export function applyFilter(){
  var w=el('mapfit');
  w.classList.remove('f12','f13','f14','f15');
  if(curDay!=='all') w.classList.add('f'+curDay.slice(1));
  if(LBL1) LBL1.now();
}
/* ちず の ふだ。日で しぼった ときは その日の ものだけ を おく（のこりに 場所が できる） */
export function netLabelItems(){
  if(curDay==='all') return NET_LABELS;
  return NET_LABELS.filter(function(l){ return l.kind==='me' || l.kind==='pref' || !l.day || l.day===curDay; });
}

/* ---------- 15. なめらかな かくだい・しゅくしょう と ゆびで うごかす ---------- */

export function setCurDay(d){ curDay=d; }
