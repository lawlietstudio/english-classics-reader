import { Book } from './types';
import { guofulun } from './guofulun';

export const books: Book[] = [guofulun];

export function getBook(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}
