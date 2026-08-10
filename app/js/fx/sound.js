"use strict";
export var SOUND_ON = true;

export var AC=null, audioReady=false;
export function unlockAudio(){
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return;
  try{
    AC = new Ctx();
    var b=AC.createBuffer(1,1,22050), s=AC.createBufferSource();
    s.buffer=b; s.connect(AC.destination); s.start(0);
    if(AC.state==='suspended') AC.resume();
    audioReady=true;
  }catch(e){ audioReady=false; }
}
export function chime(){
  if(!SOUND_ON || !audioReady || !AC) return;
  if(AC.state==='suspended') AC.resume();
  [[784,0,'triangle'],[1046,0.08,'triangle'],[1568,0.17,'triangle'],[2093,0.26,'sine']]
  .forEach(function(p){
    var o=AC.createOscillator(), g=AC.createGain(), t0=AC.currentTime+p[1];
    o.type=p[2]; o.frequency.setValueAtTime(p[0],t0);
    g.gain.setValueAtTime(0.0001,t0);
    g.gain.exponentialRampToValueAtTime(0.18,t0+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t0+0.5);
    o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0+0.54);
  });
}
export function thud(){
  if(!SOUND_ON || !audioReady || !AC) return;
  var t0=AC.currentTime, o=AC.createOscillator(), g=AC.createGain();
  o.type='sine'; o.frequency.setValueAtTime(180,t0);
  o.frequency.exponentialRampToValueAtTime(60,t0+0.12);
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(0.3,t0+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+0.22);
  o.connect(g); g.connect(AC.destination); o.start(t0); o.stop(t0+0.24);
}

/* ---------- 3. ちずを 画面に うつす 道具（2つの 見おろし方） ----------
   PROJ='top'  ほぼ 真上 から 見おろす。よこ＝東西、たて＝南北。
               たかさ は 上に のばす だけ（たてものに うすい 側面 が つく）。
               ひろい ちず は こちら（桃鉄 と おなじ かたち）。
   PROJ='iso'  ななめ 45度。段3で 起こす前は スポット の ちず 6まい も こちらだった。
   スポット の ちず 6まい も、ひろい ちずと 同じ 'top' に そろえた（§15-6）。
   K は エリアごとの 台の 大きさに つかい、TOP_RX/TOP_RY の 比で 真上の ばい率へ 変換する。
   どちらの ときも iso(gx,gy,z) を 通す ので、絵の 部品 は 書きかえずに すむ。 */

export function setOn(v){ SOUND_ON = v; }
export function isOn(){ return SOUND_ON; }
