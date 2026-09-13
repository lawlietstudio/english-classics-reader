import { Book } from './types';
import { commodities } from './capital/00-commodities';
import { fetishismOfCommodities } from './capital/03-fetishism-of-commodities';
import { buyingAndSellingOfLabourPower } from './capital/04-buying-and-selling-of-labour-power';
import { theWorkingDay } from './capital/01-the-working-day';
import { machineryAndModernIndustry } from './capital/05-machinery-and-modern-industry';
import { generalLawOfCapitalistAccumulation } from './capital/06-general-law-of-capitalist-accumulation';
import { primitiveAccumulation } from './capital/02-primitive-accumulation';
import { genesisOfTheIndustrialCapitalist } from './capital/07-genesis-of-the-industrial-capitalist';

export const capital: Book = {
  id: 'capital',
  title: '資本論',
  author: 'Karl Marx 卡爾·馬克思',
  description:
    '1867年出版嘅第一卷,原名《Das Kapital》,馬克思一生最重要嘅政治經濟學鉅著。相比《1844年手稿》嗰種哲學筆記,呢部係更成熟、更技術性嘅經濟學批判。呢度精選最經典、最易入口嘅篇章,原文英文對照廣東話/普通話翻譯。',
  chapters: [
    commodities,
    fetishismOfCommodities,
    buyingAndSellingOfLabourPower,
    theWorkingDay,
    machineryAndModernIndustry,
    generalLawOfCapitalistAccumulation,
    primitiveAccumulation,
    genesisOfTheIndustrialCapitalist,
  ],
};
