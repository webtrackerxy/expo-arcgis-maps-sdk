/* eslint-disable */
/**
 * Generates the per-sample Info (README markdown) and Code (this app's RN source)
 * shown by the sample "⋯ → View Info" sheet, plus link metadata. Run from the
 * `example` dir: `node scripts/gen-sample-content.js`. Outputs committed files
 * under components/screens/generated/.
 */
const fs = require('fs');
const path = require('path');

const EXAMPLE = path.resolve(__dirname, '..');
const SCREENS_DIR = path.join(EXAMPLE, 'components/screens');
const OFFICIAL = '/Users/user/development/arcgis-maps-sdk-swift-samples/Shared/Samples';
const OUT = path.join(SCREENS_DIR, 'generated');

// ---- parse index.ts: key -> {title, component}, and component -> file ----
const indexSrc = fs.readFileSync(path.join(SCREENS_DIR, 'index.ts'), 'utf8');

const importToFile = {}; // component identifier -> file basename (no ext)
for (const m of indexSrc.matchAll(/import\s+(?:\{([^}]*)\}|([A-Za-z0-9_]+))\s+from\s+'\.\/([A-Za-z0-9_]+)'/g)) {
  const file = m[3];
  const names = m[1] ? m[1].split(',') : [m[2]];
  for (let n of names) {
    n = n.trim();
    if (n) importToFile[n] = file;
  }
}

const screens = []; // { key, title, component }
for (const m of indexSrc.matchAll(/\{\s*key:\s*'([^']+)',\s*title:\s*'((?:[^'\\]|\\.)*)',\s*Component:\s*([A-Za-z0-9_]+)/g)) {
  screens.push({ key: m[1], title: m[2].replace(/\\'/g, "'"), component: m[3] });
}

// ---- brace/paren matcher that skips strings, templates, and comments ----
function matchDelimiter(src, openIdx, open, close) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    const c2 = src[i + 1];
    if (c === '/' && c2 === '/') {
      i = src.indexOf('\n', i);
      if (i < 0) return -1;
      continue;
    }
    if (c === '/' && c2 === '*') {
      i = src.indexOf('*/', i + 2) + 1;
      if (i < 1) return -1;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      const q = c;
      i++;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i++;
        i++;
      }
      continue;
    }
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Extract an exported function's full source from a file. */
function extractFunction(fileSrc, name) {
  const sigIdx = fileSrc.indexOf(`export function ${name}`);
  if (sigIdx < 0) return null;
  const paramOpen = fileSrc.indexOf('(', sigIdx);
  const paramClose = matchDelimiter(fileSrc, paramOpen, '(', ')');
  if (paramClose < 0) return null;
  const bodyOpen = fileSrc.indexOf('{', paramClose);
  const bodyClose = matchDelimiter(fileSrc, bodyOpen, '{', '}');
  if (bodyClose < 0) return null;
  return fileSrc.slice(sigIdx, bodyClose + 1);
}

/** The file's leading comment + import block, for context above the function. */
function fileHeader(fileSrc) {
  const lines = fileSrc.split('\n');
  const out = [];
  let inImport = false;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('import ')) inImport = true;
    out.push(line);
    if (inImport && t.endsWith(';') && (t.startsWith('import ') || t.startsWith('}'))) inImport = false;
    // Stop once we hit the first top-level declaration after imports.
    if (
      !inImport &&
      /^(export\s+)?(function|const|type|class)\s/.test(t) &&
      out.length > 1
    ) {
      out.pop();
      break;
    }
  }
  return out.join('\n').trimEnd();
}

// ---- official README lookup (by folder name == title) ----
const readmeByTitle = {};
const metaByTitle = {};
for (const dir of fs.readdirSync(OFFICIAL)) {
  const rp = path.join(OFFICIAL, dir, 'README.md');
  const mp = path.join(OFFICIAL, dir, 'README.metadata.json');
  if (fs.existsSync(rp)) readmeByTitle[dir] = fs.readFileSync(rp, 'utf8');
  if (fs.existsSync(mp)) {
    try {
      metaByTitle[dir] = JSON.parse(fs.readFileSync(mp, 'utf8'));
    } catch {}
  }
}

// Renamed screens -> official sample whose README/API we borrow.
const RENAME = {
  'Show geodesic path': 'Show geodesic path between two points',
  'Show line of sight between geoelements': 'Show exploratory line of sight between geoelements',
  'Show line of sight in scene': 'Show exploratory line of sight between points',
  'Show viewshed from camera in scene': 'Show exploratory viewshed from camera in scene',
  'Show viewshed from geoelement in scene': 'Show exploratory viewshed from geoelement in scene',
  'Show viewshed from point in scene': 'Show exploratory viewshed from point in scene',
  'Show viewshed from geoprocessing task': 'Show viewshed calculated from geoprocessing task',
  'Download vector tiles': 'Download vector tiles to local cache',
  'Add feature collection layer': 'Add feature collection layer from portal item',
};
// Consolidated screens -> short adapted README (title + our description).
// Parse descriptions.ts as text (Node can't require a .ts module).
const SCREEN_DESCRIPTIONS = {};
{
  const dsrc = fs.readFileSync(path.join(SCREENS_DIR, 'descriptions.ts'), 'utf8');
  for (const m of dsrc.matchAll(/^\s*([a-z0-9]+):\s*'((?:[^'\\]|\\.)*)',\s*$/gm)) {
    SCREEN_DESCRIPTIONS[m[1]] = m[2].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
}

function cleanReadme(md, title) {
  return md
    .replace(/^!\[[^\]]*\]\([^)]*\)\s*$/gm, '') // drop image lines
    .replace(/^#\s+.*$/m, `# ${title}`) // normalize the H1 to our title
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const sources = {};
const infos = {};
const meta = {};

for (const s of screens) {
  const file = importToFile[s.component];
  if (!file) {
    console.warn('no file for', s.key, s.component);
    continue;
  }
  // ---- code ----
  const fileSrc = fs.readFileSync(path.join(SCREENS_DIR, `${file}.tsx`), 'utf8');
  const fn = extractFunction(fileSrc, s.component);
  sources[s.key] = fn ? `${fileHeader(fileSrc)}\n\n${fn}\n` : fileSrc;
  // ---- info ----
  const official = readmeByTitle[s.title] || readmeByTitle[RENAME[s.title]];
  const desc = SCREEN_DESCRIPTIONS[s.key] || '';
  infos[s.key] = official
    ? cleanReadme(official, s.title)
    : `# ${s.title}\n\n${desc}`;
  // ---- meta ----
  const m = metaByTitle[s.title] || metaByTitle[RENAME[s.title]] || {};
  meta[s.key] = { file: `${file}.tsx`, relevantApi: (m.relevant_apis || [])[0] || '' };
}

fs.mkdirSync(OUT, { recursive: true });
const banner = '/* eslint-disable */\n// GENERATED by scripts/gen-sample-content.js — do not edit.\n';
fs.writeFileSync(
  path.join(OUT, 'sampleSources.ts'),
  `${banner}export const SAMPLE_SOURCES: Record<string, string> = ${JSON.stringify(sources, null, 0)};\n`
);
fs.writeFileSync(
  path.join(OUT, 'sampleInfo.ts'),
  `${banner}export const SAMPLE_INFO: Record<string, string> = ${JSON.stringify(infos, null, 0)};\n`
);
fs.writeFileSync(
  path.join(OUT, 'sampleMeta.ts'),
  `${banner}export type SampleMeta = { file: string; relevantApi: string };\nexport const SAMPLE_META: Record<string, SampleMeta> = ${JSON.stringify(meta, null, 0)};\n`
);
console.log(`generated ${Object.keys(sources).length} sources, ${Object.keys(infos).length} infos`);
