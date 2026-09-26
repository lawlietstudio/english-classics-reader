const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise App's navigation callbacks with the real stack router, without a device.
async function main() {
  const { StackRouter, CommonActions } = await import('@react-navigation/routers');
  const router = StackRouter({ initialRouteName: 'Books' });
  const options = {
    routeNames: ['Books', 'Chapters', 'Reader', 'Settings'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state;
  let saved;
  let progress = null;
  const books = {
    multi: { id: 'multi', title: 'Multiple chapters', chapters: [{ id: 'a' }, { id: 'b' }] },
    single: { id: 'single', title: 'Single chapter', chapters: [{ id: 'only' }] },
  };
  const dispatch = (action) => {
    const next = router.getStateForAction(state, action, options);
    if (next) state = router.getRehydratedState(next, options);
    return next;
  };
  const navigation = {
    navigate: (name, params) => dispatch(CommonActions.navigate(name, params)),
    goBack: () => dispatch(CommonActions.goBack()),
    reset: (next) => dispatch(CommonActions.reset(next)),
    setParams: (params) => dispatch({ ...CommonActions.setParams(params), source: state.routes[state.index].key }),
  };
  const createElement = (type, props, ...children) => ({
    type, props: { ...props, children: children.length === 1 ? children[0] : children },
  });
  const theme = { colors: {} };
  const mocks = {
    react: { createElement },
    '@react-navigation/native': { NavigationContainer: 'Container', DarkTheme: theme, DefaultTheme: theme },
    '@react-navigation/native-stack': { createNativeStackNavigator: () => ({ Navigator: 'Navigator', Screen: 'Screen' }) },
    'expo-status-bar': { StatusBar: 'StatusBar' },
    './data/books': { getBook: (id) => books[id] },
    './hooks/usePassageMode': { usePassageMode: () => ({ passageMode: 'sentence' }) },
    './hooks/useProgress': { useProgress: () => ({ progress, saveProgress: (value) => { saved = value; } }) },
    './hooks/useSpeechLang': { useSpeechLang: () => ({ lang: 'zh-HK', setLang() {} }) },
    './hooks/useTheme': { useTheme: () => ({ scheme: 'dark', colors: {}, palettes: [] }) },
  };
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '../App.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: (name) => {
      if (mocks[name]) return mocks[name];
      if (name.startsWith('./screens/')) return name;
      throw new Error('Unexpected import: ' + name);
    },
  });
  function screen(name) {
    const tree = module.exports.default();
    const stack = tree.props.children.find((child) => child.type === 'Navigator');
    const entry = stack.props.children.find((child) => child.props.name === name);
    const route = state.routes.find((item) => item.name === name);
    return entry.props.children({ navigation, route }).props;
  }
  const names = () => state.routes.map((route) => route.name).join(',');
  const reset = () => { state = router.getInitialState(options); };

  reset();
  screen('Books').onOpenBook('multi');
  screen('Chapters').onOpenChapter('a');
  assert.equal(names(), 'Books,Chapters,Reader');
  screen('Reader').onNextChapter();
  assert.equal(names(), 'Books,Chapters,Reader');
  assert.equal(state.routes[state.index].params.chapterId, 'b');
  assert.equal(saved.chapterId, 'b');
  screen('Reader').onPrevChapter();
  assert.equal(state.routes[state.index].params.chapterId, 'a');
  screen('Reader').onBack();
  assert.equal(names(), 'Books,Chapters');
  screen('Chapters').onBack();
  assert.equal(names(), 'Books');
  assert.equal(navigation.goBack(), null, 'Only the root leaves back unhandled for Android exit');

  screen('Books').onOpenSettings();
  screen('Settings').onBack();
  assert.equal(names(), 'Books');
  screen('Books').onOpenBook('single');
  assert.equal(names(), 'Books,Reader');
  assert.equal(screen('Reader').onNextChapter, undefined);
  screen('Reader').onBack();
  assert.equal(names(), 'Books');

  progress = { bookId: 'multi', chapterId: 'b' };
  screen('Books').onContinue();
  assert.equal(names(), 'Books,Chapters,Reader');
  screen('Reader').onBack();
  assert.equal(names(), 'Books,Chapters');
  reset();
  progress = { bookId: 'single', chapterId: 'only' };
  screen('Books').onContinue();
  assert.equal(names(), 'Books,Reader');
  reset();
  progress = { bookId: 'multi', chapterId: 'missing' };
  screen('Books').onContinue();
  assert.equal(names(), 'Books', 'Stale progress must not open a blank reader');
  console.log('Navigation checks passed: back paths, settings, resume, chapter switches, root exit.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
