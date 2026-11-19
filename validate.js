#!/usr/bin/env node
// Checks content.json before you publish it. Usage:
//   node validate.js          -> validate only
//   node validate.js --bump   -> validate, then increase "version" by 1 (do this for every release)
const fs = require('fs');
const GENERATORS = {
  // name: skill it trains (params in brackets are optional)
  idNatural: 'notes.natural', findNatural: 'notes.natural', idAny: 'notes.all', findAny: 'notes.all', alphabet: 'alphabet',
  halfWhole: 'steps', enharmonic: 'steps', staffName: 'staff.read', staffPlace: 'staff.read',
  recipe: 'scale.recipe', degree: 'scale.major [keys]', writeScale: 'scale.major [keys]', staffScale: 'scale.major [keys]', pickScale: 'scale.major [keys]', inScale: 'scale.major [keys]',
  circleNext: 'circle', circleBlank: 'circle', sigCount: 'keysig', sigToKey: 'keysig', keyFromCount: 'keysig', sigOrder: 'keysig', sigNotes: 'keysig',
  relMinor: 'relative', relMajor: 'relative', minorSig: 'relative',
  intName: 'interval', intBuild: 'interval', intSemis: 'interval', intShow: 'interval',
  triadSpell: 'triad', triadName: 'triad', triadStaff: 'triad', triadPick: 'triad', triadQual: 'triad',
  daSpell: 'triad.dimaug', daName: 'triad.dimaug', daStaff: 'triad.dimaug', daPick: 'triad.dimaug', daQual: 'triad.dimaug',
  sevSpell: 'seventh', sevName: 'seventh', sevStaff: 'seventh', sevPick: 'seventh', sevQual: 'seventh',
  chordShow: 'chord.id [quals]', diaChord: 'diatonic [keys]', diaNumeral: 'diatonic [keys]', diaQuality: 'diatonic', circleWedge: 'diatonic',
  progSpell: 'progression [keys]', progIdentify: 'progression [keys]', bluesBar: 'progression', progMissing: 'progression [keys]',
  writeMinor: 'minor.scale', harmonic: 'minor.scale', minorRecipe: 'minor.scale', pickMinor: 'minor.scale',
  writePent: 'pentatonic', pickPent: 'pentatonic', bluesNote: 'pentatonic', pentDrop: 'pentatonic',
};
const EXPLORERS = { notes: ['naturals'], staff: [], scale: ['keys', 'types'], chord: ['quals'], circle: ['mode'], interval: [], diatonic: [], progression: [] };
const KEYS = ['C','G','D','A','E','B','F#','C#','F','Bb','Eb','Ab','Db','Gb','Cb'];
const QUALS = ['maj','min','dim','aug','maj7','dom7','min7','m7b5'];
const TYPES = ['major','minor','harmonic','majpent','minpent','blues'];
const MODES = ['basic','keysig','relative','wedge'];
const errs = [];
const c = JSON.parse(fs.readFileSync(__dirname + '/content.json', 'utf8'));
if (!Number.isInteger(c.version)) errs.push('"version" must be an integer');
if (c.schema !== 1) errs.push('"schema" must be 1 (only change it together with an app update)');
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
      if (!EXPLORERS[b.name]) errs.push(`${where}: unknown explorer "${b.name}" (known: ${Object.keys(EXPLORERS).join(', ')})`);
      const o = b.options || {};
      for (const k of Object.keys(o)) if (EXPLORERS[b.name] && !EXPLORERS[b.name].includes(k)) errs.push(`${where}: explorer ${b.name} has no option "${k}"`);
      (o.keys || []).forEach(k => KEYS.includes(k) || ['C#','G#','D#','A#'].includes(k) || errs.push(`${where}: unknown key "${k}"`));
      (o.types || []).forEach(t => TYPES.includes(t) || errs.push(`${where}: unknown scale type "${t}"`));
      (o.quals || []).forEach(q => QUALS.includes(q) || errs.push(`${where}: unknown chord quality "${q}"`));
      if (o.mode && !MODES.includes(o.mode)) errs.push(`${where}: circle mode must be one of ${MODES.join(', ')}`);
    } else errs.push(`${where}: block type must be "text" or "explorer"`);
  }
  if (!(l.practice || []).length) errs.push(`${where} needs at least one practice entry`);
  for (const p of l.practice || []) {
    if (!GENERATORS[p.gen]) errs.push(`${where}: unknown generator "${p.gen}"`);
    if (!Number.isInteger(p.weight) || p.weight < 1) errs.push(`${where}: "${p.gen}" needs an integer weight >= 1`);
    ((p.params || {}).keys || []).forEach(k => KEYS.includes(k) || errs.push(`${where}: "${p.gen}" unknown key "${k}"`));
    ((p.params || {}).quals || []).forEach(q => QUALS.includes(q) || errs.push(`${where}: "${p.gen}" unknown quality "${q}"`));
  }
  if ((l.homework || []).length < 3) errs.push(`${where} should have at least 3 homework items`);
  for (const h of l.homework || []) {
    const texts = typeof h === 'string' ? [h] : Object.values(h);
    if (typeof h === 'object') for (const k of Object.keys(h)) if (!['piano','guitar','bass','fretted'].includes(k)) errs.push(`${where}: homework key "${k}" must be piano, guitar, bass or fretted`);
    for (const t of texts) { const left = t.replace(/\{pick:[^}]+\}|\{inst\}|\{lowstring\}/g, ''); if (/[{}]/.test(left)) errs.push(`${where}: homework has an unknown {token}: ${t}`); }
  }
}
if (errs.length) { console.error(errs.map(e => '✗ ' + e).join('\n')); console.error(`\n${errs.length} problem(s). Fix these before publishing.`); process.exit(1); }
if (process.argv.includes('--bump')) { c.version += 1; fs.writeFileSync(__dirname + '/content.json', JSON.stringify(c, null, 1) + '\n'); console.log(`✓ Valid. Version bumped to ${c.version}.`); }
else console.log(`✓ Valid. ${Object.keys(c.lessons).length} lessons in ${c.units.length} units, version ${c.version}.`);
