import { Book } from './types';
import { bourgeoisAndProletarians } from './manifesto/00-bourgeois-and-proletarians';
import { conclusion } from './manifesto/01-conclusion';

export const manifesto: Book = {
  id: 'manifesto',
  title: '共產黨宣言',
  author: 'Karl Marx & Friedrich Engels 馬克思與恩格斯',
  description:
    '1848年出版,原名《Manifesto of the Communist Party》,史上流傳最廣、最多人讀嘅政治小冊子之一。「一個幽靈,共產主義嘅幽靈,喺歐洲遊蕩」呢句開場白,同結尾「全世界無產者,聯合起來」都係傳誦一時嘅名句。呢度精選最經典嘅第一章同結語,原文英文對照廣東話/普通話翻譯。',
  chapters: [bourgeoisAndProletarians, conclusion],
};
