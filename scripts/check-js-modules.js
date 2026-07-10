const { mkdtempSync, copyFileSync, writeFileSync, rmSync, readFileSync } = require('fs');
const { tmpdir } = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const temp = mkdtempSync(path.join(tmpdir(), 'densuki-js-'));

const modules = [
  ['docs/js/core.js', 'core.mjs'],
  ['docs/js/media-library.js', 'media-library.mjs'],
  ['docs/js/music-player.js', 'music-player.mjs'],
  ['docs/js/main.js', 'main.mjs'],
];

try {
  for (const [source, target] of modules) {
    let content = readFileSync(path.join(root, source), 'utf8')
      .replaceAll('./core.js', './core.mjs')
      .replaceAll('./media-library.js', './media-library.mjs')
      .replaceAll('./music-player.js', './music-player.mjs');
    writeFileSync(path.join(temp, target), content);
  }

  for (const [, target] of modules) {
    const result = spawnSync(process.execPath, ['--check', path.join(temp, target)], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
