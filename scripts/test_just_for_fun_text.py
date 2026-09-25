import unittest
from just_for_fun_text import clean_page, repair_words, sentence_spans


class PdfTextTests(unittest.TestCase):
    def test_discretionary_hyphens(self):
        extracted = 'My fam\nily used a com\nputer.\n4 Just for Fun'
        raw = 'My fam\xad\nily used a com\xad\nputer.\n4 Just for Fun'
        self.assertEqual(clean_page(extracted, raw, 20, []), 'My family used a computer.')

    def test_real_spaces_and_names_survive(self):
        text = 'We went in\nto see Transmeta and Linux.\n4 Just for Fun'
        self.assertEqual(clean_page(text, text, 20, []), 'We went in to see Transmeta and Linux.')
        self.assertEqual(repair_words('torvalds@transmeta.com https://theworld.com', []),
                         'torvalds@transmeta.com https://theworld.com')

    def test_fused_words_at_sentence_end(self):
        self.assertEqual(repair_words('Duringthe day heexplained. Linusgood-naturedly smiled.', []),
                         'During the day he explained. Linus good-naturedly smiled.')

    def test_abbreviations_decimals_and_quotes(self):
        text = 'Dr. Smith paid 3.50 dollars in the U.S. today. "Why?" she asked. "It works. Really well."'
        actual = [s.strip() for s, _, _ in sentence_spans(text)]
        self.assertEqual(actual, ['Dr. Smith paid 3.50 dollars in the U.S. today.',
                                 '"Why?" she asked.', '"It works.', 'Really well."'])

    def test_unmatched_quote_does_not_swallow_sentences(self):
        self.assertEqual([s.strip() for s, _, _ in sentence_spans('"First sentence. Second sentence. Third sentence.')],
                         ['"First sentence.', 'Second sentence.', 'Third sentence.'])

    def test_spans_preserve_every_character(self):
        text = 'One sentence.\n\nII.\n\nA second sentence! Last fragment'
        spans = list(sentence_spans(text))
        self.assertEqual(''.join(s for s, _, _ in spans), text)
        self.assertTrue(all(text[a:z] == s for s, a, z in spans))


if __name__ == '__main__':
    unittest.main()
