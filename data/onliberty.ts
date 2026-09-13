import { Book } from './types';
import { theHarmPrinciple } from './onliberty/00-the-harm-principle';

export const onliberty: Book = {
  id: 'onliberty',
  title: '論自由',
  author: 'John Stuart Mill 約翰·史都華·穆勒',
  description:
    '1859年出版,原名《On Liberty》,自由主義嘅奠基經典。穆勒喺《資本論》都俾馬克思引用過,呢部書正正就係自由主義同馬克思批判形成對照嘅代表作。核心係「傷害原則」:個人行為只要唔傷害他人,就唔應該受社會或者政府干預。呢度精選最經典嘅論述,原文英文對照廣東話/普通話翻譯。',
  chapters: [theHarmPrinciple],
};
