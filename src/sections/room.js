/* ============================================================
   room.js — 房间 / 全景（监控电视 + 3D 电风扇 合并板块）
   布局：桌面 电视(左) + 电风扇全景(右)；手机 上下（先电视、后风扇）
   电视：CSS 3D 监控电视，朝右转 +15°，屏幕里是房间视频（音视频分离）
     · 旋钮 = 声音开关（捂耳朵过渡）
     · 电源开关 = 关机熄屏（CRT 关机动画），但音频时间线不停、声音 mute
   风扇：model-viewer 实时 3D（fanfan.glb 自转）+ 全景按钮（Pannellum）
   资源：roomrecord-web.mp4 + 全局 roomrecord-audio.m4a + fanfan.glb + Frame_00000_FinalColor.png
   ============================================================ */

import { setSound, syncAudioTo, roomClock } from "../core/audio-clock.js";

const WEB = "roomrecord-web.mp4";
const MODEL_VIEWER = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
const PANNELLUM_JS = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
const PANNELLUM_CSS = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
const NOISE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E";

export default {
  css: `
    #room { min-height: 100vh; background: #000; display: flex; align-items: center;
            justify-content: center; gap: 4vw; padding: 8vh 5vw; }
    #room .room-tv  { flex: 1 1 55%; perspective: 1500px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }
    #room .room-fan { flex: 1 1 45%; position: relative; display: grid; place-items: center; min-height: 62vh; }
    @media (max-width: 768px) {
      #room { flex-direction: column; gap: 7vh; padding: 8vh 5vw; min-height: auto; }
      #room .room-tv, #room .room-fan { flex: 0 0 auto; width: 100%; min-height: 0; }
      #room .room-tv { display: block; }      /* 不用 grid，避免高度塌缩 */
      #room .tv { max-width: 100%; margin: 0 auto; }
    }

    /* ===== 电视 ===== */
    #room .tv { position: relative; width: 100%; max-width: 660px; aspect-ratio: 4/3;
                --d: 130px; transform-style: preserve-3d; transform: rotateY(26deg) rotateX(6deg); margin-right: 9%; }
    /* 前面板（屏幕 + 厚塑料边框） */
    #room .tv-face { position: absolute; inset: 0; padding: 4.5% 4.5% 5.5% 4.5%;
      background: linear-gradient(150deg, #36363c, #1b1b1f 55%, #101013); border-radius: 22px;
      box-shadow: inset 0 0 0 2px #4a4a4e, inset -6px -8px 20px rgba(0,0,0,.6); }
    #room .tv-screen { position: relative; width: 100%; height: 100%; overflow: hidden;
      border-radius: 16px/22px; background: #000; box-shadow: inset 0 0 55px rgba(0,0,0,.95); }
    /* 后屁股（显像管凸出，略收窄） */
    #room .tv-butt { position: absolute; inset: 7%; transform: translateZ(calc(-1 * var(--d)));
      background: radial-gradient(130% 130% at 50% 42%, #202025, #060608); border-radius: 30px; box-shadow: 0 0 0 2px #000; }
    /* 机身侧壁（厚度） */
    #room .tv-side { position: absolute; background: linear-gradient(#202024, #0b0b0d); }
    #room .tv-side.tv-top    { top:0; left:0; right:0; height: var(--d); transform-origin: top center;    transform: rotateX(-90deg); }
    #room .tv-side.tv-bottom { bottom:0; left:0; right:0; height: var(--d); transform-origin: bottom center; transform: rotateX(90deg); }
    #room .tv-side.tv-left   { top:0; bottom:0; left:0; width: var(--d); transform-origin: left center;   transform: rotateY(90deg); }
    #room .tv-side.tv-right  { top:0; bottom:0; right:0; width: var(--d); transform-origin: right center;  transform: rotateY(-90deg); }
    #room .tv-screen video { width: 100%; height: 100%; object-fit: cover; display: block; }
    #room .scan { position:absolute; inset:0; pointer-events:none; z-index:2;
      background: repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 3px); }
    #room .film { position:absolute; inset:0; pointer-events:none; z-index:2; mix-blend-mode:screen; opacity:.4; }
    #room .film::before { content:""; position:absolute; inset:-50%;
      background:url("${NOISE}"); background-size:240px 240px; animation:room-grain .28s steps(2) infinite; }
    #room .glass { position:absolute; inset:0; pointer-events:none; z-index:4;
      background: linear-gradient(125deg, rgba(255,255,255,.12) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 72%, rgba(255,255,255,.05) 100%); }
    #room .vig { position:absolute; inset:0; pointer-events:none; z-index:3; box-shadow: inset 0 0 120px rgba(0,0,0,.95); }
    #room .room-hud { position:absolute; top:14px; right:16px; z-index:5; pointer-events:none;
      display:flex; align-items:center; gap:7px; font-family: ui-monospace, "SF Mono", Consolas, monospace;
      color:#fff; text-shadow:0 1px 5px #000; font-size:clamp(12px,1.5vw,17px); letter-spacing:.08em; }
    #room .room-hud .rec { width:8px; height:8px; border-radius:50%; background:#f33; box-shadow:0 0 8px #f33; animation:room-rec 1.4s steps(2,start) infinite; }
    @keyframes room-rec { 50% { opacity:.15; } }
    /* CRT 关机：黑屏 + 一条白线收缩 */
    #room .crt { position:absolute; inset:0; z-index:6; background:#000; opacity:0; pointer-events:none; transition:opacity .05s; }
    #room .tv-screen.off .crt { opacity:1; }
    #room .tv-screen.off .crt::before { content:""; position:absolute; left:0; right:0; top:50%; height:2px;
      background:#fff; box-shadow:0 0 14px #fff; transform-origin:center; animation: crt-off .42s ease forwards; }
    @keyframes crt-off { 0%{ transform:scaleY(40); opacity:0 } 28%{ transform:scaleY(1); opacity:1 } 100%{ transform:scaleX(0) scaleY(1); opacity:0 } }

    /* ===== 电视控制面板（外壳底部） ===== */
    #room .tv-controls { position: relative; z-index: 10; display:flex; align-items:center; justify-content:center; gap:30px; }
    #room .tv-power { display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; background:none; border:none; }
    #room .tv-power .btn { width:30px; height:16px; border-radius:3px; background:#1c1c1e; border:1px solid #000;
      box-shadow:inset 0 1px 2px rgba(255,255,255,.12); display:grid; place-items:center; }
    #room .tv-power .led { width:6px; height:6px; border-radius:50%; background:#3df37a; box-shadow:0 0 7px #3df37a; transition:.25s; }
    #room .tv-power.off .led { background:#3a1010; box-shadow:none; }
    #room .tv-power .cap, #room .tv-knob .cap { font:600 8px/1 var(--font-ui); letter-spacing:.12em; color:#888; text-transform:uppercase; }
    #room .tv-knob { display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; background:none; border:none; }
    #room .tv-knob .dial { position:relative; width:34px; height:34px; border-radius:50%;
      background:radial-gradient(circle at 38% 32%, #5a5a5e, #1d1d20 70%); border:2px solid #0b0b0c;
      box-shadow: inset 0 2px 3px rgba(255,255,255,.18), 0 3px 5px #000; transform:rotate(-50deg); transition:transform .35s cubic-bezier(.5,1.6,.5,1); }
    #room .tv-knob.on .dial { transform:rotate(50deg); }
    #room .tv-knob .dial::after { content:""; position:absolute; top:3px; left:calc(50% - 1px); width:2px; height:38%; background:#e8e8e8; border-radius:1px; }

    /* ===== 电风扇 / 全景 ===== */
    #room .m3-stage { position:relative; width:100%; height:62vh; }
    #room .m3-mv { width:100%; height:100%; background:transparent; --poster-color:transparent; }
    #room .m3-content { position:absolute; left:0; bottom:0; max-width:80%; padding:14px 16px;
      background:linear-gradient(0deg, rgba(0,0,0,.6), transparent); }
    #room .m3-content h3 { margin:0 0 .3em; font-size:clamp(16px,2.2vw,22px); color:#fff; }
    #room .m3-content p  { margin:0 0 .8em; color:var(--muted); font-size:clamp(12px,1.6vw,14px); }
    #room .m3-pano { background:transparent; border:2px solid #fff; color:#fff; padding:7px 16px;
      font:500 14px/1 var(--font-ui); border-radius:4px; cursor:pointer; transition:.2s; }
    #room .m3-pano:hover { background:#fff; color:#000; }
    .m3-overlay { position:fixed; inset:0; z-index:2147483647; background:rgba(0,0,0,.92); display:grid; place-items:center; }
    .m3-overlay[hidden]{ display:none; }
    .m3-overlay .m3-viewer { position:absolute; inset:0; }
    .m3-overlay .m3-close { position:absolute; top:18px; right:18px; z-index:2; width:40px; height:40px; border-radius:20px;
      border:none; background:rgba(255,255,255,.85); color:#000; font-size:24px; font-weight:bold; cursor:pointer; }
    @keyframes room-grain { 0%{transform:translate(0,0)} 50%{transform:translate(-4%,3%)} 100%{transform:translate(3%,-3%)} }
    @media (max-width:768px){ #room .tv { transform: rotateY(11deg) rotateX(4deg); --d: 54px; margin-right:0; } #room .m3-stage{ height:52vh; } }
  `,

  async mount(root, ctx) {
    root.innerHTML = `
      <div class="room-tv">
        <div class="tv">
          <div class="tv-side tv-top"></div>
          <div class="tv-side tv-bottom"></div>
          <div class="tv-side tv-left"></div>
          <div class="tv-side tv-right"></div>
          <div class="tv-butt"></div>
          <div class="tv-face">
            <div class="tv-screen">
              <video muted loop playsinline preload="none"></video>
              <div class="scan"></div><div class="film"></div><div class="vig"></div><div class="glass"></div>
              <div class="crt"></div>
              <div class="room-hud"><span class="rec"></span><span class="clock">DAY 1  17:02</span></div>
            </div>
          </div>
        </div>
        <div class="tv-controls">
          <button class="tv-power" type="button" aria-label="Power"><span class="btn"><span class="led"></span></span><span class="cap">Power</span></button>
          <button class="tv-knob" type="button" aria-label="Volume"><span class="dial"></span><span class="cap">Vol</span></button>
        </div>
      </div>
      <div class="room-fan">
        <div class="m3-stage">
          <model-viewer class="m3-mv" src="${ctx.asset("fanfan.glb")}" camera-controls auto-rotate
            auto-rotate-delay="0" rotation-per-second="24deg" interaction-prompt="none" disable-zoom
            shadow-intensity="1" alt="3D fan"></model-viewer>
          <div class="m3-content">
            <button class="m3-pano" type="button" data-i18n="model3d.panorama"></button>
          </div>
        </div>
      </div>
      <div class="m3-overlay" hidden>
        <button class="m3-close" type="button" aria-label="Close">&times;</button>
        <div class="m3-viewer"></div>
      </div>`;

    // ---- 电视 ----
    this._v = root.querySelector("video");
    this._src = ctx.asset(WEB);
    this._clock = root.querySelector(".clock");
    this._screen = root.querySelector(".tv-screen");
    this._power = root.querySelector(".tv-power");
    this._knob = root.querySelector(".tv-knob");
    this._hudRAF = null; this._lastHud = ""; this._t = 0;
    this._powerOn = true;     // 电视默认开
    this._knobOn = false;     // 声音默认关
    const applyAudio = () => {
      const on = this._powerOn && this._knobOn;
      if (on) syncAudioTo(this._v.currentTime);   // 开声前先对齐到视频当前进度
      setSound(on);
    };

    this._knob.addEventListener("click", () => {
      this._knobOn = !this._knobOn;
      this._knob.classList.toggle("on", this._knobOn);
      applyAudio();
    });
    this._power.addEventListener("click", () => {
      this._powerOn = !this._powerOn;
      this._power.classList.toggle("off", !this._powerOn);
      this._screen.classList.toggle("off", !this._powerOn);
      this._v.play().catch(() => {});  // 关机只熄屏 + 静音，视频继续跑 → 房间时间不停
      applyAudio();
    });

    // ---- 风扇 / 全景 ----
    ctx.loadScript(MODEL_VIEWER, { module: true }).catch(() => {});
    const overlay = root.querySelector(".m3-overlay");
    const viewerEl = root.querySelector(".m3-viewer");
    let pano = null;
    root.querySelector(".m3-pano").addEventListener("click", async () => {
      overlay.hidden = false;
      try {
        await ctx.loadCSS(PANNELLUM_CSS);
        await ctx.loadScript(PANNELLUM_JS);
        if (!pano) pano = window.pannellum.viewer(viewerEl, {
          type: "equirectangular", panorama: ctx.asset("Frame_00000_FinalColor.png"),
          autoLoad: true, autoRotate: -2, showZoomCtrl: true, showFullscreenCtrl: true,
        });
      } catch (e) { console.warn("pannellum:", e); }
    });
    root.querySelector(".m3-close").addEventListener("click", () => { overlay.hidden = true; });
  },

  _updateHud() {
    const c = roomClock(this._v.currentTime, this._v.duration);
    const t = `DAY ${c.day}  ${c.hh}:${c.mm}`;
    if (t !== this._lastHud) { this._lastHud = t; this._clock.textContent = t; }
    this._hudRAF = requestAnimationFrame(() => this._updateHud());
  },

  onEnter() {
    const v = this._v;
    if (!v.getAttribute("src")) {
      v.src = this._src;
      const t = this._t || 0;
      v.addEventListener("loadedmetadata", () => { try { v.currentTime = t; } catch {} }, { once: true });
    }
    v.play().catch(() => {});                   // 进视口就播 → 时间(视频进度)开始走
    if (this._powerOn && this._knobOn) { syncAudioTo(v.currentTime); setSound(true); }
    if (!this._hudRAF) this._updateHud();
  },

  onLeave() {
    const v = this._v;
    this._t = v.currentTime || 0;              // 记住进度，回来接上
    v.pause(); v.removeAttribute("src"); v.load();
    setSound(false);                           // 离开静音
    cancelAnimationFrame(this._hudRAF); this._hudRAF = null;
  },

  destroy() { cancelAnimationFrame(this._hudRAF); this._v?.removeAttribute("src"); },
};
