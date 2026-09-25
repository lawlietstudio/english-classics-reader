"""Import the user-provided PDF. Requires pdfplumber; usage: python script.py book.pdf."""
import json
from pathlib import Path
import re
import sys

import pdfplumber

ROOT = Path(__file__).resolve().parents[1]
SECTIONS = [(6, 'Introduction'), (10, 'Contents'), (11, 'Acknowledgments'),
            (12, 'Preface: The Meaning of Life I'), (18, 'Birth of a Nerd'),
            (52, 'Birth of an Operating System'), (138, 'King of the Ball'),
            (216, 'Intellectual Property'), (227, 'An End to Control'),
            (232, 'The Amusement Ride Ahead'), (237, 'Why Open Source Makes Sense'),
            (247, 'Fame and Fortune'), (254, 'The Meaning of Life II'), (262, 'Index')]


def extract(page, index=False):
    # Keep the body, excluding the running title and printed page number.
    body = page.crop((0, 0, page.width, page.height * .93))
    if index:
        regions = [body.crop((0, 0, page.width / 2, body.bbox[3])),
                   body.crop((page.width / 2, 0, page.width, body.bbox[3]))]
    else:
        regions = [body]
    return '\n'.join(region.extract_text(x_tolerance=1) or '' for region in regions)


chapters = []
with pdfplumber.open(sys.argv[1]) as pdf:
    assert len(pdf.pages) == 273, 'Page mapping requires the supplied 273-page edition.'
    for section, (start, title) in enumerate(SECTIONS):
        end = SECTIONS[section + 1][0] - 1 if section + 1 < len(SECTIONS) else len(pdf.pages)
        for first in range(start, end + 1, 10):
            last = min(first + 9, end)
            passages = []
            for number in range(first, last + 1):
                text = extract(pdf.pages[number - 1], title == 'Index')
                text = re.sub(r'(\w)-\n(?=[a-z])', r'\1', text)
                text = re.sub(r'\s+', ' ', text).strip()
                # Bound each speech utterance; preserve every extracted word.
                words = text.split()
                chunks, chunk = [], ''
                for word in words:
                    if len(chunk) + len(word) + 1 > 1200:
                        chunks.append(chunk)
                        chunk = ''
                    chunk = (chunk + ' ' + word).strip()
                if chunk:
                    chunks.append(chunk)
                for part, chunk in enumerate(chunks, 1):
                    passages.append({'id': f'jff-p{number}-{part}',
                                     'title': f'PDF 第 {number} 頁 · {part}',
                                     'original': chunk, 'vernacular': ''})
            if passages:
                chapters.append({'id': f'jff-{first}',
                                 'title': f'{title} · PDF {first}–{last}',
                                 'passages': passages})

book = {'id': 'justforfun', 'title': 'Just for Fun（英文版）',
        'author': 'Linus Torvalds 林納斯·托瓦茲 · David Diamond',
        'description': '《Just for Fun: The Story of an Accidental Revolutionary》。由使用者提供嘅 PDF 匯入，收錄導言、正文及索引，按 PDF 頁碼分節。英文閱讀及朗讀，暫無中文翻譯；掃描文字可能有辨識錯誤。',
        'chapters': chapters}
output = ROOT / 'data' / 'justforfun.ts'
output.write_text("import { Book } from './types';\n\n// Extracted from the user-provided PDF; not a proofread edition.\nexport const justforfun: Book = " + json.dumps(book, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'Imported {len(chapters)} sections, {sum(len(c["passages"]) for c in chapters)} passages.')
