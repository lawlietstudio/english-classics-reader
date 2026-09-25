"""Add a cached Traditional Chinese machine translation to the imported book.

Uses Google's public translation endpoint. Only run when sending the book text
for translation is intended. Existing successful translations are reused.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / 'data' / 'justforfun.ts'
CACHE = ROOT / 'node_modules' / '.cache' / 'justforfun-zh-TW.json'
PREFIX = "import { Book } from './types';\n\n// User-provided English PDF with machine-translated Traditional Chinese; not fully proofread.\nexport const justforfun: Book = "
CHAPTER_TITLES = {
    'Introduction': '導言', 'Contents': '目錄', 'Acknowledgments': '致謝',
    'Preface: The Meaning of Life I': '序言：生命的意義（一）',
    'Birth of a Nerd': '電腦迷的誕生', 'Birth of an Operating System': '作業系統的誕生',
    'King of the Ball': '舞會之王', 'Intellectual Property': '智慧財產權',
    'An End to Control': '終結控制', 'The Amusement Ride Ahead': '前方的遊樂之旅',
    'Why Open Source Makes Sense': '為何開放原始碼行得通', 'Fame and Fortune': '名聲與財富',
    'The Meaning of Life II': '生命的意義（二）', 'Index': '索引',
}


def translate(text):
    query = urllib.parse.urlencode({'client': 'gtx', 'sl': 'en', 'tl': 'zh-TW', 'dt': 't', 'q': text})
    for attempt in range(5):
        try:
            request = urllib.request.Request('https://translate.googleapis.com/translate_a/single?' + query,
                                             headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(request, timeout=45) as response:
                result = json.load(response)
            translated = ''.join(part[0] for part in result[0] if part[0]).strip()
            if not translated:
                raise ValueError('Translation is empty')
            return translated
        except Exception:
            if attempt == 4:
                raise
            time.sleep(2 ** attempt)


def translate_batch(batch):
    # Newlines keep each sentence aligned while giving the service nearby context.
    result = translate('\n'.join(text for _, text in batch))
    lines = result.splitlines()
    if len(lines) == len(batch) and all(line.strip() for line in lines):
        return {key: line.strip() for (key, _), line in zip(batch, lines)}
    # Never guess alignment if the service merges or splits a line.
    return {key: translate(text) for key, text in batch}


book = json.loads(BOOK.read_text(encoding='utf-8').split('export const justforfun: Book = ', 1)[1].rstrip(';\n'))
cache = json.loads(CACHE.read_text(encoding='utf-8')) if CACHE.exists() else {}
passages = [p for c in book['chapters'] for p in c['passages']]
for passage in passages:
    if passage['vernacular']:
        cache[hashlib.sha256(passage['original'].encode()).hexdigest()] = passage['vernacular']
jobs = {hashlib.sha256(p['original'].encode()).hexdigest(): p['original'] for p in passages}
CACHE.parent.mkdir(parents=True, exist_ok=True)
pending = {key: text for key, text in jobs.items() if key not in cache}
print(f'Translating {len(pending)} passages; {len(jobs) - len(pending)} cached.', flush=True)
batches, batch, size = [], [], 0
for key, text in pending.items():
    if batch and (size + len(text) > 2500 or len(batch) >= 25):
        batches.append(batch)
        batch, size = [], 0
    batch.append((key, text))
    size += len(text) + 1
if batch:
    batches.append(batch)
with ThreadPoolExecutor(max_workers=4) as pool:
    futures = [pool.submit(translate_batch, batch) for batch in batches]
    count = 0
    for future in as_completed(futures):
        completed = future.result()
        count += len(completed)
        cache.update(completed)
        CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f'{count}/{len(pending)} translated', flush=True)

for passage in passages:
    key = hashlib.sha256(passage['original'].encode()).hexdigest()
    passage['vernacular'] = cache[key]
    # Standard written Chinese is shared by both reading voices.
    passage['vernacularMandarin'] = cache[key]
    if 'dunk-tank' in passage['original']:
        passage['vernacular'] = '因此，當有人試圖說服他在大型活動上演講，說他的數百萬追隨者至少想親眼見到他本人時，林納斯和氣地提議，改為參加投球落水的募款遊戲。'
    if passage['original'] == 'So young and already such a health food nut.':
        passage['vernacular'] = '年紀輕輕就已經是個「健康食品狂熱分子」了。'
    if passage['original'].startswith('The accidental revolutionary started Linux'):
        passage['vernacular'] = '這位意外成為革命者的人開始開發 Linux，是因為玩電腦很有趣（而且其他選擇也不太吸引人）。'
    corrections = {
        'Now, when somebody "fingers" a machine under Linux, or Unix, they are checking to see who\'s logged on to that machine.': '在 Linux 或 Unix 上，對某台電腦執行 finger 指令，就是查詢誰登入了那台電腦。',
        "Due to the advent of firewalls, the act of fingering doesn't take place much anymore.": '由於防火牆普及，這種 finger 查詢已不再常見。',
        "But years ago people would finger another's machine to see if the user had logged on or had read his email.": '但幾年前，人們會用 finger 查詢別人的電腦，看看使用者是否已登入，或有沒有讀過電子郵件。',
        'So one way for people to figure out the version of the day was to finger my machine.': '所以，人們要查詢當天的版本，其中一種方法就是對我的電腦執行 finger 指令。',
    }
    passage['vernacular'] = corrections.get(passage['original'], passage['vernacular'])
    passage['vernacularMandarin'] = passage['vernacular']
for chapter in book['chapters']:
    heading, pages = chapter['title'].split(' · PDF ', 1)
    english = heading.split('｜', 1)[0]
    chapter['title'] = f'{english}｜{CHAPTER_TITLES[english]} · PDF {pages}'
book['title'] = 'Just for Fun（中英對照）'
book['description'] = '《Just for Fun: The Story of an Accidental Revolutionary》。按句分段，保留 PDF 頁碼，英文對照繁體書面中文，支援英文、廣東話及普通話朗讀。中文為機器翻譯，未經完整校訂；掃描原文亦可能有辨識錯誤。'
BOOK.write_text(PREFIX + json.dumps(book, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'Saved {len(passages)} translated passages.', flush=True)
