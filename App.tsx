import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { getBook } from './data/books';
import { usePassageMode } from './hooks/usePassageMode';
import { useProgress } from './hooks/useProgress';
import { useSpeechLang } from './hooks/useSpeechLang';
import { useTheme } from './hooks/useTheme';
import BookListScreen from './screens/BookListScreen';
import ChapterListScreen from './screens/ChapterListScreen';
import ReaderScreen from './screens/ReaderScreen';
import SettingsScreen from './screens/SettingsScreen';

type RootStackParamList = {
  Books: undefined;
  Chapters: { bookId: string };
  Reader: { bookId: string; chapterId: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { passageMode } = usePassageMode();
  const { progress, saveProgress } = useProgress();
  const { lang, setLang } = useSpeechLang();
  const { scheme, schemeMode, setSchemeMode, colors, paletteId, setPaletteId, palettes } = useTheme();
  const baseTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.background,
      text: colors.textPrimary,
      primary: colors.accent,
      border: colors.surfaceBorder,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Books"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          fullScreenGestureEnabled: false,
          contentStyle: { backgroundColor: colors.background },
          statusBarStyle: scheme === 'dark' ? 'light' : 'dark',
        }}
      >
        <Stack.Screen name="Books">
          {({ navigation }) => (
            <BookListScreen
              progress={progress}
              colors={colors}
              onOpenSettings={() => navigation.navigate('Settings')}
              onOpenBook={(bookId) => {
                const book = getBook(bookId, passageMode);
                if (!book) return;
                if (book.chapters.length === 1) {
                  const chapterId = book.chapters[0].id;
                  saveProgress({ bookId, chapterId });
                  navigation.navigate('Reader', { bookId, chapterId });
                } else {
                  navigation.navigate('Chapters', { bookId });
                }
              }}
              onContinue={() => {
                if (!progress) return;
                const book = getBook(progress.bookId, passageMode);
                if (!book?.chapters.some((chapter) => chapter.id === progress.chapterId)) return;
                // Restore the same back path as opening a chapter from the book list.
                const routes = [
                  { name: 'Books' },
                  ...(book.chapters.length > 1
                    ? [{ name: 'Chapters', params: { bookId: book.id } }]
                    : []),
                  { name: 'Reader', params: progress },
                ];
                navigation.reset({ index: routes.length - 1, routes });
              }}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Settings">
          {({ navigation }) => (
            <SettingsScreen
              onBack={() => navigation.goBack()}
              colors={colors}
              scheme={scheme}
              schemeMode={schemeMode}
              onChangeSchemeMode={setSchemeMode}
              paletteId={paletteId}
              onChangePaletteId={setPaletteId}
              palettes={palettes}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Chapters">
          {({ navigation, route }) => {
            const book = getBook(route.params.bookId, passageMode);
            if (!book) return null;
            return (
              <ChapterListScreen
                book={book}
                colors={colors}
                onBack={() => navigation.goBack()}
                onOpenChapter={(chapterId) => {
                  saveProgress({ bookId: book.id, chapterId });
                  navigation.navigate('Reader', { bookId: book.id, chapterId });
                }}
              />
            );
          }}
        </Stack.Screen>
        <Stack.Screen name="Reader">
          {({ navigation, route }) => {
            const book = getBook(route.params.bookId, passageMode);
            const chapterIndex = book?.chapters.findIndex((c) => c.id === route.params.chapterId) ?? -1;
            const chapter = book && chapterIndex >= 0 ? book.chapters[chapterIndex] : undefined;
            if (!book || !chapter) return null;
            const prevChapter = book.chapters[chapterIndex - 1];
            const nextChapter = book.chapters[chapterIndex + 1];
            const changeChapter = (chapterId: string) => {
              // Chapter swipes update this screen instead of adding entries to the back stack.
              saveProgress({ bookId: book.id, chapterId });
              navigation.setParams({ chapterId });
            };
            return (
              <ReaderScreen
                key={book.id + ':' + chapter.id + ':' + passageMode}
                bookTitle={book.title}
                chapter={chapter}
                lang={lang}
                onChangeLang={setLang}
                colors={colors}
                onBack={() => navigation.goBack()}
                onPrevChapter={prevChapter ? () => changeChapter(prevChapter.id) : undefined}
                onNextChapter={nextChapter ? () => changeChapter(nextChapter.id) : undefined}
              />
            );
          }}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
