# Paragraph editions

Settings > 段落顯示 selects sentence (default) or paragraph editions for every book. The persisted shared preference is `reader-passage-mode`. Display, chapter counts and speech use the same selected book. Reader remounts when the edition/chapter changes, clearing playback and scroll state; chapter IDs stay unchanged.

`data/paragraphs/*.json` archives the original editions. Most books had not previously been resegmented, so their original data comes from `c2c5d72`. Just for Fun comes from `8b301fc`, before the sentence/PDF repair change. Full commit hashes are recorded in `provenance.json`.

Just for Fun preserves the current 4,995-passage repaired edition in its original TypeScript data module and the historical 494-passage edition in the archive. Historical text may contain older OCR/word-break mistakes or earlier translations; the settings hint explains this distinction.

For the other books, `data/sentences/*.json` stores generated aligned sentence passages. ICU English/Chinese sentence boundaries are used with common English titles/initials kept together. All characters of original and translated text are preserved. Per the user's explicit choice, 175 multi-sentence passages with unequal source/translation sentence counts remain intact; no translation is generated or guessed. Their IDs are listed in `data/sentences/unaligned.json`. Equal sentence counts allow sequential alignment but are not a semantic translation review. Some books already consisted of one-sentence passages, so both modes look the same there.

Regenerate: `node scripts/archive-paragraphs.cjs` (requires Git history).
Validate: `node --test scripts/paragraph-modes.test.cjs`, `npx tsc --noEmit`, `npm run build:web`.

Books added after the archive (listed as `nativeBookIds` in `scripts/paragraph-modes.test.cjs`, starting with Franklin's Autobiography) are written directly as both editions: `data/sentences/<id>.json` has one aligned sentence per passage and `data/paragraphs/<id>.json` the same text grouped by source paragraph. They have no archived revision; the test only checks that both editions share chapter IDs and carry identical text.
