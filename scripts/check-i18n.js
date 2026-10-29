#!/usr/bin/env node
// Fails (exit 1) if:
//  1. a key exists in one language dictionary but not the other, or
//  2. a t('...') / t("...") key used anywhere in src/ is missing from the dictionaries.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function loadKeys(file) {
    const src = fs.readFileSync(file, 'utf8');
    const keys = new Set();
    const re = /^\s{4}([A-Za-z][A-Za-z0-9]*):/gm;
    let m;
    while ((m = re.exec(src)) !== null) keys.add(m[1]);
    return keys;
}

const enKeys = loadKeys(path.join(root, 'src/i18n/en.js'));
const arKeys = loadKeys(path.join(root, 'src/i18n/ar.js'));

let failed = false;

for (const key of enKeys) {
    if (!arKeys.has(key)) { console.error(`Missing in ar.js: ${key}`); failed = true; }
}
for (const key of arKeys) {
    if (!enKeys.has(key)) { console.error(`Missing in en.js: ${key}`); failed = true; }
}

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
    }
    return out;
}

const usedKeys = new Map();
for (const file of walk(path.join(root, 'src'))) {
    if (file.includes(`${path.sep}i18n${path.sep}`)) continue;
    const src = fs.readFileSync(file, 'utf8');
    const re = /\bt\(\s*'([A-Za-z][A-Za-z0-9]*)'\s*[,)]|\bt\(\s*"([A-Za-z][A-Za-z0-9]*)"\s*[,)]/g;
    let m;
    while ((m = re.exec(src)) !== null) {
        const key = m[1] || m[2];
        if (!usedKeys.has(key)) usedKeys.set(key, []);
        usedKeys.get(key).push(path.relative(root, file));
    }
}

for (const [key, files] of usedKeys) {
    if (!enKeys.has(key)) {
        console.error(`t('${key}') used in ${[...new Set(files)].join(', ')} but missing from dictionaries`);
        failed = true;
    }
}

if (failed) {
    console.error('\ni18n check FAILED');
    process.exit(1);
}
console.log(`i18n check OK: ${enKeys.size} keys in each dictionary, ${usedKeys.size} keys used in src/ all present.`);
