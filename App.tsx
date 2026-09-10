import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { getBook } from './data/books';
import { useProgress } from './hooks/useProgress';
import { useSpeechLang } from './hooks/useSpeechLang';
import { useTheme } from './hooks/useTheme';
import BookListScreen from './screens/BookListScreen';
import ChapterListScreen from './screens/ChapterListScreen';
import ReaderScreen from './screens/ReaderScreen';
import SettingsScreen from './screens/SettingsScreen';

type View =
  | { screen: 'books' }
  | { screen: 'chapters'; bookId: string }
  | { screen: 'reader'; bookId: string; chapterId: string }
  | { screen: 'settings' };

export default function App() {
  const [view, setView] = useState<View>({ screen: 'books' });
  const { progress, saveProgress } = useProgress();
  const { lang, setLang } = useSpeechLang();
  const { scheme, schemeMode, setSchemeMode, colors, paletteId, setPaletteId, palettes } = useTheme();

  const openBook = (bookId: string) => {
    const book = getBook(bookId);
    if (!book) return;
    if (book.chapters.length === 1) {
      const chapterId = book.chapters[0].id;
      setView({ screen: 'reader', bookId, chapterId });
      saveProgress({ bookId, chapterId });
    } else {
      setView({ screen: 'chapters', bookId });
    }
  };

  const openChapter = (bookId: string, chapterId: string) => {
    setView({ screen: 'reader', bookId, chapterId });
    saveProgress({ bookId, chapterId });
  };

  const continueReading = () => {
    if (progress) {
      setView({ screen: 'reader', bookId: progress.bookId, chapterId: progress.chapterId });
    }
  };

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {view.screen === 'books' && (
        <BookListScreen
          progress={progress}
          onOpenBook={openBook}
          onContinue={continueReading}
          colors={colors}
          onOpenSettings={() => setView({ screen: 'settings' })}
        />
      )}

      {view.screen === 'settings' && (
        <SettingsScreen
          onBack={() => setView({ screen: 'books' })}
          colors={colors}
          scheme={scheme}
          schemeMode={schemeMode}
          onChangeSchemeMode={setSchemeMode}
          paletteId={paletteId}
          onChangePaletteId={setPaletteId}
          palettes={palettes}
        />
      )}

      {view.screen === 'chapters' &&
        (() => {
          const book = getBook(view.bookId);
          if (!book) return null;
          return (
            <ChapterListScreen
              book={book}
              onBack={() => setView({ screen: 'books' })}
              onOpenChapter={(chapterId) => openChapter(view.bookId, chapterId)}
              colors={colors}
            />
          );
        })()}

      {view.screen === 'reader' &&
        (() => {
          const book = getBook(view.bookId);
          const chapter = book?.chapters.find((c) => c.id === view.chapterId);
          if (!book || !chapter) return null;
          return (
            <ReaderScreen
              bookTitle={book.title}
              chapter={chapter}
              lang={lang}
              onChangeLang={setLang}
              colors={colors}
              onBack={() =>
                setView(
                  book.chapters.length === 1
                    ? { screen: 'books' }
                    : { screen: 'chapters', bookId: view.bookId }
                )
              }
            />
          );
        })()}
    </>
  );
}
