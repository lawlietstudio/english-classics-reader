import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'reading-progress';

export type Progress = {
  bookId: string;
  chapterId: string;
};

export function useProgress() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setProgress(JSON.parse(raw));
      })
      .finally(() => setLoaded(true));
  }, []);

  const saveProgress = useCallback((next: Progress) => {
    setProgress(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  return { progress, loaded, saveProgress };
}
