import type { PassageMode } from '../hooks/usePassageMode';
import capitalParagraphs from './paragraphs/capital.json';
import capitalSentences from './sentences/capital.json';
import commonsenseParagraphs from './paragraphs/commonsense.json';
import commonsenseSentences from './sentences/commonsense.json';
import discoursesParagraphs from './paragraphs/discourses.json';
import discoursesSentences from './sentences/discourses.json';
import enchiridionParagraphs from './paragraphs/enchiridion.json';
import enchiridionSentences from './sentences/enchiridion.json';
import guofulunParagraphs from './paragraphs/guofulun.json';
import guofulunSentences from './sentences/guofulun.json';
import independenceParagraphs from './paragraphs/independence.json';
import independenceSentences from './sentences/independence.json';
import justforfunParagraphs from './paragraphs/justforfun.json';
import manifestoParagraphs from './paragraphs/manifesto.json';
import manifestoSentences from './sentences/manifesto.json';
import manuscripts1844Paragraphs from './paragraphs/manuscripts1844.json';
import manuscripts1844Sentences from './sentences/manuscripts1844.json';
import meditationsParagraphs from './paragraphs/meditations.json';
import meditationsSentences from './sentences/meditations.json';
import onlibertyParagraphs from './paragraphs/onliberty.json';
import onlibertySentences from './sentences/onliberty.json';
import rightsofmanParagraphs from './paragraphs/rightsofman.json';
import rightsofmanSentences from './sentences/rightsofman.json';
import seneca_lettersParagraphs from './paragraphs/seneca-letters.json';
import seneca_lettersSentences from './sentences/seneca-letters.json';
import socialcontractParagraphs from './paragraphs/socialcontract.json';
import socialcontractSentences from './sentences/socialcontract.json';
import { Book } from './types';
import { guofulun } from './guofulun';
import { meditations } from './meditations';
import { enchiridion } from './enchiridion';
import { discourses } from './discourses';
import { seneca } from './seneca';
import { manuscripts1844 } from './manuscripts1844';
import { capital } from './capital';
import { rightsofman } from './rightsofman';
import { independence } from './independence';
import { manifesto } from './manifesto';
import { commonsense } from './commonsense';
import { onliberty } from './onliberty';
import { socialcontract } from './socialcontract';
import { justforfun } from './justforfun';

export const books: Book[] = [
  guofulun,
  meditations,
  enchiridion,
  discourses,
  seneca,
  manuscripts1844,
  capital,
  rightsofman,
  independence,
  manifesto,
  commonsense,
  onliberty,
  socialcontract,
  justforfun,
];

const paragraphBooks: Book[] = [
  capitalParagraphs,
  commonsenseParagraphs,
  discoursesParagraphs,
  enchiridionParagraphs,
  guofulunParagraphs,
  independenceParagraphs,
  justforfunParagraphs,
  manifestoParagraphs,
  manuscripts1844Paragraphs,
  meditationsParagraphs,
  onlibertyParagraphs,
  rightsofmanParagraphs,
  seneca_lettersParagraphs,
  socialcontractParagraphs,
];
const sentenceBooks: Book[] = [
  capitalSentences,
  commonsenseSentences,
  discoursesSentences,
  enchiridionSentences,
  guofulunSentences,
  independenceSentences,
  justforfun,
  manifestoSentences,
  manuscripts1844Sentences,
  meditationsSentences,
  onlibertySentences,
  rightsofmanSentences,
  seneca_lettersSentences,
  socialcontractSentences,
];

export function getBook(id: string, mode: PassageMode = 'sentence'): Book | undefined {
  return (mode === 'paragraph' ? paragraphBooks : sentenceBooks).find((b) => b.id === id);
}
