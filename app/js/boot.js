"use strict";
import { el, esc, RM } from './util.js';
import { STAMPS, SAS, GOT, setEmptyDemo, setPushable, count, total, applyGotRecords } from './data/stamps.js';
import { listStamps, drainEmergency, addPerson, setCurrentPerson, exportAll, exportFileName } from './core/store.js';
import { gateThenEnter, openPasscodeSettings } from './ui/passcode.js';
import { getPersonId } from './core/person.js';
import { startLiveTracking } from './geo/live.js';
import { renderNextCard } from './ui/nextcard.js';
import { buildNetMap, NET_LABELS, NETW, NETH, NET_ME } from './map/netmap.js';
import { buildAreaMap, SPOT_LABELS, AREAS } from './map/areamap.js';
import { curArea } from './ui/sheet.js';
import { buildBar, applyFilter, netLabelItems, curDay, go, setCurDay } from './ui/screens.js';
import { buildAreaBar, renderSheet, initSheet, bindPins, setArea, curSpot, setCurSpot, snap } from './ui/sheet.js';
import { renderBook, initPages, curPage, setCurPage } from './ui/book.js';
import { showReward } from './ui/book.js';
import { confetti, partsLen } from './fx/confetti.js';
import { makeLabelLayer } from './map/labels.js';
import { makeView } from './map/view.js';
import { catBlock, CAT_PROV } from './ui/cat.js';
import { unlockAudio, chime, setOn, isOn } from './fx/sound.js';
import { toast } from './ui/toast.js';
import { showState, hideState, STATES } from './ui/states.js';
import { sizeFx } from './fx/confetti.js';
import { initScrollLinked } from './ui/book.js';
export var V1=null, V2=null, LBL1=null, LBL2=null, AREA_M0=null;
/* ちず2まい を まとめて 作りなおす（スタンプが ふえた ときなど） */
export function rebuildMaps(){
  el('mapfit').innerHTML=buildNetMap();
  var m=buildAreaMap(curArea);
  AREA_M0=m;
  el('spotfit').innerHTML=m.svg;
  if(V2) V2.setSize(m.w,m.h);
  bindPins(); applyFilter();
  if(LBL1) LBL1.now();
  if(LBL2) LBL2.now();
  renderNextCard();
}
/* 端末の中(IndexedDB)の記録を読みこんで GOT へ反映する。1台=1人分（F-46廃止）。 */
async function loadPersisted(){
  var pid=getPersonId();
  try{
    await addPerson({id:pid, name:pid});
    await setCurrentPerson(pid);
    await drainEmergency();
    var rows=await listStamps(pid);
    applyGotRecords(rows);
  }catch(e){
    console.warn('きろくの よみこみに しっぱいしました',e);
  }
}
export async function boot(){
  await loadPersisted();
  el('mapfit').innerHTML=buildNetMap();
  var m0=buildAreaMap(curArea);
  AREA_M0=m0;
  el('spotfit').innerHTML=m0.svg;
  buildBar(); buildAreaBar();
  renderSheet(); renderBook(); initSheet(); initPages(); bindPins();

  /* ふだ の 層。きんしたい ＝ 上のチップ帯・右上のボタン・下のカード・下パネル・タブバー */
  LBL1=makeLabelLayer('mapv','mapLbl', netLabelItems,
        ['#scr1 .mctl','#scr1 .legend','#nextcard','.tabs']);
  LBL2=makeLabelLayer('spotv','spotLbl', function(){return SPOT_LABELS;},
        ['#scr2 .mctl','#sheet','.tabs']);

  renderNextCard();
  V1=makeView('mapv','mapfit',NETW,NETH,0,function(){ LBL1.update(); });
  V2=makeView('spotv','spotfit',m0.w,m0.h,152,function(){ LBL2.update(); });
  V1.ready(); applyFilter();
  requestAnimationFrame(function(){
    V1.centerOn(NET_ME[0], NET_ME[1], V1.coverScale(), false);
    LBL1.now();
  });
  sizeFx();

  Array.prototype.forEach.call(document.querySelectorAll('.tab'),function(b){
    b.addEventListener('click',function(){ go(+b.getAttribute('data-scr')); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-z]'),function(b){
    b.addEventListener('click',function(){
      var m=b.getAttribute('data-z');
      if(m==='fit') V1.fit(); else V1.zoom(m==='in'?1.5:1/1.5);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-z2]'),function(b){
    b.addEventListener('click',function(){
      var m=b.getAttribute('data-z2');
      if(m==='fit') V2.fit(); else V2.zoom(m==='in'?1.5:1/1.5);
    });
  });
  el('btnHere').addEventListener('click',function(){
    V1.centerOn(NET_ME[0],NET_ME[1],V1.minScale()*2.4,true);
    toast('いま いるところ に もどりました');
  });
  el('btnSound').addEventListener('click',function(){
    setOn(!isOn());
    el('btnSound').setAttribute('aria-pressed',String(isOn()));
    el('sndWave').setAttribute('opacity',isOn()?'1':'0.15');
    toast(isOn()?'おとを だします':'おとを けしました');
    if(isOn()) chime();
  });

  var plist=[['load','よみこみ中'],['gpsfail','いちじょうほう が とれない'],
             ['denied','いちじょうほう が ことわられた'],['empty','スタンプ0この からっぽ'],
             ['offline','オフライン']];
  el('pList').innerHTML=plist.map(function(p){
    return '<button data-st="'+p[0]+'">'+p[1]+'<small>'+esc(STATES[p[0]].t)+'</small></button>';
  }).join('')
   + '<button data-st="resetEmpty">からっぽ デモを もどす<small>スタンプちょうを 17こ に もどします</small></button>'
   + '<button data-st="fillAll">ぜんぶ あつめた ことにする<small>ごほうびの え を みる</small></button>';
  el('btnState').addEventListener('click',function(){ el('picker').classList.add('on'); });
  el('pClose').addEventListener('click',function(){ el('picker').classList.remove('on'); });
  el('picker').addEventListener('click',function(e){ if(e.target===el('picker')) el('picker').classList.remove('on'); });
  Array.prototype.forEach.call(el('pList').querySelectorAll('button'),function(b){
    b.addEventListener('click',function(){
      var k=b.getAttribute('data-st');
      el('picker').classList.remove('on');
      if(k==='empty'){ setEmptyDemo(true); renderBook(); renderSheet(); go(3); showState('empty'); return; }
      if(k==='resetEmpty'){ setEmptyDemo(false); renderBook(); renderSheet(); go(3); return; }
      if(k==='fillAll'){ setEmptyDemo(false);
        STAMPS.concat(SAS).forEach(function(x){GOT[x.k]=1;});
        renderBook(); renderSheet(); buildAreaBar(); rebuildMaps();
        go(3); showReward(); return; }
      showState(k);
    });
  });
  el('stAct').addEventListener('click',hideState);
  el('rwClose').addEventListener('click',function(){ el('reward').classList.remove('on'); });

  /* うごきを へらす せってい：ちずの アニメも とめる */
  function applyRM(){
    Array.prototype.forEach.call(document.querySelectorAll('svg'),function(x){
      if(!x.pauseAnimations) return;
      if(RM.matches) x.pauseAnimations(); else x.unpauseAnimations();
    });
  }
  applyRM();
  if(RM.addEventListener) RM.addEventListener('change',applyRM);

  initScrollLinked();
  window.addEventListener('resize',function(){ sizeFx(); if(LBL1)LBL1.now(); if(LBL2)LBL2.now(); });
  window.addEventListener('orientationchange',sizeFx);

  /* GPS→ちず の 接続。地図の 作りなおしは 間引かれた ペースで rebuildMaps() から 呼ばれる */
  startLiveTracking(function(){
    rebuildMaps();
    if(el('scr2').classList.contains('on')) renderSheet();
  });

  /* --- 機械検算の 口（QA が 画面から 数を 読む ため） --- */
  window.__labelAudit=function(){
    return {map:(LBL1?LBL1.stat():null), spot:(LBL2?LBL2.stat():null),
            area:curArea, day:curDay};
  };
  window.__setArea=function(a){ setArea(a); };
  window.__go=function(n){ go(n); };
  window.__zoom=function(which,k){ (which===1?V1:V2).zoom(k); };
  window.__fit=function(which){ (which===1?V1:V2).fit(false); };
  window.__pan=function(which,dx,dy){ (which===1?V1:V2).pan(dx,dy); };
  window.__relayout=function(){ if(LBL1)LBL1.now(); if(LBL2)LBL2.now(); };

  /* 段0: check.py（_design/mockup_A/_check/check.py）を新構成へ向け直すための窓口。
     元のモックアップはグローバル関数（curDay/buildBar/...）を直接 evaluate していたが、
     ESモジュール化で window に居ないため、既存の __xxx 窓口にならい __test に束ねて出す。
     挙動は変えず、検算のためだけの追加口（AC-GOAL-2 の確認手段そのもの）。 */
  window.__test = {
    el: el,
    get curDay(){ return curDay; }, buildBar: buildBar, applyFilter: applyFilter, setCurDay: setCurDay,
    AREAS: AREAS, get curSpot(){ return curSpot; }, setCurSpot: setCurSpot,
    renderSheet: renderSheet, snap: snap,
    showState: showState, hideState: hideState, showReward: showReward,
    confetti: confetti, get partsLen(){ return partsLen(); },
    get curPage(){ return curPage; }, setCurPage: setCurPage,
    renderBook: renderBook,
  };
}

el('bootCat').innerHTML=catBlock('cat-guide',132);
el('bootCatNote').textContent=CAT_PROV;
el('bootTotalNum').textContent=total();
el('rewardTotalNum').textContent=total();

el('bootGo').addEventListener('click',function(){
  unlockAudio();
  el('boot').classList.add('off');
  gateThenEnter(function(){
    el('app').setAttribute('aria-hidden','false');
    boot();
  });
});

/* F-47：旅行後に端末の記録（押したスタンプ・写真）を1つのファイルにして書き出す */
el('btnExport').addEventListener('click',async function(){
  try{
    var data=await exportAll();
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url; a.download=exportFileName();
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); },2000);
    toast('きろくを ほぞんしました');
  }catch(e){
    toast('ほぞんできませんでした');
  }
});
el('btnPasscode').addEventListener('click',openPasscodeSettings);

window.addEventListener('load',function(){
  var d=document.documentElement;
  if(d.scrollWidth>d.clientWidth) console.warn('よこスクロールが 出ています',d.scrollWidth,d.clientWidth);
  /* オフライン対応（段4）。本体と絵を 先に キャッシュする */
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./sw.js').catch(function(e){
      console.warn('Service Worker の とうろくに しっぱいしました',e);
    });
  }
});

