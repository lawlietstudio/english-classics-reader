const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadCatalog, loadBooks } = require('./load-data.cjs');
const { sentences, splitPassage } = require('./archive-paragraphs.cjs');
const root = path.resolve(__dirname, '..');
const catalog = loadCatalog(root);
const provenance = require('../data/paragraphs/provenance.json');
const before = loadBooks(root, provenance.revision);
const historicalJff = loadBooks(root, provenance.justForFunRevision).find(b => b.id === 'justforfun');
const plain = value => JSON.parse(JSON.stringify(value));
const compact = text => text.replace(/\s+/g, '');

test('all 14 books have both modes with stable chapter identities and exact archived text', () => {
  assert.equal(catalog.books.length, 14);
  for (const book of before) {
    const paragraphs = catalog.getBook(book.id, 'paragraph');
    const split = catalog.getBook(book.id, 'sentence');
    assert.deepEqual(plain(paragraphs), plain(book.id === 'justforfun' ? historicalJff : book));
    assert.deepEqual(Array.from(split.chapters, c => c.id), Array.from(paragraphs.chapters, c => c.id));
    assert.equal(catalog.getBook(book.id), split);
    for (const chapter of split.chapters) {
      assert.equal(new Set(chapter.passages.map(p => p.id)).size, chapter.passages.length);
    }
  }
});

test('splitting preserves every character of source and both translations, in order', () => {
  for (const book of before.filter(b => b.id !== 'justforfun')) {
    const split = catalog.getBook(book.id, 'sentence');
    book.chapters.forEach((chapter, index) => {
      for (const passage of chapter.passages) {
        const parts = split.chapters[index].passages.filter(p => p.id === passage.id || p.id.startsWith(passage.id + '--sentence-'));
        assert.ok(parts.length, passage.id);
        for (const field of ['original', 'vernacular', 'vernacularMandarin']) {
          if (passage[field] !== undefined) assert.equal(compact(parts.map(p => p[field]).join('')), compact(passage[field]), `${book.id}/${passage.id}/${field}`);
        }
      }
    });
  }
});

test('unaligned translations stay intact; names and decimal numbers are not broken', () => {
  const p = { id: 'test', original: 'One. Two.', vernacular: '只有一句。' };
  assert.deepEqual(splitPassage(p), [p]);
  assert.deepEqual(sentences('Dr. Smith paid 3.14 dollars. Mr. Jones agreed.', true), ['Dr. Smith paid 3.14 dollars.', 'Mr. Jones agreed.']);
  const report = require('../data/sentences/unaligned.json');
  assert.ok(report.length > 0);
  for (const item of report) {
    const old = catalog.getBook(item.bookId, 'paragraph').chapters.find(c => c.id === item.chapterId).passages.find(p => p.id === item.passageId);
    const current = catalog.getBook(item.bookId, 'sentence').chapters.find(c => c.id === item.chapterId).passages.find(p => p.id === item.passageId);
    assert.deepEqual(plain(current), plain(old));
  }
});

test('Just for Fun keeps its repaired current sentence edition and historical paragraph edition', () => {
  assert.deepEqual(plain(catalog.getBook('justforfun', 'sentence')), plain(before.find(b => b.id === 'justforfun')));
  assert.equal(catalog.getBook('justforfun', 'sentence').chapters.reduce((n,c)=>n+c.passages.length,0), 4995);
  assert.equal(catalog.getBook('justforfun', 'paragraph').chapters.reduce((n,c)=>n+c.passages.length,0), 494);
});
