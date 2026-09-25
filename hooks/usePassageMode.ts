import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PassageMode = 'sentence' | 'paragraph';
const KEY = 'reader-passage-mode';
let mode: PassageMode = 'sentence';
let edited = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

// Shared across Settings and the book/reader screens; late hydration must not
// overwrite a selection made while storage is still loading.
AsyncStorage.getItem(KEY).then(value => {
  if (!edited && (value === 'sentence' || value === 'paragraph')) {
    mode = value;
    notify();
  }
}).catch(() => {});

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function setPassageMode(next: PassageMode) {
  edited = true;
  mode = next;
  notify();
  AsyncStorage.setItem(KEY, next).catch(() => {});
}

export function usePassageMode() {
  const passageMode = useSyncExternalStore(subscribe, () => mode, () => 'sentence' as PassageMode);
  return { passageMode, setPassageMode };
}
