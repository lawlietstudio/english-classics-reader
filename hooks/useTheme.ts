import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultPaletteId, getPalette, isPaletteId, palettes, PaletteId } from '../theme/colors';

const SCHEME_STORAGE_KEY = 'theme-mode';
const PALETTE_STORAGE_KEY = 'theme-palette';

export type ThemeScheme = 'light' | 'dark';
export type SchemeMode = 'system' | ThemeScheme;

export function useTheme() {
  const systemScheme = useColorScheme();
  const [schemeMode, setSchemeModeState] = useState<SchemeMode>('system');
  const [paletteId, setPaletteIdState] = useState<PaletteId>(defaultPaletteId);

  useEffect(() => {
    AsyncStorage.getItem(SCHEME_STORAGE_KEY).then((raw) => {
      if (raw === 'light' || raw === 'dark' || raw === 'system') setSchemeModeState(raw);
    });
    AsyncStorage.getItem(PALETTE_STORAGE_KEY).then((raw) => {
      if (raw && isPaletteId(raw)) setPaletteIdState(raw);
    });
  }, []);

  const scheme: ThemeScheme = schemeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : schemeMode;

  const setSchemeMode = useCallback((mode: SchemeMode) => {
    setSchemeModeState(mode);
    AsyncStorage.setItem(SCHEME_STORAGE_KEY, mode).catch(() => {});
  }, []);

  const toggleScheme = useCallback(() => {
    const next: ThemeScheme = scheme === 'dark' ? 'light' : 'dark';
    setSchemeMode(next);
  }, [scheme, setSchemeMode]);

  const setPaletteId = useCallback((id: PaletteId) => {
    setPaletteIdState(id);
    AsyncStorage.setItem(PALETTE_STORAGE_KEY, id).catch(() => {});
  }, []);

  const palette = getPalette(paletteId);
  const colors = scheme === 'dark' ? palette.dark : palette.light;

  return {
    scheme,
    schemeMode,
    setSchemeMode,
    toggleScheme,
    colors,
    paletteId,
    setPaletteId,
    palettes,
  };
}
