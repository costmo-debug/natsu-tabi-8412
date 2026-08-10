"use strict";
/* 1台＝1人分の記録（F-46 廃止・Sir 指示 2026-08-10）。
   端末ごとに1つだけ personId を作って localStorage に置き、以後はそれを使い続ける。 */
var LS_KEY = 'tabi.personId';
export function getPersonId(){
  try{
    var id=localStorage.getItem(LS_KEY);
    if(!id){
      id = (self.crypto && self.crypto.randomUUID) ? self.crypto.randomUUID()
         : 'p-'+Date.now()+'-'+Math.random().toString(16).slice(2);
      localStorage.setItem(LS_KEY,id);
    }
    return id;
  }catch(e){ return 'p-fallback'; }
}
