/* =========================================================
   MIRE (chargement + canal 01), VERSION TEXTE, LANGUE DU DOM
   ========================================================= */
const $ = (id) => document.getElementById(id);

// mire de réglage originale : barres, grille, cercle, rampe de gris
function drawMire(ctx, w, h, t, o = {}){
  ctx.save();
  ctx.fillStyle = '#121212'; ctx.fillRect(0, 0, w, h);
  const bars = ['#c0c0c0','#c0c000','#00c0c0','#00c000','#c000c0','#c00000','#0000c0'];
  const bh = h*.52, bw = w/bars.length;
  bars.forEach((c,i)=>{ ctx.fillStyle = c; ctx.fillRect(Math.floor(i*bw), 0, Math.ceil(bw), bh); });
  const rev = ['#0000c0','#121212','#c000c0','#121212','#00c0c0','#121212','#c0c0c0'];
  rev.forEach((c,i)=>{ ctx.fillStyle = c; ctx.fillRect(Math.floor(i*bw), bh, Math.ceil(bw), h*.07); });
  for (let i=0;i<8;i++){ const v = Math.round(i*255/7); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(i*w/8, h*.82, Math.ceil(w/8), h*.18); }
  // grille et cercle
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = Math.max(1, w/512);
  for (let x=w/16; x<w; x+=w/16){ ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h*.82); ctx.stroke(); }
  for (let y=h/12; y<h*.82; y+=h/12){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(2, w/300);
  ctx.beginPath(); ctx.arc(w/2, h*.43, h*.36, 0, Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w/2 - h*.36, h*.43); ctx.lineTo(w/2 + h*.36, h*.43); ctx.moveTo(w/2, h*.07); ctx.lineTo(w/2, h*.79); ctx.stroke();
  // cartouche central
  const cw = w*.52, chh = h*.2, cx = w/2 - cw/2, cy = h*.43 - chh/2;
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(cx, cy, cw, chh);
  ctx.strokeStyle = '#ffb547'; ctx.lineWidth = Math.max(2, w/340); ctx.strokeRect(cx, cy, cw, chh);
  ctx.fillStyle = '#ffb547'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(h*.085)}px VT323, "Courier New", monospace`;
  ctx.fillText(o.title || 'DS·VISION', w/2, cy + chh*.38);
  ctx.font = `${Math.round(h*.045)}px VT323, "Courier New", monospace`; ctx.fillStyle = '#e9c993';
  ctx.fillText(o.sub || '', w/2, cy + chh*.76);
  // barre de progression ou invitation
  if (o.progress != null){
    const pw = w*.5, ph = h*.035, px = w/2 - pw/2, py = h*.735;
    ctx.fillStyle = '#0b0b0b'; ctx.fillRect(px-4, py-4, pw+8, ph+8);
    ctx.fillStyle = '#ffb547'; ctx.fillRect(px, py, pw*Math.min(1, o.progress), ph);
  }
  if (o.footer){
    ctx.fillStyle = '#0b0b0b'; ctx.fillRect(w*.2, h*.86, w*.6, h*.09);
    ctx.fillStyle = Math.floor(t*2) % 2 ? '#ffb547' : '#9a6a26';
    ctx.font = `${Math.round(h*.05)}px VT323, "Courier New", monospace`; ctx.fillText(o.footer, w/2, h*.905);
  }
  // balayage lumineux
  const sy = ((t*.35) % 1) * h;
  const g = ctx.createLinearGradient(0, sy-40, 0, sy+40); g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(.5,'rgba(255,255,255,.07)'); g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, sy-40, w, 80);
  ctx.restore();
}

/* ---------- écran de chargement ---------- */
const loaderEl = $('loader'), mireCanvas = $('mire'), loadTxt = $('loadTxt');
let loadP = 0, loaderOn = true;
function setProgress(p){ loadP = Math.max(loadP, p); if (loadTxt) loadTxt.textContent = `${UI.loading} ${Math.round(loadP*100)} %`; }
(function loaderLoop(){
  if (!loaderOn || !mireCanvas) return;
  const ctx = mireCanvas.getContext('2d');
  drawMire(ctx, mireCanvas.width, mireCanvas.height, performance.now()/1000, {sub:UI.mireSub, progress:loadP});
  requestAnimationFrame(loaderLoop);
})();
function hideLoader(){
  setProgress(1);
  setTimeout(()=>{ loaderEl.classList.add('off'); $('boot').hidden = false; setTimeout(()=>{ loaderOn = false; loaderEl.remove(); }, 700); }, 250);
}

/* ---------- version texte (accessibilité + secours sans WebGL) ---------- */
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function renderTextCV(){
  let html = '';
  for (const s of CV.sections){
    html += `<div class="tc-sec"><h3>${esc(s.title)}</h3>`;
    if (s.projects){
      CV.projects.forEach((p, i)=>{
        const meta = PROJECT_META[i];
        html += `<h4>${esc(p.title)}</h4><p class="sub">${esc(p.sub)} · ${esc(p.status)}</p><p>${esc(p.desc)}</p>`;
        if (p.bullets.length) html += '<ul>' + p.bullets.map(b=>`<li>${esc(b)}</li>`).join('') + '</ul>';
        html += `<div class="tags">${p.stack.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`;
        if (meta.link && p.linkLabel) html += `<p><a href="${esc(meta.link)}" target="_blank" rel="noopener">${esc(p.linkLabel)}</a></p>`;
      });
    }
    let inList = false, inDl = false;
    const close = () => { if(inList){html+='</ul>';inList=false;} if(inDl){html+='</dl>';inDl=false;} };
    for (const b of s.blocks){
      if (b.li){ if(inDl){html+='</dl>';inDl=false;} if(!inList){html+='<ul>';inList=true;} html+=`<li>${esc(b.li)}</li>`; continue; }
      if (b.kv){ if(inList){html+='</ul>';inList=false;} if(!inDl){html+='<dl>';inDl=true;} html+=`<dt>${esc(b.kv[0])}</dt><dd>${esc(b.kv[1])}</dd>`; continue; }
      close();
      if (b.h) html += `<h4>${esc(b.h)}</h4>`;
      else if (b.sub) html += `<p class="sub">${esc(b.sub)}</p>`;
      else if (b.p) html += `<p>${esc(b.p)}</p>`;
      else if (b.tags) html += `<div class="tags">${b.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`;
    }
    close();
    if (s.links) html += s.links.map(l=>`<p><a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a></p>`).join('');
    html += '</div>';
  }
  $('tcBody').innerHTML = html;
}

/* ---------- textes du DOM selon la langue ---------- */
let refreshToggles = null; // défini plus loin, une fois le son et la lumière prêts
function applyLangDOM(){
  document.documentElement.lang = UI.lang;
  $('txtBtn').textContent = UI.textVersion;
  $('langBtn').textContent = UI.otherLang;
  $('langBtn').setAttribute('aria-label', UI.lang === 'fr' ? 'Switch to English' : 'Passer en français');
  $('closeTxt').textContent = UI.close;
  $('backBtn').textContent = UI.backMenu;
  $('tcRole').textContent = UI.bootRole;
  const bk = $('bootKicker'); if (bk){ bk.textContent = UI.bootKicker; $('bootRole').textContent = UI.bootRole; $('power').textContent = UI.bootPower; $('bootSmall').textContent = UI.bootSmall; }
  if (refreshToggles) refreshToggles();
  renderTextCV();
  setProgress(loadP);
}
applyLangDOM();

const textcv = $('textcv');
$('txtBtn').onclick = () => { textcv.hidden = false; $('closeTxt').focus(); };
$('closeTxt').onclick = () => { textcv.hidden = true; $('gl').focus(); };

function webglFail(){
  loaderOn = false; loaderEl?.remove();
  $('boot')?.remove();
  for (const id of ['closeTxt','txtBtn','sndBtn','lightBtn']) { const el = $(id); if (el) el.hidden = true; }
  textcv.hidden = false;
}
