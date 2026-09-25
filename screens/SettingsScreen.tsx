import React, { useMemo } from 'react';
import { usePassageMode } from '../hooks/usePassageMode';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SchemeMode, ThemeScheme } from '../hooks/useTheme';
import { FONT_SIZE_OPTIONS, FONT_SIZE_VALUES, useReaderPrefs } from '../hooks/useReaderPrefs';
import { Palette, PaletteId, ThemeColors } from '../theme/colors';

type Props = {
  onBack: () => void;
  colors: ThemeColors;
  scheme: ThemeScheme;
  schemeMode: SchemeMode;
  onChangeSchemeMode: (mode: SchemeMode) => void;
  paletteId: PaletteId;
  onChangePaletteId: (id: PaletteId) => void;
  palettes: Palette[];
};

const SCHEME_OPTIONS: { mode: SchemeMode; label: string }[] = [
  { mode: 'system', label: '跟隨系統' },
  { mode: 'light', label: '淺色' },
  { mode: 'dark', label: '深色' },
];

export default function SettingsScreen({
  onBack,
  colors,
  scheme,
  schemeMode,
  onChangeSchemeMode,
  paletteId,
  onChangePaletteId,
  palettes,
}: Props) {
  const { passageMode, setPassageMode } = usePassageMode();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { fontSize, setFontSize, snapScroll, setSnapScroll } = useReaderPrefs();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.back}>‹ 返回</Text>
        </Pressable>
        <Text style={styles.topTitle}>設定</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>外觀</Text>
        <View style={styles.segmentRow}>
          {SCHEME_OPTIONS.map((opt) => {
            const active = schemeMode === opt.mode;
            return (
              <Pressable
                key={opt.mode}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => onChangeSchemeMode(opt.mode)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.hint}>
          而家用緊{scheme === 'dark' ? '深色' : '淺色'}模式
        </Text>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>顏色主題</Text>
        <View style={styles.paletteList}>
          {palettes.map((p) => {
            const active = paletteId === p.id;
            const preview = scheme === 'dark' ? p.dark : p.light;
            return (
              <Pressable
                key={p.id}
                style={[styles.paletteCard, active && styles.paletteCardActive]}
                onPress={() => onChangePaletteId(p.id)}
              >
                <View style={styles.swatchRow}>
                  <View style={[styles.swatch, { backgroundColor: preview.background }]} />
                  <View style={[styles.swatch, { backgroundColor: preview.accent }]} />
                  <View style={[styles.swatch, { backgroundColor: preview.accentStrong }]} />
                  <View style={[styles.swatch, { backgroundColor: preview.surface, borderWidth: 1, borderColor: preview.surfaceBorder }]} />
                </View>
                <Text style={styles.paletteName}>{p.name}</Text>
                {active && <Text style={styles.paletteCheck}>✓</Text>}
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>字體大小</Text>
        <View style={styles.segmentRow}>
          {FONT_SIZE_OPTIONS.map((opt) => {
            const active = fontSize === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                onPress={() => setFontSize(opt.key)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text
          style={[
            styles.fontPreview,
            { fontSize: FONT_SIZE_VALUES[fontSize], lineHeight: Math.round(FONT_SIZE_VALUES[fontSize] * 1.6) },
          ]}
        >
          原文同白話都會用呢個大小顯示。
        </Text>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>段落顯示</Text>
        <View style={styles.segmentRow}>
          {([
            { key: 'sentence', label: '分句閱讀（分開）' },
            { key: 'paragraph', label: '原段落（合埋）' },
          ] as const).map(opt => (
            <Pressable
              key={opt.key}
              accessibilityRole="radio"
              aria-checked={passageMode === opt.key}
              accessibilityState={{ checked: passageMode === opt.key }}
              style={[styles.segmentBtn, passageMode === opt.key && styles.segmentBtnActive]}
              onPress={() => setPassageMode(opt.key)}
            >
              <Text style={[styles.segmentText, passageMode === opt.key && styles.segmentTextActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.hint}>顯示同朗讀會一齊切換。譯文未能逐句對齊嘅段落會保持完整，避免錯配。原段落保留歷史版本，可能未包含之後嘅文字修訂。</Text>

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>捲動</Text>
        <View style={styles.switchCard}>
          <View style={styles.switchCardText}>
            <Text style={styles.switchCardLabel}>自動貼齊段落</Text>
            <Text style={styles.hint}>停止捲動之後,自動滑去最近一段嘅頂部。</Text>
          </View>
          <Switch value={snapScroll} onValueChange={setSnapScroll} />
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background, paddingTop: Platform.OS === 'web' ? 24 : 64 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    back: { fontSize: 16, color: c.textSecondary, width: 60 },
    topTitle: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: c.textSecondary, marginBottom: 10 },
    sectionTitleSpaced: { marginTop: 28 },
    segmentRow: {
      flexDirection: 'row',
      backgroundColor: c.pill,
      borderRadius: 14,
      padding: 4,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    segmentBtnActive: { backgroundColor: c.inverse },
    segmentText: { fontSize: 13, color: c.textMuted, fontWeight: '600' },
    segmentTextActive: { color: c.inverseText },
    hint: { fontSize: 12, color: c.textSecondary, marginTop: 8 },
    paletteList: { gap: 12 },
    paletteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    paletteCardActive: { borderColor: c.accentStrong },
    swatchRow: { flexDirection: 'row', marginRight: 14 },
    swatch: {
      width: 22,
      height: 22,
      borderRadius: 11,
      marginRight: -8,
    },
    paletteName: { fontSize: 15, fontWeight: '600', color: c.textPrimary, flex: 1 },
    paletteCheck: { fontSize: 16, color: c.accentStrong, fontWeight: '700' },
    fontPreview: { color: c.textPrimary, marginTop: 12 },
    switchCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      gap: 12,
    },
    switchCardText: { flex: 1 },
    switchCardLabel: { fontSize: 15, fontWeight: '600', color: c.textPrimary, marginBottom: 4 },
  });
