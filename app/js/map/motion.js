"use strict";
import { T, iso, pt, G, shade, isoBox, isoRoof, hexClamp, isoCone, isoShadow, offsetPts, isoPath, roadLadder, dirArrows, rnd, projR } from '../map/iso.js';
export function steamG(x,y,z,n,sp){
  var c=iso(x,y,z), s=[];
  for(var i=0;i<n;i++){
    s.push('<path d="M'+(c[0]+(i-(n-1)/2)*sp).toFixed(1)+' '+c[1].toFixed(1)
      + ' c -5 -8 5 -12 0 -20" fill="none" stroke="#ffffff" stroke-width="4" '
      + 'stroke-linecap="round" opacity=".8"/>');
  }
  return s.join('');
}
