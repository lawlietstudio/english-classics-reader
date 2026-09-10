import { Book } from './types';
import { thingsInOurPower } from './epictetus/01-things-in-our-power';
import { dutyAndImpediment } from './epictetus/02-duty-and-impediment';
import { freedomFromAppearances } from './epictetus/03-freedom-from-appearances';
import { relationsAndTheGods } from './epictetus/04-relations-and-the-gods';
import { restraintAndDesire } from './epictetus/05-restraint-and-desire';
import { progressTowardWisdom } from './epictetus/06-progress-toward-wisdom';

export const enchiridion: Book = {
  id: 'enchiridion',
  title: 'Enchiridion 手冊',
  author: 'Epictetus 愛比克泰德',
  description:
    '古羅馬斯多葛派哲學家愛比克泰德(公元55-135年)嘅弟子阿里安,將老師嘅教誨輯錄成呢本簡明手冊,原名《Encheiridion》,即「隨身小刀」之意——意指本書應如利刃咁隨時帶喺身邊應用。全書共52節,原文英文對照廣東話/普通話翻譯,譯自George Long嘅英譯本。',
  chapters: [
    thingsInOurPower,
    dutyAndImpediment,
    freedomFromAppearances,
    relationsAndTheGods,
    restraintAndDesire,
    progressTowardWisdom,
  ],
};
