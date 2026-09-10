import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TEXT_SOURCE_KEY = 'reader-text-source';
const SHOW_VERNACULAR_KEY = 'reader-show-vernacular';
const FONT_SIZE_KEY = 'reader-font-size';
const RATE_KEY = 'reader-speech-rate';

export type TextSource = 'original' | 'vernacular';

export type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

export const FONT_SIZE_OPTIONS: { key: FontSize; label: string }[] = [
  { key: 'small', label: '細' },
  { key: 'medium', label: '中' },
  { key: 'large', label: '大' },
  { key: 'xlarge', label: '特大' },
];

// Base point size for passage text (original and vernacular share the same size).
// Line height is derived at a fixed ratio wherever this is consumed.
export const FONT_SIZE_VALUES: Record<FontSize, number> = {
  small: 16,
  medium: 19,
  large: 23,
  xlarge: 28,
};

const DEFAULT_RATE = 0.85;
const MIN_RATE = 0.5;
const MAX_RATE = 1.5;

function isFontSize(value: string | null): value is FontSize {
  return value === 'small' || value === 'medium' || value === 'large' || value === 'xlarge';
}

function clampRate(value: number) {
  return Math.min(MAX_RATE, Math.max(MIN_RATE, +value.toFixed(2)));
}

export function useReaderPrefs() {
  const [textSource, setTextSourceState] = useState<TextSource>('original');
  const [showVernacular, setShowVernacularState] = useState(true);
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [rate, setRateState] = useState(DEFAULT_RATE);

  useEffect(() => {
    AsyncStorage.getItem(TEXT_SOURCE_KEY).then((raw) => {
      if (raw === 'original' || raw === 'vernacular') setTextSourceState(raw);
    });
    AsyncStorage.getItem(SHOW_VERNACULAR_KEY).then((raw) => {
      if (raw === 'true' || raw === 'false') setShowVernacularState(raw === 'true');
    });
    AsyncStorage.getItem(FONT_SIZE_KEY).then((raw) => {
      if (isFontSize(raw)) setFontSizeState(raw);
    });
    AsyncStorage.getItem(RATE_KEY).then((raw) => {
      const parsed = raw != null ? Number(raw) : NaN;
      if (!Number.isNaN(parsed)) setRateState(clampRate(parsed));
    });
  }, []);

  const setTextSource = useCallback((next: TextSource) => {
    setTextSourceState(next);
    AsyncStorage.setItem(TEXT_SOURCE_KEY, next).catch(() => {});
  }, []);

  const toggleTextSource = useCallback(() => {
    setTextSource(textSource === 'original' ? 'vernacular' : 'original');
  }, [textSource, setTextSource]);

  const setShowVernacular = useCallback((next: boolean) => {
    setShowVernacularState(next);
    AsyncStorage.setItem(SHOW_VERNACULAR_KEY, String(next)).catch(() => {});
  }, []);

  const setFontSize = useCallback((next: FontSize) => {
    setFontSizeState(next);
    AsyncStorage.setItem(FONT_SIZE_KEY, next).catch(() => {});
  }, []);

  const setRate = useCallback((next: number | ((prev: number) => number)) => {
    setRateState((prev) => {
      const resolved = clampRate(typeof next === 'function' ? next(prev) : next);
      AsyncStorage.setItem(RATE_KEY, String(resolved)).catch(() => {});
      return resolved;
    });
  }, []);

  return {
    textSource,
    setTextSource,
    toggleTextSource,
    showVernacular,
    setShowVernacular,
    fontSize,
    setFontSize,
    rate,
    setRate,
  };
}
