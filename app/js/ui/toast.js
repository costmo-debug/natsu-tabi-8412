"use strict";
import { el } from '../util.js';
import { nowText } from '../geo/live.js';
export var toastT=0, nowT=0;
/* ちず画面（scr1）では くろい おび を 出さず、下カードの 1行目 に 出す。
   下パネル＋くろい おび＋タブバー の 3だん重ね を なくす ため（下の 情報 は 1つ だけ） */
export function toast(msg){
  var onMap = el('scr1') && el('scr1').classList.contains('on');
  if(onMap && el('nowtx')){
    el('nowtx').textContent=msg;
    el('nowline').classList.add('hot');
    clearTimeout(nowT);
    nowT=setTimeout(function(){
      el('nowtx').textContent=nowText(); el('nowline').classList.remove('hot');
    },2500);
    return;
  }
  var t=el('toast'); t.textContent=msg; t.classList.add('on');
  clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove('on');},2500);
}
/* 触覚は Android のみの上乗せ。iOS は分岐に入らないのでエラーも待ち時間も出ない */
