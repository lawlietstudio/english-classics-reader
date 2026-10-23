import type { PassageMode } from '../hooks/usePassageMode';
import capitalParagraphs from './paragraphs/capital.json';
import capitalSentences from './sentences/capital.json';
import commonsenseParagraphs from './paragraphs/commonsense.json';
import commonsenseSentences from './sentences/commonsense.json';
import discoursesParagraphs from './paragraphs/discourses.json';
import discoursesSentences from './sentences/discourses.json';
import enchiridionParagraphs from './paragraphs/enchiridion.json';
import enchiridionSentences from './sentences/enchiridion.json';
import franklinParagraphs from './paragraphs/franklin.json';
import franklinSentences from './sentences/franklin.json';
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
import carnegieParagraphs from './paragraphs/carnegie.json';
import carnegieSentences from './sentences/carnegie.json';
import sonnetsParagraphs from './paragraphs/sonnets.json';
import hamletParagraphs from './paragraphs/hamlet.json';
import othelloParagraphs from './paragraphs/othello.json';
import learParagraphs from './paragraphs/lear.json';
import macbethParagraphs from './paragraphs/macbeth.json';
import romeoParagraphs from './paragraphs/romeo.json';
import merchantParagraphs from './paragraphs/merchant.json';
import midsummerParagraphs from './paragraphs/midsummer.json';
import caesarParagraphs from './paragraphs/caesar.json';
import sherlockParagraphs from './paragraphs/sherlock.json';
import animalfarmParagraphs from './paragraphs/animalfarm.json';
import oldmanParagraphs from './paragraphs/oldman.json';
import sonnetsSentences from './sentences/sonnets.json';
import hamletSentences from './sentences/hamlet.json';
import othelloSentences from './sentences/othello.json';
import learSentences from './sentences/lear.json';
import macbethSentences from './sentences/macbeth.json';
import romeoSentences from './sentences/romeo.json';
import merchantSentences from './sentences/merchant.json';
import midsummerSentences from './sentences/midsummer.json';
import caesarSentences from './sentences/caesar.json';
import sherlockSentences from './sentences/sherlock.json';
import animalfarmSentences from './sentences/animalfarm.json';
import oldmanSentences from './sentences/oldman.json';
import ozParagraphs from './paragraphs/oz.json';
import ozSentences from './sentences/oz.json';
import panParagraphs from './paragraphs/pan.json';
import panSentences from './sentences/pan.json';
import hpParagraphs from './paragraphs/hp.json';
import hpSentences from './sentences/hp.json';
import tomParagraphs from './paragraphs/tom.json';
import tomSentences from './sentences/tom.json';
import sgParagraphs from './paragraphs/sg.json';
import sgSentences from './sentences/sg.json';
import aesopParagraphs from './paragraphs/aesop.json';
import aesopSentences from './sentences/aesop.json';
import potterParagraphs from './paragraphs/potter.json';
import potterSentences from './sentences/potter.json';
import bbParagraphs from './paragraphs/bb.json';
import bbSentences from './sentences/bb.json';
import upfromslaveryParagraphs from './paragraphs/upfromslavery.json';
import upfromslaverySentences from './sentences/upfromslavery.json';
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
  franklinSentences,
  upfromslaverySentences,
  carnegieSentences,
  sonnetsSentences,
  hamletSentences,
  othelloSentences,
  learSentences,
  macbethSentences,
  romeoSentences,
  merchantSentences,
  midsummerSentences,
  caesarSentences,
  sherlockSentences,
  animalfarmSentences,
  oldmanSentences,
  ozSentences,
  panSentences,
  hpSentences,
  tomSentences,
  sgSentences,
  aesopSentences,
  potterSentences,
  bbSentences,
];

const paragraphBooks: Book[] = [
  capitalParagraphs,
  commonsenseParagraphs,
  discoursesParagraphs,
  enchiridionParagraphs,
  franklinParagraphs,
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
  upfromslaveryParagraphs,
  carnegieParagraphs,
  sonnetsParagraphs,
  hamletParagraphs,
  othelloParagraphs,
  learParagraphs,
  macbethParagraphs,
  romeoParagraphs,
  merchantParagraphs,
  midsummerParagraphs,
  caesarParagraphs,
  sherlockParagraphs,
  animalfarmParagraphs,
  oldmanParagraphs,
  ozParagraphs,
  panParagraphs,
  hpParagraphs,
  tomParagraphs,
  sgParagraphs,
  aesopParagraphs,
  potterParagraphs,
  bbParagraphs,
];
const sentenceBooks: Book[] = [
  capitalSentences,
  commonsenseSentences,
  discoursesSentences,
  enchiridionSentences,
  franklinSentences,
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
  upfromslaverySentences,
  carnegieSentences,
  sonnetsSentences,
  hamletSentences,
  othelloSentences,
  learSentences,
  macbethSentences,
  romeoSentences,
  merchantSentences,
  midsummerSentences,
  caesarSentences,
  sherlockSentences,
  animalfarmSentences,
  oldmanSentences,
  ozSentences,
  panSentences,
  hpSentences,
  tomSentences,
  sgSentences,
  aesopSentences,
  potterSentences,
  bbSentences,
];

export function getBook(id: string, mode: PassageMode = 'sentence'): Book | undefined {
  return (mode === 'paragraph' ? paragraphBooks : sentenceBooks).find((b) => b.id === id);
}
