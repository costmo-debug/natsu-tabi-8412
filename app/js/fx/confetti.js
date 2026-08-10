"use strict";
import { el } from '../util.js';
import { RM } from '../util.js';
export var fx=el('fx'), ctx=fx.getContext('2d'), parts=[], raf=0;
export function sizeFx(){
  var d=Math.min(window.devicePixelRatio||1,2);
  fx.width=Math.floor(innerWidth*d); fx.height=Math.floor(innerHeight*d);
  fx.style.width=innerWidth+'px'; fx.style.height=innerHeight+'px';
  ctx.setTransform(d,0,0,d,0,0);
}
export function confetti(n){
  if(RM.matches) return;
  n=Math.min(n,100-parts.length);
  if(n<=0) return;
  var cols=['#ffb400','#4fb3f0','#62c15f','#f280b0','#d1332e','#ffffff'];
  var cx=innerWidth/2, cy=innerHeight*0.4;
  for(var i=0;i<n;i++){
    var a=Math.random()*Math.PI*2, v=3+Math.random()*8;
    parts.push({x:cx,y:cy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-5,
      w:5+Math.random()*7,h:8+Math.random()*9,r:Math.random()*Math.PI,
      vr:(Math.random()-0.5)*0.36,c:cols[(Math.random()*cols.length)|0],life:0});
  }
  if(!raf) raf=requestAnimationFrame(tick);
}
export function tick(){
  ctx.clearRect(0,0,innerWidth,innerHeight);
  for(var i=parts.length-1;i>=0;i--){
    var p=parts[i];
    p.vy+=0.3; p.vx*=0.992; p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; p.life++;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.r);
    ctx.globalAlpha=Math.max(0,1-p.life/115);
    ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    if(p.y>innerHeight+40||p.life>115) parts.splice(i,1);
  }
  raf = parts.length ? requestAnimationFrame(tick) : 0;
  if(!raf) ctx.clearRect(0,0,innerWidth,innerHeight);
}

/* ---------- 12. 5つの じょうたい ---------- */

export function partsLen(){ return parts.length; }
