/* =========================================================
   CANAL 12 : terminal caché
   ========================================================= */
const G = {fg:'#8dffa4', dim:'#3f8a50', bg0:'#06140a', bg1:'#020703'};
const term = {lines:[], input:'', hist:[], hi:-1, booted:false};
function termPrint(x){ for (const l of [].concat(x)) term.lines.push(String(l)); if (term.lines.length > 400) term.lines.splice(0, term.lines.length - 400); }
function termBoot(){ if (term.booted) return; term.booted = true; termPrint(CV.term.welcome); }

function termRun(raw){
  const line = raw.trim(); const T = CV.term;
  termPrint('> ' + line);
  if (!line) return;
  term.hist.push(line); term.hi = -1;
  const [c0, ...args] = line.split(/\s+/); const c = c0.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const arg = args.join(' ');
  const is = (...names) => names.includes(c);
  if (is('aide','help','?','h')) termPrint(T.help);
  else if (is('whoami','qui')) termPrint(T.whoami);
  else if (is('projets','projects')){
    termPrint(T.projectsIntro);
    CV.projects.forEach((p,i)=>termPrint(`  ${pad2(i+1)}  ${p.title}  ·  ${p.status}`));
    termPrint(T.projectsOutro);
  }
  else if (is('projet','project','play','lire')){
    const n = parseInt(arg, 10);
    if (!(n >= 1 && n <= CV.projects.length)) termPrint(T.projectBad);
    else { termPrint(T.projectGo); after(.5, ()=>playProject(n-1, true)); }
  }
  else if (is('competences','skills','stack')) termPrint(T.skills);
  else if (is('formation','education','etudes')) termPrint(T.education);
  else if (is('contact','mail','email')) termPrint(T.contact);
  else if (is('noctura','esport')) termPrint(T.noctura);
  else if (is('ls','dir')) termPrint(T.ls);
  else if (is('cat','type')){
    const a = arg.toLowerCase();
    if (a.includes('secret')) termPrint(T.secret);
    else if (a.includes('cv')) termPrint(T.cv);
    else if (a.includes('proj')) termRun('projets');
    else termPrint(`cat: ${arg || '?'}: ${LANG === 'fr' ? 'introuvable' : 'not found'}`);
  }
  else if (is('sudo','su','rm')) termPrint(T.sudo);
  else if (is('date','time')) termPrint(T.date());
  else if (is('echo')) termPrint(arg);
  else if (is('clear','cls','effacer')) term.lines = [];
  else if (is('lang','langue','language')){
    const want = arg.toLowerCase().startsWith('en') ? 'en' : arg.toLowerCase().startsWith('fr') ? 'fr' : (LANG === 'fr' ? 'en' : 'fr');
    setLang(want); termPrint(CV.term.langSet);
  }
  else if (is('exit','quit','quitter','sortir','menu','q')){ termPrint(T.exit); after(.4, ()=>tuneTo(2)); }
  else termPrint(T.unknown(c0));
}

function drawTerminal(tv, t){
  const ctx = tv.ctx;
  const g = ctx.createRadialGradient(CW/2, CH/2, 80, CW/2, CH/2, 720); g.addColorStop(0, G.bg0); g.addColorStop(1, G.bg1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  safeBegin(ctx); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  tv.hits = [{x:0, y:0, w:CW, h:CH, act:'term'}];
  ctx.fillStyle = G.dim; ctx.font = '30px VT323'; ctx.fillText(UI.termTitle, 100, 108);
  ctx.textAlign = 'right'; ctx.fillText(LANG.toUpperCase() + ' · ' + new Date().toLocaleTimeString(LANG === 'fr' ? 'fr-FR' : 'en-GB', {hour:'2-digit', minute:'2-digit'}), 924, 108); ctx.textAlign = 'left';
  ctx.fillStyle = G.dim; ctx.fillRect(100, 124, 824, 2);
  ctx.font = '31px VT323';
  const rows = [];
  for (const l of term.lines){ if (l === '') { rows.push(''); continue; } for (const w of wrap(ctx, l, 820)) rows.push(w); }
  const caret = Math.floor(t*2.2)%2 ? '█' : ' ';
  const inputRows = wrap(ctx, '> ' + term.input + caret, 820);
  const maxRows = 16, out = rows.slice(-(maxRows - inputRows.length));
  let y = 168;
  for (const r of out){ ctx.fillStyle = r.startsWith('> ') ? G.dim : G.fg; ctx.fillText(r, 100, y); y += 33; }
  ctx.fillStyle = '#c9ffd2'; for (const r of inputRows){ ctx.fillText(r, 100, y); y += 33; }
  if (coarse && !term.input && document.activeElement !== termInput){ ctx.fillStyle = G.dim; ctx.font = '26px VT323'; ctx.fillText(LANG === 'fr' ? 'TOUCHEZ L’ÉCRAN POUR TAPER' : 'TAP THE SCREEN TO TYPE', 100, 728); }
  ctx.restore();
}
