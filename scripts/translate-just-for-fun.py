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
            if not translated or not re.search(r'[\u3400-\u9fff]', translated):
                raise ValueError('Translation contains no Chinese text')
            return translated
        except Exception:
            if attempt == 4:
                raise
            time.sleep(2 ** attempt)


book = json.loads(BOOK.read_text(encoding='utf-8').split('export const justforfun: Book = ', 1)[1].rstrip(';\n'))
cache = json.loads(CACHE.read_text(encoding='utf-8')) if CACHE.exists() else {}
passages = [p for c in book['chapters'] for p in c['passages']]
jobs = {hashlib.sha256(p['original'].encode()).hexdigest(): p['original'] for p in passages}
CACHE.parent.mkdir(parents=True, exist_ok=True)
pending = {key: text for key, text in jobs.items() if key not in cache}
print(f'Translating {len(pending)} passages; {len(jobs) - len(pending)} cached.', flush=True)
with ThreadPoolExecutor(max_workers=4) as pool:
    futures = {pool.submit(translate, text): key for key, text in pending.items()}
    for count, future in enumerate(as_completed(futures), 1):
        cache[futures[future]] = future.result()
        CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding='utf-8')
        if count % 25 == 0:
            print(f'{count}/{len(pending)} translated', flush=True)

for passage in passages:
    key = hashlib.sha256(passage['original'].encode()).hexdigest()
    passage['vernacular'] = cache[key]
    # Standard written Chinese is shared by both reading voices.
    passage['vernacularMandarin'] = cache[key]
for chapter in book['chapters']:
    heading, pages = chapter['title'].split(' · PDF ', 1)
    english = heading.split('｜', 1)[0]
    chapter['title'] = f'{english}｜{CHAPTER_TITLES[english]} · PDF {pages}'
# Reviewed correction: a dunk tank is a fundraising game, not basketball.
for passage in passages:
    if passage['id'] == 'jff-p8-1':
        passage['vernacular'] = '推動了這場革命，而且實際上成了它的領袖。問題是，Linux 和開放原始碼越成功，他就越不想談論它。這位意外成為革命者的人開始開發 Linux，是因為玩電腦很有趣（而且其他選擇也不太吸引人）。有人試圖說服他在一場大型活動上演講，說他的數百萬追隨者只是想親眼見見他本人。林納斯便和氣地提議，改為參加投球落水的募款遊戲。他解釋說，那樣會更好玩，也可以籌款。對方拒絕了。這可不是他們心目中領導革命的方式。革命者不是天生的。革命無法預先計劃，也無法加以管理。革命就這樣發生了……——大衛·戴蒙'
        passage['vernacularMandarin'] = passage['vernacular']
    if passage['id'] == 'jff-p41-2':
        passage['vernacular'] = passage['vernacular'].replace('這麼年輕就已經是個保健食品堅果了。', '年紀輕輕就已經是個「健康食品狂熱分子」了。')
        passage['vernacularMandarin'] = passage['vernacular']
    if passage['id'] == 'jff-p203-1':
        passage['vernacular'] = '十。走出臥室、來到聚光燈下後，我很快就得學會一些別人大概上幼稚園時已經懂得的生活技巧。例如，我從沒料到，人們竟會如此認真看待我的一舉一動。以下兩件事，其實都是同一個主題的不同版本。還在大學時，我的電腦上有一個 root 帳號。每個帳號都有一個附帶的名稱，用來提供使用者資訊。因此，我把自己電腦上的 root 帳號命名為 Linus「God」Torvalds。我就是那台放在大學辦公室的電腦的上帝。有甚麼大不了的？在 Linux 或 Unix 上，對某台電腦執行 finger 指令，就是查詢誰登入了那台電腦。由於防火牆普及，這種查詢已不再常見。但幾年前，大家會用 finger 查詢別人的電腦，看看使用者是否已登入，或有沒有讀過電子郵件。這也是查看某人「plan」的方法；那是使用者放在電腦上的個人資訊，有點像網頁的前身。我的 plan 一直列有最新的核心版本。所以，人們查詢的其中一種方法就是'
        passage['vernacularMandarin'] = passage['vernacular']
book['title'] = 'Just for Fun（中英對照）'
book['description'] = '《Just for Fun: The Story of an Accidental Revolutionary》。由使用者提供嘅 PDF 匯入，收錄導言、正文及索引，按 PDF 頁碼分節。英文對照繁體書面中文，支援英文、廣東話及普通話朗讀。中文為機器翻譯，未經完整校訂；掃描原文亦可能有辨識錯誤。'
BOOK.write_text(PREFIX + json.dumps(book, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'Saved {len(passages)} translated passages.', flush=True)
