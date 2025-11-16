#!/usr/bin/env node
/*
  Simple build script for Acme Shop (gpt5)
  - Minifies CSS (Clean-CSS)
  - Minifies & concatenates JS (Terser)
  - Optionally compresses local images in ./assets via Sharp
*/

const fs = require('fs');
const path = require('path');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

function log(...args) { console.log('[build]', ...args); }

async function minifyCss() {
  const inFile = path.join(__dirname, '..', 'styles', 'style.css');
  const outFile = path.join(__dirname, '..', 'styles', 'style.min.css');
  const css = await fs.promises.readFile(inFile, 'utf8');
  const output = new CleanCSS({ level: 2 }).minify(css);
  if (output.errors && output.errors.length) {
    console.error('CSS errors:', output.errors);
  }
  await fs.promises.writeFile(outFile, output.styles, 'utf8');
  log('CSS minified -> styles/style.min.css');
}

async function minifyJs() {
  const base = path.join(__dirname, '..', 'scripts');
  const inputs = [path.join(base, 'products.js'), path.join(base, 'app.js')];
  const code = {};
  for (const file of inputs) {
    code[file] = await fs.promises.readFile(file, 'utf8');
  }
  const result = await minifyJS(code, {
    sourceMap: false,
    compress: { passes: 2, drop_console: true },
    mangle: true,
    module: false,
  });
  const outFile = path.join(base, 'bundle.min.js');
  await fs.promises.writeFile(outFile, result.code, 'utf8');
  log('JS bundled+minified -> scripts/bundle.min.js');
}

async function compressImages() {
  const sharpAvailable = (() => { try { require.resolve('sharp'); return true; } catch { return false; } })();
  if (!sharpAvailable) {
    log('sharp not installed; skipping image compression (npm i -D sharp to enable)');
    return;
  }
  const sharp = require('sharp');
  const assetsDir = path.join(__dirname, '..', 'assets');
  const exists = fs.existsSync(assetsDir);
  if (!exists) { log('no ./assets directory found; skipping image compression'); return; }
  const files = await fs.promises.readdir(assetsDir);
  const targets = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f));
  if (!targets.length) { log('no images to compress under ./assets'); return; }
  const outDir = path.join(assetsDir, 'optimized');
  await ensureDir(outDir);
  for (const f of targets) {
    const inPath = path.join(assetsDir, f);
    const outPath = path.join(outDir, f.replace(/\.(jpe?g|png)$/i, '.webp'));
    await sharp(inPath).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 }).toFile(outPath);
    log('compressed', f, '->', path.relative(path.join(__dirname, '..'), outPath));
  }
}

(async () => {
  try {
    await minifyCss();
    await minifyJs();
    await compressImages();
    log('done');
  } catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
  }
})();
