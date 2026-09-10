import { Book } from './types';
import { guofulun } from './guofulun';
import { meditations } from './meditations';
import { enchiridion } from './enchiridion';
import { discourses } from './discourses';
import { seneca } from './seneca';

export const books: Book[] = [guofulun, meditations, enchiridion, discourses, seneca];

export function getBook(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}
