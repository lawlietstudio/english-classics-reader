import { Book } from './types';
import { firstBook } from './meditations/01-first-book';

export const meditations: Book = {
  id: 'meditations',
  title: 'Meditations 沉思錄',
  author: 'Marcus Aurelius 馬可・奧勒留',
  description:
    '羅馬皇帝馬可・奧勒留(公元121-180年)喺行軍途中寫俾自己睇嘅私人札記,原名《Ta eis heauton》,即「致自己」,係斯多葛哲學嘅經典之作。全書共12卷,原文英文對照廣東話/普通話翻譯。',
  chapters: [firstBook],
};
