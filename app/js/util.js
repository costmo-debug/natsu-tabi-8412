"use strict";
export var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
export function el(id){return document.getElementById(id);}
export function esc(s){return String(s).replace(/[&<>"]/g,function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

/* ---------- 1. データ ---------- */
