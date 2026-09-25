const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { loadBooks } = require('./load-data.cjs');
const root = path.resolve(__dirname, '..');
const en = new Intl.Segmenter('en', { granularity: 'sentence' });
const zh = new Intl.Segmenter('zh-Hant', { granularity: 'sentence' });

function sentences(text, english = false) {
  const pieces = Array.from((english ? en : zh).segment(text), p => p.segment.trim()).filter(Boolean);
  if (!english) return pieces;
  const result = [];
  for (const piece of pieces) {
    const previous = result.at(-1);
    // ICU can consider titles/initials sentence endings. Keep them with the name.
    if (previous && /\b(?:Mr|Mrs|Ms|Dr|Prof|Rev|St|Capt|Gen|Col|Lt|Sr|Jr|vs|etc|[A-Z])\.$/.test(previous)) {
      result[result.length - 1] += ' ' + piece;
    } else result.push(piece);
  }
  return result;
}

function splitPassage(passage) {
  const original = sentences(passage.original, true);
  const vernacular = sentences(passage.vernacular);
  const mandarin = passage.vernacularMandarin ? sentences(passage.vernacularMandarin) : undefined;
  if (original.length <= 1 || original.length !== vernacular.length || (mandarin && original.length !== mandarin.length)) {
    return [passage];
  }
  return original.map((text, i) => ({
    ...passage,
    id: `${passage.id}--sentence-${i + 1}`,
    original: text,
    vernacular: vernacular[i],
    ...(mandarin ? { vernacularMandarin: mandarin[i] } : {}),
  }));
}

if (require.main === module) {
  const resolve = ref => execFileSync('git', ['rev-parse', ref], { cwd: root, encoding: 'utf8' }).trim();
  const revision = resolve('c2c5d72');
  const justForFunRevision = resolve('8b301fc');
  const books = loadBooks(root, revision);
  const historical = loadBooks(root, justForFunRevision).find(b => b.id === 'justforfun');
  const paragraphDir = path.join(root, 'data/paragraphs');
  const sentenceDir = path.join(root, 'data/sentences');
  fs.mkdirSync(paragraphDir, { recursive: true });
  fs.mkdirSync(sentenceDir, { recursive: true });
  const report = [];
  for (const book of books) {
    const before = book.id === 'justforfun' ? historical : book;
    fs.writeFileSync(path.join(paragraphDir, `${book.id}.json`), JSON.stringify(before, null, 2) + '\n');
    if (book.id === 'justforfun') continue; // Already sentence-aligned and proofread for PDF word breaks.
    const after = { ...book, chapters: book.chapters.map(chapter => ({
      ...chapter, passages: chapter.passages.flatMap(p => {
        const parts = splitPassage(p);
        if (parts.length === 1 && sentences(p.original, true).length > 1) {
          report.push({ bookId: book.id, chapterId: chapter.id, passageId: p.id });
        }
        return parts;
      }),
    })) };
    fs.writeFileSync(path.join(sentenceDir, `${book.id}.json`), JSON.stringify(after, null, 2) + '\n');
    console.log(`${book.id}: ${before.chapters.reduce((n,c)=>n+c.passages.length,0)} -> ${after.chapters.reduce((n,c)=>n+c.passages.length,0)}`);
  }
  fs.writeFileSync(path.join(paragraphDir, 'provenance.json'), JSON.stringify({ revision, justForFunRevision,
    note: 'Exact historical paragraphs, including original translations. Just for Fun predates PDF word-break repairs; its current sentence version retains those repairs.' }, null, 2) + '\n');
  fs.writeFileSync(path.join(sentenceDir, 'unaligned.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.length} unaligned passages retained intact.`);
}
module.exports = { sentences, splitPassage };
