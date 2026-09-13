import { Book } from './types';
import { estrangedLabour } from './manuscripts1844/00-estranged-labour';
import { privatePropertyAndCommunism } from './manuscripts1844/01-private-property-and-communism';
import { powerOfMoney } from './manuscripts1844/02-power-of-money';
import { wagesOfLabour } from './manuscripts1844/03-wages-of-labour';
import { profitOfCapital } from './manuscripts1844/04-profit-of-capital';
import { preface } from './manuscripts1844/05-preface';
import { privatePropertyAndLabour } from './manuscripts1844/06-private-property-and-labour';
import { rentOfLand } from './manuscripts1844/07-rent-of-land';
import { antithesisOfCapitalAndLabour } from './manuscripts1844/08-antithesis-of-capital-and-labour';
import { humanNeedsAndDivisionOfLabour } from './manuscripts1844/09-human-needs-and-division-of-labour';

export const manuscripts1844: Book = {
  id: 'manuscripts1844',
  title: '經濟學哲學手稿',
  author: 'Karl Marx 卡爾·馬克思',
  description:
    '1844年馬克思喺巴黎寫低但生前未有出版嘅手稿,1932年先正式面世,原名《Economic and Philosophic Manuscripts of 1844》。呢度精選最經典嘅篇章,原文英文對照廣東話/普通話翻譯。',
  chapters: [
    preface,
    wagesOfLabour,
    profitOfCapital,
    rentOfLand,
    estrangedLabour,
    antithesisOfCapitalAndLabour,
    privatePropertyAndLabour,
    privatePropertyAndCommunism,
    humanNeedsAndDivisionOfLabour,
    powerOfMoney,
  ],
};
