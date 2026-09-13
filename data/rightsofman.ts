import { Book } from './types';
import { declaration } from './rightsofman/00-declaration';

export const rightsofman: Book = {
  id: 'rightsofman',
  title: '人權和公民權宣言',
  author: '法國國民議會',
  description:
    '1789年8月26日由法國國民議會通過,原名《Déclaration des droits de l\'homme et du citoyen》,法國大革命嘅奠基文件,亦係現代人權概念嘅重要源頭。全文短小精悍,一個序言加17條條文,呢度全文收錄,原文英文對照廣東話/普通話翻譯。',
  chapters: [declaration],
};
