"""Import the supplied PDF as sentence-aligned reading passages.

Requires pdfplumber, pypdf, wordfreq and wordninja.
Usage: python scripts/import-just-for-fun.py book.pdf
Use --pages-cache cache.json to reuse extracted page text during proofreading.
"""
import argparse
from bisect import bisect_right
import json
from pathlib import Path
import re
import pdfplumber
from pypdf import PdfReader
from just_for_fun_text import clean_page, sentence_spans
from wordfreq import zipf_frequency

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = [(6, 'Introduction'), (10, 'Contents'), (11, 'Acknowledgments'),
            (12, 'Preface: The Meaning of Life I'), (18, 'Birth of a Nerd'),
            (52, 'Birth of an Operating System'), (138, 'King of the Ball'),
            (216, 'Intellectual Property'), (227, 'An End to Control'),
            (232, 'The Amusement Ride Ahead'), (237, 'Why Open Source Makes Sense'),
            (247, 'Fame and Fortune'), (254, 'The Meaning of Life II'), (262, 'Index')]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf')
    parser.add_argument('--pages-cache', type=Path)
    args = parser.parse_args()
    if args.pages_cache and args.pages_cache.exists():
        pages = json.loads(args.pages_cache.read_text(encoding='utf-8'))
    else:
        raw = PdfReader(args.pdf)
        pages = []
        with pdfplumber.open(args.pdf) as pdf:
            assert len(pdf.pages) == 273, 'Page mapping requires the supplied edition.'
            for i, page in enumerate(pdf.pages):
                pages.append({'page': i + 1, 'text': page.extract_text(x_tolerance=1) or '', 'raw': raw.pages[i].extract_text() or ''})
                page.close()
        if args.pages_cache:
            args.pages_cache.parent.mkdir(parents=True, exist_ok=True)
            args.pages_cache.write_text(json.dumps(pages, ensure_ascii=False), encoding='utf-8')
    assert len(pages) == 273
    output = ROOT / 'data' / 'justforfun.ts'
    previous = json.loads(output.read_text(encoding='utf-8').split('export const justforfun: Book = ', 1)[1].rstrip(';\n')) if output.exists() else None
    old_chapters = {c['id']: c for c in previous['chapters']} if previous else {}
    translations = {p['original']: p for c in old_chapters.values() for p in c['passages'] if p['vernacular']}
    old_passages = {p['id']: p for c in old_chapters.values() for p in c['passages']}
    chapters, changes = [], []
    for section, (start, title) in enumerate(SECTIONS):
        end = SECTIONS[section + 1][0] - 1 if section + 1 < len(SECTIONS) else 273
        # The index is a list of references, not prose. Preserve the column-aware import.
        if title == 'Index' and previous:
            joins = {a: b for a, b in changes if len(a.split()) == 2 and b.isalpha() and a.replace(' ', '') == b}
            for chapter in previous['chapters']:
                if chapter['id'] not in {'jff-262', 'jff-272'}:
                    continue
                for passage in chapter['passages']:
                    cleaned = re.sub(r'\b(?:\d+\s+Index|Index\s+\d+)\b', '', passage['original'])
                    while True:
                        before = cleaned
                        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
                        for broken, joined in joins.items():
                            cleaned = re.sub(r'\b' + re.escape(broken) + r'\b', joined, cleaned)
                        if cleaned == before:
                            break
                    if cleaned != passage['original']:
                        passage['original'] = cleaned
                        passage['vernacular'] = ''
                        passage.pop('vernacularMandarin', None)
                chapters.append(chapter)
            continue
        text, page_starts, numbers, notes = '', [], [], []
        for number in range(start, end + 1):
            page = pages[number - 1]
            source = page['text']
            note = re.search(r'(?m)^\*(?=[A-Z])', source)
            if note:
                notes.append((number, clean_page(source[note.start():], page['raw'], number, changes)))
                source = source[:note.start()] + '\n' + source.splitlines()[-1]
            body = clean_page(source, page['raw'], number, changes)
            if not body:
                continue
            # Join a word divided across a page boundary, after lifting footnotes out.
            left = re.search(r'([A-Za-z]+)(-?)\s+$', text)
            right = re.match(r'([a-z]+)', body)
            if left and right:
                combined = left[1] + right[1]
                if zipf_frequency(combined, 'en') >= 3 and (left[2] or min(zipf_frequency(left[1], 'en'), zipf_frequency(right[1], 'en')) < 2):
                    changes.append([left[1] + ' ' + right[1], combined])
                    text = text[:left.end(1)]
            page_starts.append(len(text))
            numbers.append(number)
            text += body + ('\n\n' if number in {6, 8} else ' ')
        groups = {}
        segmented = list(sentence_spans(text))
        assert re.sub(r'\s+', '', ''.join(s for s, _, _ in segmented)) == re.sub(r'\s+', '', text), 'Sentence splitting lost source text'
        spans = [(s, numbers[max(0, bisect_right(page_starts, a) - 1)], numbers[max(0, bisect_right(page_starts, z - 1) - 1)]) for s, a, z in segmented]
        for number, note_text in notes:
            spans.extend((f'Footnote: {s}', number, number) for s, _, _ in sentence_spans(note_text))
        for span_text, page, last_page in spans:
            sentence = re.sub(r'\s+', ' ', span_text).strip()
            if not sentence:
                continue
            first = start + ((page - start) // 10) * 10
            group = groups.setdefault(first, [])
            page_label = str(page) if page == last_page else f'{page}–{last_page}'
            passage = {'id': f'jff-s{first}-{len(group) + 1}', 'title': f'PDF 第 {page_label} 頁 · {len(group) + 1}', 'original': sentence, 'vernacular': ''}
            old = old_passages.get(passage['id'])
            if not old or old['original'] != sentence or not old['vernacular']:
                old = translations.get(sentence)
            if old:
                passage['vernacular'] = old['vernacular']
                passage['vernacularMandarin'] = old.get('vernacularMandarin', old['vernacular'])
            group.append(passage)
        for first, passages in groups.items():
            chapter_id = f'jff-{first}'
            heading = old_chapters.get(chapter_id, {}).get('title', f'{title} · PDF {first}–{min(first + 9, end)}')
            chapters.append({'id': chapter_id, 'title': heading, 'passages': passages})
    book = {'id': 'justforfun', 'title': 'Just for Fun（中英對照）', 'author': 'Linus Torvalds 林納斯·托瓦茲 · David Diamond',
            'description': '《Just for Fun: The Story of an Accidental Revolutionary》。按句分段，保留 PDF 頁碼，英文對照繁體書面中文，支援英文、廣東話及普通話朗讀。中文為機器翻譯，未經完整校訂；掃描原文亦可能有辨識錯誤。', 'chapters': chapters}
    output.write_text("import { Book } from './types';\n\n// User-provided PDF, sentence-aligned; machine translation is not fully proofread.\nexport const justforfun: Book = " + json.dumps(book, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    report = ROOT / 'node_modules' / '.cache' / 'jff-clean' / 'repairs.json'
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(changes, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Imported {len(chapters)} sections, {sum(len(c["passages"]) for c in chapters)} passages; {len(changes)} repairs.')


if __name__ == '__main__':
    main()
