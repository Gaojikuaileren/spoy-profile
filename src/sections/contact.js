/* ============================================================
   contact.js — 页尾联系方式（紧凑横向卡片）
   左右布局：兔子 icon + 联系方式 + contact.gif，整体压扁。
   深色径向渐变背景，与项目板块(纯黑)区分。
   资源：assets/usagi.png（兔子 icon）、assets/contact.gif（懒加载）
   ============================================================ */

export default {
  css: `
    #contact {
      min-height: auto; padding: 9vh 6vw;
      background: radial-gradient(ellipse 90% 80% at 50% 0%, #1a1a22, #0a0a0c 72%);
      display: flex; align-items: center; justify-content: center;
    }
    #contact .c-card {
      display: flex; align-items: center; gap: 30px; flex-wrap: wrap; justify-content: center;
      background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1);
      border-radius: 0; padding: 24px 34px; box-shadow: 0 24px 60px rgba(0,0,0,.5);
    }
    #contact .c-icon {
      width: 92px; height: 92px; border-radius: 20px; overflow: hidden; flex: 0 0 auto;
      background: linear-gradient(160deg, #fff, #e8e8ee); box-shadow: 0 8px 24px rgba(0,0,0,.45);
    }
    #contact .c-icon img { width: 100%; height: 100%; object-fit: contain; }
    #contact .c-info { display: flex; flex-direction: column; gap: .55em; color: #fff; }
    #contact .c-info h2 { margin: 0 0 .15em; font-size: clamp(22px, 3vw, 32px); font-weight: 600; }
    #contact .c-info .row { display: flex; gap: .7em; align-items: baseline; font-size: clamp(14px, 1.7vw, 17px); }
    #contact .c-info a.row { color: #fff; text-decoration: none; }
    #contact .c-info a.row:hover { text-decoration: underline; }
    #contact .c-info .label { color: var(--muted); min-width: 82px; font-size: .8em; letter-spacing: .04em; text-transform: uppercase; }
    #contact .c-info a.about { margin-top: .25em; font-size: clamp(15px, 1.9vw, 19px); font-weight: 500; }
    #contact .c-gif {
      width: clamp(190px, 24vw, 280px); border-radius: 10px; overflow: hidden; flex: 0 0 auto;
      box-shadow: 0 8px 28px rgba(0,0,0,.5);
    }
    #contact .c-gif img { display: block; width: 100%; height: auto; background: #0a0a0a; }
    @media (max-width: 768px) {
      #contact { padding: 7vh 6vw; }
      #contact .c-card { flex-direction: column; text-align: center; padding: 26px 24px; gap: 20px; }
      #contact .c-info .row { justify-content: center; }
      #contact .c-gif { width: min(70vw, 280px); }
    }
  `,

  mount(root, ctx) {
    root.innerHTML = `
      <div class="c-card">
        <div class="c-icon"><img alt="Usagi" src="assets/usagi.png" /></div>
        <div class="c-info">
          <h2 data-i18n="contact.title"></h2>
          <a class="row" href="mailto:freeketchup@icloud.com">
            <span class="label">Email</span><span>freeketchup@icloud.com</span>
          </a>
          <a class="row" href="https://instagram.com/s.gjklr/" target="_blank" rel="noopener">
            <span class="label">Instagram</span><span>@s.gjklr</span>
          </a>
          <a class="row about" href="https://gaojikuaileren.github.io/Shipeng_CV/?v=art-vr" target="_blank" rel="noopener">
            <span data-i18n="contact.cv"></span>
          </a>
        </div>
        <div class="c-gif"><img alt="" /></div>
      </div>`;
    root.querySelector(".c-gif img").src = ctx.asset("contact.gif");
  },
};
