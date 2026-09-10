import { Book } from './types';
import { thingsInOurPower } from './discourses/01-things-in-our-power';
import { ofProvidence } from './discourses/02-of-providence';
import { howWeShouldBehaveToTyrants } from './discourses/03-how-we-should-behave-to-tyrants';
import { onFriendship } from './discourses/04-on-friendship';
import { howWeOughtToBearSickness } from './discourses/05-how-we-ought-to-bear-sickness';
import { aboutFreedom } from './discourses/06-about-freedom';
import { whatToDespiseAndValue } from './discourses/07-what-to-despise-and-value';
import { aboutPurity } from './discourses/08-about-purity';

export const discourses: Book = {
  id: 'discourses',
  title: 'Discourses 論說集',
  author: 'Epictetus 愛比克泰德',
  description:
    '愛比克泰德喺尼科波利斯講學嗰陣,由弟子阿里安記錄低嘅課堂對話,原名《Diatribai》。原著四卷、近百篇對話,呢度精選最經典嘅篇章,涵蓋操之在我、天道、自由、友誼、疾病同潔淨等主題。原文英文對照廣東話/普通話翻譯,譯自George Long嘅英譯選本。',
  chapters: [
    thingsInOurPower,
    ofProvidence,
    howWeShouldBehaveToTyrants,
    onFriendship,
    howWeOughtToBearSickness,
    aboutFreedom,
    whatToDespiseAndValue,
    aboutPurity,
  ],
};
