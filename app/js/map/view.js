"use strict";
import { el } from '../util.js';
export function makeView(viewId, fitId, cw, ch, padBottom, onChange){
  var v=el(viewId), f=el(fitId), PB=padBottom||0;
  var s=1, tx=0, ty=0, minS=0.2, maxS=4, started=false;
  function apply(){
    f.style.transform='translate('+tx.toFixed(2)+'px,'+ty.toFixed(2)+'px) scale('+s.toFixed(4)+')';
    v.__tf={s:s,tx:tx,ty:ty};
    if(onChange) onChange();
  }
  function clamp(){
    var vw=v.clientWidth, vh=v.clientHeight-PB, w=cw*s, h=ch*s;
    tx = w<=vw ? (vw-w)/2 : Math.min(0,Math.max(vw-w,tx));
    ty = h<=vh ? (vh-h)/2 : Math.min(0,Math.max(vh-h,ty));
  }
  function fit(anim){
    var vw=v.clientWidth, vh=v.clientHeight-PB;
    if(!vw||!vh) return;
    minS=Math.min(vw/cw, vh/ch)*0.98; s=minS; clamp();
    if(anim){f.classList.add('anim'); setTimeout(function(){f.classList.remove('anim');},320);}
    apply();
  }
  function zoomAt(ns,cx,cy,anim){
    ns=Math.max(minS,Math.min(maxS,ns));
    var k=ns/s; tx=cx-(cx-tx)*k; ty=cy-(cy-ty)*k; s=ns; clamp();
    if(anim){f.classList.add('anim'); setTimeout(function(){f.classList.remove('anim');},320);}
    apply();
  }
  function centerOn(px,py,ns,anim){
    ns=Math.max(minS,Math.min(maxS,ns||s)); s=ns;
    tx=v.clientWidth/2-px*s; ty=(v.clientHeight-PB)/2-py*s; clamp();
    if(anim){f.classList.add('anim'); setTimeout(function(){f.classList.remove('anim');},320);}
    apply();
  }
  /* ゆびの そうさ：1本＝うごかす／2本＝ひろげて かくだい */
  var pts={}, last=null, lastTap=0;
  function mid(a,b){return {x:(a.x+b.x)/2, y:(a.y+b.y)/2};}
  function dist(a,b){return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));}
  v.addEventListener('pointerdown',function(e){
    if(e.target.closest('.pin')) return;
    v.setPointerCapture&&v.setPointerCapture(e.pointerId);
    pts[e.pointerId]={x:e.clientX,y:e.clientY};
    var ks=Object.keys(pts);
    if(ks.length===1){ v.classList.add('drag'); last={x:e.clientX,y:e.clientY}; }
    else if(ks.length===2){ last={d:dist(pts[ks[0]],pts[ks[1]]), m:mid(pts[ks[0]],pts[ks[1]])}; }
  });
  v.addEventListener('pointermove',function(e){
    if(!pts[e.pointerId]) return;
    pts[e.pointerId]={x:e.clientX,y:e.clientY};
    var ks=Object.keys(pts), r=v.getBoundingClientRect();
    if(ks.length===1 && last && last.x!==undefined){
      tx+=e.clientX-last.x; ty+=e.clientY-last.y; last={x:e.clientX,y:e.clientY}; clamp(); apply();
    }else if(ks.length===2 && last && last.d){
      var d2=dist(pts[ks[0]],pts[ks[1]]), m2=mid(pts[ks[0]],pts[ks[1]]);
      zoomAt(s*(d2/last.d), m2.x-r.left, m2.y-r.top, false);
      tx+=m2.x-last.m.x; ty+=m2.y-last.m.y; clamp(); apply();
      last={d:d2,m:m2};
    }
  });
  function end(e){
    delete pts[e.pointerId];
    if(!Object.keys(pts).length){ v.classList.remove('drag'); last=null; }
    else { var ks=Object.keys(pts); last={x:pts[ks[0]].x,y:pts[ks[0]].y}; }
  }
  ['pointerup','pointercancel','pointerleave'].forEach(function(ev){ v.addEventListener(ev,end); });
  v.addEventListener('wheel',function(e){
    e.preventDefault();
    var r=v.getBoundingClientRect();
    zoomAt(s*(e.deltaY<0?1.12:1/1.12), e.clientX-r.left, e.clientY-r.top, false);
  },{passive:false});
  v.addEventListener('click',function(e){
    var now=Date.now();
    if(now-lastTap<300){
      var r=v.getBoundingClientRect();
      zoomAt(s*1.8, e.clientX-r.left, e.clientY-r.top, true);
    }
    lastTap=now;
  });
  return {
    ready:function(){ if(!started && v.clientWidth){ started=true; fit(false); } },
    fit:function(anim){ fit(anim!==false); },
    /* 画面を すきま なく うめる 倍率（うえ下に 空白を 出さない） */
    coverScale:function(){ var vw=v.clientWidth, vh=v.clientHeight-PB;
      return Math.max(vw/cw, vh/ch); },
    setSize:function(w,h){ cw=w; ch=h; started=false; },
    zoom:function(k){ zoomAt(s*k, v.clientWidth/2, v.clientHeight/2, true); },
    pan:function(dx,dy){ tx+=dx; ty+=dy; clamp(); apply(); },
    centerOn:centerOn,
    minScale:function(){return minS;}
  };
}

