import { Book } from './types';
import { originOfGovernmentAndIndependence } from './commonsense/00-origin-of-government-and-independence';

export const commonsense: Book = {
  id: 'commonsense',
  title: '常識',
  author: 'Thomas Paine 湯瑪士·潘恩',
  description:
    '1776年1月出版嘅小冊子,原名《Common Sense》,發行量喺當時嘅北美殖民地打破紀錄,直接推動咗美國走向獨立。文筆淺白有力,將「君主制」同「政府嘅本質」呢啲抽象議題,講到販夫走卒都聽得明。呢度精選最經典嘅論點同呼籲獨立嘅名句,原文英文對照廣東話/普通話翻譯。',
  chapters: [originOfGovernmentAndIndependence],
};
