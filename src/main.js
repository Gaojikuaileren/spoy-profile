/* ============================================================
   main.js — 唯一入口
   职责：启动板块引擎 → 初始化语言 → 全局 UI（回顶 / 背景特效）
   ============================================================ */

import { mountAll } from "./core/engine.js";
import { initI18n } from "./core/i18n.js";
import { initAudioClock } from "./core/audio-clock.js";

function boot() {
  // 1) 按 config/sections.js 渲染并懒加载所有板块
  mountAll(document.getElementById("app"));

  // 2) 语言（localStorage > 浏览器语言 > en），绑定切换按钮
  initI18n();

  // 2.5) 房间音频时钟：全局常驻、默认静音的主时间线（room 板块听筒控制开声）
  initAudioClock("assets/roomrecord-audio.m4a");

  // 3) 回到顶部按钮：滚动超过 0.6 屏才显示
  const toTop = document.getElementById("to-top");
  if (toTop) {
    addEventListener("scroll", () => {
      toTop.classList.toggle("show", window.scrollY > innerHeight * 0.6);
    }, { passive: true });
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // 4) 全屏 CMY 色散视差背景（最耗性能 → 尊重“减少动效”，按需懒加载）
  // CMY 动态色散版性能太重（连截图都抓不动，手机更糟），改用 hero 静态兔子背景图。
  // 想要动态色散版需先优化（大幅降帧 + 更小的图）再开：
  // import("./effects/cmy-parallax.js").then((m) => m.init()).catch(() => {});
}

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", boot);
else boot();
