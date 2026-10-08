/* =========================================================
   ÉCRANS (canvas 2D, 1024×768, filtrés ensuite par le shader CRT)
   ========================================================= */
const CW = 1024, CH = 768;
const C = {fg:'#ffb547', dim:'#9a6a26', faint:'#3a2810', ink:'#140c02', soft:'#f2cf94'};
const BK = 0.045; // courbure, identique au shader
const SAFE = 0.88; // le contenu est dessiné à 88 % pour rester loin des bords arrondis
function safeBegin(ctx){ ctx.save(); ctx.translate(CW/2,CH/2); ctx.scale(SAFE,SAFE); ctx.translate(-CW/2,-CH/2); }
function barrel(u, v){ let cx=u*2-1, cy=v*2-1; const kx=1+cy*cy*BK, ky=1+cx*cx*BK; cx*=kx; cy*=ky; return [cx*.5+.5, cy*.5+.5]; }
const pad2 = n => String(n).padStart(2, '0');

function paintBase(ctx){
  const g = ctx.createRadialGradient(CW/2,CH/2,80,CW/2,CH/2,720);
  g.addColorStop(0,'#1c1207'); g.addColorStop(1,'#060402');
  ctx.fillStyle = g; ctx.fillRect(0,0,CW,CH);
  ctx.fillStyle = 'rgba(255,181,71,0.045)';
  for (let x=64;x<CW;x+=64) ctx.fillRect(x,0,1,CH);
  for (let y=64;y<CH;y+=64) ctx.fillRect(0,y,CW,1);
}
function wrap(ctx, text, maxW){
  const words = String(text).split(' '), lines = []; let line = '';
  for (const w of words){ const test = line ? line+' '+w : w;
    if (ctx.measureText(test).width > maxW && line){ lines.push(line); line = w; } else line = test; }
  if (line) lines.push(line); return lines;
}
function fitText(ctx, text, maxW){
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text; while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}

/* ---------- mise en page des blocs de texte ---------- */
const AREA = {x:100, top:228, bottom:700, w:800};
function layoutBlocks(ctx, blocks, W, y0 = 0){
  const ops = []; let y = y0, first = y0 === 0;
  for (const b of blocks){
    if (b.h){ if(!first) y += 22; ctx.font='44px VT323'; for (const l of wrap(ctx,b.h,W)){ ops.push({k:'h',t:l,y,f:'44px VT323'}); y += 46; } }
    else if (b.sub){ ctx.font='30px VT323'; for (const l of wrap(ctx,b.sub,W)){ ops.push({k:'sub',t:l,y,f:'30px VT323'}); y += 34; } }
    else if (b.p){ ctx.font='34px VT323'; for (const l of wrap(ctx,b.p,W)){ ops.push({k:'p',t:l,y,f:'34px VT323'}); y += 36; } y += 10; }
    else if (b.li){ ctx.font='32px VT323'; const ls = wrap(ctx,b.li,W-34);
      ls.forEach((l,i)=>{ ops.push({k:'li',t:l,y,f:'32px VT323',bullet:i===0}); y += 33; }); y += 6; }
    else if (b.tags){ ctx.font='30px VT323'; let x = 0; y += 4;
      for (const t of b.tags){ const tw = ctx.measureText(t).width + 28;
        if (x + tw > W){ x = 0; y += 54; }
        ops.push({k:'tag',t,x,y,w:tw,f:'30px VT323'}); x += tw + 12; }
      y += 62; }
    else if (b.kv){ ctx.font='34px VT323'; const kw = Math.min(230, W*.36); const ls = wrap(ctx,b.kv[1],W-kw);
      ops.push({k:'key',t:b.kv[0],y,f:'28px VT323'});
      ls.forEach(l=>{ ops.push({k:'val',t:l,y,f:'34px VT323',kx:kw}); y += 38; }); y += 10; }
    else if (b.warn){ ctx.font='28px VT323'; for (const l of wrap(ctx,b.warn,W)){ ops.push({k:'sub',t:l,y,f:'28px VT323'}); y += 32; } }
    else if (b.gap){ y += 26; }
    first = false;
  }
  return {ops, height:y};
}
function layoutSection(ctx, sec){
  const W = sec.photo ? 520 : AREA.w;
  return layoutBlocks(ctx, sec.blocks, W);
}
function drawOps(ctx, ops, x0, oy, extra){
  for (const o of ops){
    const y = oy + o.y; if (y < AREA.top-80 || y > AREA.bottom+10) continue;
    ctx.font = o.f || '30px VT323';
    if (o.k==='h'){ ctx.fillStyle = C.fg; ctx.fillText(o.t, x0, y+36); }
    else if (o.k==='sub'){ ctx.fillStyle = C.dim; ctx.fillText(o.t, x0, y+26); }
    else if (o.k==='p'){ ctx.fillStyle = C.soft; ctx.fillText(o.t, x0, y+28); }
    else if (o.k==='li'){ ctx.fillStyle = C.fg; if (o.bullet) ctx.fillText('›', x0, y+26); ctx.fillStyle = C.soft; ctx.fillText(o.t, x0+34, y+26); }
    else if (o.k==='tag'){ ctx.strokeStyle = C.dim; ctx.lineWidth = 2; ctx.strokeRect(x0+o.x, y, o.w, 44); ctx.fillStyle = C.soft; ctx.fillText(o.t, x0+o.x+14, y+32); }
    else if (o.k==='key'){ ctx.fillStyle = C.dim; ctx.fillText(o.t, x0, y+28); }
    else if (o.k==='val'){ ctx.fillStyle = C.soft; ctx.fillText(o.t, x0+(o.kx||230), y+28); }
    else if (extra) extra(o, y);
  }
}
function drawScrollbar(ctx, scroll, height, coarseHint){
  const viewH = AREA.bottom - AREA.top, max = Math.max(0, height - viewH);
  if (max <= 0) return;
  ctx.fillStyle = C.faint; ctx.fillRect(932, AREA.top, 4, viewH);
  const hh = Math.max(40, viewH * viewH / height), yy = AREA.top + (viewH - hh) * (scroll / max);
  ctx.fillStyle = C.fg; ctx.fillRect(930, yy, 8, hh);
  if (scroll < max - 4){ ctx.fillStyle = C.dim; ctx.font = '26px VT323'; ctx.fillText(coarseHint ? UI.scrollTouch : UI.scroll, 100, 740); }
}
function drawHeader(ctx, tv, chLabel, title, backLabel, active, t, backAct = 'back'){
  ctx.fillStyle = C.dim; ctx.font = '30px VT323'; ctx.fillText(chLabel + '  //  ' + CV.name, 100, 108);
  ctx.font = '32px VT323';
  const bw = Math.max(150, ctx.measureText(backLabel).width + 40), bx = 924 - bw, by = 76, bh = 44;
  const hov = tv.hover === backAct;
  ctx.strokeStyle = hov ? C.fg : C.dim; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh);
  if (hov){ ctx.fillStyle = C.fg; ctx.fillRect(bx, by, bw, bh); }
  ctx.fillStyle = hov ? C.ink : C.fg; ctx.fillText(backLabel, bx+20, by+33);
  tv.hits.push({x:bx, y:by, w:bw, h:bh, act:backAct});
  ctx.fillStyle = C.fg; ctx.font = '78px VT323';
  ctx.fillText(fitText(ctx, title, 820) + (active && Math.floor(t*2.4)%2 ? '_' : ''), 100, 186);
  ctx.fillStyle = C.faint; ctx.fillRect(100, 206, 824, 3);
}

/* ---------- images (photo, captures) ---------- */
const imgCache = new Map();
let onImageReady = () => {};
function getImg(url){
  if (!url) return null;
  let e = imgCache.get(url);
  if (!e){ e = {img:new Image(), ok:false}; e.img.onload = () => { e.ok = true; onImageReady(); }; e.img.src = url; imgCache.set(url, e); }
  return e.ok ? e.img : null;
}
function drawCover(ctx, img, x, y, w, h){
  const r = Math.max(w/img.width, h/img.height), iw = img.width*r, ih = img.height*r;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.filter = 'grayscale(1) sepia(1) saturate(2.2) hue-rotate(-12deg) brightness(.95) contrast(1.1)';
  ctx.drawImage(img, x + (w-iw)/2, y + (h-ih)/2, iw, ih); ctx.filter = 'none';
  ctx.restore();
}
function drawPhotoFrame(ctx, x, y, w, h){
  const img = getImg(MEDIA.photo);
  ctx.fillStyle = '#0a0703'; ctx.fillRect(x, y, w, h);
  if (img) drawCover(ctx, img, x, y, w, h);
  else {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.strokeStyle = C.faint; ctx.lineWidth = 2;
    for (let i=-h; i<w; i+=22){ ctx.beginPath(); ctx.moveTo(x+i, y+h); ctx.lineTo(x+i+h, y); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#0a0703'; ctx.fillRect(x+18, y+h*.18, w-36, h*.56);
    ctx.fillStyle = C.fg; ctx.font = '150px VT323'; ctx.textAlign = 'center'; ctx.fillText('DS', x+w/2, y+h*.56);
    ctx.font = '26px VT323'; ctx.fillStyle = C.dim; ctx.fillText(UI.photoPlaceholder, x+w/2, y+h*.68); ctx.textAlign = 'left';
  }
  ctx.strokeStyle = C.dim; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = C.fg; for (const [cx,cy] of [[x,y],[x+w,y],[x,y+h],[x+w,y+h]]) ctx.fillRect(cx-7, cy-7, 14, 14);
}

/* ---------- canal sans signal (neige dessinée + incrustation) ---------- */
const noiseC = document.createElement('canvas'); noiseC.width = 256; noiseC.height = 192;
const noiseX = noiseC.getContext('2d'), noiseD = noiseX.createImageData(256, 192);
function drawNoise(ctx, alpha = 1){
  const d = noiseD.data;
  for (let i=0;i<d.length;i+=4){ const v = Math.random()*255; d[i] = v; d[i+1] = v*.92; d[i+2] = v*.78; d[i+3] = 255; }
  noiseX.putImageData(noiseD, 0, 0);
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = false; ctx.drawImage(noiseC, 0, 0, CW, CH); ctx.restore();
}
function drawOSDChannel(ctx, n){
  ctx.save(); ctx.font = '84px VT323'; ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillText('CH ' + pad2(n), 928, 136);
  ctx.fillStyle = '#e8ffd8'; ctx.fillText('CH ' + pad2(n), 924, 132); ctx.restore();
}
function drawNoSignal(tv, t, n){
  const ctx = tv.ctx; drawNoise(ctx); safeBegin(ctx); tv.hits = [];
  drawOSDChannel(ctx, n);
  ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(262, 330, 500, 110);
  ctx.textAlign = 'center'; ctx.fillStyle = '#e8ffd8'; ctx.font = '64px VT323'; ctx.fillText(UI.noSignal, 512, 405);
  if (n === 11){ ctx.font = '34px VT323'; ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(282, 470, 460, 50); ctx.fillStyle = '#e8ffd8'; ctx.fillText(UI.noSignalTease, 512, 506); }
  ctx.textAlign = 'left'; ctx.restore();
}
function drawMireChannel(tv, t){
  tv.hits = [];
  drawMire(tv.ctx, CW, CH, t, {sub:UI.mireSub, footer:UI.mireTurn});
  drawOSDChannel(tv.ctx, 1);
}

/* ---------- guide des chaînes (télé principale, canaux 2 à 7) ---------- */
function drawMenu(tv, t){
  const ctx = tv.ctx; paintBase(ctx); safeBegin(ctx); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.dim; ctx.font = '30px VT323'; ctx.fillText(UI.menuHeader, 100, 108);
  ctx.fillStyle = C.fg; ctx.font = '78px VT323'; ctx.fillText(CV.name, 100, 174);
  ctx.fillStyle = C.dim; ctx.font = '30px VT323'; ctx.fillText(fitText(ctx, CV.role, 600), 100, 210);
  ctx.font = '58px VT323'; ctx.textAlign = 'right'; ctx.fillStyle = C.fg; ctx.fillText('CH ' + pad2(st.tune), 924, 174); ctx.textAlign = 'left';
  ctx.fillStyle = C.faint; ctx.fillRect(100, 232, 824, 3);
  tv.hits = [];
  const y0 = 304, lh = 64;
  CV.sections.forEach((s,i)=>{
    const y = y0 + i*lh, sel = i === st.sel;
    if (sel){ ctx.fillStyle = C.fg; ctx.fillRect(86, y-48, 594, 60); }
    ctx.fillStyle = sel ? C.ink : C.fg; ctx.font = '58px VT323';
    ctx.fillText((sel ? '> ' : '  ') + s.label + (sel && Math.floor(t*2.4)%2 ? '_' : ''), 96, y);
    ctx.font = '28px VT323'; ctx.fillStyle = sel ? C.ink : C.dim; ctx.textAlign = 'right';
    ctx.fillText(s.ch, 664, y-6); ctx.textAlign = 'left';
    tv.hits.push({x:86, y:y-48, w:594, h:60, act:'open', i});
  });
  const px = 712, py = 286, pw = 212, ph = 150;
  ctx.strokeStyle = C.faint; ctx.lineWidth = 3; ctx.strokeRect(px, py, pw, ph);
  ctx.fillStyle = C.dim; ctx.font = '26px VT323'; ctx.fillText(UI.signal, px, py-10);
  ctx.strokeStyle = 'rgba(255,181,71,.12)'; ctx.lineWidth = 1;
  for (let i=1;i<4;i++){ ctx.beginPath(); ctx.moveTo(px+i*pw/4,py); ctx.lineTo(px+i*pw/4,py+ph); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(px,py+ph/2); ctx.lineTo(px+pw,py+ph/2); ctx.stroke();
  ctx.strokeStyle = C.fg; ctx.lineWidth = 3; ctx.beginPath();
  const f = 2 + st.sel*0.6;
  for (let x=0;x<=pw;x+=3){ const k = x/pw;
    const yy = py + ph/2 + Math.sin(k*Math.PI*2*f + t*4)*ph*.28*Math.sin(k*Math.PI) + Math.sin(k*40+t*9)*3;
    x ? ctx.lineTo(px+x, yy) : ctx.moveTo(px+x, yy); }
  ctx.stroke();
  ctx.fillStyle = C.dim; ctx.font = '26px VT323';
  UI.signalLines.forEach((l,i)=>ctx.fillText(l, px, py+ph+40+i*30));
  ctx.fillStyle = C.dim; ctx.font = '28px VT323';
  ctx.fillText(coarse ? UI.menuFootTouch : UI.menuFoot, 100, 706);
  ctx.restore();
}

/* ---------- sections classiques ---------- */
function drawSection(tv, t, active){
  if (tv.sec.projects) return drawProjects(tv, t, active);
  const ctx = tv.ctx, sec = tv.sec; paintBase(ctx); safeBegin(ctx); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  tv.hits = [];
  drawHeader(ctx, tv, sec.ch, sec.title, UI.back, active, t);
  const L = tv.layout, viewH = AREA.bottom - AREA.top;
  ctx.save(); ctx.beginPath(); ctx.rect(80, AREA.top-4, 860, viewH+8); ctx.clip();
  drawOps(ctx, L.ops, AREA.x, AREA.top - tv.scroll);
  ctx.restore();
  if (sec.photo) drawPhotoFrame(ctx, 664, AREA.top + 6, 252, 316);
  drawScrollbar(ctx, tv.scroll, L.height, coarse);
  ctx.restore();
}
