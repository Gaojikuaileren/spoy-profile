/* ============================================================
   audio-clock.js — 房间声音（独立音轨，跟随视频进度）
   时间线改由【视频进度】驱动（video.currentTime）——进视口就走，
   不依赖是否开声音。这里只管声音：
     - 音频独立文件，默认不出声
     - 开声音时：先把音频 seek 到视频当前进度再播 → 与画面同步
     - 持续用 syncIfDrift() 校正漂移
     - 开/关带「捂耳朵」过渡（低通 + 音量一起渐变）
   房间时间映射（给 room 的 HUD 用）：Day1 17:02 → Day3 17:00
   资源：assets/roomrecord-audio.m4a
   ============================================================ */

let audio = null;
let ctx = null, srcNode = null, filterNode = null, gainNode = null;
let graphReady = false;
let soundOn = false;
const RAMP = 0.55;
const MUFFLED = 320;

export function initAudioClock(src) {
  if (audio) return;
  audio = new Audio(src);
  audio.loop = true;
  audio.preload = "auto";       // 不 autoplay：开声音时才播，并与视频对齐
}

function ensureGraph() {
  if (graphReady) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  srcNode = ctx.createMediaElementSource(audio);
  filterNode = ctx.createBiquadFilter();
  filterNode.type = "lowpass";
  filterNode.frequency.value = MUFFLED;
  gainNode = ctx.createGain();
  gainNode.gain.value = 0;
  srcNode.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(ctx.destination);
  audio.muted = false;
  graphReady = true;
}

/** 把音频对齐到指定时间（视频进度） */
export function syncAudioTo(t) {
  if (audio) { try { audio.currentTime = t; } catch {} }
}
/** 漂移超过容差才校正（避免频繁 seek 卡顿） */
export function syncIfDrift(t, tol = 0.35) {
  if (audio && soundOn && Math.abs(audio.currentTime - t) > tol) {
    try { audio.currentTime = t; } catch {}
  }
}

/** 开/关声音，带捂耳朵过渡 */
export function setSound(on) {
  ensureGraph();
  soundOn = on;
  if (!audio) return;
  if (on && audio.paused) audio.play().catch(() => {});
  if (!graphReady) { audio.muted = !on; return; }
  if (ctx.state === "suspended") ctx.resume();
  const now = ctx.currentTime, f = filterNode.frequency, g = gainNode.gain;
  f.cancelScheduledValues(now); g.cancelScheduledValues(now);
  f.setValueAtTime(f.value, now); g.setValueAtTime(g.value, now);
  if (on) { f.linearRampToValueAtTime(20000, now + RAMP); g.linearRampToValueAtTime(1, now + RAMP); }
  else    { f.linearRampToValueAtTime(MUFFLED, now + RAMP); g.linearRampToValueAtTime(0, now + RAMP); }
}
export function isSoundOn() { return soundOn; }

// 房间时间：Day1 17:02 → Day3 17:00（接受视频进度 t / 时长 dur）
const START_MIN = 17 * 60 + 2;       // 1022
const SPAN_MIN = 2878;
export function roomClock(t, dur) {
  const p = Math.min((t || 0) / (dur || 469.43), 1);
  const totalSec = (START_MIN + p * SPAN_MIN) * 60;
  const day = Math.floor(totalSec / 86400) + 1;
  const dsec = Math.floor(totalSec % 86400);
  const hh = String(Math.floor(dsec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((dsec % 3600) / 60)).padStart(2, "0");
  return { day, hh, mm };
}
