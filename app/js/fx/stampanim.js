"use strict";
export function buzz(ms){
  if(typeof navigator!=='undefined' && 'vibrate' in navigator){
    try{navigator.vibrate(ms);}catch(e){}
  }
}
