/* ============================================================
   cmy-parallax.js — 全屏 CMY 色散视差背景（旧站标志性氛围层）
   鼠标视差 + 青/品红/黄三通道偏移，限帧 24fps、自适应分辨率。
   性能取舍：
     - 移动端默认跳过（这层最重，手机不划算）
     - 页面切到后台(document.hidden)自动暂停
     - main.js 已对 prefers-reduced-motion 跳过
   想整块关掉：把 main.js 里 import("./effects/cmy-parallax.js") 那段注释掉即可。
   资源：assets/*plus.png（自适应多分辨率，均为小文件）
   ============================================================ */

let started = false;

export function init() {
  if (started) return;
  // 移动端不跑这层重特效（珍惜性能）
  if (innerWidth <= 768) return;
  started = true;

  const style = document.createElement("style");
  style.textContent = `
    .cmy-layer { position:fixed; top:0; left:0; width:100vw; height:100vh;
                 pointer-events:none; z-index:-2; }   /* 背景层：在所有内容之下 */
    #cmy-shadow { filter:blur(8px); }
    #cmy-main   { filter:blur(3px); z-index:-1; }`;
  document.head.appendChild(style);

  const shadow = Object.assign(document.createElement("canvas"), { id: "cmy-shadow", className: "cmy-layer" });
  const main = Object.assign(document.createElement("canvas"), { id: "cmy-main", className: "cmy-layer" });
  document.body.append(shadow, main);

  const sCtx = shadow.getContext("2d"), mCtx = main.getContext("2d");
  const fpsInterval = 1000 / 24;
  let lastFrame = 0;
  const scaleFactor = 0.5, parallax = 0.33, smooth = 0.05, disp = 8 * 30;
  const channels = {
    c: { p:{x:-1,y:1},  d:{x:0,y:-1}, color:"cyan" },
    m: { p:{x:1,y:-1},  d:{x:-1,y:1}, color:"magenta" },
    y: { p:{x:1,y:1},   d:{x:1,y:1},  color:"yellow" },
  };
  const srcSet = [
    { url:"assets/480plus.png", w:480 }, { url:"assets/768plus.png", w:768 },
    { url:"assets/1024plus.png", w:1024 }, { url:"assets/1920plus.png", w:1920 },
    { url:"assets/3840plus.png", w:3840 }, { url:"assets/plus.png", w:7680 },
  ];
  const pickSrc = () => {
    const t = innerWidth * 2;
    return (srcSet.find((s) => s.w >= t) || srcSet[srcSet.length - 1]).url;
  };

  let img, w, h, ready = false;
  // 只在主页(hero)可见时绘制，滚到别的板块就暂停（省性能）
  let heroVisible = true;
  const heroEl = document.getElementById("hero");
  if (heroEl) new IntersectionObserver((es) => { heroVisible = es[0].isIntersecting; }).observe(heroEl);
  const tinted = {};
  let tX=0.5, tY=0.5, cX=0.5, cY=0.5;
  addEventListener("mousemove", (e) => { tX = e.clientX/innerWidth; tY = e.clientY/innerHeight; }, { passive:true });
  const lerp = (a,b,t) => a+(b-a)*t;

  const resize = () => {
    const rs = 0.4;
    shadow.style.width = main.style.width = innerWidth+"px";
    shadow.style.height = main.style.height = innerHeight+"px";
    shadow.width = main.width = Math.floor(innerWidth*rs);
    shadow.height = main.height = Math.floor(innerHeight*rs);
    sCtx.setTransform(rs,0,0,rs,0,0); mCtx.setTransform(rs,0,0,rs,0,0);
  };
  const makeTint = (color) => {
    const off = document.createElement("canvas"); off.width=w; off.height=h;
    const o = off.getContext("2d");
    o.drawImage(img,0,0,img.width,img.height,0,0,w,h);
    o.globalCompositeOperation = "source-in"; o.fillStyle=color; o.fillRect(0,0,w,h);
    return off;
  };

  const loop = (now) => {
    requestAnimationFrame(loop);
    if (document.hidden || !heroVisible) return;  // 后台 / 不在主页 → 暂停
    if (!lastFrame) lastFrame = now;
    if (now-lastFrame < fpsInterval) return;
    lastFrame = now;
    if (!ready) return;
    cX = lerp(cX,tX,smooth); cY = lerp(cY,tY,smooth);
    const cx=(innerWidth-w)*0.5, cy=(innerHeight-h)*0.5;
    let dx=(cX-0.5)*(innerWidth-w)*parallax, dy=(cY-0.5)*(innerHeight-h)*parallax*2;
    sCtx.clearRect(0,0,innerWidth,innerHeight); mCtx.clearRect(0,0,innerWidth,innerHeight);
    sCtx.globalAlpha = 0.4;
    for (const k of ["c","m","y"]) {
      const cfg=channels[k], layer=tinted[k];
      const px=cx+dx*cfg.p.x, py=cy+dy*cfg.p.y;
      sCtx.drawImage(layer, px+cfg.d.x*disp, py+cfg.d.y*disp, w, h);
    }
    mCtx.drawImage(img,0,0,img.width,img.height, cx+dx, cy+dy, w, h);
  };

  const load = () => {
    img = new Image();
    img.src = pickSrc();
    img.onload = () => {
      w = img.width*scaleFactor; h = img.height*scaleFactor;
      resize();
      for (const k of ["c","m","y"]) tinted[k] = makeTint(channels[k].color);
      ready = true;
    };
    img.onerror = () => console.warn("[cmy-parallax] 背景图加载失败");
  };
  addEventListener("resize", () => { ready=false; load(); }, { passive:true });
  load();
  requestAnimationFrame(loop);
}
