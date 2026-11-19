# Circular Thinking: lesson content

This repo holds `content.json`, the lessons both apps run on (iOS and Android). The apps check this file every time they launch. When `version` here is higher than what's on the phone, they download it and the new lessons show up with a **New** badge. No App Store or Play Store review is involved.

It has to stay **public** so the apps can read it without a login. Nothing private belongs here.

## Shipping new lessons

1. Edit `content.json` (see the format below).
2. Run `node validate.js`. Fix anything it flags.
3. Run `node validate.js --bump` to raise `version` by one.
4. Commit and push to `main`. Phones pick it up on their next launch.

Then, before the next app store release of either app, copy the same file into the app repo so new installs start with the latest lessons:
- iOS: `CircularThinking/Resources/content.json`
- Android: `app/src/main/assets/content.json`

## What you can add without an app update

Anything built from the pieces below. A new lesson is a new entry in `lessons` plus its id in a unit's `lessons` list. A new unit is a new entry in `units`.

Things that **do** need an app update: a new question type, a new explorer, a new instrument, or a change to `schema`. Bump `schema` only together with an app release that understands it. Older apps ignore content with a higher schema, so nobody gets a broken lesson.

## Format

```jsonc
{
  "version": 2,            // bump for every publish
  "schema": 1,             // only changes with an app update
  "units": [ { "id": "u8", "title": "Modes", "lessons": ["dorian"] } ],
  "lessons": {
    "dorian": {
      "id": "dorian",
      "title": "The Dorian mode",
      "summary": "One line shown on the path.",
      "addedIn": 2,        // the version this lesson first shipped in (drives the New badge)
      "blocks": [
        { "type": "text", "only": null, "md": "Paragraphs, **bold**, _italic_ and - bullet lists." },
        { "type": "text", "only": "guitar", "md": "Shown only when Guitar is selected." },
        { "type": "explorer", "name": "scale", "options": { "keys": ["D", "G"], "types": ["minor"] }, "caption": "Optional caption." }
      ],
      "practice": [
        { "gen": "writeMinor", "weight": 3, "params": {} },
        { "gen": "degree", "weight": 2, "params": { "keys": ["D", "G"] } }
      ],
      "homework": [
        "Plain text task. {pick:A|B|C} picks one at random.",
        { "piano": "Piano version", "fretted": "Guitar and bass version, {lowstring} string" }
      ]
    }
  }
}
```

A practice set is 8 questions drawn from `practice`, weighted by `weight`. Getting 6 right completes the lesson.

### Explorers (interactive diagrams)

| name | options |
|---|---|
| `notes` | `naturals: true` shows only natural notes |
| `staff` | none; tap lines and spaces to hear notes |
| `scale` | `keys`, `types` (major, minor, harmonic, majpent, minpent, blues) |
| `chord` | `quals` (maj, min, dim, aug, maj7, dom7, min7, m7b5) |
| `circle` | `mode`: basic, keysig, relative, wedge |
| `interval`, `diatonic`, `progression` | none |

### Question generators

Each one makes a fresh question every time, so a lesson never repeats the same eight. Params in brackets are optional. `keys` limits which keys it draws from; `quals` limits chord types.

| skill | generators |
|---|---|
| Musical alphabet | `alphabet` |
| Natural notes | `idNatural`, `findNatural` |
| All 12 notes | `idAny`, `findAny` |
| Half/whole steps | `halfWhole`, `enharmonic` |
| Staff reading | `staffName`, `staffPlace` |
| Major scale recipe | `recipe` |
| Spelling major scales | `degree`, `writeScale`, `staffScale`, `pickScale`, `inScale` [keys] |
| Circle of fifths | `circleNext`, `circleBlank` |
| Key signatures | `sigCount`, `sigToKey`, `keyFromCount`, `sigOrder`, `sigNotes` |
| Relative minors | `relMinor`, `relMajor`, `minorSig` |
| Intervals | `intName`, `intBuild`, `intSemis`, `intShow` |
| Major/minor triads | `triadSpell`, `triadName`, `triadStaff`, `triadPick`, `triadQual` |
| Dim/aug triads | `daSpell`, `daName`, `daStaff`, `daPick`, `daQual` |
| Seventh chords | `sevSpell`, `sevName`, `sevStaff`, `sevPick`, `sevQual` |
| Chord shapes on the instrument | `chordShow` [quals] |
| Chords in a key | `diaChord`, `diaNumeral` [keys], `diaQuality`, `circleWedge` |
| Progressions | `progSpell`, `progIdentify`, `progMissing` [keys], `bluesBar` |
| Minor scales | `writeMinor`, `harmonic`, `minorRecipe`, `pickMinor` |
| Pentatonic & blues | `writePent`, `pickPent`, `bluesNote`, `pentDrop` |

`validate.js` has the same list and rejects any name it doesn't know.

## Font

`NotoMusic-OFL.txt` is the license for the Noto Music font bundled in the apps (SIL Open Font License 1.1).
