/* ============================================================
   face-anim.js — P2 人脸动画：idle / speak 视频切换
   压缩版：视频（左，较小）+ icon 按钮（右）。
   按钮是「捂嘴 / 不捂嘴」icon 切换：捂嘴=静止(idle)，不捂嘴=说话(speak)。
   ============================================================ */

const ICON = `
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="24" cy="22" r="15" opacity=".55"/>
    <circle cx="18.5" cy="20" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="29.5" cy="20" r="1.5" fill="currentColor" stroke="none"/>
    <g class="i-speak">
      <ellipse cx="24" cy="29" rx="4.5" ry="3.6"/>
      <path d="M37 24 q3.5 5 0 10"/>
      <path d="M41 21 q5.5 8 0 16" opacity=".55"/>
    </g>
    <g class="i-mute">
      <path d="M17.5 29 q6.5 3.5 13 0" opacity=".55"/>
      <rect x="12.5" y="25.5" width="23" height="7.5" rx="3.7" fill="currentColor" fill-opacity=".22" stroke-width="1.6"/>
    </g>
  </svg>`;

export default {
  css: `
    #face-anim {
      min-height: auto; padding: 8vh 6vw; background: #000;
      display: flex; align-items: center; justify-content: center; gap: 4vw; flex-wrap: wrap;
    }
    #face-anim .fa-panel {
      position: relative; overflow: hidden; background: #000; flex: 0 0 auto;
      width: min(58vw, calc(34vh * 16/9)); height: min(calc(58vw * 9/16), 34vh);
    }
    #face-anim .fa-v { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .4s ease; }
    #face-anim .fa-v.active { opacity: 1; }
    #face-anim .fa-vignette { position: absolute; inset: 0; pointer-events: none; z-index: 2;
      background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,.1) 50%, rgba(0,0,0,1) 100%); }
    /* 捂嘴 / 不捂嘴 icon 按钮 */
    #face-anim .fa-btn {
      width: 76px; height: 76px; border-radius: 50%; cursor: pointer; padding: 0;
      background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.25); color: #fff;
      display: grid; place-items: center; transition: background .2s, border-color .2s, transform .08s;
    }
    #face-anim .fa-btn:hover { background: rgba(255,255,255,.1); }
    #face-anim .fa-btn:active { transform: scale(.94); }
    #face-anim .fa-btn.on { background: rgba(255,255,255,.14); border-color: rgba(255,255,255,.55); }
    #face-anim .fa-btn svg { width: 60%; height: 60%; }
    #face-anim .fa-btn .i-speak { opacity: 0; transition: opacity .2s; }
    #face-anim .fa-btn .i-mute  { opacity: 1; transition: opacity .2s; }
    #face-anim .fa-btn.on .i-speak { opacity: 1; }
    #face-anim .fa-btn.on .i-mute  { opacity: 0; }
    @media (max-width: 768px) { #face-anim { gap: 26px; padding: 7vh 6vw; } }
  `,

  mount(root, ctx) {
    root.innerHTML = `
      <div class="fa-panel">
        <video class="fa-v fa-v1 active" muted loop playsinline></video>
        <video class="fa-v fa-v2" muted loop playsinline></video>
        <div class="fa-vignette"></div>
      </div>
      <button class="fa-btn" type="button" aria-label="Speak">${ICON}</button>`;

    this.v1 = root.querySelector(".fa-v1");
    this.v2 = root.querySelector(".fa-v2");
    this.btn = root.querySelector(".fa-btn");
    this.srcs = { v1: ctx.asset("idle.mp4"), v2: ctx.asset("speak.mp4") };
    this.loaded = false; this.visible = false; this.speaking = false;

    this.btn.addEventListener("click", () => {
      if (!this.visible) return;
      this.speaking = !this.speaking;
      this.btn.classList.toggle("on", this.speaking);
      this.speaking ? this._swap(this.v2, this.v1) : this._swap(this.v1, this.v2);
    });
  },

  _swap(show, hide) {
    hide.classList.remove("active"); hide.pause();
    show.currentTime = hide.currentTime;
    show.play().catch(() => {});
    show.classList.add("active");
  },

  onEnter() {
    this.visible = true;
    if (!this.loaded) { this.v1.src = this.srcs.v1; this.v2.src = this.srcs.v2; this.loaded = true; }
    (this.speaking ? this.v2 : this.v1).play().catch(() => {});
  },
  onLeave() { this.visible = false; this.v1?.pause(); this.v2?.pause(); },
};
