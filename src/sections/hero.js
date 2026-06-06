/* ============================================================
   hero.js — 首屏 + 导航 + 海豚窗口（景深层级）
   层级（前→后）：语言切换/Top(全局fixed) > 文字 > 兔子背景(半透) > 加载圈 > 海豚
   海豚在最底、兔子背景半透明盖其上 → 海豚朦胧透出做景深；加载圈居中在海豚之上。
   海豚：桌面右侧 1/3、手机居中 4/5 在内容下方；36 帧 jpg 2fps；hero 离开即停。
   资源：assets/dolphin/01.jpg … 36.jpg
   ============================================================ */

import { sections } from "../config/sections.js";

const DOLPHIN_FRAMES = 36;
const dolphinSrc = (i) => `assets/dolphin/${String(i).padStart(2, "0")}.jpg`;

export default {
  css: `
    #hero {
      position: relative; min-height: 100vh; overflow: hidden; background: #000;
      display: flex; align-items: center; padding: 0 6vw;
    }
    /* 海豚窗口（最底层 z1，桌面绝对定位在右侧） */
    #hero .hero-window {
      position: absolute; right: 6vw; top: 50%; transform: translateY(-50%);
      width: 33vw; z-index: 1; box-shadow: 0 14px 50px rgba(0,0,0,.55); overflow: hidden; font-size: 0;
    }
    #hero .hero-window img.dolphin-frame { display: block; width: 100%; height: auto; background: #000; }
    /* 加载圈（z2，海豚之上、窗口居中）：单道拖尾光环 */
    #hero .dolphin-spin {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
      width: clamp(44px, 6vw, 76px); aspect-ratio: 1; border-radius: 50%; z-index: 2; pointer-events: none;
      background: conic-gradient(from 0deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.95) 100%);
      -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 4px), #000 0);
      mask: radial-gradient(farthest-side, #0000 calc(100% - 4px), #000 0);
      filter: drop-shadow(0 0 6px rgba(255,255,255,.55));
      animation: dolphin-spin 1s steps(12) infinite;
    }
    @keyframes dolphin-spin { to { transform: translate(-50%,-50%) rotate(360deg); } }
    /* 兔子背景（z3，半透盖在海豚上做景深） */
    #hero .hero-bg { position: absolute; inset: 0; z-index: 3; opacity: .55; }
    #hero .hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    #hero .hero-bg::after {
      content: ""; position: absolute; inset: 0;
      background: radial-gradient(120% 90% at 30% 50%, rgba(0,0,0,.25), rgba(0,0,0,.7));
    }
    /* 文字（z4，最前） */
    #hero .hero-main { position: relative; z-index: 4; display: flex; flex-direction: column; gap: .4em; max-width: 58%; }
    #hero .hero-title { margin: 0; font-size: clamp(34px, 6.5vw, 84px); font-weight: 600; text-shadow: 0 2px 24px rgba(0,0,0,.9); }
    #hero .hero-sub   { margin: 0 0 1em; font-size: clamp(14px, 2.2vw, 22px); color: #eee; text-shadow: 0 2px 14px rgba(0,0,0,.9); }
    #hero .hero-nav { gap: 16px; }
    #hero .nav-item { display: flex; align-items: center; gap: 16px; cursor: pointer; background: none; border: none; padding: 0; }
    #hero .nav-btn {
      width: 54px; height: 54px; border-radius: 0; flex: 0 0 auto; display: grid; place-items: center;
      background: #1b1b20; border: 1px solid rgba(255,255,255,.3);
      transition: background .15s, border-color .15s;
    }
    #hero .nav-num { font: 700 16px/1 ui-monospace, Consolas, monospace; color: #d2d2d8; }
    #hero .nav-item:hover .nav-btn { background: #2a2a31; border-color: rgba(255,255,255,.65); }
    #hero .nav-item:active .nav-btn { background: #141418; }
    @media (max-width: 768px) {
      #hero { flex-direction: column; justify-content: center; gap: 28px; padding: 9vh 6vw; }
      #hero .hero-main { max-width: 100%; }
      #hero .hero-window { position: relative; right: auto; top: auto; transform: none; width: 80vw; align-self: center; }
    }
  `,

  mount(root, ctx) {
    root.innerHTML = `
      <div class="hero-window" aria-hidden="true">
        <img class="dolphin-frame" alt="" />
        <div class="dolphin-spin"></div>
      </div>
      <div class="hero-bg">
        <img class="hero-img" alt="" sizes="100vw" src="assets/unnamed.png"
          srcset="assets/480.png 480w, assets/768.png 768w, assets/1024.png 1024w, assets/unnamed.png 1668w" />
      </div>
      <div class="hero-main">
        <h1 class="hero-title" data-i18n="hero.title"></h1>
        <nav class="hero-nav btn-stack" aria-label="Sections"></nav>
      </div>`;

    const navEl = root.querySelector(".hero-nav");
    const navItems = sections.filter((s) => s.enabled && s.nav);
    navItems.forEach((s, i) => {
      const item = document.createElement("button");
      item.type = "button"; item.className = "nav-item";
      item.innerHTML = `<span class="nav-btn"><span class="nav-num">${String(i + 1).padStart(2, "0")}</span></span>`;
      item.title = s.title[ctx.getLang()] || s.title.en;
      item.addEventListener("click", () => ctx.scrollToSection(s.id));
      navEl.appendChild(item);
    });
    this._navItems = navItems;
    this._navEl = navEl;

    this._dimg = root.querySelector(".dolphin-frame");
    this._frame = 1;
    this._timer = null;
    for (let i = 1; i <= DOLPHIN_FRAMES; i++) { const im = new Image(); im.src = dolphinSrc(i); }
    this._dimg.src = dolphinSrc(1);
  },

  onEnter() {
    if (this._timer) return;
    this._timer = setInterval(() => {
      this._frame = (this._frame % DOLPHIN_FRAMES) + 1;
      this._dimg.src = dolphinSrc(this._frame);
    }, 500);
  },
  onLeave() { clearInterval(this._timer); this._timer = null; },

  setLang(lang) {
    if (!this._navEl) return;
    [...this._navEl.children].forEach((item, i) => {
      item.title = this._navItems[i].title[lang] || this._navItems[i].title.en;
    });
  },
};
