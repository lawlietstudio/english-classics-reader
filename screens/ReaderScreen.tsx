import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import * as Speech from 'expo-speech';
import { setAudioModeAsync } from 'expo-audio';
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
  // Undefined when there's no neighbouring chapter (first/last in the book) — swiping in that
  // direction rubber-bands back to centre instead of navigating.
  onPrevChapter?: () => void;
  onNextChapter?: () => void;
};

export default function ReaderScreen({
  bookTitle,
  chapter,
  lang,
  onChangeLang,
  onBack,
  colors,
  onPrevChapter,
  onNextChapter,
}: Props) {
  const {
    textSource: preferredTextSource,
    toggleTextSource,
    showVernacular,
    setShowVernacular,
    fontSize,
    rate,
    setRate,
    snapScroll,
    tapPassageToPlay,
  } = useReaderPrefs();
  const hasTranslation = chapter.passages.every((passage) => passage.vernacular.trim().length > 0);
  const textSource = hasTranslation ? preferredTextSource : 'original';
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
  // iOS Safari/Chrome (both WebKit) heavily throttle a locked-screen tab's JavaScript unless
  // the tab is recognised as actively playing media — otherwise the utterance's completion
  // event can arrive very late or never, silently stalling chapter auto-advance. Holding an
  // actually-playing (silent) audio graph open for the duration of chapter playback, plus a
  // Media Session registration, is what earns that background-audio allowance.
  const keepAliveRef = useRef<{ stop: () => void } | null>(null);
  const bgWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Media Session action handlers are registered once per `startKeepAlive()` call but need to
  // invoke whichever handler closure is current (they capture `isPaused` etc.), hence indirection
  // through refs kept up to date below rather than calling `handlePauseResume`/`handleStop` directly.
  const handlePauseResumeRef = useRef<(() => void) | null>(null);
  const handleStopRef = useRef<(() => void) | null>(null);
  // The original text here is always English; only the vernacular (Cantonese/Mandarin)
  // reading uses the app-wide `lang` toggle. Which voice pool to draw from therefore
  // depends on what's about to be read, not just on `lang` alone.
  const speechLang: EffectiveSpeechLang = textSource === 'original' ? 'en-US' : lang;
  const { voices, voiceId, checked: voiceChecked, selectVoice } = useSpeechVoice(speechLang);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const passageOffsetsRef = useRef<Record<string, number>>({});
  const lastScrollYRef = useRef(0);
  const maxScrollYRef = useRef(0);
  const draggingRef = useRef(false);
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearScrollTimer = useCallback(() => {
    if (scrollEndTimerRef.current != null) {
      clearTimeout(scrollEndTimerRef.current);
      scrollEndTimerRef.current = null;
    }
  }, []);

  // Cancel work from the previous chapter or preference when navigation changes.
  useEffect(() => {
    clearScrollTimer();
    return clearScrollTimer;
  }, [chapter.id, snapScroll, clearScrollTimer]);

  const handlePassageLayout = useCallback((id: string, e: LayoutChangeEvent) => {
    passageOffsetsRef.current[id] = e.nativeEvent.layout.y;
  }, []);

  const scheduleSnap = useCallback(() => {
    clearScrollTimer();
    if (!snapScroll || draggingRef.current) return;
    scrollEndTimerRef.current = setTimeout(() => {
      scrollEndTimerRef.current = null;
      const offsets = chapter.passages
        .map((passage) => passageOffsetsRef.current[passage.id])
        .filter((offset): offset is number => offset != null);
      if (!offsets.length) return;
      const y = lastScrollYRef.current;
      const nearest = offsets.reduce((best, offset) =>
        Math.abs(offset - y) < Math.abs(best - y) ? offset : best
      );
      // The last card may not reach the top; clamp to avoid repeated snapping at the bottom.
      const target = Math.max(0, Math.min(nearest, maxScrollYRef.current));
      if (Math.abs(target - y) > 1) {
        scrollRef.current?.scrollTo({ y: target, animated: true });
      }
    }, 120);
  }, [chapter.passages, snapScroll, clearScrollTimer]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    lastScrollYRef.current = contentOffset.y;
    maxScrollYRef.current = Math.max(0, contentSize.height - layoutMeasurement.height);
    scheduleSnap();
  }, [scheduleSnap]);

  // Match the classical reader: keep the spoken passage visible on both a
  // manual play tap and automatic chapter playback, independently of drag snapping.
  useEffect(() => {
    if (playingPassageId == null) return;
    if (!chapter.passages.some((passage) => passage.id === playingPassageId)) return;
    const offset = passageOffsetsRef.current[playingPassageId];
    if (offset == null) return;
    clearScrollTimer();
    scrollRef.current?.scrollTo({ y: offset, animated: true });
  }, [playingPassageId, chapter.passages, clearScrollTimer]);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current != null) {
      clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const clearBgWatchdog = useCallback(() => {
    if (bgWatchdogRef.current != null) {
      clearInterval(bgWatchdogRef.current);
      bgWatchdogRef.current = null;
    }
  }, []);

  const stopKeepAlive = useCallback(() => {
    keepAliveRef.current?.stop();
    keepAliveRef.current = null;
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        (navigator as any).mediaSession.playbackState = 'none';
      } catch {}
    }
  }, []);

  // Must be called from inside a user-gesture handler (the play/pause button), since iOS
  // requires an AudioContext to be created or resumed synchronously within a tap in order to
  // actually run rather than stay suspended.
  const startKeepAlive = useCallback(() => {
    if (Platform.OS !== 'web' || keepAliveRef.current) return;
    const AudioCtx =
      typeof window !== 'undefined' ? (window as any).AudioContext || (window as any).webkitAudioContext : null;
    if (AudioCtx) {
      try {
        const ctx = new AudioCtx();
        const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); // 1s of silence
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(ctx.destination);
        source.start(0);
        if (ctx.state === 'suspended') ctx.resume();
        keepAliveRef.current = {
          stop: () => {
            try {
              source.stop();
            } catch {}
            try {
              ctx.close();
            } catch {}
          },
        };
      } catch {
        keepAliveRef.current = null;
      }
    }
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const ms: any = (navigator as any).mediaSession;
        ms.metadata = new (window as any).MediaMetadata({ title: chapter.title, artist: bookTitle });
        ms.playbackState = 'playing';
        ms.setActionHandler('play', () => {
          if (supportsPauseResume) handlePauseResumeRef.current?.();
        });
        ms.setActionHandler('pause', () => {
          if (supportsPauseResume) handlePauseResumeRef.current?.();
        });
        ms.setActionHandler('stop', () => handleStopRef.current?.());
      } catch {}
    }
  }, [bookTitle, chapter.title, supportsPauseResume]);

  useEffect(() => {
    return () => {
      stopRequestedRef.current = true;
      clearWatchdog();
      clearBgWatchdog();
      stopKeepAlive();
      Speech.stop();
    };
  }, [chapter.id, clearWatchdog, clearBgWatchdog, stopKeepAlive]);

  // On native platforms, this is the real fix for screen-lock playback: it configures the
  // app's shared AVAudioSession (iOS) / audio focus (Android) for background playback, which
  // `useApplicationAudioSession: true` below then tells the speech synthesizer to use instead
  // of its own short-lived session. Requires the `expo-audio` config plugin's
  // `enableBackgroundPlayback` (adds the `audio` UIBackgroundMode) and a native rebuild — it
  // has no effect on web, where the keep-alive/watchdog approach above is the only option.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

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
        // Tells AVSpeechSynthesizer to use the app's own AVAudioSession (configured for
        // background playback above via expo-audio) instead of managing a short-lived one
        // of its own, which is what actually lets speech continue with the screen locked.
        ...(Platform.OS === 'ios' ? { useApplicationAudioSession: true } : null),
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
          // A single passage erroring out (e.g. the TTS engine hiccupping while the tab is
          // backgrounded) shouldn't silently kill the rest of chapter playback — skip ahead
          // instead, matching onDone's behaviour.
          onEnd?.();
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
        clearBgWatchdog();
        stopKeepAlive();
        return;
      }
      speakOne(chapter.passages[index], () => playChapterFrom(index + 1));
    },
    [chapter.passages, speakOne, clearBgWatchdog, stopKeepAlive]
  );

  const handlePlayChapter = () => {
    stopRequestedRef.current = false;
    setIsPlayingChapter(true);
    pausedRef.current = false;
    setIsPaused(false);
    startKeepAlive();
    playChapterFrom(0);
  };

  const handleStop = () => {
    stopRequestedRef.current = true;
    clearWatchdog();
    clearBgWatchdog();
    stopKeepAlive();
    activePassageIdRef.current = null;
    pendingOnEndRef.current = null;
    Speech.stop();
    setIsPlayingChapter(false);
    setPlayingPassageId(null);
    pausedRef.current = false;
    setIsPaused(false);
  };
  handleStopRef.current = handleStop;

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
    startKeepAlive();
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
  handlePauseResumeRef.current = handlePauseResume;

  // Defense in depth for the case above: even with the keep-alive audio graph and Media
  // Session registered, some browser/OS combinations still drop the utterance's completion
  // event specifically while the tab is hidden (screen locked or app backgrounded). While
  // hidden and mid-chapter, poll the engine directly and manually advance if it has gone idle
  // without onDone/onError having cleared the in-flight passage. This mirrors the existing
  // pause/resume watchdog above, but is scoped to backgrounding rather than a manual resume.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!isPlayingChapter || pausedRef.current) return;
        clearBgWatchdog();
        bgWatchdogRef.current = setInterval(() => {
          const watchedPassageId = activePassageIdRef.current;
          if (watchedPassageId == null) return;
          Speech.isSpeakingAsync().then((speaking) => {
            if (speaking || activePassageIdRef.current !== watchedPassageId) return;
            clearBgWatchdog();
            const onEnd = pendingOnEndRef.current;
            activePassageIdRef.current = null;
            pendingOnEndRef.current = null;
            setPlayingPassageId(null);
            onEnd?.();
          });
        }, 1000);
      } else {
        clearBgWatchdog();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPlayingChapter, clearBgWatchdog]);

  const adjustRate = (delta: number) => {
    setRate((r) => r + delta);
  };

  // Swipe-to-change-chapter, similar to SwiftUI's page-style TabView: drag horizontally to
  // preview the transition, release past a distance/velocity threshold to commit it, otherwise
  // spring back. At the first/last chapter (no handler for that direction) the drag is heavily
  // damped so it still moves a little (rubber-band feedback) but never actually navigates.
  const screenWidth = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(0)).current;
  const SWIPE_COMMIT_DISTANCE = 70;
  const SWIPE_COMMIT_VELOCITY = 0.5;
  // The PanResponder's callbacks below are created once (via the useRef further down) and would
  // otherwise close over the `onPrevChapter`/`onNextChapter` props from that first render only;
  // refs let them always see the current chapter's neighbours as the user navigates.
  const onPrevChapterRef = useRef(onPrevChapter);
  onPrevChapterRef.current = onPrevChapter;
  const onNextChapterRef = useRef(onNextChapter);
  onNextChapterRef.current = onNextChapter;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5,
      onPanResponderMove: (_evt, gestureState) => {
        const movingToNext = gestureState.dx < 0;
        const hasTarget = movingToNext ? !!onNextChapterRef.current : !!onPrevChapterRef.current;
        translateX.setValue(hasTarget ? gestureState.dx : gestureState.dx * 0.3);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const movingToNext = gestureState.dx < 0;
        const target = movingToNext ? onNextChapterRef.current : onPrevChapterRef.current;
        const committed =
          !!target &&
          (Math.abs(gestureState.dx) > SWIPE_COMMIT_DISTANCE ||
            Math.abs(gestureState.vx) > SWIPE_COMMIT_VELOCITY);
        if (committed) {
          Animated.timing(translateX, {
            toValue: movingToNext ? -screenWidth : screenWidth,
            duration: 220,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => {
            translateX.setValue(0);
            target!();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: Platform.OS !== 'web',
            bounciness: 8,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: Platform.OS !== 'web',
          bounciness: 8,
        }).start();
      },
    })
  ).current;

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
          disabled={!hasTranslation}
          onPress={() => onChangeLang(lang === 'zh-CN' ? 'zh-HK' : 'zh-CN')}
        >
          <Text style={styles.pillText}>{lang === 'zh-CN' ? '普通話' : '廣東話'}</Text>
        </Pressable>
        <Pressable style={styles.pill} onPress={toggleTextSource} disabled={!hasTranslation}>
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
          <Text style={styles.switchLabel}>{hasTranslation ? '顯示中文' : '暫無中文翻譯'}</Text>
          <Switch value={hasTranslation && showVernacular} onValueChange={setShowVernacular} disabled={!hasTranslation} />
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

      <Animated.View
        style={[styles.scroll, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
      <ScrollView
        key={chapter.id}
        ref={scrollRef}
        style={styles.scrollInner}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          draggingRef.current = true;
          clearScrollTimer();
        }}
        onScrollEndDrag={() => {
          draggingRef.current = false;
          scheduleSnap();
        }}
      >
        {chapter.passages.map((passage) => {
          const active = playingPassageId === passage.id;
          const PassageCard = tapPassageToPlay ? Pressable : View;
          const onPassagePress = () => {
            if (!active) handlePlayFrom(passage);
            else if (supportsPauseResume) handlePauseResume();
            else handleStop();
          };
          const actionLabel = !active ? '播放段落' : supportsPauseResume ? (isPaused ? '繼續播放' : '暫停播放') : '停止播放';
          return (
            <PassageCard
              onPress={tapPassageToPlay ? onPassagePress : undefined}
              accessible={tapPassageToPlay}
              accessibilityRole={tapPassageToPlay ? 'button' : undefined}
              accessibilityLabel={tapPassageToPlay ? actionLabel + '：' + (passage.title || passage.original) : undefined}
              key={passage.id}
              style={[styles.passageCard, active && styles.passageCardActive]}
              onLayout={(e) => handlePassageLayout(passage.id, e)}
            >
              <View style={styles.passageHeader}>
                {passage.title ? (
                  <Text style={styles.passageTitle}>{passage.title}</Text>
                ) : (
                  <View />
                )}
                {!tapPassageToPlay && <Pressable
                  onPress={onPassagePress}
                  style={styles.passagePlayButton}
                  accessibilityRole="button"
                  accessibilityLabel={actionLabel}
                >
                  {!active || (supportsPauseResume && isPaused) ? (
                    <View style={styles.playTriangle} />
                  ) : supportsPauseResume ? (
                    <View style={styles.pauseIcon}>
                      <View style={styles.pauseBar} />
                      <View style={styles.pauseBar} />
                    </View>
                  ) : (
                    <View style={styles.stopIcon} />
                  )}
                </Pressable>}
              </View>
              <Text style={styles.originalText}>{passage.original}</Text>
              {showVernacular && !!vernacularFor(passage) && (
                <Text style={styles.vernacularText}>{vernacularFor(passage)}</Text>
              )}
            </PassageCard>
          );
        })}
      </ScrollView>
      </Animated.View>

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
    container: { flex: 1, backgroundColor: c.background, paddingTop: Platform.OS === 'web' ? 24 : 64 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    back: { fontSize: 16, lineHeight: 24, color: c.textSecondary, width: 60 },
    topTitle: { fontSize: 15, lineHeight: 24, fontWeight: '600', color: c.textPrimary, flex: 1, textAlign: 'center' },
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
      maxWidth: '100%',
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
    scroll: {
      flex: 1,
      marginTop: 16,
      // Without this, a desktop mouse-drag (or a touch-drag that starts on selectable text)
      // triggers the browser's native text-selection instead of the swipe-to-change-chapter
      // gesture. Native iOS/Android are unaffected since there's no text-selection concept
      // competing with the responder there.
      ...(Platform.OS === 'web' ? ({ userSelect: 'none' } as any) : null),
    },
    scrollInner: { flex: 1 },
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
    passageTitle: { flex: 1, minWidth: 0, marginRight: 12, fontSize: 13, fontWeight: '700', color: c.accent },
    passagePlayButton: {
      width: 44,
      height: 44,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 22,
      backgroundColor: c.pill,
    },
    playTriangle: {
      width: 0,
      height: 0,
      borderTopWidth: 8,
      borderBottomWidth: 8,
      borderLeftWidth: 13,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: c.textPrimary,
      marginLeft: 3,
    },
    pauseIcon: { flexDirection: 'row', gap: 4 },
    pauseBar: { width: 4, height: 16, backgroundColor: c.textPrimary },
    stopIcon: { width: 14, height: 14, backgroundColor: c.textPrimary },
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
