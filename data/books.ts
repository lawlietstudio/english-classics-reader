import { Book } from './types';
import { guofulun } from './guofulun';
import { meditations } from './meditations';
import { enchiridion } from './enchiridion';

export const books: Book[] = [guofulun, meditations, enchiridion];

export function getBook(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}
