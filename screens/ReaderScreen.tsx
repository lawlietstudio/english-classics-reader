import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { Chapter, Passage } from '../data/types';
import { FONT_SIZE_VALUES, useReaderPrefs } from '../hooks/useReaderPrefs';
import { SpeechLang } from '../hooks/useSpeechLang';
import { EffectiveSpeechLang, useSpeechVoice } from '../hooks/useSpeechVoice';
import { ThemeColors } from '../theme/colors';

// react-native-web's `Platform.OS` is always `'web'`, even when the page is running inside
// Android Chrome — it doesn't distinguish the underlying mobile OS the way the native
// `Platform.OS` does. But Android Chrome's `speechSynthesis.pause()`/`resume()` has the same
// problem as Android's native TextToSpeech: `resume()` reliably fails to actually continue
// speaking (this is a long-standing Chromium-on-Android bug, not something this app can fix),
// so pause/resume needs to be disabled there too, detected via user-agent sniffing since
// `Platform.OS` alone can't tell us.
const isAndroidWeb =
  Platform.OS === 'web' &&
  typeof navigator !== 'undefined' &&
  /android/i.test(navigator.userAgent ?? '');

function shortVoiceLabel(voice: Speech.Voice) {
  const name = voice.name || voice.identifier;
  const dashIndex = name.indexOf(' - ');
  const base = dashIndex > 0 ? name.slice(0, dashIndex) : name;
  return base.replace(/^Microsoft\s+/i, '').trim();
}

type Props = {
  bookTitle: string;
  chapter: Chapter;
  lang: SpeechLang;
  onChangeLang: (lang: SpeechLang) => void;
  onBack: () => void;
  colors: ThemeColors;
};

export default function ReaderScreen({ bookTitle, chapter, lang, onChangeLang, onBack, colors }: Props) {
  const {
    textSource,
    toggleTextSource,
    showVernacular,
    setShowVernacular,
    fontSize,
    rate,
    setRate,
  } = useReaderPrefs();
  const styles = useMemo(() => createStyles(colors, FONT_SIZE_VALUES[fontSize]), [colors, fontSize]);
  const [playingPassageId, setPlayingPassageId] = useState<string | null>(null);
  const [isPlayingChapter, setIsPlayingChapter] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const supportsPauseResume = Platform.OS !== 'android' && !isAndroidWeb;
  const stopRequestedRef = useRef(false);
  // Mirrors `isPaused` synchronously. On web, expo-speech maps the browser's
  // SpeechSynthesisUtterance `onpause` event to the same `onStopped` callback used for a real
  // stop, so `onStopped` fires right after we call Speech.pause(). This ref lets `onStopped`
  // tell that apart from a genuine stop and ignore the spurious one.
  const pausedRef = useRef(false);
  // Tracks the passage id and completion callback of the utterance currently in flight, so the
  // resume watchdog below can tell whether a passage is still "owned" by the utterance it started
  // watching, or has already moved on via a normal onDone.
  const activePassageIdRef = useRef<string | null>(null);
  const pendingOnEndRef = useRef<(() => void) | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // The original text here is always English; only the vernacular (Cantonese/Mandarin)
  // reading uses the app-wide `lang` toggle. Which voice pool to draw from therefore
  // depends on what's about to be read, not just on `lang` alone.
  const speechLang: EffectiveSpeechLang = textSource === 'original' ? 'en-US' : lang;
  const { voices, voiceId, checked: voiceChecked, selectVoice } = useSpeechVoice(speechLang);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current != null) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopRequestedRef.current = true;
      clearWatchdog();
      Speech.stop();
    };
  }, [chapter.id, clearWatchdog]);

  const vernacularFor = useCallback(
    (passage: Passage) =>
      lang === 'zh-CN' && passage.vernacularMandarin ? passage.vernacularMandarin : passage.vernacular,
    [lang]
  );

  const textFor = useCallback(
    (passage: Passage) => (textSource === 'original' ? passage.original : vernacularFor(passage)),
    [textSource, vernacularFor]
  );

  const speakOne = useCallback(
    (passage: Passage, onEnd?: () => void) => {
      clearWatchdog();
      activePassageIdRef.current = passage.id;
      pendingOnEndRef.current = onEnd ?? null;
      Speech.speak(textFor(passage), {
        language: speechLang,
        voice: voiceId,
        rate,
        onStart: () => {
          setPlayingPassageId(passage.id);
          pausedRef.current = false;
          setIsPaused(false);
        },
        onDone: () => {
          clearWatchdog();
          activePassageIdRef.current = null;
          pendingOnEndRef.current = null;
          setPlayingPassageId(null);
          pausedRef.current = false;
          setIsPaused(false);
          onEnd?.();
        },
        onStopped: () => {
          if (pausedRef.current) return;
          clearWatchdog();
          activePassageIdRef.current = null;
          pendingOnEndRef.current = null;
          setPlayingPassageId(null);
          setIsPaused(false);
        },
        onError: () => {
          clearWatchdog();
          activePassageIdRef.current = null;
          pendingOnEndRef.current = null;
          setPlayingPassageId(null);
          pausedRef.current = false;
          setIsPaused(false);
        },
      });
    },
    [clearWatchdog, speechLang, rate, textFor, voiceId]
  );

  const playChapterFrom = useCallback(
    (index: number) => {
      if (stopRequestedRef.current) return;
      if (index >= chapter.passages.length) {
        setIsPlayingChapter(false);
        return;
      }
      speakOne(chapter.passages[index], () => playChapterFrom(index + 1));
    },
    [chapter.passages, speakOne]
  );

  const handlePlayChapter = () => {
    stopRequestedRef.current = false;
    setIsPlayingChapter(true);
    pausedRef.current = false;
    setIsPaused(false);
    playChapterFrom(0);
  };

  const handleStop = () => {
    stopRequestedRef.current = true;
    clearWatchdog();
    activePassageIdRef.current = null;
    pendingOnEndRef.current = null;
    Speech.stop();
    setIsPlayingChapter(false);
    setPlayingPassageId(null);
    pausedRef.current = false;
    setIsPaused(false);
  };

  const handlePlayFrom = (passage: Passage) => {
    const index = chapter.passages.findIndex((p) => p.id === passage.id);
    if (index === -1) return;
    stopRequestedRef.current = true;
    clearWatchdog();
    activePassageIdRef.current = null;
    pendingOnEndRef.current = null;
    Speech.stop();
    stopRequestedRef.current = false;
    pausedRef.current = false;
    setIsPaused(false);
    setIsPlayingChapter(true);
    playChapterFrom(index);
  };

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      pausedRef.current = false;
      setIsPaused(false);
      Speech.resume();
      // Some browsers (observed on Chromium) never fire the utterance's completion
      // event after a pause()/resume() cycle, even though playback actually finishes —
      // silently stalling chapter auto-advance. Poll as a fallback and manually advance
      // if the engine goes idle while this passage is still marked active.
      clearWatchdog();
      const watchedPassageId = activePassageIdRef.current;
      if (watchedPassageId != null) {
        watchdogRef.current = setInterval(() => {
          Speech.isSpeakingAsync().then((speaking) => {
            if (speaking || activePassageIdRef.current !== watchedPassageId) {
              if (activePassageIdRef.current !== watchedPassageId) clearWatchdog();
              return;
            }
            clearWatchdog();
            const onEnd = pendingOnEndRef.current;
            activePassageIdRef.current = null;
            pendingOnEndRef.current = null;
            pausedRef.current = false;
            setPlayingPassageId(null);
            setIsPaused(false);
            onEnd?.();
          });
        }, 300);
      }
    } else {
      pausedRef.current = true;
      setIsPaused(true);
      Speech.pause();
    }
  }, [clearWatchdog, isPaused]);

  const adjustRate = (delta: number) => {
    setRate((r) => r + delta);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>
          {bookTitle} · {chapter.title}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.controlsRow}>
        <Pressable
          style={[styles.pill, textSource !== 'vernacular' && styles.pillDim]}
          onPress={() => onChangeLang(lang === 'zh-CN' ? 'zh-HK' : 'zh-CN')}
        >
          <Text style={styles.pillText}>{lang === 'zh-CN' ? '普通話' : '廣東話'}</Text>
        </Pressable>
        <Pressable style={styles.pill} onPress={toggleTextSource}>
          <Text style={styles.pillText}>朗讀:{textSource === 'original' ? '英文' : '中文'}</Text>
        </Pressable>
        {voices.length > 1 && (
          <Pressable style={styles.pill} onPress={() => setVoicePickerOpen(true)}>
            <Text style={styles.pillText}>
              聲:{shortVoiceLabel(voices.find((v) => v.identifier === voiceId) ?? voices[0])} ▾
            </Text>
          </Pressable>
        )}
        <View style={styles.rateBox}>
          <Pressable onPress={() => adjustRate(-0.1)} hitSlop={8}>
            <Text style={styles.rateBtn}>－</Text>
          </Pressable>
          <Text style={styles.rateText}>{rate.toFixed(1)}x</Text>
          <Pressable onPress={() => adjustRate(0.1)} hitSlop={8}>
            <Text style={styles.rateBtn}>＋</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.controlsRow}>
        {playingPassageId !== null ? (
          <View style={styles.transportRow}>
            {supportsPauseResume && (
              <Pressable style={styles.playAllBtn} onPress={handlePauseResume}>
                <Text style={styles.playAllText}>{isPaused ? '▶ 繼續' : '⏸ 暫停'}</Text>
              </Pressable>
            )}
            <Pressable style={[styles.playAllBtn, styles.playAllBtnActive]} onPress={handleStop}>
              <Text style={styles.playAllText}>■ 停止</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.playAllBtn} onPress={handlePlayChapter}>
            <Text style={styles.playAllText}>▶ 播放全篇</Text>
          </Pressable>
        )}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>顯示中文</Text>
          <Switch value={showVernacular} onValueChange={setShowVernacular} />
        </View>
      </View>

      {voiceChecked && !voiceId && (
        <Text style={styles.hint}>
          {speechLang === 'en-US'
            ? Platform.OS === 'android'
              ? '手機未搵到英文語音,可能未裝語音包。'
              : '呢個瀏覽器/裝置未搵到英文語音,請試換個瀏覽器。'
            : Platform.OS === 'android'
            ? `手機未搵到${lang === 'zh-HK' ? '廣東話' : '普通話'}語音,可能未裝語音包,請試轉${lang === 'zh-HK' ? '普通話' : '廣東話'}。`
            : `呢個瀏覽器/裝置未搵到${lang === 'zh-HK' ? '廣東話' : '普通話'}語音,請試轉${lang === 'zh-HK' ? '普通話' : '廣東話'}或換個瀏覽器。`}
        </Text>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {chapter.passages.map((passage) => {
          const active = playingPassageId === passage.id;
          return (
            <View key={passage.id} style={[styles.passageCard, active && styles.passageCardActive]}>
              <View style={styles.passageHeader}>
                {passage.title ? (
                  <Text style={styles.passageTitle}>{passage.title}</Text>
                ) : (
                  <View />
                )}
                <Pressable
                  onPress={() => {
                    if (!active) {
                      handlePlayFrom(passage);
                    } else if (supportsPauseResume) {
                      handlePauseResume();
                    } else {
                      // No pause/resume on this platform (Android's TTS has no such
                      // concept) — tapping the "active" icon here must stop playback,
                      // not restart the passage from the top.
                      handleStop();
                    }
                  }}
                  hitSlop={10}
                >
                  <Text style={styles.playIcon}>
                    {!active ? '▶' : supportsPauseResume ? (isPaused ? '▶' : '⏸') : '■'}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.originalText}>{passage.original}</Text>
              {showVernacular && (
                <Text style={styles.vernacularText}>{vernacularFor(passage)}</Text>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={voicePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setVoicePickerOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVoicePickerOpen(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>揀把聲</Text>
            <ScrollView style={styles.modalList}>
              {voices.map((voice) => {
                const isActive = voice.identifier === voiceId;
                return (
                  <Pressable
                    key={voice.identifier}
                    style={[styles.voiceOption, isActive && styles.voiceOptionActive]}
                    onPress={() => {
                      selectVoice(voice.identifier);
                      setVoicePickerOpen(false);
                    }}
                  >
                    <Text style={[styles.voiceOptionText, isActive && styles.voiceOptionTextActive]}>
                      {shortVoiceLabel(voice)}
                    </Text>
                    {isActive && <Text style={styles.voiceOptionCheck}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (c: ThemeColors, passageFontSize: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, paddingTop: Platform.OS === 'web' ? 24 : 56 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    back: { fontSize: 16, color: c.textSecondary, width: 60 },
    topTitle: { fontSize: 15, fontWeight: '600', color: c.textPrimary, flex: 1, textAlign: 'center' },
    controlsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 14,
      gap: 10,
      rowGap: 8,
    },
    pill: {
      backgroundColor: c.pill,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    pillDim: { opacity: 0.5 },
    pillText: { fontSize: 13, color: c.textMuted },
    rateBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.pill,
      borderRadius: 16,
      paddingHorizontal: 10,
      gap: 8,
    },
    rateBtn: { fontSize: 16, color: c.textMuted, paddingVertical: 4, width: 18, textAlign: 'center' },
    rateText: { fontSize: 13, color: c.textMuted, minWidth: 34, textAlign: 'center' },
    transportRow: { flexDirection: 'row', gap: 8 },
    playAllBtn: {
      backgroundColor: c.inverse,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
    },
    playAllBtnActive: { backgroundColor: c.accentStrong },
    playAllText: { color: c.inverseText, fontSize: 14, fontWeight: '600' },
    switchRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 8 },
    switchLabel: { fontSize: 13, color: c.textMuted },
    hint: { fontSize: 11, color: c.accent, paddingHorizontal: 20, marginTop: 8 },
    scroll: { flex: 1, marginTop: 16 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 60 },
    passageCard: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    passageCardActive: { borderColor: c.accentStrong, backgroundColor: c.activeCardBg },
    passageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    passageTitle: { fontSize: 13, fontWeight: '700', color: c.accent },
    playIcon: { fontSize: 16 },
    originalText: {
      fontSize: passageFontSize,
      lineHeight: Math.round(passageFontSize * 1.6),
      color: c.textPrimary,
      fontWeight: '500',
    },
    vernacularText: {
      fontSize: passageFontSize,
      lineHeight: Math.round(passageFontSize * 1.6),
      color: c.textSecondary,
      marginTop: 10,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: c.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    modalCard: {
      backgroundColor: c.background,
      borderRadius: 16,
      padding: 16,
      width: '100%',
      maxWidth: 320,
      maxHeight: '70%',
    },
    modalTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 10 },
    modalList: { flexGrow: 0 },
    voiceOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
    },
    voiceOptionActive: { backgroundColor: c.pill },
    voiceOptionText: { fontSize: 15, color: c.textPrimary },
    voiceOptionTextActive: { fontWeight: '700', color: c.accent },
    voiceOptionCheck: { fontSize: 15, color: c.accent, fontWeight: '700' },
  });
