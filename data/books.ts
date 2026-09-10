import { Book } from './types';
import { guofulun } from './guofulun';
import { meditations } from './meditations';

export const books: Book[] = [guofulun, meditations];

export function getBook(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}
