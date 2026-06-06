/* ============================================================
   loader.js — 按需加载外部脚本 / 样式（带去重）
   板块只在被用到时才拉自己的库（p5 / model-viewer / pannellum），
   不用的板块一行第三方代码都不加载 —— 这是性能友好的关键之一。
   ============================================================ */

const loaded = new Map(); // src -> Promise

export function loadScript(src, { module = false } = {}) {
  if (loaded.has(src)) return loaded.get(src);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    if (module) s.type = "module";
    s.async = true;
    s.onload = () => resolve(src);
    s.onerror = () => reject(new Error("加载失败: " + src));
    document.head.appendChild(s);
  });
  loaded.set(src, p);
  return p;
}

export function loadCSS(href) {
  if (loaded.has(href)) return loaded.get(href);
  const p = new Promise((resolve, reject) => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    l.onload = () => resolve(href);
    l.onerror = () => reject(new Error("加载失败: " + href));
    document.head.appendChild(l);
  });
  loaded.set(href, p);
  return p;
}

/** 注入一段板块自带的 CSS（每个板块只注入一次） */
export function injectStyle(id, css) {
  if (document.getElementById(id)) return;
  const el = document.createElement("style");
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}
