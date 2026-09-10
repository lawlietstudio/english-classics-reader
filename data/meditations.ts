import { Book } from './types';
import { firstBook } from './meditations/01-first-book';
import { secondBook } from './meditations/02-second-book';
import { thirdBook } from './meditations/03-third-book';
import { fourthBook } from './meditations/04-fourth-book';
import { fifthBook } from './meditations/05-fifth-book';
import { sixthBook } from './meditations/06-sixth-book';
import { seventhBook } from './meditations/07-seventh-book';
import { eighthBook } from './meditations/08-eighth-book';
import { ninthBook } from './meditations/09-ninth-book';
import { tenthBook } from './meditations/10-tenth-book';
import { eleventhBook } from './meditations/11-eleventh-book';
import { twelfthBook } from './meditations/12-twelfth-book';

export const meditations: Book = {
  id: 'meditations',
  title: 'Meditations 沉思錄',
  author: 'Marcus Aurelius 馬可・奧勒留',
  description:
    '羅馬皇帝馬可・奧勒留(公元121-180年)喺行軍途中寫俾自己睇嘅私人札記,原名《Ta eis heauton》,即「致自己」,係斯多葛哲學嘅經典之作。全書共12卷,原文英文對照廣東話/普通話翻譯。',
  chapters: [
    firstBook,
    secondBook,
    thirdBook,
    fourthBook,
    fifthBook,
    sixthBook,
    seventhBook,
    eighthBook,
    ninthBook,
    tenthBook,
    eleventhBook,
    twelfthBook,
  ],
};
