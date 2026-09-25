// Read data modules at an immutable Git revision without changing the checkout.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');

function loadCatalog(root, revision) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const source = revision
      ? execFileSync('git', ['show', `${revision}:${file}`], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      : fs.readFileSync(path.join(root, file), 'utf8');
    if (file.endsWith('.json')) return JSON.parse(source);
    const module = { exports: {} };
    cache.set(file, module);
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    const localRequire = (name) => {
      if (!name.startsWith('.')) throw new Error(`Unexpected data dependency: ${name}`);
      const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), name));
      return load(target.endsWith('.json') ? target : target + '.ts');
    };
    vm.runInNewContext(`(function(require,module,exports){${output}\n})`, {}, { filename: file })(localRequire, module, module.exports);
    return module.exports;
  }
  return load('data/books.ts');
}

const loadBooks = (root, revision) => loadCatalog(root, revision).books;

module.exports = { loadBooks, loadCatalog };
