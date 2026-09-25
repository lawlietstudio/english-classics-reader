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

export function getBook(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}
