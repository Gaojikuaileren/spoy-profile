/* ============================================================
   engine.js — 板块引擎：注册 · 懒加载 · 生命周期 · 语言广播
   ------------------------------------------------------------
   性能模型（核心）：
     接近视口(±400px) → 才下载并 mount 板块代码
     进入视口         → onEnter()  启动动画/视频
     离开视口         → onLeave()  停止 rAF / 暂停视频
   => 任意时刻只有“看得见的板块”在消耗 CPU/GPU。
      未来加再多板块，性能也不会线性恶化。
   ------------------------------------------------------------
   板块模块约定（src/sections/*.js 的 default export）：
     {
       css?:   "板块自有样式字符串",
       mount(root, ctx),   // 必需：把 DOM 建到 root 里
       onEnter?(),         // 进入视口
       onLeave?(),         // 离开视口
       setLang?(lang),     // 语言切换（textContent 已自动刷新，这里处理特殊项）
       destroy?(),
     }
   ============================================================ */

import { enabledSections } from "../config/sections.js";
import { t, getLang, onLangChange, applyTo } from "./i18n.js";
import { loadScript, loadCSS, injectStyle } from "../lib/loader.js";

const records = []; // { cfg, el, mod, mounted, inView }
const byEl = new WeakMap();

/** 平滑滚动到某板块 */
export function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/** 传给每个板块的上下文（工具箱） */
const ctx = {
  t, getLang, onLangChange,
  loadScript, loadCSS, injectStyle,
  scrollToSection,
  asset: (name) => `assets/${name}`,     // 统一资源路径
};

function makePlaceholder(cfg) {
  const label = cfg.title ? (cfg.title[getLang()] || cfg.title.en) : cfg.id;
  const el = document.createElement("div");
  el.className = "ph";
  el.innerHTML = `<div class="ph__label">${label}<small>placeholder · ${cfg.id}</small></div>`;
  // 占位标题也跟随语言切换
  onLangChange((lang) => {
    if (cfg.title) el.querySelector(".ph__label").firstChild.textContent =
      cfg.title[lang] || cfg.title.en;
  });
  return el;
}

async function ensureMounted(rec) {
  if (rec.mounted) return;
  rec.mounted = true;               // 立刻置位，防止重复加载
  rec.el.dataset.state = "loading";
  try {
    const mod = (await rec.cfg.load()).default;
    rec.mod = mod;
    if (mod.css) injectStyle(`css-${rec.cfg.id}`, mod.css);
    await mod.mount(rec.el, ctx);
    applyTo(rec.el);                 // 初次刷新板块内 [data-i18n]
    rec.el.removeAttribute("data-state");
    // mount 完成时若已在视口，补触发 onEnter
    if (rec.inView) mod.onEnter?.();
  } catch (err) {
    console.error(`[engine] 板块 "${rec.cfg.id}" 加载失败:`, err);
    rec.el.dataset.state = "";
    rec.el.innerHTML =
      `<div class="ph"><div class="ph__label">⚠ ${rec.cfg.id}<small>${err.message}</small></div></div>`;
  }
}

export function mountAll(mountEl) {
  const app = mountEl || document.getElementById("app");

  for (const cfg of enabledSections()) {
    const el = document.createElement("section");
    el.className = "section";
    el.id = cfg.id;
    if (cfg.minHeight) el.style.minHeight = cfg.minHeight;

    if (cfg.placeholder) {
      el.appendChild(makePlaceholder(cfg));
      app.appendChild(el);
      continue;                     // 占位板块不进懒加载流程
    }

    const rec = { cfg, el, mod: null, mounted: false, inView: false };
    records.push(rec);
    byEl.set(el, rec);
    app.appendChild(el);
  }

  // 1) 预加载：接近视口就下载 + mount
  const loadObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) {
        const rec = byEl.get(e.target);
        if (rec) ensureMounted(rec);
      }
    }),
    { rootMargin: "400px 0px" }
  );

  // 2) 可见性：控制启动/停止
  const viewObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      const rec = byEl.get(e.target);
      if (!rec) return;
      rec.inView = e.isIntersecting;
      if (!rec.mod) return;
      if (e.isIntersecting) rec.mod.onEnter?.();
      else rec.mod.onLeave?.();
    }),
    { rootMargin: "-20% 0px -20% 0px", threshold: 0 }
  );

  records.forEach((rec) => {
    loadObserver.observe(rec.el);
    viewObserver.observe(rec.el);
  });

  // 3) 语言切换广播给所有已挂载板块
  onLangChange((lang) => {
    records.forEach((rec) => rec.mod?.setLang?.(lang));
  });
}
