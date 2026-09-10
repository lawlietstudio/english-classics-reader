import React, { useMemo } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Book } from '../data/types';
import { ThemeColors } from '../theme/colors';

type Props = {
  book: Book;
  onBack: () => void;
  onOpenChapter: (chapterId: string) => void;
  colors: ThemeColors;
};

export default function ChapterListScreen({ book, onBack, onOpenChapter, colors }: Props) {
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} hitSlop={12}>
        <Text style={styles.back}>‹ 返回</Text>
      </Pressable>
      <Text style={styles.header}>{book.title}</Text>
      <Text style={styles.subheader}>{book.author}</Text>

      <FlatList
        data={book.chapters}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.chapterCard} onPress={() => onOpenChapter(item.id)}>
            <Text style={styles.chapterTitle}>{item.title}</Text>
            <Text style={styles.chapterCount}>{item.passages.length} 段</Text>
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
    back: { fontSize: 16, color: c.textSecondary, marginBottom: 12 },
    header: { fontSize: 26, fontWeight: '700', color: c.textPrimary },
    subheader: { fontSize: 13, color: c.textSecondary, marginTop: 4, marginBottom: 16 },
    list: { paddingBottom: 40 },
    chapterCard: {
      backgroundColor: c.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.surfaceBorder,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    chapterTitle: { fontSize: 17, fontWeight: '600', color: c.textPrimary },
    chapterCount: { fontSize: 12, color: c.textSecondary },
  });
