export type BookCategory = {
  id: string;
  label: string;
  bookIds: string[];
};

// Home-screen tabs. A book not listed here still shows under 全部.
export const bookCategories: BookCategory[] = [
  { id: 'fairy', label: '童話故事', bookIds: ['aesop', 'potter', 'hp', 'oz', 'pan', 'alice'] },
  { id: 'youth', label: '少年小說', bookIds: ['anne', 'pol', 'bb', 'sg', 'tom'] },
  { id: 'fiction', label: '經典小說', bookIds: ['sherlock', 'animalfarm', 'oldman'] },
  {
    id: 'shakespeare',
    label: '莎士比亞',
    bookIds: [
      'sonnets',
      'hamlet',
      'othello',
      'lear',
      'macbeth',
      'romeo',
      'merchant',
      'midsummer',
      'caesar',
    ],
  },
  {
    id: 'philosophy',
    label: '哲學',
    bookIds: ['meditations', 'enchiridion', 'discourses', 'seneca-letters'],
  },
  {
    id: 'politics',
    label: '經濟政治',
    bookIds: [
      'guofulun',
      'manuscripts1844',
      'capital',
      'manifesto',
      'rightsofman',
      'independence',
      'commonsense',
      'onliberty',
      'socialcontract',
    ],
  },
  { id: 'bio', label: '傳記', bookIds: ['franklin', 'upfromslavery', 'carnegie', 'justforfun'] },
];
