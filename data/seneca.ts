import { Book } from './types';
import { onSavingTime } from './seneca/01-on-saving-time';
import { onDiscursivenessInReading } from './seneca/02-on-discursiveness-in-reading';
import { onTrueAndFalseFriendship } from './seneca/03-on-true-and-false-friendship';
import { onThePhilosophersMean } from './seneca/04-on-the-philosophers-mean';
import { onCrowds } from './seneca/05-on-crowds';
import { onPhilosophyAndFriendship } from './seneca/06-on-philosophy-and-friendship';
import { onMasterAndSlave } from './seneca/07-on-master-and-slave';
import { onMeetingDeathCheerfully } from './seneca/08-on-meeting-death-cheerfully';

export const seneca: Book = {
  id: 'seneca-letters',
  title: 'Letters to Lucilius 致盧齊利烏斯書',
  author: 'Seneca 塞內卡',
  description:
    '古羅馬斯多葛派哲學家塞內卡(公元前4年-公元65年)晚年寫俾好友盧齊利烏斯嘅書信集,原名《Epistulae Morales ad Lucilium》,原著共124封信。呢度精選最經典嘅書信,涵蓋珍惜光陰、閱讀、友誼、避開人群、面對死亡等主題。原文英文對照廣東話/普通話翻譯,譯自Richard M. Gummere嘅英譯本。',
  chapters: [
    onSavingTime,
    onDiscursivenessInReading,
    onTrueAndFalseFriendship,
    onThePhilosophersMean,
    onCrowds,
    onPhilosophyAndFriendship,
    onMasterAndSlave,
    onMeetingDeathCheerfully,
  ],
};
