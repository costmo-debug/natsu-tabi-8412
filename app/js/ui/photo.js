"use strict";
/* photo.js — F-48：地図の スポットに しゃしんを ひもづけて 端末（IndexedDB）に おく。
   位置情報は もたない（しゃしんの データだけ）。外へは 送らない。 */
import { el } from '../util.js';
import { addPhoto, listPhotosForStamp, deletePhoto } from '../core/store.js';
import { getPersonId } from '../core/person.js';
import { toast } from './toast.js';

var urlCache = {};

function urlOf(rec) {
  if (!urlCache[rec.id]) urlCache[rec.id] = URL.createObjectURL(rec.blob);
  return urlCache[rec.id];
}

export async function renderPhotoSlot(stampId) {
  var box = el('photoArea');
  if (!box) return;
  var pid = getPersonId();
  var photos = await listPhotosForStamp(pid, stampId);
  if (box.getAttribute('data-k') !== stampId) return; /* 表示中に スポットが 切りかわっていたら 何もしない */
  var h = '';
  photos.forEach(function (p) {
    h += '<div class="pthumb"><img src="' + urlOf(p) + '" alt="とった しゃしん">'
       + '<button class="pdel" data-id="' + p.id + '" aria-label="この しゃしんを けす">×</button></div>';
  });
  h += '<label class="paddbtn">'
     + '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6.4" width="18" height="13.6" rx="3"/>'
     + '<circle cx="12" cy="13.2" r="3.6"/><path d="M8.6 6.4 10 4h4l1.4 2.4"/></svg>'
     + '<span>しゃしんを とる／えらぶ</span>'
     + '<input type="file" accept="image/*" capture="environment" class="pfile">'
     + '</label>';
  box.innerHTML = h;
  var input = box.querySelector('.pfile');
  if (input) {
    input.addEventListener('change', async function () {
      var f = input.files && input.files[0];
      if (!f) return;
      try {
        await addPhoto(pid, stampId, f);
        toast('しゃしんを ほぞんしました');
        renderPhotoSlot(stampId);
      } catch (e) {
        toast('しゃしんを ほぞんできませんでした（きろくの ようりょうが いっぱいです）');
      }
      input.value = '';
    });
  }
  Array.prototype.forEach.call(box.querySelectorAll('.pdel'), function (b) {
    b.addEventListener('click', async function () {
      await deletePhoto(b.getAttribute('data-id'));
      renderPhotoSlot(stampId);
    });
  });
}
