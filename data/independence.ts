import { Book } from './types';
import { declaration } from './independence/00-declaration';

export const independence: Book = {
  id: 'independence',
  title: '美國獨立宣言',
  author: 'Thomas Jefferson 湯瑪士·傑佛遜(執筆)',
  description:
    '1776年7月4日由大陸會議通過,正式宣告十三個北美殖民地脫離英國統治。開篇「人人生而平等」一段係啟蒙思想嘅經典表述,對後世憲政民主影響深遠。原文中段有27條針對英王喬治三世嘅具體控訴,呢度精選最經典嘅哲學論述同代表性控訴,原文英文對照廣東話/普通話翻譯。',
  chapters: [declaration],
};
