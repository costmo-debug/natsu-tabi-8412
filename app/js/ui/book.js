"use strict";
import { el } from '../util.js';
import { esc } from '../util.js';
import { got, count, total, findStamp, PUSHABLE, EMPTY_DEMO, getManualMode, distText } from '../data/stamps.js';
import { acquire, removeStampUI } from './acquire.js';
import { catId, catBlock, CAT_PROV } from './cat.js';
import { stampArtSrc, hasStampArt } from '../data/stampArt.js';
import { confetti } from '../fx/confetti.js';
import { chime } from '../fx/sound.js';
import { RM } from '../util.js';
export var PAGES = [
  {t:'きょうと',        sub:'8がつ12にち（すい）',        ks:['k1','k2','k3','k4'],        g:'kyoto'},
  {t:'ゆばら・びせい',  sub:'8がつ13にち（もく）',        ks:['y1','y2','y3','y4'],        g:'yubara'},
  {t:'いずも',          sub:'8がつ14にち（きん）',        ks:['i1','i2','i3','i4'],        g:'izumo'},
  {t:'もちがせ',        sub:'8がつ14にち よる 〜 15にち あさ', ks:['f1','f2','f3','f4'], g:'mochigase'},
  {t:'ひめじ',          sub:'8がつ15にち（ど）',          ks:['h1','h2','h3','h4'],        g:'himeji'},
  {t:'サービスエリア ①',sub:'すいた・たからづかきた・かさい・しょうおう', ks:['sa1','sa2','sa3','sa4'], g:'sa1'},
  {t:'サービスエリア ②',sub:'たかはし のぼり／くだり・ひるぜん・かさい・なじお',   ks:['sa5','sa6','sa7','sa8','sa9'], g:'sa2'}
];
export var GROUP_KEY_OF={};
PAGES.forEach(function(pg){ pg.ks.forEach(function(k){ GROUP_KEY_OF[k]=pg.g; }); });
export var ROT=[-5,4,-3,6,-6,3,-4,5];
export var curPage=0;

export function slotHTML(k){
  var st=findStamp(k), g=got(k), now=(!g && (getManualMode() || k===PUSHABLE));
  var gk=GROUP_KEY_OF[k]||'kyoto';
  var cls='slot g-'+gk+(g?' got':'')+(now?' now':'');
  var tag='button';
  return '<'+tag+' class="'+cls+'" data-k="'+k+'" data-open="1"'
       + ' style="--gc:var(--d'+GID(gk)+');--gcbg:var(--d'+GID(gk)+'bg)"'
       + ' aria-label="'+esc(st.n)+'（'+(g?'ゲットずみ':(now?'いま おせる':'まだ'))+'）">'
       + '<span class="en">'+(g&&hasStampArt(k)
           ? '<img src="'+stampArtSrc(k)+'" alt="'+esc(st.n)+'" loading="lazy">'
           : g
             ? '<span class="enph" aria-hidden="true">'+esc(st.e||'？')+'</span>'
             : '<span class="enph mystery" aria-hidden="true">？</span>')
           + (now?'<span class="shine" aria-hidden="true"></span>':'')+'</span>'
       + '<span class="nm">'+esc(st.n)+'</span>'
       + (g?'<span class="mk" aria-hidden="true">✓</span>':'')
       + '</'+tag+'>';
}
function GID(gk){
  return {kyoto:12,yubara:13,izumo:14,mochigase:15,himeji:16,sa1:17,sa2:18}[gk]||12;
}
export function renderBook(){
  var n=count(), tt=total(), c=2*Math.PI*40;
  el('ringNum').textContent=n;
  el('ringTotalNum').textContent=tt;
  el('ringArc').setAttribute('stroke-dasharray',(c*n/tt).toFixed(1)+' '+c.toFixed(1));
  el('bookLead').textContent = n===0
    ? 'まだ 1こも ありません。さいしょは 8/12 の すいたSA です。'
    : (n===tt ? 'ぜんぶ あつまりました！' : 'のこり '+(tt-n)+'こ。');

  var h=[];
  if(!EMPTY_DEMO && !got(PUSHABLE)){
    var ps=findStamp(PUSHABLE);
    if(ps){
      h.push('<div class="bignote"><button class="bigbtn" data-push="1" data-k="'+PUSHABLE+'">'
           + ps.e+' いま 「'+esc(ps.n)+'」が おせます</button></div>');
    }
  }
  var slotCount=0;
  PAGES.forEach(function(pg){
    pg.ks.forEach(function(k){ h.push(slotHTML(k)); slotCount++; });
  });
  /* 5れつの グリッドに あまりが 出る ぶんは、ねこの えで うめる（データに ひもづかない かざり） */
  var COLS=5, rest=slotCount%COLS;
  if(rest){
    var fillPoses=['cat-cheer','cat-guide','cat-travel'];
    for(var fi=0; fi<COLS-rest; fi++){
      h.push('<div class="slot fillcat" aria-hidden="true">'
           + catBlock(fillPoses[fi%fillPoses.length],64)+'</div>');
    }
  }
  el('pages').innerHTML=h.join('');

  Array.prototype.forEach.call(el('pages').querySelectorAll('[data-push]'),function(b){
    b.addEventListener('click',function(){ acquire(b.getAttribute('data-k')); });
  });
  Array.prototype.forEach.call(el('pages').querySelectorAll('[data-open]'),function(b){
    b.addEventListener('click',function(){ openStampModal(b.getAttribute('data-k')); });
  });
}
export function initPages(){}
export function gotoPageOf(k){
  var t=el('pages').querySelector('.slot[data-k="'+k+'"]');
  if(t) t.scrollIntoView({block:'center', behavior:RM.matches?'auto':'smooth'});
}

/* ---------- 9b. マスを タップ した ときの 拡大表示 ---------- */
export function openStampModal(k){
  var st=findStamp(k); if(!st) return;
  var g=got(k), now=(!g && (getManualMode() || k===PUSHABLE));
  var gk=GROUP_KEY_OF[k]||'kyoto';
  el('smArt').style.setProperty('--gc','var(--d'+GID(gk)+')');
  el('smArt').innerHTML=g&&hasStampArt(k)
    ? '<img src="'+stampArtSrc(k)+'" alt="'+esc(st.n)+'">'
    : g
      ? '<span aria-hidden="true">'+esc(st.e||'？')+'</span>'
      : '<span class="mystery" aria-hidden="true">？</span>';
  el('smName').textContent=st.n;
  el('smPlace').textContent='ばしょ：'+(st.pl||'');
  el('smWhen').textContent='よてい：'+st.d+' '+(st.t||'');

  var stEl=el('smState'), actEl=el('smAct');
  stEl.className='smState'; actEl.innerHTML='';
  if(g){
    stEl.classList.add('got');
    stEl.textContent='スタンプ ゲット ずみ';
    var rm=document.createElement('button');
    rm.className='doRemove'; rm.textContent='けす';
    rm.addEventListener('click',function(){ removeStampUI(k); closeStampModal(); });
    actEl.appendChild(rm);
  }else if(now){
    stEl.classList.add('now');
    stEl.textContent='いま おせます！';
    var ps=document.createElement('button');
    ps.className='doPush'; ps.textContent='おす';
    ps.addEventListener('click',function(){ acquire(k); closeStampModal(); });
    actEl.appendChild(ps);
  }else{
    stEl.textContent='ちかづくと おせます（いま '+distText(k)+'）';
  }
  el('stampModal').classList.add('on');
}
export function closeStampModal(){ el('stampModal').classList.remove('on'); }
export function initStampModal(){
  var m=el('stampModal'); if(!m) return;
  el('smClose').addEventListener('click',closeStampModal);
  m.addEventListener('click',function(e){ if(e.target===m) closeStampModal(); });
}

/* ---------- 10. スタンプを おした ときの えんしゅつ（はでに） ---------- */
export function showReward(){
  el('rewardArt').innerHTML =
    '<svg viewBox="0 0 240 190" width="240" height="190" aria-hidden="true">'
    + '<ellipse cx="120" cy="170" rx="78" ry="12" fill="#2f4a63" opacity=".14"/>'
    + '<g transform="translate(60,54)">'+'<use href="#'+catId('cat-trophy')+'" width="120" height="120"/>'+'</g>'
    + '<g transform="translate(120,52)"><path d="M-26 -18 h52 v14 a26 22 0 0 1 -52 0 Z" fill="#ffb400"/>'
    + '<path d="M-26 -14 h-12 a10 10 0 0 0 12 14 Z" fill="#e5a200"/>'
    + '<path d="M26 -14 h12 a10 10 0 0 1 -12 14 Z" fill="#e5a200"/>'
    + '<rect x="-5" y="4" width="10" height="12" fill="#e5a200"/>'
    + '<rect x="-16" y="16" width="32" height="7" rx="3" fill="#d1332e"/></g>'
    + '<g fill="#d1332e">'
    + '<circle cx="30" cy="34" r="7"/><circle cx="210" cy="34" r="7"/>'
    + '<circle cx="16" cy="88" r="5"/><circle cx="224" cy="88" r="5"/>'
    + '<circle cx="34" cy="132" r="6"/><circle cx="206" cy="132" r="6"/></g>'
    + '</svg>';
  el('rewardArt').insertAdjacentHTML('beforeend',
    '<div class="catprov">'+CAT_PROV+'</div>');
  el('reward').classList.add('on');
  confetti(50); chime();
}

/* ---------- 11. かみふぶき（Canvas・つぶ50こ／さいだい100こ） ---------- */
export function initScrollLinked(){
  /* 1がめん グリッドに なった ため、view() れんどう は もう つかわない */
}

/* ---------- 16. きどう ---------- */

export function setCurPage(i){ curPage=i; renderBook(); }
