/* ============================================================
   sections.js — 板块清单（页面的“目录”）
   【管理接口②】这是你日常最常改的文件。

   加一个新交互板块，只要两步：
     1) 在 src/sections/ 下新建一个模块（照 _template.js 抄）
     2) 在下面数组里加一条配置

   字段说明：
     id          唯一标识（也是锚点 #id、导航定位用）
     enabled     是否启用（false = 整块不渲染）
     nav         是否出现在 Hero 导航里
     title       导航/锚点标题（四语）
     load        懒加载函数：板块代码只在接近视口时才下载
     placeholder true = 只占个色块位（用于“规划中、还没做”的板块）
     minHeight   占位高度，避免懒加载时页面跳动
   顺序 = 数组顺序。
   ============================================================ */

export const sections = [
  {
    id: "hero",
    enabled: true,
    nav: false,                         // Hero 本身是导航容器
    load: () => import("../sections/hero.js"),
    minHeight: "100vh",
  },
  {
    id: "pixel-game",
    enabled: true,
    nav: true,
    title: { zh: "像素游乐场", en: "Pixel Playground", de: "Pixel-Spielplatz", ja: "ピクセル・プレイグラウンド" },
    load: () => import("../sections/pixel-game.js"),
    minHeight: "150vh",
  },
  {
    id: "face-anim",
    enabled: true,
    nav: true,
    title: { zh: "人脸动画", en: "Facial Animation", de: "Gesichtsanimation", ja: "顔アニメ" },
    load: () => import("../sections/face-anim.js"),
    minHeight: "auto",
  },
  {
    id: "room",
    enabled: true,
    nav: true,
    title: { zh: "房间 / 全景", en: "Room / Panorama", de: "Raum / Panorama", ja: "ルーム / パノラマ" },
    load: () => import("../sections/room.js"),
    minHeight: "100vh",
  },

  // ↓↓↓ 预留位示例：未来的交互板块。enabled 但 placeholder，先占个色块。
  //     真正要做时：把 placeholder 删掉、补上 load + 模块文件即可。
  {
    id: "slot-next",
    enabled: true,
    nav: false,
    placeholder: true,
    title: { zh: "下一个项目（预留位）", en: "Next project (reserved)", de: "Nächstes Projekt (reserviert)", ja: "次のプロジェクト（予約）" },
    minHeight: "70vh",
  },
  {
    id: "contact",
    enabled: true,
    nav: false,
    title: { zh: "联系", en: "Contact", de: "Kontakt", ja: "お問い合わせ" },
    load: () => import("../sections/contact.js"),
    minHeight: "auto",
  },
];

/** 取启用的板块 */
export const enabledSections = () => sections.filter((s) => s.enabled);
