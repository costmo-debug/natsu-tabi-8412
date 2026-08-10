"use strict";
import { el } from '../util.js';
import { esc } from '../util.js';
import { got, count, total, findStamp, PUSHABLE, EMPTY_DEMO } from '../data/stamps.js';
import { acquire, replay } from './acquire.js';
import { catId, catBlock, CAT_PROV } from './cat.js';
import { stampArtSrc, hasStampArt } from '../data/stampArt.js';
import { confetti } from '../fx/confetti.js';
import { chime } from '../fx/sound.js';
import { RM } from '../util.js';
export var PAGES = [
  {t:'きょうと',        sub:'8がつ12にち（すい）',        ks:['k1','k2','k3','k4']},
  {t:'ゆばら・びせい',  sub:'8がつ13にち（もく）',        ks:['y1','y2','y3','y4']},
  {t:'いずも',          sub:'8がつ14にち（きん）',        ks:['i1','i2','i3','i4']},
  {t:'もちがせ',        sub:'8がつ14にち よる 〜 15にち あさ', ks:['f1','f2','f3','f4']},
  {t:'ひめじ',          sub:'8がつ15にち（ど）',          ks:['h1','h2','h3','h4']},
  {t:'サービスエリア ①',sub:'すいた・たからづかきた・かさい・しょうおう', ks:['sa1','sa2','sa3','sa4']},
  {t:'サービスエリア ②',sub:'たかはし のぼり／くだり・ひるぜん・かさい・なじお',   ks:['sa5','sa6','sa7','sa8','sa9']}
];
export var ROT=[-5,4,-3,6,-6,3,-4,5];
export var curPage=0;

export function slotHTML(k,idx){
  var st=findStamp(k), g=got(k), now=(k===PUSHABLE && !g);
  var cls='slot'+(g?' got':'')+(now?' now':'');
  var rot=ROT[idx%ROT.length];
  var tag=now?'button':'div';
  return '<'+tag+' class="'+cls+'" data-k="'+k+'"'+(now?' data-push="1"':'')
       + ' style="--rot:'+(g?rot:0)+'deg">'
       + (g?'<span class="ink"></span><span class="ink2"></span>':'')
       + '<span class="en">'+(hasStampArt(k)
           ? '<img src="'+stampArtSrc(k)+'" alt="'+esc(st.n)+'" loading="lazy">'
           : '<span class="enph" aria-hidden="true">？</span>')+'</span>'
       + '<span class="sn">'+esc(st.n)+'</span>'
       + '<span class="sd">'+esc(st.d==='まえ'?'りょこうまえ':st.d+' '+(st.t||''))+'</span>'
       + '</'+tag+'>';
}
export function renderBook(){
  var n=count(), tt=total(), c=2*Math.PI*40;
  el('ringNum').textContent=n;
  el('ringTotalNum').textContent=tt;
  el('ringArc').setAttribute('stroke-dasharray',(c*n/tt).toFixed(1)+' '+c.toFixed(1));
  el('bookLead').textContent = n===0
    ? 'まだ 1こも ありません。さいしょは 8/12 の すいたSA です。'
    : (n===tt ? 'ぜんぶ あつまりました！' : 'のこり '+(tt-n)+'こ。');
  el('pbar1').style.width=(n/tt*100).toFixed(1)+'%';
  el('pnum1').textContent=n+' / '+tt;

  var h=[];
  PAGES.forEach(function(pg,pi){
    var done=pg.ks.filter(function(k){return got(k);}).length;
    h.push('<div class="page" data-p="'+pi+'"><div class="paper">');
    if(n===0 && pi===0){
      h.push('<div class="note" style="margin:0 0 16px;text-align:center">'
           + '<b style="display:block;font-size:16px;margin-bottom:4px">スタンプは まだ 0こ です</b>'
           + '8がつ12にち 10:10 の すいたSA（のぼり）で だいしを もらう ところから はじまります。</div>');
    }
    if(pg.ks.indexOf(PUSHABLE)>=0 && !got(PUSHABLE) && !EMPTY_DEMO){
      var ps=findStamp(PUSHABLE);
      h.push('<button class="bigbtn" data-push="1" data-k="'+PUSHABLE+'">'
           + ps.e+' いま 「'+esc(ps.n)+'」が おせます</button>');
    }
    h.push('<h3>'+esc(pg.t)+'　<span style="color:var(--pop)">'+done+'／'+pg.ks.length+'</span></h3>');
    h.push('<p>'+esc(pg.sub)+'</p>');
    h.push('<div class="slots">');
    pg.ks.forEach(function(k,ki){ h.push(slotHTML(k,pi*3+ki)); });
    h.push('</div>');
    if(pi===PAGES.length-1){
      h.push('<button class="subbtn" id="rewardBtn" style="margin-top:16px">ごほうびの え を みる（デモ）</button>');
      h.push('<button class="subbtn" id="replayBtn">もういちど えんしゅつ を みる</button>');
    }
    h.push('</div></div>');
  });
  el('pages').innerHTML=h.join('');
  el('pdots').innerHTML=PAGES.map(function(p,i){
    return '<span class="pdot'+(i===curPage?' on':'')+'"></span>';
  }).join('')+'<span class="pnum" id="pnum">'+(curPage+1)+' / '+PAGES.length+'</span>';

  Array.prototype.forEach.call(el('pages').querySelectorAll('[data-push]'),function(b){
    b.addEventListener('click',function(){ acquire(b.getAttribute('data-k')); });
  });
  var rb=el('rewardBtn'); if(rb) rb.addEventListener('click',showReward);
  var pb=el('replayBtn'); if(pb) pb.addEventListener('click',replay);
  el('pages').scrollLeft = curPage * el('pages').clientWidth;
}
export function initPages(){
  var p=el('pages');
  p.addEventListener('scroll',function(){
    var w=p.clientWidth||1, i=Math.round(p.scrollLeft/w);
    if(i!==curPage){
      curPage=Math.max(0,Math.min(PAGES.length-1,i));
      Array.prototype.forEach.call(el('pdots').querySelectorAll('.pdot'),function(d,j){
        d.classList.toggle('on', j===curPage);
      });
      var pn=el('pnum'); if(pn) pn.textContent=(curPage+1)+' / '+PAGES.length;
    }
  });
}
export function gotoPageOf(k){
  for(var i=0;i<PAGES.length;i++){ if(PAGES[i].ks.indexOf(k)>=0){ curPage=i; break; } }
  var p=el('pages');
  p.scrollTo({left:curPage*p.clientWidth, behavior:RM.matches?'auto':'smooth'});
  Array.prototype.forEach.call(el('pdots').querySelectorAll('.pdot'),function(d,j){
    d.classList.toggle('on', j===curPage); });
  var pn=el('pnum'); if(pn) pn.textContent=(curPage+1)+' / '+PAGES.length;
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
  var ok = window.CSS && CSS.supports && CSS.supports('animation-timeline','view()');
  if(!ok || RM.matches) return;
  var st=document.createElement('style');
  st.textContent='.paper{animation:paperIn 300ms cubic-bezier(0.05,0.7,0.1,1) both;'
    + 'animation-timeline:view();animation-range:entry 0% entry 60%}'
    + '@keyframes paperIn{from{opacity:.35;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(st);
}

/* ---------- 16. きどう ---------- */

export function setCurPage(i){ curPage=i; renderBook(); }
