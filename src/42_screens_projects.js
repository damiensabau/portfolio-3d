/* =========================================================
   CANAL PROJETS : vidéothèque (liste) et fiche lue au magnétoscope
   ========================================================= */
function layoutProject(ctx, i){
  const p = CV.projects[i], meta = PROJECT_META[i], ops = [];
  const SX = 448, SW = 376;                     // colonne de droite, à côté de l'aperçu
  ops.push({k:'shot', i, y:0, h:262});
  ops.push({k:'lbl', t:UI.stack, x:SX, y:0});
  ctx.font = '30px VT323';
  let x = 0, y = 40;
  for (const tg of p.stack){ const tw = ctx.measureText(tg).width + 28;
    if (x + tw > SW && x > 0){ x = 0; y += 54; }
    ops.push({k:'tag', t:tg, x:SX + x, y, w:tw, f:'30px VT323'}); x += tw + 12; }
  y += 66;
  ops.push({k:'lbl', t:UI.status, x:SX, y}); y += 36;
  ops.push({k:'stat', t:p.status, x:SX, y, color:meta.color}); y += 44;
  const top = Math.max(262, y) + 30;
  const blocks = [{sub:p.sub}, {p:p.desc}, ...p.bullets.map(b=>({li:b}))];
  if (!meta.link || !p.linkLabel) blocks.push({gap:1}, {warn:UI.internal});
  const L = layoutBlocks(ctx, blocks, AREA.w, top);
  return {ops: ops.concat(L.ops), height: L.height + 10};
}

/* ---------- aperçus dessinés en attendant les vraies captures ---------- */
function drawMock(ctx, kind, x, y, w, h, t, color){
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#0d0904'; ctx.fillRect(x, y, w, h);
  const fg = C.fg, dim = C.faint, acc = color;
  ctx.fillStyle = dim; ctx.fillRect(x, y, w, 26); ctx.fillStyle = acc; ctx.fillRect(x+10, y+9, 8, 8);
  ctx.fillStyle = C.dim; ctx.fillRect(x+26, y+9, 8, 8); ctx.fillRect(x+42, y+9, 8, 8);
  const bx = x + 14, by = y + 40, bw = w - 28, bh = h - 54;
  if (kind === 'docs'){
    ctx.fillStyle = dim; ctx.fillRect(bx, by, 90, bh);
    for (let i=0;i<6;i++){ ctx.fillStyle = i === 1 ? acc : C.dim; ctx.fillRect(bx+10, by+12+i*26, 60, 10); }
    for (let i=0;i<6;i++){ const ry = by + 8 + i*30; ctx.fillStyle = C.dim; ctx.fillRect(bx+106, ry, 18, 22); ctx.fillStyle = fg; ctx.fillRect(bx+132, ry+4, 120 + (i*37 % 90), 8); ctx.fillStyle = dim; ctx.fillRect(bx+132, ry+15, 80, 5); }
  } else if (kind === 'leaderboard'){
    for (let i=0;i<7;i++){ const ry = by + i*29; ctx.fillStyle = i%2 ? 'rgba(255,181,71,.05)' : 'rgba(255,181,71,.1)'; ctx.fillRect(bx, ry, bw, 26);
      ctx.fillStyle = i < 3 ? acc : C.dim; ctx.font = '22px VT323'; ctx.fillText('#' + (i+1), bx+8, ry+20);
      ctx.fillStyle = fg; ctx.fillRect(bx+52, ry+9, 90 - i*6, 8);
      ctx.fillStyle = acc; ctx.fillRect(bx+bw-150, ry+8, 140 - i*16, 10); }
  } else if (kind === 'stats'){
    for (let i=0;i<3;i++){ const cx = bx + i*(bw/3); ctx.strokeStyle = C.dim; ctx.lineWidth = 2; ctx.strokeRect(cx+4, by, bw/3-8, 70);
      ctx.fillStyle = i === 0 ? acc : fg; ctx.font = '40px VT323'; ctx.fillText(['2.41','18%','312'][i], cx+16, by+50); }
    ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.beginPath();
    for (let k=0;k<=24;k++){ const px = bx + k*bw/24, py = by + bh - 20 - (Math.sin(k*.7 + t*.8)*.5+.5)*(bh-110); k ? ctx.lineTo(px,py) : ctx.moveTo(px,py); }
    ctx.stroke();
  } else if (kind === 'dashboard'){
    for (let i=0;i<4;i++){ const on = i !== 2 || Math.floor(t*2)%2; ctx.fillStyle = on ? (i === 2 ? acc : '#7dff9c') : dim; ctx.beginPath(); ctx.arc(bx+16, by+16+i*34, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = C.dim; ctx.fillRect(bx+36, by+11+i*34, 110, 10); }
    ctx.strokeStyle = C.dim; ctx.lineWidth = 2; ctx.strokeRect(bx+170, by, bw-170, bh);
    ctx.font = '20px VT323';
    for (let i=0;i<7;i++){ ctx.fillStyle = i === 4 ? acc : C.dim; ctx.fillText(['scan ok','hook check','module ok','flag: review','net ok','idle','sync'][i], bx+182, by+24+i*24); }
  } else if (kind === 'phone'){
    const pw = 130, ph = bh, px = x + w/2 - pw/2;
    ctx.strokeStyle = fg; ctx.lineWidth = 3; ctx.strokeRect(px, by, pw, ph);
    for (let r=0;r<3;r++) for (let c=0;c<3;c++){ ctx.fillStyle = (r+c)%3 === 0 ? acc : C.dim; ctx.fillRect(px+10+c*39, by+12+r*52, 32, 44); }
    ctx.fillStyle = fg; ctx.font = '22px VT323'; ctx.fillText('★ 8.4', px - 92, by + 40); ctx.fillText('VU ✓', px + pw + 18, by + 40);
  } else {
    for (let i=0;i<3;i++){ const tx = bx + 20 + i*(bw-40)/3, tw = (bw-40)/3 - 18, th = tw*.75, ty = by + 30 + (i%2)*24;
      ctx.fillStyle = C.dim; ctx.fillRect(tx-6, ty-6, tw+12, th+12); ctx.fillStyle = i === 1 ? acc : '#2a1c0b'; ctx.fillRect(tx, ty, tw, th); }
  }
  // étiquette « capture à venir »
  ctx.font = '22px VT323'; const lw = ctx.measureText(UI.shotPlaceholder).width + 20;
  ctx.fillStyle = 'rgba(0,0,0,.75)'; ctx.fillRect(x + w - lw - 8, y + h - 34, lw, 26);
  ctx.fillStyle = C.soft; ctx.fillText(UI.shotPlaceholder, x + w - lw + 2, y + h - 15);
  ctx.restore();
}
function drawShot(ctx, i, x, y, w, h, t){
  const meta = PROJECT_META[i], url = (MEDIA.shots[meta.id] || [])[0], img = getImg(url);
  if (img){ ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); drawCover(ctx, img, x, y, w, h); }
  else drawMock(ctx, meta.mock, x, y, w, h, t, meta.color);
  ctx.strokeStyle = C.dim; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
}

/* ---------- incrustations du magnétoscope ---------- */
function drawVHSOSD(ctx, t){
  const el = Math.max(0, t - st.playT);
  ctx.save(); ctx.font = '44px VT323';
  const on = el > 3 || Math.floor(el*2.5)%2 === 0;
  if (on){ ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillText('▶ ' + UI.play, 103, 67); ctx.fillStyle = '#eaffdf'; ctx.fillText('▶ ' + UI.play, 100, 64); }
  const s = Math.floor(el), tc = `SP ${Math.floor(s/3600)}:${pad2(Math.floor(s/60)%60)}:${pad2(s%60)}`;
  ctx.font = '34px VT323'; ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillText(tc, 927, 745); ctx.fillStyle = '#eaffdf'; ctx.fillText(tc, 924, 742);
  ctx.restore();
}

/* ---------- dessin du canal Projets ---------- */
function drawProjects(tv, t, active){
  const ctx = tv.ctx, sec = tv.sec; paintBase(ctx); safeBegin(ctx); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  tv.hits = [];
  if (st.pview === 'detail' && st.playing >= 0){
    const i = st.playing, p = CV.projects[i];
    if (!tv.dlayout || tv.dlayout.i !== i || tv.dlayout.lang !== LANG){ tv.dlayout = {i, lang:LANG, ...layoutProject(ctx, i)}; }
    drawHeader(ctx, tv, sec.ch, p.title, UI.backList, active, t, 'list');
    const L = tv.dlayout, viewH = AREA.bottom - AREA.top;
    ctx.save(); ctx.beginPath(); ctx.rect(80, AREA.top-4, 860, viewH+8); ctx.clip();
    drawOps(ctx, L.ops, AREA.x, AREA.top - tv.scroll, (o, y) => {
      if (o.k === 'shot') drawShot(ctx, o.i, AREA.x, y, 420, 262, t);
      else if (o.k === 'lbl'){ ctx.fillStyle = C.dim; ctx.font = '28px VT323'; ctx.fillText(o.t, AREA.x + o.x, y + 24); }
      else if (o.k === 'stat'){ ctx.fillStyle = o.color; ctx.fillRect(AREA.x + o.x, y + 6, 14, 26); ctx.fillStyle = C.fg; ctx.font = '36px VT323'; ctx.fillText(o.t, AREA.x + o.x + 26, y + 30); }
    });
    ctx.restore();
    drawScrollbar(ctx, tv.scroll, L.height, coarse);
    drawVHSOSD(ctx, t);
    ctx.restore();
    return;
  }
  drawHeader(ctx, tv, sec.ch, sec.title, UI.back, active, t);
  ctx.fillStyle = C.dim; ctx.font = '28px VT323'; ctx.fillText(UI.listHead, 100, 250);
  const y0 = 316, lh = 62;
  CV.projects.forEach((p, i)=>{
    const y = y0 + i*lh, sel = active && i === st.psel, meta = PROJECT_META[i];
    if (sel){ ctx.fillStyle = C.fg; ctx.fillRect(86, y-44, 852, 56); }
    ctx.fillStyle = meta.color; ctx.fillRect(100, y-38, 56, 42);
    ctx.fillStyle = C.ink; ctx.font = '32px VT323'; ctx.fillText(pad2(i+1), 110, y-8);
    ctx.fillStyle = sel ? C.ink : C.fg; ctx.font = '46px VT323'; ctx.fillText(fitText(ctx, p.title, 470), 176, y);
    ctx.font = '28px VT323'; ctx.textAlign = 'right'; ctx.fillStyle = sel ? C.ink : C.dim; ctx.fillText(fitText(ctx, p.status, 250), 924, y-6); ctx.textAlign = 'left';
    tv.hits.push({x:86, y:y-44, w:852, h:56, act:'proj', i});
  });
  ctx.fillStyle = C.dim; ctx.font = '28px VT323';
  ctx.fillText(coarse ? UI.hintListTouch.toUpperCase() : UI.listFoot, 100, 706);
  ctx.restore();
}
