import { Book } from './types';
import { theSocialCompact } from './socialcontract/00-the-social-compact';

export const socialcontract: Book = {
  id: 'socialcontract',
  title: '社會契約論',
  author: 'Jean-Jacques Rousseau 讓-雅克·盧梭',
  description:
    '1762年出版,原名《Du contrat social》,啟蒙時代最有影響力嘅政治哲學著作之一,直接啟發咗法國大革命同《人權和公民權宣言》。「人生而自由,卻無往不在枷鎖之中」呢句開場白,同「公共意志」「被迫得到自由」呢啲概念,都影響咗兩個世紀嘅政治思想。呢度精選第一卷最經典嘅論述(英譯本),原文對照廣東話/普通話翻譯。',
  chapters: [theSocialCompact],
};
