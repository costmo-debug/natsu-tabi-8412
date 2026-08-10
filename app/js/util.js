"use strict";
export var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
export function el(id){return document.getElementById(id);}
/* いま つかっている ブラウザの なまえ。いちじょうほうの きょかは ブラウザごとに
   せっていの ばしょが ちがう（iPhoneは アプリごとに べつ）ため、あんない文を
   出しわける ために つかう。 */
export function browserName(){
  var ua = navigator.userAgent || '';
  if (/CriOS/.test(ua)) return 'Chrome';
  if (/FxiOS/.test(ua)) return 'Firefox';
  if (/EdgiOS/.test(ua)) return 'Edge';
  if (/Chrome/.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Safari/.test(ua)) return 'Safari';
  return 'お使いの ブラウザ';
}
export function esc(s){return String(s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

/* ---------- 1. データ ---------- */
