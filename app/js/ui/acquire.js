"use strict";
import { el } from '../util.js';
import { got, GOT, findStamp } from '../data/stamps.js';
import { thud, chime } from '../fx/sound.js';
import { buzz } from '../fx/stampanim.js';
import { toast } from './toast.js';
import { confetti } from '../fx/confetti.js';
import { go } from './screens.js';
import { renderSheet } from './sheet.js';
import { renderBook, gotoPageOf, showReward } from './book.js';
import { buildAreaBar } from './sheet.js';
import { rebuildMaps } from '../boot.js';
import { count, total } from '../data/stamps.js';
import { pressStamp, removeStamp } from '../core/store.js';
import { getPersonId } from '../core/person.js';
import { catBlock } from './cat.js';

var cheerT=0;
function cheer(){
  var box=el('catCheer'); if(!box) return;
  box.innerHTML=catBlock('cat-cheer',176);
  clearTimeout(cheerT);
  requestAnimationFrame(function(){ box.classList.add('on'); });
  cheerT=setTimeout(function(){ box.classList.remove('on'); },1200);
}

export async function acquire(k){
  if(!k||got(k)) return;
  /* F-23：まず 端末（IndexedDB）に 書く。書けなかったら 押した ことに しない
     （容量が 尽きた ときに 黙って 成功と 返さない ＝ store.js の やくそく） */
  var w;
  try{
    w = await pressStamp({ personId: getPersonId(), stampId: k });
  }catch(e){
    toast('おせませんでした（きろくの ようりょうが いっぱいです）');
    return;
  }
  if(w.status==='failed'){
    toast('おせませんでした（きろくの ようりょうが いっぱいです）');
    return;
  }
  GOT[k]=1;
  var st=findStamp(k);
  thud(); setTimeout(chime,90); buzz([20,40,30]);
  toast('🎉 「'+(st?st.n:'スタンプ')+'」 ゲット！');
  confetti(50);
  cheer();
  go(3);
  renderSheet(); renderBook(); buildAreaBar();
  rebuildMaps();
  gotoPageOf(k);
  requestAnimationFrame(function(){
    var c=el('pages').querySelector('.slot[data-k="'+k+'"]');
    if(c) c.classList.add('pop');
    if(count()===total()) setTimeout(showReward,900);
  });
}
/* B-2：おした スタンプを もう いちど タップ → 事後確認 → けす
   （押す ときは 事前確認なし・けす ときだけ 聞く、が Sir の 意図） */
export async function removeStampUI(k){
  if(!k || !got(k)) return;
  if(!window.confirm('この スタンプを けしますか？')) return;
  try{
    await removeStamp(getPersonId(), k);
  }catch(e){
    toast('けせませんでした');
    return;
  }
  delete GOT[k];
  renderSheet(); renderBook(); buildAreaBar();
  rebuildMaps();
}
