export type Passage = {
  id: string;
  title?: string;
  original: string;
  vernacular: string;
  /** Standard written Mandarin (書面語) rendering of `vernacular`, used when reading in 普通話. Falls back to `vernacular` when absent. */
  vernacularMandarin?: string;
};

export type Chapter = {
  id: string;
  title: string;
  passages: Passage[];
};

export type Book = {
  id: string;
  title: string;
  author: string;
  description: string;
  chapters: Chapter[];
};
