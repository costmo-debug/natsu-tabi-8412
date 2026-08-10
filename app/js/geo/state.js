"use strict";
/* いま の いちじょうほう を 1か所に まとめる（feedback_state_what_changed の 方針どおり、
   実行時共有状態は ここに 置く。段1の 要main判断④への 回答）。 */
export var LIVE = {
  have: false,           /* 一度でも 位置が とれたか */
  status: 'load',        /* load | ok | weak | off_route | denied | gpsfail | hidden */
  lat: null, lon: null,
  abstract: null,        /* {x,y}（広い ちずの NP と 同じ スケール） */
  routeId: null,
  fromKey: null, toKey: null, segFraction: null, /* いま いちばん 近い ルート区間（下カードの 現在地文に つかう） */
  accuracy: null,
  moving: false,         /* 段4：直近の GPS の うごきから 判定（cat-travel に つかう） */
  updatedAt: 0           /* さいごに ここが 書きかわった 時こく（表示の 更新には つかわない） */
};
/* 段4：「さいごに ちゃんと とれた 時こく」。accuracy が わるくて 捨てた ときは 進めない
   （表示側の「さいご取得：○ふん前」は これを 見る） */
export var lastGoodAt = 0;
export function setLive(patch, isGoodFix){
  for(var k in patch) if(patch.hasOwnProperty(k)) LIVE[k]=patch[k];
  LIVE.updatedAt = Date.now();
  if (isGoodFix) lastGoodAt = LIVE.updatedAt;
}
export function lastGoodText(){
  if (!lastGoodAt) return null;
  var mins = Math.floor((Date.now() - lastGoodAt) / 60000);
  if (mins <= 0) return 'たった いま';
  return mins + 'ふん まえ';
}
