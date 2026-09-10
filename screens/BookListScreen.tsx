import React, { useMemo } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { books } from '../data/books';
import { Progress } from '../hooks/useProgress';
import { ThemeColors } from '../theme/colors';

type Props = {
  progress: Progress | null;
  onOpenBook: (bookId: string) => void;
  onContinue: () => void;
  colors: ThemeColors;
  onOpenSettings: () => void;
};

export default function BookListScreen({
  progress,
  onOpenBook,
  onContinue,
  colors,
  onOpenSettings,
}: Props) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const continueBook = progress ? books.find((b) => b.id === progress.bookId) : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>英文有聲</Text>
          <Text style={styles.subheader}>英文經典 · 中文對照 · 雙語朗讀</Text>
        </View>
        <Pressable style={styles.themeToggle} onPress={onOpenSettings} hitSlop={10}>
          <Text style={styles.themeToggleIcon}>⚙️</Text>
        </Pressable>
      </View>

      {continueBook && (
        <Pressable style={styles.continueCard} onPress={onContinue}>
          <Text style={styles.continueLabel}>繼續閱讀</Text>
          <Text style={styles.continueTitle}>{continueBook.title}</Text>
        </Pressable>
      )}

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.bookCard} onPress={() => onOpenBook(item.id)}>
            <Text style={styles.bookTitle}>{item.title}</Text>
            <Text style={styles.bookAuthor}>{item.author}</Text>
            <Text style={styles.bookDesc} numberOfLines={2}>
              {item.description}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
      paddingTop: Platform.OS === 'web' ? 24 : 64,
      paddingHorizontal: 20,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    header: { fontSize: 28, fontWeight: '700', color: c.textPrimary },
    subheader: { fontSize: 13, color: c.textSecondary, marginTop: 4, marginBottom: 16 },
    themeToggle: {
      backgroundColor: c.pill,
      borderRadius: 18,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeToggleIcon: { fontSize: 16 },
    continueCard: {
      backgroundColor: c.inverse,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    continueLabel: { color: c.inverseMuted, fontSize: 12, marginBottom: 4 },
    continueTitle: { color: c.inverseText, fontSize: 18, fontWeight: '600' },
    list: { paddingBottom: 40 },
    bookCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
    },
    bookTitle: { fontSize: 20, fontWeight: '700', color: c.textPrimary },
    bookAuthor: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    bookDesc: { fontSize: 13, color: c.textMuted, marginTop: 8, lineHeight: 18 },
  });
