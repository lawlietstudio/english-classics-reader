const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../utils/passageSnap.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exportsObject = {};
vm.runInNewContext(compiled, { exports: exportsObject });
const snap = exportsObject.getPassageSnapTarget;
// The final card's top is unreachable: raw-offset comparison used to jump back to 400.
assert.equal(snap([0, 400, 900], 600, 600), 600);
assert.equal(snap([0, 400, 900], 570, 600), 600);
assert.equal(snap([0, 400, 900], 640, 600), 600);
// A tall final card must still be readable all the way to its bottom.
assert.equal(snap([0, 300], 1100, 1100), 1100);
assert.equal(snap([0], 800, 800), 800);
assert.equal(snap([0, 250, 600], 270, 900), 250);
assert.equal(snap([0, 250, 600], -30, 900), 0);
assert.equal(snap([0, 250], 0, 0), 0);
assert.equal(snap([NaN, undefined, 400], 390, 700), 400);
console.log('Passage snap checks passed: reachable final card, bottom edge, bounce, tall card, normal snapping.');
