/* ============================================================
   i18n.js — 统一多语言（取代旧站 5 套互相打架的 setLang）
   - 全部文案集中在 config/strings.js
   - DOM 用 data-i18n="key" 标记，切换时一次性刷新
   - JS 里用 t(key) 取文案；板块可 subscribe 监听语言变化
   ============================================================ */

import { strings } from "../config/strings.js";

export const LANGS = ["zh", "en", "de", "ja"];
const FALLBACK = "en";
const STORE_KEY = "spoy.lang";

let current = FALLBACK;
const subscribers = new Set();

/** 取某 key 的当前语言文案；缺失时回退 en，再缺则返回 key 本身 */
export function t(key, lang = current) {
  const entry = strings[key];
  if (!entry) return key;
  return entry[lang] ?? entry[FALLBACK] ?? key;
}

export function getLang() {
  return current;
}

/** 订阅语言变化，返回取消订阅函数。板块用它刷新自身（含非 textContent 的部分） */
export function onLangChange(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** 刷新某个 DOM 子树里所有 [data-i18n]（板块 mount 后调用一次） */
export function applyTo(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
}

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  current = lang;
  document.documentElement.lang = lang;
  try { localStorage.setItem(STORE_KEY, lang); } catch {}

  // 1) 刷新全局所有 [data-i18n]
  applyTo(document);

  // 2) 高亮当前语言按钮
  document.querySelectorAll("#lang-switcher .lang-btn").forEach((b) => {
    b.setAttribute("aria-current", String(b.dataset.lang === lang));
  });

  // 3) 通知订阅者（板块做特殊处理，如 canvas 内文字）
  subscribers.forEach((fn) => { try { fn(lang); } catch (e) { console.warn(e); } });
}

/** 初始化：localStorage > 浏览器语言 > en，并绑定切换按钮 */
export function initI18n() {
  let lang = FALLBACK;
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && LANGS.includes(saved)) lang = saved;
    else {
      const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
      if (LANGS.includes(nav)) lang = nav;
    }
  } catch {}

  document.querySelectorAll("#lang-switcher .lang-btn").forEach((b) => {
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });

  setLang(lang);
}
