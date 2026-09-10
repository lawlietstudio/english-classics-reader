// GitHub Pages project sites are served under /<repo>/, but Expo's web
// export emits root-relative asset paths ("/favicon.ico", "/_expo/...").
// Rewriting them to relative paths lets the same build work at any subpath.
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/(href|src)="\//g, '$1="./');
fs.writeFileSync(indexPath, html);
console.log('Rewrote absolute asset paths to relative in dist/index.html');
