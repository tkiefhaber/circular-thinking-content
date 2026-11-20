#!/usr/bin/env node
// Checks content.json before you publish it. Usage:
//   node validate.js          -> validate only
//   node validate.js --bump   -> validate, then increase "version" by 1 (do this for every release)
// The lists below must match what the apps support. Adding to them needs an app update.
const fs = require('fs');
const GENERATORS = new Set('alphabet arpAll bluesBar bluesNote borrowedName borrowedSpot chordShow circleBlank circleNext circleWedge closeKey colorFormula colorName colorPick colorSpell daName daPick daQual daSpell daStaff degree diaChord diaNumeral diaQuality earChord earInterval earProg earScale enharmonic findAny findNatural halfWhole harmonic idAny idNatural inScale intBuild intName intSemis intShow invBass invName invSlash invStaff keyFromCount melodicWrite minorChord minorNumeral minorProg minorRecipe minorSig modeColor modeFit modeName modeParent modePick modeSpell pentDrop pickMinor pickPent pickScale pivot positionKey progIdentify progMissing progNum progSpell recipe relMajor relMinor secDomBuild secDomFind sevName sevPick sevQual sevSpell sevStaff sigCount sigNotes sigOrder sigToKey staffName staffPlace staffScale transpose triadName triadPick triadQual triadSpell triadStaff tritoneSub voiceLead writeMinor writePent writeScale '.trim().split(/\s+/));
const EXPLORERS = { notes: ['naturals'], staff: [], scale: ['keys', 'types'], chord: ['quals'], circle: ['mode'], interval: [], diatonic: ['minor', 'sevenths'], progression: ['sets', 'minor'], inversion: ['quals'], ear: ['kind'] };
const GAME_ENGINES = ['find', 'name', 'chordhunt', 'staff', 'earInterval', 'earChord', 'keysig', 'circle', 'scaleBuild', 'chordBuild', 'transpose'];
const KEYS = ['C','G','D','A','E','B','F#','C#','F','Bb','Eb','Ab','Db','Gb','Cb','G#','D#','A#'];
const CHORD_Q = ['maj','min','dim','aug','maj7','dom7','min7','m7b5','sus2','sus4','maj6','add9','maj9','dom9','min9','dom13','dim7','dom7b9','dom7s9'];
const SCALE_T = ['major','minor','harmonic','melodic','majpent','minpent','blues','dorian','phrygian','lydian','mixolydian','locrian'];
const INTERVALS = ['m2','M2','m3','M3','P4','A4','P5','m6','M6','m7','M7','P8'];
const NUM_PROGS = ['turnaround','251','minor251','minorAndalusian','minorPop','minor145','secDom','borrowed','bVII','rhythm'];
const QUALS = new Set([...CHORD_Q, ...SCALE_T, ...INTERVALS, ...NUM_PROGS]);
const MODES = ['basic','keysig','relative','wedge'];
const SCHEMA = 2;
const errs = [];
const c = JSON.parse(fs.readFileSync(__dirname + '/content.json', 'utf8'));
if (!Number.isInteger(c.version)) errs.push('"version" must be an integer');
if (c.schema !== SCHEMA) errs.push(`"schema" must be ${SCHEMA} (only change it together with an app update)`);
const inUnits = new Set();
for (const u of c.units || []) for (const id of u.lessons) { if (!c.lessons[id]) errs.push(`unit ${u.id} lists missing lesson "${id}"`); if (inUnits.has(id)) errs.push(`lesson "${id}" is in two units`); inUnits.add(id); }
for (const [id, l] of Object.entries(c.lessons)) {
  const where = `lesson "${id}"`;
  if (!inUnits.has(id)) errs.push(`${where} is not in any unit, so nobody will see it`);
  for (const k of ['title', 'summary']) if (!l[k]) errs.push(`${where} needs "${k}"`);
  if (!Number.isInteger(l.addedIn)) errs.push(`${where} needs "addedIn" (the content version it first shipped in; drives the "New" badge)`);
  for (const b of l.blocks || []) {
    if (b.type === 'text') { if (!b.md) errs.push(`${where}: text block needs "md"`); if (b.only && !['piano','guitar','bass'].includes(b.only)) errs.push(`${where}: "only" must be piano, guitar or bass`); }
    else if (b.type === 'explorer') {
      if (!EXPLORERS[b.name]) { errs.push(`${where}: unknown explorer "${b.name}" (known: ${Object.keys(EXPLORERS).join(', ')})`); continue; }
      const o = b.options || {};
      for (const k of Object.keys(o)) if (!EXPLORERS[b.name].includes(k)) errs.push(`${where}: explorer ${b.name} has no option "${k}"`);
      (o.keys || []).forEach(k => KEYS.includes(k) || errs.push(`${where}: unknown key "${k}"`));
      (o.types || []).forEach(t => SCALE_T.includes(t) || errs.push(`${where}: unknown scale type "${t}"`));
      (o.quals || []).forEach(q => CHORD_Q.includes(q) || errs.push(`${where}: unknown chord quality "${q}"`));
      (o.sets || []).forEach(q => NUM_PROGS.includes(q) || errs.push(`${where}: unknown progression "${q}"`));
      if (o.mode && !MODES.includes(o.mode)) errs.push(`${where}: circle mode must be one of ${MODES.join(', ')}`);
      if (o.kind && !['intervals','chords','scales'].includes(o.kind)) errs.push(`${where}: ear kind must be intervals, chords or scales`);
    } else errs.push(`${where}: block type must be "text" or "explorer"`);
  }
  if (!(l.practice || []).length) errs.push(`${where} needs at least one practice entry`);
  for (const p of l.practice || []) {
    if (!GENERATORS.has(p.gen)) errs.push(`${where}: unknown generator "${p.gen}"`);
    if (!Number.isInteger(p.weight) || p.weight < 1) errs.push(`${where}: "${p.gen}" needs an integer weight >= 1`);
    ((p.params || {}).keys || []).forEach(k => KEYS.includes(k) || errs.push(`${where}: "${p.gen}" unknown key "${k}"`));
    ((p.params || {}).quals || []).forEach(q => QUALS.has(q) || errs.push(`${where}: "${p.gen}" unknown option "${q}"`));
  }
  if ((l.homework || []).length < 3) errs.push(`${where} should have at least 3 homework items`);
  for (const h of l.homework || []) {
    const texts = typeof h === 'string' ? [h] : Object.values(h);
    if (typeof h === 'object') for (const k of Object.keys(h)) if (!['piano','guitar','bass','fretted'].includes(k)) errs.push(`${where}: homework key "${k}" must be piano, guitar, bass or fretted`);
    for (const t of texts) { const left = t.replace(/\{pick:[^}]+\}|\{inst\}|\{lowstring\}/g, ''); if (/[{}]/.test(left)) errs.push(`${where}: homework has an unknown {token}: ${t}`); }
  }
}
const gids = new Set();
for (const g of c.games || []) {
  const where = `game "${g.id}"`;
  if (gids.has(g.id)) errs.push(`${where} is listed twice`); gids.add(g.id);
  if (!GAME_ENGINES.includes(g.engine)) errs.push(`${where}: unknown engine "${g.engine}" (known: ${GAME_ENGINES.join(', ')})`);
  if (!g.title || !g.desc) errs.push(`${where} needs a title and desc`);
  if (!Number.isInteger(g.secs) || g.secs < 15) errs.push(`${where}: secs must be a whole number of at least 15`);
  // Engine-specific "types" values; quals and keys use the shared lists.
  const ENGINE_TYPES = { find: ['natural', 'accidental'], name: ['natural', 'accidental'], staff: ['staff', 'ledger'], circle: ['V', 'IV', 'rel'], transpose: ['triads', 'sevenths'], scaleBuild: SCALE_T };
  const levels = g.levels || [Object.assign({ after: null }, g.params || {})];
  if (!levels.length || levels[0].after != null) errs.push(`${where}: the first level needs "after": null so the game is open from the start`);
  levels.forEach((lv, i) => {
    const lw = `${where} level ${i + 1}`;
    if (lv.after != null && !c.lessons[lv.after]) errs.push(`${lw}: "after" names unknown lesson "${lv.after}"`);
    (lv.quals || []).forEach(q => QUALS.has(q) || errs.push(`${lw}: unknown option "${q}"`));
    (lv.types || []).forEach(t => (ENGINE_TYPES[g.engine] || []).includes(t) || errs.push(`${lw}: "${t}" isn't a type for the ${g.engine} engine (known: ${(ENGINE_TYPES[g.engine] || []).join(', ') || 'none'})`));
    (lv.keys || []).forEach(k => KEYS.includes(k) || errs.push(`${lw}: unknown key "${k}"`));
  });
}
if (errs.length) { console.error(errs.map(e => '✗ ' + e).join('\n')); console.error(`\n${errs.length} problem(s). Fix these before publishing.`); process.exit(1); }
if (process.argv.includes('--bump')) { c.version += 1; fs.writeFileSync(__dirname + '/content.json', JSON.stringify(c, null, 1) + '\n'); console.log(`✓ Valid. Version bumped to ${c.version}.`); }
else console.log(`✓ Valid. ${Object.keys(c.lessons).length} lessons in ${c.units.length} units, ${(c.games || []).length} games, version ${c.version}.`);
