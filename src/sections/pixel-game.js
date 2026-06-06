/* ============================================================
   pixel-game.js — P1 像素游乐场（含出门交互）
   ------------------------------------------------------------
   两种状态：
     trapped  困在地图里：player 相对 game-window 绝对定位（手机仅此态）
     outside  走出门后：  player 相对视口 fixed，可在整页跑、跟随滚动
   控制：桌面 WASD / 方向键 + 右下方向键按钮；手机点地图移动（不能出门）
   门：地图顶部的门，走到门口按 ↑/W 出门；出门后走回门口按 ↓/S 回去（可逆）
   门框层：复制 mapbg 用 clip-path 只留门框那块，叠在小人上方做“钻出”遮挡
           （clip-path 坐标是占位，世鹏按真实门位置微调即可）
   资源：assets/mapbg.png  assets/nihil-1-Sheet16.png
   ============================================================ */

export default {
  css: `
    #pixel-game { position:relative; background:#000; padding:10vh 0; display:flex; justify-content:center;
                  align-items:center; gap:40px; flex-wrap:wrap; }
    #pixel-game .gw { position:relative; border:2px solid #fff; flex:0 0 auto; }
    #pixel-game .gw img.bg,
    #pixel-game .gw .pg-doorframe { display:block; height:min(680px, 90vh); width:auto; }
    /* 门框层：与地图同图同位，clip 只留门框区域，z 在小人之上 */
    #pixel-game .gw .pg-doorframe {
      position:absolute; top:0; left:0; z-index:5; pointer-events:none;
      clip-path: inset(0% 29% 64% 53%);   /* 对齐截图右侧玻璃门，可再微调 */
    }
    #pixel-game .controls {
      position:absolute; right:10px; bottom:10px; display:grid;
      grid-template-columns:repeat(3,40px); grid-template-rows:repeat(3,40px); gap:5px; z-index:10;
    }
    #pixel-game .cbtn {
      position:relative; background:rgba(255,255,255,.2); border:1px solid #fff;
      border-radius:4px; cursor:pointer; user-select:none;
    }
    #pixel-game .cbtn::after {
      content:attr(data-sym); position:absolute; top:50%; left:50%;
      transform:translate(-50%,-50%); font-size:16px; color:#fff;
    }
    #pixel-game .text-box { width:35vw; display:flex; flex-direction:column; gap:16px; color:#fff; }
    #pixel-game .text-box h2 { margin:0; font-size:clamp(20px,3vw,28px); }
    #pixel-game .text-box p  { margin:0; font-size:clamp(13px,1.8vw,16px); line-height:1.6; color:var(--muted); }
    @media (max-width:768px){
      #pixel-game { flex-direction:column; align-items:center; padding:10vh 20px; }
      #pixel-game .text-box { width:90vw; text-align:center; }
      #pixel-game .gw img.bg,
      #pixel-game .gw .pg-doorframe { width:90vw; height:auto; }
      #pixel-game .controls { display:none; }
      #pixel-game .gw::after { content:"Touch map"; position:absolute; bottom:10px; left:50%;
        transform:translateX(-50%); color:#fff; font-size:14px; pointer-events:none; }
    }
    /* 小人：全局 class（出门移到 body 后样式仍生效） */
    .pg-player {
      position:absolute; background-image:url("assets/nihil-1-Sheet16.png");
      background-size:400% 400%; image-rendering:pixelated;
      transform-origin:center; filter:brightness(78%);
    }
    /* 迷宫：出门后淡入、阻挡小人、出口朝下 */
    #pixel-game .pg-maze { position:absolute; inset:0; z-index:6; pointer-events:none; opacity:0; transition:opacity 1.4s ease; }
    #pixel-game .pg-maze.show { opacity:1; }
    #pixel-game .pg-wall { position:absolute;
      background:repeating-linear-gradient(45deg,#44444c,#44444c 7px,#26262c 7px,#26262c 14px);
      box-shadow:inset 0 0 0 1px rgba(255,255,255,.18), 0 2px 6px rgba(0,0,0,.5); }
    /* 出门提示 */
    .pg-hint {
      position:fixed; left:50%; bottom:32px; transform:translateX(-50%);
      z-index:10001; padding:10px 18px; border-radius:8px;
      background:rgba(0,0,0,.7); color:#fff; font-size:14px; letter-spacing:.03em;
      border:1px solid rgba(255,255,255,.25); pointer-events:none;
      opacity:0; transition:opacity .4s;
    }
    .pg-hint.show { opacity:1; }
  `,

  mount(root, ctx) {
    root.innerHTML = `
      <div class="gw" id="pg-window">
        <img class="bg" src="${ctx.asset("mapbg.png")}" alt="Map" draggable="false" />
        <div class="pg-player" id="pg-player"></div>
        <img class="pg-doorframe" src="${ctx.asset("mapbg.png")}" alt="" draggable="false" />
        <div class="controls">
          <div></div><div class="cbtn" data-dir="up" data-sym="↑"></div><div></div>
          <div class="cbtn" data-dir="left" data-sym="←"></div><div></div>
          <div class="cbtn" data-dir="right" data-sym="→"></div>
          <div></div><div class="cbtn" data-dir="down" data-sym="↓"></div><div></div>
        </div>
      </div>
      `;

    const win = root.querySelector("#pg-window");
    const player = root.querySelector("#pg-player");
    const bg = root.querySelector("img.bg");
    const isMobile = () => innerWidth <= 768;

    // 硬件加速检测（无加速时降速）
    let hwAccel = true;
    try {
      const gl = document.createElement("canvas").getContext("webgl");
      const dbg = gl && gl.getExtension("WEBGL_debug_renderer_info");
      if (!gl) hwAccel = false;
      else if (dbg && /SwiftShader|llvmpipe|softpipe|software/i.test(
        gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))) hwAccel = false;
    } catch { hwAccel = false; }

    const sprite = {
      idleFront:[{r:0,c:0},{r:0,c:1}], idleBack:[{r:0,c:2},{r:0,c:3}],
      runFront:[{r:2,c:1},{r:2,c:2}], runBack:[{r:2,c:3},{r:3,c:0}], runDown:[{r:2,c:1},{r:2,c:2}],
    };
    let posX=0, posY=0, dir=null, target=null, lastDir="front";
    let frame=0, lastTime=0, size=64, speed=3, inited=false;
    let running=false, rafId=null, mode="trapped";
    // 边界 + 门坐标（window 内坐标，scale() 更新）
    let minX=0,maxX=0,minY=0,maxY=0, doorL=0,doorR=0,doorY=0;
    const interval = { idle:1500, run:300 };

    // 迷宫（出门后淡入）：围绕地图外围、程序生成（递归回溯）的复杂网格、底部出口
    const maze = document.createElement("div"); maze.className = "pg-maze";
    root.appendChild(maze);
    let mazeActive = false, mazeBuilt = false, wallRects = [], lastMapW = 0;
    const buildMaze = () => {
      if (mazeBuilt) return; mazeBuilt = true;
      const sr=root.getBoundingClientRect(), gr=win.getBoundingClientRect();
      const W=sr.width, H=sr.height, docL=sr.left+scrollX, docT=sr.top+scrollY;
      lastMapW = gr.width;
      const CELL=Math.max(40, Math.round(gr.width/7));   // 格子大小跟地图宽走 → 随地图一起缩放
      const cols=Math.max(4,Math.floor(W/CELL)), rows=Math.max(4,Math.floor(H/CELL));
      const cw=W/cols, ch=H/rows, TH=4;
      // 地图占的格子（挖空，迷宫只在外围生成）
      const gx0=gr.left-sr.left-cw, gy0=gr.top-sr.top-ch, gx1=gr.right-sr.left+cw, gy1=gr.bottom-sr.top+ch;
      const blocked=(r,c)=>{ const x=c*cw,y=r*ch; return x+cw>gx0&&x<gx1&&y+ch>gy0&&y<gy1; };
      const grid=Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>({w:{t:1,r:1,b:1,l:1},v:blocked(r,c)})));
      const dirs=[["t",-1,0,"b"],["b",1,0,"t"],["l",0,-1,"r"],["r",0,1,"l"]];
      let s=null; for(let r=0;r<rows&&!s;r++)for(let c=0;c<cols;c++)if(!grid[r][c].v){s=[r,c];break;}
      if(s){ grid[s[0]][s[1]].v=true; const st=[s];
        while(st.length){ const [r,c]=st[st.length-1];
          const nb=dirs.map(([w,dr,dc,ow])=>{const nr=r+dr,nc=c+dc; if(nr<0||nc<0||nr>=rows||nc>=cols||grid[nr][nc].v)return null; return [w,nr,nc,ow];}).filter(Boolean);
          if(nb.length){ const [w,nr,nc,ow]=nb[(Math.random()*nb.length)|0]; grid[r][c].w[w]=0; grid[nr][nc].w[ow]=0; grid[nr][nc].v=true; st.push([nr,nc]); }
          else st.pop();
        }
      }
      const exitCol=(cols/2)|0;   // 底部出口列
      const add=(x,y,w,h)=>{ const d=document.createElement("div"); d.className="pg-wall";
        d.style.cssText=`left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px`;
        maze.appendChild(d); wallRects.push({x:docL+x,y:docT+y,w,h}); };
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){ if(blocked(r,c))continue; const cell=grid[r][c], x=c*cw, y=r*ch;
        if(cell.w.t) add(x,y,cw+TH,TH);
        if(cell.w.l) add(x,y,TH,ch+TH);
        if(c===cols-1) add(x+cw,y,TH,ch+TH);
        if(r===rows-1 && c!==exitCol) add(x,y+ch,cw+TH,TH);   // 底部边界：出口列留口
      }
    };

    const scale = () => {
      if (!bg.complete) return;
      const br=bg.getBoundingClientRect(), wr=win.getBoundingClientRect();
      const bw=br.width, bh=br.height, bgL=br.left-wr.left, bgT=br.top-wr.top;
      size = Math.round(bw * 0.23);                 // 手机/桌面统一比例：地图宽的 23%
      const factor = hwAccel ? 2 : 8;
      speed = size*factor/60;
      minX=bgL+bw*0.08; maxX=bgL+bw*0.76-size; minY=bgT+bh*0.32; maxY=bgT+bh*0.95-size;
      doorL=bgL+bw*0.53; doorR=bgL+bw*0.71; doorY=minY;        // 门口（对齐截图右侧玻璃门，可再微调）
      if (mode==="trapped" && !inited) {
        posX=(win.clientWidth-size)/2; posY=(win.clientHeight-size)/2; inited=true;
      }
      player.style.width=size+"px"; player.style.height=size+"px";
      if (mode==="trapped") { player.style.left=posX+"px"; player.style.top=posY+"px"; }
      player.style.transform="scaleX(1)";
    };
    const rebuildMaze = () => { maze.innerHTML=""; wallRects.length=0; mazeBuilt=false; buildMaze(); };
    let rebuildTimer=null;
    const scheduleRebuild = () => { clearTimeout(rebuildTimer); rebuildTimer=setTimeout(()=>{
      if (mazeActive && Math.abs(win.getBoundingClientRect().width-lastMapW)>2) rebuildMaze();
    }, 250); };

    const atDoorX = () => (posX+size/2)>=doorL && (posX+size/2)<=doorR;

    const exitDoor = () => {
      const wr=win.getBoundingClientRect();
      posX = wr.left+scrollX+posX; posY = wr.top+scrollY+posY;   // window 坐标 → 文档坐标
      mode="outside";
      player.style.position="absolute";          // 相对文档：留在原地，随页面一起滚动
      player.style.zIndex="10000";
      document.body.appendChild(player);
      player.style.left=posX+"px"; player.style.top=posY+"px";
      buildMaze(); maze.classList.add("show"); mazeActive=true;
      showHint();
    };

    const enterDoor = () => {
      mode="trapped";
      player.style.position="absolute";
      player.style.zIndex="";
      win.appendChild(player);
      posX=(doorL+doorR)/2 - size/2; posY=doorY;    // 回到门口（window 坐标）
      player.style.left=posX+"px"; player.style.top=posY+"px";
      maze.classList.remove("show"); mazeActive=false;
      hideHint();
    };

    const move = () => {
      const oldX=posX, oldY=posY;
      if (target) {                                 // 点击移动（手机）
        const dx=target.x-posX, dy=target.y-posY, d=Math.hypot(dx,dy);
        if (d<speed){ posX=target.x; posY=target.y; target=null; }
        else { posX+=dx/d*speed; posY+=dy/d*speed; }
      } else if (dir) {
        if (dir==="left") posX-=speed; if (dir==="right") posX+=speed;
        if (dir==="up") posY-=speed; if (dir==="down") posY+=speed;
      }

      if (mode==="trapped") {
        posX=Math.max(minX,Math.min(posX,maxX));
        posY=Math.max(minY,Math.min(posY,maxY));
        // 顶到门口 + 按上 → 出门（仅桌面）
        if (!isMobile() && dir==="up" && atDoorX() && posY<=doorY+2) exitDoor();
      } else {                                       // outside：文档坐标，留在原地随页面滚动
        const docW=document.documentElement.clientWidth, docH=document.documentElement.scrollHeight;
        posX=Math.max(0,Math.min(posX,docW-size));
        posY=Math.max(0,Math.min(posY,docH-size));
        // 迷宫碰撞：撞墙则退回上一步（停在墙前）
        if (mazeActive) {
          const ho=size*0.28, hb=size*0.44;   // 碰撞盒缩到小人中心 ~44%，更好穿迷宫
          for (const wl of wallRects) {
            if (posX+ho<wl.x+wl.w && posX+ho+hb>wl.x && posY+ho<wl.y+wl.h && posY+ho+hb>wl.y) { posX=oldX; posY=oldY; break; }
          }
        }
        // 走回门口（文档位置）+ 按下 → 回地图
        if (dir==="down") {
          const wr=win.getBoundingClientRect();
          const dsx=wr.left+scrollX+(doorL+doorR)/2, dsy=wr.top+scrollY+doorY;
          if (Math.hypot((posX+size/2)-dsx, (posY+size/2)-dsy) < size) enterDoor();
        }
      }
      player.style.left=posX+"px"; player.style.top=posY+"px";
    };

    const animate = (ts) => {
      const moving = Boolean(dir)||Boolean(target);
      if (ts-lastTime > (moving?interval.run:interval.idle)) { frame=(frame+1)%2; lastTime=ts; }
      let used=dir;
      if (moving && !used && target) {
        const dx=target.x-posX, dy=target.y-posY;
        used = Math.abs(dx)>Math.abs(dy) ? (dx<0?"left":"right") : (dy<0?"up":"down");
      }
      let arr, flip=1;
      if (moving) {
        arr = used==="up"?sprite.runBack : used==="down"?sprite.runDown : sprite.runFront;
        lastDir = used==="up"?"back":"front"; flip = used==="left"?-1:1;
      } else {
        arr = lastDir==="back"?sprite.idleBack:sprite.idleFront;
        const m = player.style.transform.match(/scaleX\((-?\d)\)/); flip = m?m[1]:1;
      }
      const f = arr[frame];
      player.style.transform = `scaleX(${flip})`;
      player.style.backgroundPosition = `${-f.c*100}% ${-f.r*100}%`;
    };

    const loop = (ts) => { move(); animate(ts); rafId=requestAnimationFrame(loop); };

    // ---- 出门提示 ----
    let hintEl=null, hintTimer=null;
    const showHint = () => {
      if (!hintEl) { hintEl=document.createElement("div"); hintEl.className="pg-hint"; document.body.appendChild(hintEl); }
      hintEl.textContent = ctx.t("pixelGame.wasdHint");
      requestAnimationFrame(()=>hintEl.classList.add("show"));
      clearTimeout(hintTimer); hintTimer=setTimeout(()=>hintEl&&hintEl.classList.remove("show"), 5000);
    };
    const hideHint = () => hintEl && hintEl.classList.remove("show");

    // ---- 键盘（桌面）----
    const keymap = { w:"up", a:"left", s:"down", d:"right",
                     arrowup:"up", arrowleft:"left", arrowdown:"down", arrowright:"right" };
    const onKeyDown = (e) => {
      const k=e.key.toLowerCase();
      if (keymap[k]) { dir=keymap[k]; target=null; if (k.startsWith("arrow")) e.preventDefault(); }
    };
    const onKeyUp = (e) => { const k=e.key.toLowerCase(); if (keymap[k] && dir===keymap[k]) dir=null; };
    addEventListener("keydown", onKeyDown);
    addEventListener("keyup", onKeyUp);

    // ---- 方向键按钮 ----
    win.querySelectorAll(".cbtn").forEach((btn) => {
      const d = btn.dataset.dir;
      btn.addEventListener("mousedown", ()=>{ dir=d; target=null; });
      btn.addEventListener("mouseup", ()=>{ dir=null; });
      btn.addEventListener("mouseleave", ()=>{ dir=null; });
      btn.addEventListener("touchstart", (e)=>{ e.preventDefault(); dir=d; target=null; }, {passive:false});
      btn.addEventListener("touchend", (e)=>{ e.preventDefault(); dir=null; }, {passive:false});
    });

    // ---- 点击地图移动（手机，仅 trapped）----
    win.addEventListener("touchend", (e) => {
      if (!isMobile() || mode!=="trapped") return;
      e.preventDefault();
      const wr=win.getBoundingClientRect(), tch=e.changedTouches[0];
      const br=bg.getBoundingClientRect(), ox=br.left-wr.left, oy=br.top-wr.top;
      const rx=tch.clientX-wr.left-size/2, ry=tch.clientY-wr.top-size/2;
      const bw=br.width, bh=br.height;
      target={ x:Math.max(ox+bw*0.08,Math.min(rx,ox+bw*0.76-size)),
               y:Math.max(oy+bh*0.32,Math.min(ry,oy+bh*0.95-size)) }; dir=null;
    }, {passive:false});

    bg.onload = scale;
    if (bg.complete) scale();
    this._onResize = () => { scale(); if (mazeActive) scheduleRebuild(); };
    addEventListener("resize", this._onResize);

    this._mode = () => mode;
    this._start = () => { if (!running){ running=true; lastTime=performance.now(); rafId=requestAnimationFrame(loop); } };
    this._stop  = () => { if (running){ cancelAnimationFrame(rafId); running=false; } };
    this._cleanup = () => {
      removeEventListener("keydown", onKeyDown); removeEventListener("keyup", onKeyUp);
      if (this._onResize) removeEventListener("resize", this._onResize);
      hintEl && hintEl.remove(); player.remove();
    };
  },

  onEnter() { this._start?.(); },
  // 出门后小人在整页活动，即使本板块离开视口也要继续；只有还困在地图里才暂停
  onLeave() { if (this._mode && this._mode()==="trapped") this._stop?.(); },
  destroy() { this._stop?.(); this._cleanup?.(); },
};
