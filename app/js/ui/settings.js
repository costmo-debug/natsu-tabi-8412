"use strict";
import { el, esc } from '../util.js';
import { got, findStamp } from '../data/stamps.js';
import { PAGES } from './book.js';
import { acquire } from './acquire.js';

export function renderLaterList(){
  var h=[], any=false;
  PAGES.forEach(function(pg){
    var ks=pg.ks.filter(function(k){ return !got(k); });
    if(!ks.length) return;
    any=true;
    h.push('<div style="margin:12px 0 4px;font-size:12px;font-weight:700;color:var(--ink3);padding:0 4px">'
         + esc(pg.t)+'</div>');
    ks.forEach(function(k){
      var st=findStamp(k);
      h.push('<button data-k="'+k+'">'+esc(st.n)
           + '<small>'+esc(st.pl||'')+(st.t?'　・　'+esc(st.d)+' '+esc(st.t):'　・　'+esc(st.d))+'</small></button>');
    });
  });
  if(!any) h.push('<p class="lead" style="margin-top:8px">ぜんぶ おしました。のこりは ありません。</p>');
  el('laterList').innerHTML=h.join('');
  Array.prototype.forEach.call(el('laterList').querySelectorAll('[data-k]'),function(b){
    b.addEventListener('click',function(){
      var k=b.getAttribute('data-k'), st=findStamp(k);
      if(!window.confirm('「'+(st?st.n:'スタンプ')+'」を おした ことに しますか？')) return;
      Promise.resolve(acquire(k)).then(function(){
        el('laterPicker').classList.remove('on');
      });
    });
  });
}
export function openLater(){
  renderLaterList();
  el('laterPicker').classList.add('on');
}
export function initSettings(){
  el('btnLater').addEventListener('click',openLater);
  el('laterClose').addEventListener('click',function(){ el('laterPicker').classList.remove('on'); });
  el('laterPicker').addEventListener('click',function(e){
    if(e.target===el('laterPicker')) el('laterPicker').classList.remove('on');
  });
}
