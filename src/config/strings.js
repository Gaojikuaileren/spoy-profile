/* ============================================================
   strings.js — 全局文案表（四语：zh / en / de / ja）
   【管理接口①】所有界面文字集中在这里，改文案只动这一个文件。
   DOM 里用 data-i18n="key"；JS 里用 t("key")。
   ⚠️ 标 TODO 的是占位文案，世鹏回来填真实项目信息。
   ============================================================ */

export const strings = {
  // ---- 通用 UI ----
  "nav.top":        { zh: "▲ 顶部",   en: "▲ Top",     de: "▲ Nach oben", ja: "▲ トップ" },
  "common.loading": { zh: "加载中…",  en: "Loading…",  de: "Lädt…",       ja: "読み込み中…" },

  // ---- Hero ----
  "hero.title":    { zh: "你好", en: "Hi", de: "Hi", ja: "こんにちは" },
  "hero.subtitle": { zh: "关于玩、动态与空间的实验",
                     en: "Experiments in play, motion & space",
                     de: "Experimente mit Spiel, Bewegung & Raum",
                     ja: "遊び・動き・空間の実験" },

  // ---- P1 像素游戏（TODO: 换成真实项目介绍） ----
  "pixelGame.title": { zh: "像素游乐场", en: "Pixel Playground", de: "Pixel-Spielplatz", ja: "ピクセル・プレイグラウンド" },
  "pixelGame.desc":  { zh: "桌面端用 WASD / 方向键，手机端点击地图移动。走到顶部的门可以走出地图。",
                       en: "Use WASD / arrows (desktop) or tap the map (mobile). Reach the top door to step out.",
                       de: "WASD / Pfeile (Desktop) oder Karte antippen (Mobil). Durch die obere Tür nach draußen.",
                       ja: "PCは WASD / 矢印、スマホは地図をタップ。上のドアから外に出られます。" },
  "pixelGame.wasdHint": { zh: "WASD / 方向键 移动 · 走回门口回到地图",
                       en: "Move with WASD / arrows · walk back to the door to return",
                       de: "Mit WASD / Pfeilen bewegen · zurück zur Tür zum Zurückkehren",
                       ja: "WASD / 矢印キーで移動 · ドアに戻ると地図へ" },

  // ---- P2 人脸动画 ----
  "faceAnim.title":  { zh: "人脸动画", en: "Facial Animation", de: "Gesichtsanimation", ja: "顔アニメーション" },
  "faceAnim.desc":   { zh: "在静止与说话动画之间切换。",
                       en: "Switch between idle and speaking animation.",
                       de: "Zwischen Ruhe- und Sprech-Animation wechseln.",
                       ja: "アイドルとスピーク・アニメーションを切り替え。" },
  "faceAnim.toggle": { zh: "说话", en: "Speak", de: "Sprechen", ja: "スピーク" },

  // ---- P3 3D / 全景（TODO: 换成真实项目介绍） ----
  "model3d.title":    { zh: "3D / 全景", en: "3D / Panorama", de: "3D / Panorama", ja: "3D / パノラマ" },
  "model3d.desc":     { zh: "实时旋转的 3D 模型，点击进入全景查看。",
                        en: "A real-time 3D model — tap to enter the panorama.",
                        de: "Echtzeit-3D-Modell — tippen für die Panorama-Ansicht.",
                        ja: "リアルタイム3Dモデル。タップでパノラマ表示。" },
  "model3d.panorama": { zh: "全景", en: "Panorama", de: "Panorama", ja: "パノラマ" },
  "model3d.caption":  { zh: "项目预览", en: "Project Preview", de: "Projektvorschau", ja: "プロジェクトプレビュー" },

  // ---- Contact（页尾） ----
  "contact.title": { zh: "联系我", en: "Get in touch", de: "Kontakt", ja: "お問い合わせ" },
  "contact.cv":    { zh: "更多关于我 →", en: "More about me →", de: "Mehr über mich →", ja: "私について →" },
};
