"use strict";
import { el, esc } from '../util.js';
import { LBL_H, LBL_PAD, LBL_FONT } from '../data/tokens.js';
export var _measCtx=null;
export function labelWidth(t){
  if(!_measCtx){ _measCtx=document.createElement('canvas').getContext('2d'); _measCtx.font=LBL_FONT; }
  return Math.ceil(_measCtx.measureText(t).width)+20;
}
export function rectHit(a,b){ return a.x<b.x+b.w && a.x+a.w>b.x && a.y<b.y+b.h && a.y+a.h>b.y; }

export function makeLabelLayer(hostId, layerId, getItems, forbidSel, onTapKey){
  var host=el(hostId), lay=el(layerId), pending=0;
  var stat={items:0,drawn:0,dots:0,off:0,overlap:0,outside:0,band:0};

  /* 段5：ふだ タップ。ドラッグ（ちずの パン）と まちがえない ように、
     うごいた りょう が しきい値を こえたら タップ あつかいに しない（sheet.js の grip と 同じ しくみ） */
  if(onTapKey){
    var tap=null;
    lay.addEventListener('pointerdown',function(e){
      var t=e.target.closest && e.target.closest('[data-key]');
      if(!t){ tap=null; return; }
      tap={x:e.clientX,y:e.clientY,moved:false,key:t.getAttribute('data-key'),title:t.getAttribute('data-title')||''};
    });
    lay.addEventListener('pointermove',function(e){
      if(!tap) return;
      if(Math.abs(e.clientX-tap.x)>6 || Math.abs(e.clientY-tap.y)>6) tap.moved=true;
    });
    lay.addEventListener('pointerup',function(){
      if(!tap) return;
      var t=tap; tap=null;
      if(!t.moved) onTapKey(t.key, t.title);
    });
    lay.addEventListener('pointercancel',function(){ tap=null; });
  }

  function forbidden(){
    var hr=host.getBoundingClientRect(), out=[];
    forbidSel.forEach(function(sel){
      Array.prototype.forEach.call(document.querySelectorAll(sel),function(e){
        var cs=getComputedStyle(e);
        if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity||'1')<0.05) return;
        var r=e.getBoundingClientRect();
        if(r.width<1||r.height<1) return;
        out.push({x:r.left-hr.left-LBL_PAD, y:r.top-hr.top-LBL_PAD,
                  w:r.width+LBL_PAD*2, h:r.height+LBL_PAD*2, band:1});
      });
    });
    return out;
  }

  function relayout(){
    var W=host.clientWidth, H=host.clientHeight;
    if(!W||!H){ return; }
    var tf=host.__tf||{s:1,tx:0,ty:0};
    var occupied=forbidden(), bands=occupied.slice();
    var items=getItems()||[];
    stat={items:items.length,drawn:0,dots:0,off:0,overlap:0,outside:0,band:0};

    /* 画面に 出ている ものだけ・大事な ものから 先に おく */
    var live=[];
    items.forEach(function(it){
      var sx=it.x*tf.s+tf.tx, sy=it.y*tf.s+tf.ty;
      if(sx<-80||sx>W+80||sy<-80||sy>H+80){ stat.off++; return; }
      live.push({it:it, sx:sx, sy:sy});
    });
    live.sort(function(a,b){ return (b.it.prio||0)-(a.it.prio||0); });

    /* 段4：府県名は 画面の 大きさに あわせた 見出しなので、ふだの 当たり判定の 外で 別あつかい
       （海の 名前と 同じ＝ .lbbox に 数えず、他の ふだの 場所とりを じゃましない） */
    var out=[];
    /* 全部を いちどに 見る ひろい とき は 6つ ぜんぶが かさなって うるさい ので、
       ある程度 大きく した とき（tf.s >= 0.55）だけ 出す（main 裁定＝画面に 入っている 県名だけ） */
    var prefOn = tf.s>=0.55;
    var prefItems=[], seaItems=[], normItems=[];
    live.forEach(function(a){
      if(a.it.kind==='pref'){ if(prefOn) prefItems.push(a); }
      else if(a.it.kind==='sea'){ seaItems.push(a); }
      else normItems.push(a);
    });
    /* 府県名の 出た 場所は、あとから おく ふだが 軽く 重ならない ように 場所とりの じゃまリストへ 足す
       （main 指摘＝「いま ここ！」など 他の 要素と 軽く 重なる 箇所を なくす。2026-08-10） */
    prefItems.forEach(function(a){
      var r=prefBox(a,W,H);
      out.push(drawPrefLabel(a,W,H));
      occupied.push({x:r.x,y:r.y,w:r.w,h:r.h});
    });
    /* 海の なまえ ＝ 画面いっぱいで 隠れにくい ので、府県名と 同じく 場所とりの 外で そのまま 出す */
    seaItems.forEach(function(a){ out.push(drawSeaLabel(a)); });
    live=normItems;

    /* ピンの まる と ねこ は 先に とっておく（ふだが 上に かぶらない ように） */
    live.forEach(function(a){
      var k=a.it.keep;
      if(!k) return;
      occupied.push({x:a.sx-k[0]*tf.s, y:a.sy-k[1]*tf.s, w:k[2]*tf.s, h:k[3]*tf.s});
    });

    var boxes=[];
    var DIRS=[[0,-1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[1,1],[-1,1]];
    live.forEach(function(a){
      var t=a.it.t, w=a.it.w||(a.it.w=labelWidth(t)), h=a.it.h||LBL_H;
      var pick=null;
      /* 8ほうこう x 2つの きょり。それでも だめなら、画面の 中に よせた ものを ためす */
      for(var di=0; di<3 && !pick; di++){
        var gap=(di===1)?30:12, fitin=(di===2);
        for(var i=0;i<DIRS.length;i++){
          var d=DIRS[i], rx, ry;
          rx = d[0]===0 ? a.sx-w/2 : (d[0]>0 ? a.sx+gap : a.sx-w-gap);
          ry = d[1]===0 ? a.sy-h/2 : (d[1]>0 ? a.sy+gap*0.7 : a.sy-h-gap*0.7);
          if(fitin){
            if(d[0]!==0) continue;
            rx=Math.max(LBL_PAD, Math.min(rx, W-LBL_PAD-w));
            ry=Math.max(LBL_PAD, Math.min(ry, H-LBL_PAD-h));
          }
          var r={x:rx,y:ry,w:w,h:h};
          if(r.x<LBL_PAD||r.y<LBL_PAD||r.x+r.w>W-LBL_PAD||r.y+r.h>H-LBL_PAD) continue;
          var bad=false;
          for(var j=0;j<occupied.length;j++){ if(rectHit(r,occupied[j])){bad=true;break;} }
          if(bad) continue;
          pick=r; break;
        }
      }
      if(pick){
        occupied.push({x:pick.x-4,y:pick.y-4,w:pick.w+8,h:pick.h+8});
        boxes.push(pick);
        out.push(drawLabel(a, pick));
        stat.drawn++;
      }else{
        var dr={x:a.sx-7,y:a.sy-7,w:14,h:14};
        if(dr.x>=0 && dr.y>=0 && dr.x+dr.w<=W && dr.y+dr.h<=H){
          occupied.push(dr); out.push(drawDot(a)); stat.dots++;
        }else{ stat.off++; }
      }
    });

    /* 自分で 数える：重なり・はみ出し・きんしたい への 入りこみ */
    for(var p=0;p<boxes.length;p++){
      var b1=boxes[p];
      if(b1.x<0||b1.y<0||b1.x+b1.w>W||b1.y+b1.h>H) stat.outside++;
      for(var q=p+1;q<boxes.length;q++){ if(rectHit(b1,boxes[q])) stat.overlap++; }
      for(var r2=0;r2<bands.length;r2++){ if(rectHit(b1,bands[r2])){ stat.band++; break; } }
    }

    lay.innerHTML='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+out.join('')+'</svg>';
    lay.__stat=stat;
  }

  function drawLabel(a,r){
    var it=a.it, col=it.col||'#c9d3de', s=[];
    var cx=r.x+r.w/2, cy=r.y+r.h/2;
    var ex=Math.max(r.x,Math.min(a.sx,r.x+r.w)), ey=Math.max(r.y,Math.min(a.sy,r.y+r.h));
    if(Math.abs(a.sx-cx)>r.w/2+2 || Math.abs(a.sy-cy)>r.h/2+2){
      s.push('<path d="M'+a.sx.toFixed(1)+' '+a.sy.toFixed(1)+'L'+ex.toFixed(1)+' '+ey.toFixed(1)
           + '" stroke="'+col+'" stroke-width="2" opacity=".7"/>');
      s.push('<circle cx="'+a.sx.toFixed(1)+'" cy="'+a.sy.toFixed(1)+'" r="3.4" fill="'+col+'"/>');
    }
    if(it.kind==='me'){
      s.push('<rect class="lbbox" x="'+r.x.toFixed(1)+'" y="'+r.y.toFixed(1)+'" width="'+r.w+'" height="'+r.h
           + '" rx="11" fill="#d1332e"/>');
      s.push('<text x="'+cx.toFixed(1)+'" y="'+(r.y+15.5).toFixed(1)
           + '" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">'+esc(it.t)+'</text>');
      return '<g>'+s.join('')+'</g>';
    }
    var dk = it.key ? ' data-key="'+esc(it.key)+'" data-title="'+esc(it.t)+'" style="pointer-events:auto"' : '';
    s.push('<rect class="lbbox"'+dk+' x="'+r.x.toFixed(1)+'" y="'+r.y.toFixed(1)+'" width="'+r.w+'" height="'+r.h
         + '" rx="11" fill="#ffffff" stroke="'+col+'" stroke-width="3"/>');
    s.push('<text'+dk+' x="'+cx.toFixed(1)+'" y="'+(r.y+15.5).toFixed(1)
         + '" font-size="13" font-weight="700" fill="#1d2b3a" text-anchor="middle">'+esc(it.t)+'</text>');
    if(it.got===true){
      s.push('<circle cx="'+(r.x+r.w-1).toFixed(1)+'" cy="'+(r.y+2).toFixed(1)
           + '" r="8" fill="#17773d" stroke="#ffffff" stroke-width="2.4"/>');
      s.push('<path d="M'+(r.x+r.w-5).toFixed(1)+' '+(r.y+2).toFixed(1)
           + ' l2.6 3 l5 -5.6" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');
    }
    return '<g class="lb1">'+s.join('')+'</g>';
  }
  /* 段4：府県名。実写（桃鉄の道中図）の見え方に合わせた大きさ・白フチつきの太字
     （2026-08-10 main 実測にもとづき緊急修正＝画面幅0.16→0.045。地図を覆わない） */
  function prefBox(a,W,H){
    var fs=Math.max(14,Math.round(W*0.045)), hw=fs*a.it.t.length*0.32, hh=fs*0.7;
    var cx=Math.max(hw+8, Math.min(a.sx, W-hw-8));
    var cy=Math.max(hh+8, Math.min(a.sy, H-hh-8));
    return {x:cx-hw,y:cy-hh,w:hw*2,h:hh*2,cx:cx,cy:cy,fs:fs};
  }
  function drawPrefLabel(a,W,H){
    var b=prefBox(a,W,H), fs=b.fs, cx=b.cx, cy=b.cy;
    var dk = a.it.key ? ' data-key="'+esc(a.it.key)+'" data-title="'+esc(a.it.t)+'" style="pointer-events:auto"' : '';
    return '<text'+dk+' x="'+cx.toFixed(1)+'" y="'+cy.toFixed(1)+'" font-size="'+fs+'" font-weight="700" '
      + 'fill="'+(a.it.col||'#1d2b3a')+'" stroke="#ffffff" stroke-width="'+Math.round(fs*0.14)+'" '
      + 'paint-order="stroke" stroke-linejoin="round" text-anchor="middle" opacity=".78">'
      + esc(a.it.t)+'</text>';
  }
  /* 段5：海の なまえ。府県名と 同じ 場所とりの 外あつかい・タップで 説明を 出す */
  function drawSeaLabel(a){
    var it=a.it, dk = it.key ? ' data-key="'+esc(it.key)+'" data-title="'+esc(it.t)+'" style="pointer-events:auto"' : '';
    return '<text'+dk+' x="'+a.sx.toFixed(1)+'" y="'+a.sy.toFixed(1)+'" font-size="21" font-weight="700" '
      + 'fill="#e8f6ff" stroke="#2b7fae" stroke-width="4" paint-order="stroke" '
      + 'text-anchor="middle">'+esc(it.t)+'</text>';
  }
  /* おく ばしょが ない ふだ ＝ ひきだし線つきの 点。大きくすると 名前が 出る */
  function drawDot(a){
    var col=a.it.col||'#c9d3de';
    var dk = a.it.key ? ' data-key="'+esc(a.it.key)+'" data-title="'+esc(a.it.t)+'" style="pointer-events:auto"' : '';
    return '<g><path d="M'+a.sx.toFixed(1)+' '+(a.sy+14).toFixed(1)+'L'+a.sx.toFixed(1)+' '+a.sy.toFixed(1)
      + '" stroke="'+col+'" stroke-width="2" opacity=".7"/>'
      + '<circle class="lbdot"'+dk+' cx="'+a.sx.toFixed(1)+'" cy="'+a.sy.toFixed(1)+'" r="5.5" fill="'+col
      + '" stroke="#ffffff" stroke-width="2.4"/></g>';
  }

  function req(){
    if(pending) return;
    pending=requestAnimationFrame(function(){ pending=0; relayout(); });
  }
  return {update:req, now:relayout, stat:function(){return lay.__stat||stat;}};
}

