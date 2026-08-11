"use strict";
import { esc } from '../util.js';
export var STAMPS = [
 {k:'k1',e:'🍰',n:'ケーキ',            pl:'大丸京都店',            pk:'だいまる きょうとてん',d:'8/12',t:'14:30',day:'d12',g:'きょうと',ind:1,
   z:[[35.004372,135.761899,250,'大丸京都店']]},
 {k:'k2',e:'🏮',n:'やど',              pl:'さと茂旅館',            pk:'さともりょかん',       d:'8/12',t:'16:00',day:'d12',g:'きょうと',ind:0,
   z:[[34.987750,135.758112,300,'さと茂旅館']]},
 {k:'k3',e:'🍛',n:'カレーうどん',      pl:'味味香 京都ポルタ店',   pk:'みみこう きょうとポルタてん',d:'8/12',t:'16:40',day:'d12',g:'きょうと',ind:1,
   z:[[34.986111,135.758611,250,'京都ポルタ']]},
 {k:'k4',e:'🐬',n:'よるの すいぞくかん',pl:'京都水族館',           pk:'きょうと すいぞくかん',d:'8/12',t:'18:00',day:'d12',g:'きょうと',ind:1,
   z:[[34.987554,135.747878,250,'京都水族館']]},
 {k:'y1',e:'♨️',n:'おんせん',          pl:'湯原温泉 菊之湯',       pk:'ゆばらおんせん きくのゆ',d:'8/13',t:'14:40',day:'d13',g:'ゆばら・びせい',ind:0,
   z:[[35.203193,133.731084,300,'菊之湯']]},
 {k:'y2',e:'🌉',n:'よりそいばし',      pl:'寄りそい橋（湯原温泉）',pk:'よりそいばし',         d:'8/13',t:'15:20',day:'d13',g:'ゆばら・びせい',ind:0,
   z:[[35.205344,133.732586,250,'寄りそい橋']]},
 {k:'y3',e:'🎨',n:'ミュージアム',      pl:'湯原温泉ミュージアム',  pk:'ゆばらおんせん ミュージアム',d:'8/13',t:'15:40',day:'d13',g:'ゆばら・びせい',ind:1,
   z:[[35.201173,133.732378,200,'湯原温泉ミュージアム']]},
 {k:'y4',e:'☄️',n:'てんもんだい',      pl:'美星天文台',            pk:'びせい てんもんだい',  d:'8/13',t:'20:45',day:'d13',g:'ゆばら・びせい',ind:0,
   z:[[34.672032,133.545392,200,'美星天文台']]},
 {k:'i1',e:'🍜',n:'いずもそば',        pl:'そば処 八雲 本店',      pk:'そばどころ やくも ほんてん',d:'8/14',t:'11:30',day:'d14',g:'いずも',ind:0,
   z:[[35.399793,132.683002,200,'八雲 本店']]},
 {k:'i2',e:'⛩️',n:'かぐらでん',        pl:'出雲大社 神楽殿',       pk:'いずもたいしゃ かぐらでん',d:'8/14',t:'12:25',day:'d14',g:'いずも',ind:0,
   z:[[35.401500,132.684427,150,'神楽殿']]},
 {k:'i3',e:'🙏',n:'ごほんでん',        pl:'出雲大社 御本殿',       pk:'いずもたいしゃ ごほんでん',d:'8/14',t:'12:45',day:'d14',g:'いずも',ind:0,
   z:[[35.401995,132.685459,150,'御本殿']]},
 {k:'i4',e:'⛩️',n:'おおとりい',        pl:'出雲大社 大鳥居',       pk:'いずもたいしゃ おおとりい',d:'8/14',t:'13:20',day:'d14',g:'いずも',ind:0,
   z:[[35.396714,132.686364,200,'勢溜の大鳥居','せいだまり'],
      [35.391566,132.687287,200,'宇迦橋の大鳥居','うかばし']]},
 {k:'f1',e:'🔥',n:'バーベキュー',      pl:'フォレストリア用瀬',    pk:'フォレストリア もちがせ',d:'8/14',t:'18:30',day:'d14',g:'もちがせ',ind:0,
   z:[[35.298887,134.237375,200,'フォレストリア用瀬']]},
 {k:'f2',e:'🎆',n:'はなび',            pl:'フォレストリア用瀬',    pk:'フォレストリア もちがせ',d:'8/14',t:'21:00',day:'d14',g:'もちがせ',ind:0,
   z:[[35.298887,134.237375,200,'フォレストリア用瀬']]},
 {k:'f3',e:'✨',n:'ほしぞら',          pl:'フォレストリア用瀬',    pk:'フォレストリア もちがせ',d:'8/14',t:'21:30',day:'d14',g:'もちがせ',ind:0,
   z:[[35.298887,134.237375,200,'フォレストリア用瀬']]},
 {k:'f4',e:'💧',n:'かわあそび',        pl:'赤波川の川あそび場所',  pk:'あかなみがわ の かわあそびばしょ',d:'8/15',t:'8:00', day:'d15',g:'もちがせ',ind:0,
   z:[]},
 {k:'h1',e:'🍽',n:'おひるごはん',      pl:'千姫茶屋',              pk:'せんひめぢゃや',       d:'8/15',t:'11:05',day:'d15',g:'ひめじ',ind:0,
   z:[[34.833689,134.693940,250,'千姫茶屋']]},
 {k:'h2',e:'🏯',n:'ひめじじょう',      pl:'姫路城',                pk:'ひめじじょう',         d:'8/15',t:'12:20',day:'d15',g:'ひめじ',ind:1,
   z:[[34.839331,134.694020,300,'姫路城 大天守']]},
 {k:'h3',e:'🐟',n:'すいぞくかん',      pl:'姫路市立水族館',        pk:'ひめじしりつ すいぞくかん',d:'8/15',t:'14:45',day:'d15',g:'ひめじ',ind:1,
   z:[[34.822656,134.676338,200,'姫路市立水族館']]},
 {k:'h4',e:'🥩',n:'わぎゅう',          pl:'えん家 太子店',         pk:'えんや たいしてん',    d:'8/15',t:'17:00',day:'d15',g:'ひめじ',ind:0,
   z:[[34.833994,134.586333,200,'えん家 太子店']]}
];
/* SA も おなじ もちかた。上り／下り は 絵がら も 時こく も ちがう ので 別の スタンプ の まま。
   まとめたい ときは z に 2つ 入れれば 1スタンプ2円 に できる（データの かたちは そろえた） */
export var SAS = [
 {k:'sa1',e:'📄',n:'すいたSA（のぼり）',    pl:'吹田SA（上り）',    pk:'すいたSA のぼり',    sub:'8/12 10:10〜10:35・めいしん',            p:'ピカチュウ ／ ルギア',     d:'8/12',day:'d12',
   z:[[34.783084,135.526675,150,'吹田SA（上り）']]},
 {k:'sa2',e:'⚡',n:'たからづかきたSA',      pl:'宝塚北SA',          pk:'たからづかきたSA',   sub:'8/13 10:10〜10:35・しんめいしん',        p:'ピカチュウ ／ ゼルネアス', d:'8/13',day:'d13',
   z:[[34.866531,135.303764,200,'宝塚北SA']]},
 {k:'sa3',e:'🍽',n:'かさいSA（くだり）',    pl:'加西SA（下り）',    pk:'かさいSA くだり',    sub:'8/13 11:25〜12:25・ちゅうごくどう／おひる',p:'ミズゴロウ ／ ジュペッタ',d:'8/13',day:'d13',
   z:[[34.946087,134.799143,150,'加西SA（下り）']]},
 {k:'sa4',e:'⛽',n:'しょうおうSA（くだり）',pl:'勝央SA（下り）',    pk:'しょうおうSA くだり',sub:'8/13 13:30〜13:45・ちゅうごくどう',      p:'クワッス ／ チョロネコ',   d:'8/13',day:'d13',
   z:[[35.043418,134.106264,150,'勝央SA（下り）']]},
 {k:'sa5',e:'☄️',n:'たかはしSA【のぼり】',  pl:'高梁SA（上り）',    pk:'たかはしSA のぼり',  sub:'8/13 19:20ごろ・びせいへの いき',        p:'クワッス ／ オクタン',     d:'8/13',day:'d13',
   z:[[34.873454,133.661374,150,'高梁SA（上り）']]},
 {k:'sa6',e:'🌙',n:'たかはしSA【くだり】',  pl:'高梁SA（下り）',    pk:'たかはしSA くだり',  sub:'8/13 22:00〜22:10・びせいからの かえり', p:'ワニノコ ／ イエッサン',   d:'8/13',day:'d13',
   z:[[34.878932,133.661816,150,'高梁SA（下り）']]},
 {k:'sa7',e:'🐄',n:'ひるぜんこうげんSA',    pl:'蒜山高原SA（下り）',pk:'ひるぜんこうげんSA くだり',sub:'8/14 08:50〜09:10・よなごどう',    p:'ミズゴロウ ／ エルレイド', d:'8/14',day:'d14',
   z:[[35.271023,133.629485,150,'蒜山高原SA（下り）']]},
 {k:'sa8',e:'🍚',n:'かさいSA（のぼり）',    pl:'加西SA（上り）',    pk:'かさいSA のぼり',    sub:'8/15 19:25〜19:40・ちゅうごくどう',      p:'メッソン ／ マニューラ',   d:'8/15',day:'d15',
   z:[[34.948144,134.802390,150,'加西SA（上り）']]},
 {k:'sa9',e:'🏁',n:'なじおSA（のぼり）',    pl:'西宮名塩SA（上り）',pk:'にしのみやなじおSA のぼり',sub:'8/15 20:20〜20:35・ちゅうごくどう',p:'アシマリ ／ ロトム',       d:'8/15',day:'d15',
   z:[[34.828805,135.295702,150,'西宮名塩SA（上り）']]}
];

/* 段6是正：ここは モックアップの ころの 見本データ（さいしょから 15こ おした ことに する）
   が 残って いた。きどうの たびに これが 復活して しまい、「けした スタンプが もどる」
   ふしぎな げんしょうの 正体だった（Sir 実証・2026-08-11）。ほんばんは 空っぽ から はじめる */
export var GOT = {};
/* 段6是正・つづき：PUSHABLE も 同じしゅるいの 見本データ（'i2'＝かぐらでん 決め打ち）が
   残っていた。GPS判定（geo/live.js）が 動くまでの あいだ、近くに いなくても 金枠が
   出てしまう げんいんだった。ほんばんは "何も おせない" を あらわす null から はじめる */
export var PUSHABLE = null;
export function got(k){return !!GOT[k];}
export function total(){return STAMPS.length + SAS.length;}
export function count(){var n=0;STAMPS.concat(SAS).forEach(function(s){if(got(s.k))n++;});return n;}
export function findStamp(k){var a=STAMPS.concat(SAS);
  for(var i=0;i<a.length;i++){if(a[i].k===k)return a[i];} return null;}

/* --- F-54 はんてい円 を あつかう ---------------------------------------- */
export function zones(k){ var s=findStamp(k); return (s&&s.z)?s.z:[]; }
/* いま いるところ。GPS が とれるまでは デモの ちてん（8/14 12:25 出雲大社 神楽殿）のまま */
export var ME=[35.401500,132.684427];
export function setME(latlon){ if(latlon && typeof latlon[0]==='number' && typeof latlon[1]==='number') ME=latlon; }
export var MPD_LAT=110574;
export function mpdLon(lat){ return 111320*Math.cos(lat*Math.PI/180); }
export function metersBetween(a,b){
  var dN=(b[0]-a[0])*MPD_LAT, dE=(b[1]-a[1])*mpdLon((a[0]+b[0])/2);
  return Math.sqrt(dN*dN+dE*dE);
}
/* いちばん 近い はんてい円 までの きょり。円が 無い ものは null */
export function distTo(k){
  var zs=zones(k); if(!zs.length) return null;
  var best=Infinity;
  zs.forEach(function(z){ best=Math.min(best, metersBetween(ME,[z[0],z[1]])); });
  return best;
}
export function distText(k){
  var d=distTo(k);
  if(d===null) return 'まだ きまっていません';
  if(d<10) return '0 m（いま ここ）';
  if(d<1000) return Math.round(d/10)*10+' m';
  return (d/1000).toFixed(d<10000?1:0)+' km';
}
export function zoneText(k){
  var zs=zones(k);
  if(!zs.length) return 'まだ きまっていません';
  if(zs.length===1) return zs[0][2]+' m';
  return zs.map(function(z){return z[2]+' m';}).join(' ／ ')+'（'+zs.length+'かしょ どちらでも）';
}
export function llText(k){
  var zs=zones(k);
  if(!zs.length) return 'まだ きまっていません';
  return zs.map(function(z){return z[0].toFixed(6)+', '+z[1].toFixed(6);}).join('<br>');
}
/* 漢字に ふりがな を つける（小学2年までの 240字 いがい は すべて つける きまり） */
/* 段5：ふりがな を 独立した 上の行に 置く（<ruby> は やめた。§12-2 の 字ちらしが 根本から 消える） */
export function rb(txt,kana){
  return '<span class="rbwrap"><span class="rbkana">'+esc(kana)+'</span>'
       + '<span class="rbtxt">'+esc(txt)+'</span></span>';
}
export function plRuby(k){ var s=findStamp(k); return s? rb(s.pl,s.pk) : ''; }

/* --- ねこの さしこみ口（ここ1か所） ------------------------------------- */
/* とどいていない すがた は cat-guide に おちる */

export function setPushable(k){ PUSHABLE = k; }

/* 「いまは 近づいて なくても おせる」モード。せってい画面で 切りかえる（でんぱが なくても てで おす、の 置きかえ） */
export var MANUAL_MODE = false;
export function getManualMode(){ return MANUAL_MODE; }
export function setManualMode(v){ MANUAL_MODE = !!v; }

/* --- F-20・F-44・F-54・F-55 いまの いちから おせる 1か所を きめる ------ */
/* いちばん 近い はんてい円の 中に 入っている スタンプを 1つだけ 返す（無ければ null）。
   1つの スタンプが 複数の円を もつ ときは、いちばん 近い円 までの きょりで くらべる（F-54-3）。 */
export function nearestPushable(latlon){
  if(!latlon) return null;
  var best=null, bestD=Infinity;
  STAMPS.concat(SAS).forEach(function(s){
    if(got(s.k)) return;
    var zs=zones(s.k); if(!zs.length) return;      /* F-55: 円が無い地点は対象外（手おしのみ） */
    zs.forEach(function(z){
      var d=metersBetween(latlon,[z[0],z[1]]);
      if(d<=z[2] && d<bestD){ bestD=d; best=s.k; }
    });
  });
  return best;
}
/* きどう時に IndexedDB から 読みこんだ 記録を GOT へ 反映する */
export function applyGotRecords(records){
  (records||[]).forEach(function(r){ if(r && r.stampId) GOT[r.stampId]=1; });
}
