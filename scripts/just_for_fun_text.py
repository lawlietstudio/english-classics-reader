"""Repair PDF line wraps before segmenting prose; retain genuine spaces and names."""
import re
import wordninja
from wordfreq import zipf_frequency

FUNCTION_WORDS = set('a an the of to in on at for from with and or but as if than that this these those he she it we they his her my our your their was were is are had has have be been by not no into out up would could should'.split())
PROTECTED = set('transmeta capitola hagashi comdex torvalds linux minix microvax vendorware geekdom morfar mormor farfar farmor informix gnutella decss torvaldian'.split())
SPECIAL_SPLITS = {'wesat': 'we sat', 'askshowhe': 'asks how he', 'Linusgood': 'Linus good', 'Toveand': 'Tove and', 'Tovewe': 'Tove we', 'ifTransmeta': 'if Transmeta', 'callTransmeta': 'call Transmeta', 'thefootware': 'the footwear'}
SPECIAL_SPLITS.update({'ifyou': 'if you', 'howto': 'how to', 'Afew': 'A few', 'specificissue': 'specific issue'})


def repair_words(text, changes):
    def split(match):
        word = match.group()
        if word in SPECIAL_SPLITS:
            result = SPECIAL_SPLITS[word]
        elif word.lower() in PROTECTED or zipf_frequency(word, 'en') >= 2:
            return word
        else:
            parts = wordninja.split(word)
            if len(parts) < 2 or not any(p.lower() in FUNCTION_WORDS for p in parts):
                return word
            if not all((len(p) > 1 or p.lower() in {'a', 'i'}) and (zipf_frequency(p, 'en') >= 3.2 or p.lower() in PROTECTED or p == 'Linus') for p in parts):
                return word
            result = ' '.join(parts)
        changes.append([word, result])
        return result
    # Protect whole URLs and addresses, but allow words next to sentence punctuation.
    return ' '.join(token if '@' in token or '://' in token or re.search(r'\w\.(?:com|org|net)\b', token)
                    else re.sub(r'\b[A-Za-z]{5,}\b', split, token) for token in text.split(' '))


def clean_page(text, raw, number, changes):
    lines = text.splitlines()
    # Verified running footers in this edition; page 86 is an image caption.
    if lines and 7 <= number <= 261 and number not in {10, 18, 52, 86, 138}:
        changes.append(['footer', lines.pop()])
    soft_breaks = re.findall(r'([A-Za-z]+)\xad\s*\n\s*([A-Za-z]+)', raw)
    text = '\n'.join(lines)
    text = re.sub(r'(?m)^\*\s*$', '', text)
    text = re.sub(r'(?m)^([IVXLC]+\.|-[A-Za-z][^\n]*)$', r'\n\n\1\n\n', text)

    def unwrap(match):
        left, hyphen, right = match.groups()
        supported = any(a.endswith(left) and b.startswith(right) for a, b in soft_breaks)
        combined = left + right
        likely = zipf_frequency(combined, 'en') >= 3 and min(zipf_frequency(left, 'en'), zipf_frequency(right, 'en')) < 2
        if supported or likely:
            changes.append([left + ' ' + right, combined])
            return combined
        return left + hyphen + ' ' + right

    text = re.sub(r'([A-Za-z]+)(-?)\n[ \t]*([A-Za-z]+)', unwrap, text)
    text = repair_words(text, changes)
    text = re.sub(r'(?m)^([IVXLC]+\.|-[A-Za-z][^\n]*)$', r'\n\n\1\n\n', text)
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    text = re.sub(r'\.\s*\.\s*\.', '...', text)
    text = text.replace("W'eb", 'Web').replace('Linu»', 'Linux').replace('Linu�', 'Linux')
    text = re.sub(r'\brnn\b', 'run', text)
    return text.strip()


ABBREVIATIONS = {'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'e.g', 'i.e', 'inc', 'corp', 'co', 'no', 'fig'}


def sentence_spans(text):
    """Split even inside long quotations; OCR often has unmatched quote marks.

    Return source offsets so a sentence spanning pages retains accurate provenance.
    """
    start = 0
    for match in re.finditer(r'[.!?]+[\"\u201d\u2019\)\]]*(?:\s+|$)|\n\n+', text):
        boundary = match.end()
        punctuation = match.group().strip()
        if punctuation.startswith('.'):
            before = text[start:match.start()]
            token = re.search(r'([A-Za-z.]+)$', before)
            word = token.group(1) if token else ''
            if '\n\n' not in match.group() and (word.lower() in ABBREVIATIONS or re.fullmatch(r'(?:[A-Za-z]\.)*[A-Za-z]', word)):
                continue
        if punctuation.startswith(('?', '!')) and boundary < len(text) and text[boundary].islower():
            # Keep attribution with its question: "Why?" she asked.
            continue
        if text[start:boundary].strip():
            yield text[start:boundary], start, boundary
        start = boundary
    if text[start:].strip():
        yield text[start:], start, len(text)
