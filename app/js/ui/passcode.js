"use strict";
/* passcode.js — F-53：合言葉は「使う（4桁）」「使わない」を初回に選べる。
   Q-13＝強さは求めない（自分専用の気分だけ）。サーバーが無いので照合は端末の中だけ。
   忘れた時は いつでも「つかわない」に切りかえられる（AC-F04-3・main裁定3）。 */
import { el } from '../util.js';
import { getPasscodeSetting, setPasscodeEnabled, setPasscodeDisabled, checkPasscode } from '../core/store.js';
import { toast } from './toast.js';

export async function gateThenEnter(enterApp) {
  var setting = await getPasscodeSetting();
  if (setting === null) { openSetup(enterApp); return; }
  if (setting.enabled) { openGate(enterApp); return; }
  enterApp();
}

function openSetup(afterDone) {
  var scr = el('passSetup');
  var digitsWrap = el('passDigitsWrap'), input = el('passDigitsInput');
  scr.classList.add('on');
  digitsWrap.classList.remove('on');
  input.value = '';
  function close() { scr.classList.remove('on'); }
  el('passUseBtn').onclick = function () {
    digitsWrap.classList.add('on'); input.value = ''; input.focus();
  };
  el('passNoBtn').onclick = async function () {
    await setPasscodeDisabled();
    close(); afterDone();
  };
  el('passDigitsOk').onclick = async function () {
    var v = input.value.trim();
    if (!/^[0-9]{4}$/.test(v)) { toast('すうじを 4つ いれてください'); return; }
    await setPasscodeEnabled(v);
    close(); afterDone();
  };
}

function openGate(enterApp) {
  var scr = el('passGate');
  var input = el('gateInput'), msg = el('gateMsg');
  scr.classList.add('on');
  input.value = ''; msg.textContent = '';
  function close() { scr.classList.remove('on'); }
  el('gateOk').onclick = async function () {
    var v = input.value.trim();
    var ok = await checkPasscode(v);
    if (ok) { close(); enterApp(); }
    else { msg.textContent = 'ちがいます。もういちど いれてください。'; input.value = ''; input.focus(); }
  };
  el('gateForget').onclick = async function (e) {
    e.preventDefault();
    await setPasscodeDisabled();
    close(); enterApp();
  };
}

export function openPasscodeSettings() {
  openSetup(function () { toast('あいことばの せっていを かえました'); });
}
