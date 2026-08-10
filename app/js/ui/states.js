"use strict";
import { el, browserName } from '../util.js';
import { catBlock, CAT_PROV } from './cat.js';
export var ICONS={
  load:'<div class="spin"></div>',
  gpsfail:'<div class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="M12 8v4.6M12 16h.01"/></svg></div>',
  denied:'<div class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.4"/><path d="m6.6 6.6 10.8 10.8"/></svg></div>',
  empty:'<div class="ic"><svg viewBox="0 0 24 24"><rect x="4.4" y="4.4" width="15.2" height="15.2" rx="3.2"/><path d="M8.6 12h6.8"/></svg></div>',
  offline:'<div class="ic"><svg viewBox="0 0 24 24"><path d="M2.6 8.6a16 16 0 0 1 18.8 0M6 12.2a11 11 0 0 1 12 0M9.4 15.8a6 6 0 0 1 5.2 0"/><path d="M12 19.4h.01"/><path d="m3.6 3.6 16.8 16.8"/></svg></div>'
};
export var STATES={
  load:{t:'ちずを よみこんでいます',m:'あと すこし まってください。よみこみが おわると、いま いるところ が ちずに 出ます。',a:'とじる'},
  gpsfail:{t:'いま いるところ が わかりません',m:'そらが 見えない ところに いるため、ばしょが とれませんでした。そとに 出るか、「てで おす」ボタンで じぶんで おしてください。',a:'てで おす'},
  denied:{t:'いちじょうほう が ことわられています',m:'この たんまつ で いちじょうほう が「きょかしない」に なっています。iPhoneの「せってい」アプリ → {{browser}} → いちじょうほう を「アプリの しよう中は きょか」に かえてから、この がめんに もどって「とじる」を おしてください（ブラウザの なかの せっていでは ありません）。',a:'とじる'},
  empty:{t:'スタンプは まだ 0こ です',m:'8がつ12にち 10:10 の すいたSA（のぼり）で だいしを もらう ところから はじまります。',a:'スタンプちょう を ひらく'},
  offline:{t:'いま つながっていません',m:'おした スタンプは この たんまつ に ちゃんと のこって います。でんぱが もどったら じどうで おくります。',a:'わかった'}
};
/* どの すがたの ねこを 出すか。とどいて いなければ cat-guide に おちる */
export var STATE_CAT={gpsfail:'cat-trouble', denied:'cat-trouble', offline:'cat-trouble',
               empty:'cat-sleep', load:''};
export function showState(kind){
  var s=STATES[kind]; if(!s) return;
  var pose=STATE_CAT[kind];
  el('stIcon').innerHTML = pose
    ? '<div class="catbox">'+catBlock(pose,132)+'<span class="mk">'+ICONS[kind]
        .replace('<div class="ic">','').replace('</div>','')+'</span></div>'
    : ICONS[kind];
  el('stCatNote').textContent = pose ? CAT_PROV : '';
  el('stTtl').textContent=s.t;
  el('stMsg').textContent=s.m.replace('{{browser}}', browserName());
  el('stAct').textContent=s.a;
  el('state').classList.toggle('bad', kind==='gpsfail'||kind==='denied');
  el('state').classList.add('on');
}
export function hideState(){ el('state').classList.remove('on'); }

/* ---------- 13. がめんの きりかえ ---------- */
