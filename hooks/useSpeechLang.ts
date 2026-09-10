import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'speech-lang';

export type SpeechLang = 'zh-CN' | 'zh-HK';

export function useSpeechLang() {
  const [lang, setLangState] = useState<SpeechLang>('zh-CN');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw === 'zh-CN' || raw === 'zh-HK') setLangState(raw);
    });
  }, []);

  const setLang = useCallback((next: SpeechLang) => {
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  return { lang, setLang };
}
