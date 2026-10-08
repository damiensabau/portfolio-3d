/* ---------- scénario de test (ajouté à la fin du module) ---------- */
{
const pump = (n) => { for (let i=0;i<n;i++){ const q = globalThis.__raf.splice(0); for (const cb of q) cb(0); } };
const log = (...a) => console.log('[T]', ...a);
const expect = (cond, msg) => { if (!cond) globalThis.__errs.push('EXPECT: ' + msg); };
try {
  pump(3);
  bootEl.hidden = false;
  start(); pump(80);
  log('after start', st.mode, 'tune', st.tune, 'busy', st.busy);
  expect(st.mode === 'menu' && !st.busy, 'menu ready after boot');

  __key('ArrowDown'); pump(2); log('sel', st.sel, 'tune', st.tune, 'dial', st.dialPos); expect(st.dialPos === 3, 'dial follows selection');
  expect(st.sel === 1 && st.tune === 3, 'arrow down moves selection and tune');
  __key('ArrowUp'); __key('ArrowUp'); pump(2); expect(st.sel === 5 && st.tune === 7, 'wrap up to contact');

  for (let i=0;i<5;i++){ stepTune(1); pump(3); }
  log('tune after zapping', st.tune, 'dialPos', st.dialPos);
  expect(st.tune === 12, 'reach channel 12');
  expect(term.booted, 'terminal booted');
  for (const c of ['aide','whoami','projets','competences','formation','contact','noctura','ls','cat secret.txt','cat cv.txt','sudo rm -rf','date','echo salut','zzz','help']) termRun(c);
  log('term lines', term.lines.length);
  __key('h'); __key('i'); __key('Enter'); pump(2);
  termRun('langue en'); expect(LANG === 'en', 'lang switched to en from terminal'); pump(3);
  termRun('lang fr'); expect(LANG === 'fr', 'lang back to fr');
  termRun('effacer'); expect(term.lines.length === 0, 'clear');
  stepTune(1); pump(3); expect(st.tune === 1, 'wrap to channel 1 (mire)'); pump(3);
  stepTune(-1); pump(3); expect(st.tune === 12, 'back to 12');
  termRun('projet 3'); pump(250);
  log('after projet 3', st.mode, 'cur', st.cur, 'playing', st.playing, 'pview', st.pview, 'media', media.playing);
  expect(st.mode === 'section' && st.cur === PROJ && st.playing === 2 && st.pview === 'detail', 'tape 3 playing from terminal');
  expect(media.tapes[2].inVCR, 'tape 3 in VCR');
  log('links', linksEl.hidden, linksEl.innerHTML);
  scrollBy(400); pump(20);
  playProject(0); pump(120); expect(st.playing === 0 && media.tapes[0].inVCR && !media.tapes[2].inVCR, 'swap tapes');
  log('docupedia links hidden?', linksEl.hidden);
  playProject(5); pump(120); expect(st.playing === 5, 'portfolio tape');
  log('portfolio link', linksEl.innerHTML);
  __key('Escape'); pump(60); expect(st.pview === 'list' && st.playing === -1, 'escape ejects');
  const ps = st.psel; __key('ArrowDown'); __key('Enter'); pump(120); expect(st.playing === (ps+1)%6, 'list enter plays next tape');
  __key('Escape'); pump(40); __key('Escape'); pump(80);
  log('back to menu', st.mode, 'tune', st.tune);
  expect(st.mode === 'menu', 'two escapes return to menu');

  // chaînes vides et mire
  tuneTo(1); pump(4); tuneTo(9); pump(4); tuneTo(11); pump(4); tuneTo(4); pump(4);
  expect(st.tune === 4 && st.sel === 2, 'tune 4 selects projets');
  // lumière et langue
  __key('l'); pump(40); expect(!lightsOn, 'light off'); log('hemi', hemi.intensity.toFixed(2), 'bulb', bulbLight.intensity.toFixed(2));
  lightBtn.click(); pump(40); expect(lightsOn, 'light on');
  langBtn.click(); pump(5); expect(LANG === 'en' && UI.lang === 'en', 'lang button'); log('chan', chan.textContent, '| hint', hint.textContent);
  langBtn.click(); pump(5);
  // toutes les sections
  for (let i=0;i<6;i++){ openSection(i); pump(60); expect(st.mode === 'section' && st.cur === i, 'open section ' + i); scrollBy(2000); pump(20); __key('Escape'); pump(70); if (st.mode !== 'menu'){ __key('Escape'); pump(70); } }
  expect(st.mode === 'menu', 'menu at end of sections loop');

  // pointeur : écran du menu
  const hit = (object, uv = {x:.5, y:.5}) => [{object, uv, point:new THREE.Vector3()}];
  globalThis.__hits = hit(tvs[0].screen, {x:.3, y:.5});
  glCanvas.__fire('pointermove', {clientX:300, clientY:300}); pump(2);
  log('hover menu', tvs[0].hover, 'sel', st.sel);
  glCanvas.__fire('pointerdown', {clientX:300, clientY:300}); glCanvas.__fire('pointerup', {clientX:300, clientY:300}); pump(80);
  log('after click menu', st.mode, st.cur);
  if (st.mode === 'section'){ __key('Escape'); pump(80); if (st.mode !== 'menu'){ __key('Escape'); pump(80); } }
  // bouton de chaîne : clic puis glisser
  const dialMesh = tvs[0].dial.children[0];
  globalThis.__hits = hit(dialMesh);
  const t0 = st.tune;
  glCanvas.__fire('pointerdown', {clientX:600, clientY:300}); glCanvas.__fire('pointerup', {clientX:600, clientY:300}); pump(3);
  expect(st.tune === (t0 % 12) + 1, 'dial click steps channel');
  glCanvas.__fire('pointerdown', {clientX:700, clientY:300});
  glCanvas.__fire('pointermove', {clientX:700, clientY:420}); glCanvas.__fire('pointermove', {clientX:560, clientY:430});
  glCanvas.__fire('pointerup', {clientX:560, clientY:430}); pump(3);
  log('tune after drag', st.tune);
  glCanvas.__fire('wheel', {clientX:600, clientY:300, deltaY:100}); pump(3);
  // cassette cliquée depuis le menu
  tuneTo(2); pump(3);
  globalThis.__hits = hit(media.tapes[3].group.children[0]);
  glCanvas.__fire('pointermove', {clientX:10, clientY:10}); pump(2);
  glCanvas.__fire('pointerdown', {clientX:10, clientY:10}); glCanvas.__fire('pointerup', {clientX:10, clientY:10}); pump(260);
  expect(st.playing === 3, 'tape click from menu plays tape 4'); log('tape click', st.mode, st.cur, st.playing);
  // lampe
  globalThis.__hits = hit(lamp.meshes[0]);
  glCanvas.__fire('pointerdown', {clientX:10, clientY:10}); glCanvas.__fire('pointerup', {clientX:10, clientY:10}); pump(5);
  expect(!lightsOn, 'lamp click toggles light');
  globalThis.__hits = [];
  // version texte
  $('txtBtn').click(); expect(!textcv.hidden, 'text version opens'); __key('Escape'); expect(textcv.hidden, 'text version closes');
  log('textcv length', $('tcBody').innerHTML.length);
  log('done; mode', st.mode, 'tune', st.tune, 'clock', clockT.toFixed(1));
} catch(e){ globalThis.__errs.push('THROW: ' + (e && e.stack || e)); }
}
