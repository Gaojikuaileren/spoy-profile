/* ============================================================
   _template.js — 新板块模板
   加一个交互板块的完整流程：
     1) 复制本文件 → src/sections/你的名字.js
     2) 改下面的 #my-section / 内容 / 逻辑
     3) 打开 config/sections.js，在数组里加一条：
          {
            id: "my-section",
            enabled: true,
            nav: true,
            title: { zh:"…", en:"…", de:"…", ja:"…" },
            load: () => import("../sections/my-section.js"),
            minHeight: "100vh",
          }
   就这样。导航会自动出现、懒加载与生命周期自动接管。
   ------------------------------------------------------------
   ctx 工具箱：
     ctx.t(key)            取四语文案（先在 config/strings.js 里加 key）
     ctx.getLang()         当前语言
     ctx.asset("x.png")    → "assets/x.png"
     ctx.loadScript(url,{module})  按需加载外部库
     ctx.loadCSS(url)              按需加载外部样式
     ctx.scrollToSection(id)
   性能铁律：onEnter 里启动的东西（rAF / video / webgl），
            onLeave 里一定要停掉。
   ============================================================ */

export default {
  css: `
    #my-section { min-height:100vh; display:grid; place-items:center; background:#000; }
  `,

  mount(root, ctx) {
    root.innerHTML = `
      <div>
        <h2 data-i18n="hero.title"></h2>
        <!-- 你的 DOM / canvas / video … -->
      </div>`;
    // 例：this._raf 存动画句柄，方便 onLeave 停止
  },

  onEnter() { /* 进视口：启动动画/视频 */ },
  onLeave() { /* 离开：cancelAnimationFrame / video.pause() */ },
  setLang(lang) { /* 特殊文案处理；普通 [data-i18n] 已自动刷新 */ },
  destroy() { /* 清理事件监听等 */ },
};
