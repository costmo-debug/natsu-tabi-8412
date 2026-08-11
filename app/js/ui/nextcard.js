"use strict";
/* nextcard.js — したの カード「こんやの とまり」を、実際の 日付と GPS の いちに
 * あわせて つくる（8/12〜8/15 の 4日ぶんの じっさいの データだけを つかう。
 * 8/15の夜は 自宅に かえる ため、ばしょを 出さない）。
 */
import { findStamp, distTo, rb } from '../data/stamps.js';
import { LIVE } from '../geo/state.js';
import { esc } from '../util.js';

var DAY_KEY = {12:'k2', 13:'y1', 14:'f1'};

function tripDayInfo(now){
  var y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  if (y === 2026 && m === 8 && DAY_KEY[d]) return { kind: 'stamp', key: DAY_KEY[d] };
  if (y === 2026 && m === 8 && d === 15) return { kind: 'home' };
  return { kind: 'out' };
}

function farText(meters){
  if (meters < 10) return '0 m さき';
  if (meters < 1000) return Math.round(meters / 10) * 10 + ' m さき';
  return (meters / 1000).toFixed(meters < 10000 ? 1 : 0) + ' km さき';
}

export function initNextCard(){
  var card=document.getElementById('nextcard'), grip=document.getElementById('ncgrip');
  if(!card||!grip) return;
  var dragging=false, y0=0, moved=false;
  grip.addEventListener('pointerdown',function(e){
    dragging=true; moved=false; y0=e.clientY;
    if(grip.setPointerCapture) grip.setPointerCapture(e.pointerId);
  });
  grip.addEventListener('pointermove',function(e){
    if(!dragging) return;
    if(Math.abs(e.clientY-y0)>6) moved=true;
  });
  function up(e){
    if(!dragging) return; dragging=false;
    if(!moved){ card.classList.toggle('expanded'); return; }
    var dy=e.clientY-y0;
    if(dy<-6) card.classList.add('expanded');
    else if(dy>6) card.classList.remove('expanded');
  }
  grip.addEventListener('pointerup',up);
  grip.addEventListener('pointercancel',up);
  grip.addEventListener('keydown',function(e){
    if(e.key==='Enter'||e.key===' '){ e.preventDefault(); card.classList.toggle('expanded'); }
  });
}
export function renderNextCard(now){
  now = now || new Date();
  var info = tripDayInfo(now);
  var card = document.getElementById('nextcard');
  if (!card) return;
  var ntx = card.querySelector('.ntx');
  var nm = card.querySelector('.nm');
  if (!ntx || !nm) return;

  if (info.kind === 'stamp') {
    var s = findStamp(info.key);
    ntx.innerHTML = '<span class="k">こんやの とまり</span><span class="v">' + rb(s.pl, s.pk) + '</span>';
    var distStr;
    if (!LIVE.have) {
      distStr = 'まだ いちじょうほう が ありません';
    } else {
      var d = distTo(info.key);
      distStr = (d === null) ? 'まだ いちじょうほう が ありません' : farText(d);
    }
    nm.innerHTML = '<b>' + esc(s.t) + '</b><span>' + esc(distStr) + '</span>';
  } else if (info.kind === 'home') {
    ntx.innerHTML = '<span class="k">こんやは</span><span class="v">おうちに かえります</span>';
    nm.innerHTML = '';
  } else {
    ntx.innerHTML = '<span class="k">りょこうは</span><span class="v">8がつ12にちから です</span>';
    nm.innerHTML = '';
  }
}
