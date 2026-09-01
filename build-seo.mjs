#!/usr/bin/env node
/* =====================================================================
   build-seo.mjs — 「検索で見つけてもらう」ための タグを まとめて 入れなおす

   使い方:  node build-seo.mjs          （書きこむ）
           node build-seo.mjs --check  （書かずに 何が 変わるかだけ 見る）

   なぜ スクリプトに して いるか（CLAUDE.md §4・§8）:
     ・アプリは 30こ 以上 ある。同じ タグを 手で 30回 貼ると かならず ずれる。
     ・apps.js が アプリ一覧の 正（source of truth）。名まえ・説明・日づけを
       そこから 取れば、アプリを 1つ 足すたびに この スクリプトを 走らせるだけで
       タイトル・説明・sitemap.xml が ぜんぶ そろう。

   やること:
     1. 各 index.html の <title> と、その 下の 「SEO:auto」ブロック
        （description / canonical / OGP / Twitterカード）を 入れかえる
     2. ルート index.html に 構造化データ（JSON-LD）を 入れる
     3. sitemap.xml を 作りなおす（Search Console に 出すのは これ）

   ★ 「SEO:auto」〜「/SEO:auto」の 中は 手で 直さない（次の 実行で 消える）。
     直したい ときは この ファイルを 直して もう一度 走らせる。

   ★ りかの4島（energy/tsubutsubu/inochi/chikyu-no-shima）と science-island の
     index.html は science-island/build-islands.mjs の 生成物なので ここでは さわらない。
     あちらが この ファイルの seoHead() を import して 同じ タグを 埋めこむ。
   ===================================================================== */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

/* ---- サイトの 住所。GitHub Pages の プロジェクトページなので /kagasen/ が つく。
       独自ドメインに 引っこす ときは ここだけ 直せば ぜんぶ 追いかける ---- */
export const SITE      = 'https://kagasen.github.io/kagasen/';
export const SITE_NAME = 'かがせんのHAPPYアプリ集';
export const OGP_IMAGE = SITE + 'images/ogp.png';

/* 検索されたい ことば（かがせん／教育／知育／アプリ）を ここに 集めて おく */
export const SITE_DESC =
  '小学校の先生「かがせん」が作った、小学生と先生のための無料の教育アプリ・知育アプリ集。' +
  '国語・算数・理科・社会の学習ゲームから、席替え・グループ分けなどの授業ツールまで。' +
  '広告なし・登録なし・インストール不要で、iPadでもすぐ使えます。';

/* 各アプリの 説明の うしろに つける 一言（ブランド名を 全ページに 置く） */
const APP_DESC_TAIL = '｜小学校の先生「かがせん」が作った無料の教育・知育アプリ（広告なし・登録なし）。';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BEGIN = '<!-- SEO:auto build-seo.mjs が作る。手で直さない -->';
const END   = '<!-- /SEO:auto -->';

/* ---- 1ページぶんの タグ。ルートも アプリも りかの島も ぜんぶ ここを 通す ---- */
export function seoHead({ title, desc, url, indent = '' }) {
  const lines = [
    BEGIN,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${esc(url)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${esc(url)}">`,
    `<meta property="og:image" content="${esc(OGP_IMAGE)}">`,
    `<meta property="og:locale" content="ja_JP">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    END,
  ];
  return lines.map((l) => indent + l).join('\n');
}

/* ============================ ここから下は 実行部 ============================ */

const CHECK = process.argv.includes('--check');
const changed = [];
const readFile  = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
function writeFile(p, next) {
  const cur = fs.existsSync(path.join(ROOT, p)) ? readFile(p) : null;
  if (cur === next) return false;
  changed.push(p);
  if (!CHECK) fs.writeFileSync(path.join(ROOT, p), next);
  return true;
}

/* ---- apps.js を そのまま 読んで 一覧を 手に入れる（重複を 書かない ため）---- */
function loadApps() {
  const ctx = { };
  vm.createContext(ctx);
  vm.runInContext(readFile('apps.js') + '\n;globalThis.__apps = appsData;', ctx);
  return ctx.__apps.map((a) => ({
    id: a.id,
    title: a.title,
    desc: a.description,
    dir: String(a.link).split('/')[0],
    date: String(a.date).replace(/\//g, '-'),
  }));
}

/* ---- りかの4島＋全部入りは build-islands.mjs の 生成物。ここでは さわらない ---- */
const GENERATED = new Set([
  'science-island', 'energy-no-shima', 'tsubutsubu-no-shima', 'inochi-no-shima', 'chikyu-no-shima',
]);

/* ---- <title> の 下に SEOブロックを 置きなおす（何回 走らせても 同じ 形に なる）---- */
function applyHead(html, { title, desc, url }) {
  /* 前に 置いた ブロックを まず 取りのぞく */
  html = html.replace(new RegExp(`[ \\t]*${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`), '');
  /* ブロックの 外に 残って いる 古い description / canonical も 消す（二重に なる）*/
  html = html.replace(/[ \t]*<meta\s+name="description"[^>]*>\n?/gi, '');
  html = html.replace(/[ \t]*<link\s+rel="canonical"[^>]*>\n?/gi, '');

  const m = html.match(/([ \t]*)<title>[\s\S]*?<\/title>/);
  if (!m) throw new Error('<title> が 見つからない');
  const indent = m[1];
  const block = `${indent}<title>${esc(title)}</title>\n` + seoHead({ title, desc, url, indent });
  return html.replace(/[ \t]*<title>[\s\S]*?<\/title>/, block);
}

/* ---- ルート index.html の 構造化データ（JSON-LD）---- */
const LD_BEGIN = '<!-- LD:auto build-seo.mjs が作る。手で直さない -->';
const LD_END   = '<!-- /LD:auto -->';

function jsonLd(apps) {
  const graph = [
    { '@type': 'WebSite', '@id': SITE + '#website', url: SITE, name: SITE_NAME,
      alternateName: ['かがせんのハッピーアプリ集', 'かがせん アプリ集'],
      inLanguage: 'ja', description: SITE_DESC, publisher: { '@id': SITE + '#person' } },
    { '@type': 'Person', '@id': SITE + '#person', name: 'かがせん',
      jobTitle: '小学校教員', description: '小学生と先生のための教育アプリ・知育アプリを作っている小学校の先生。' },
    { '@type': 'ItemList', name: SITE_NAME + ' アプリ一覧', numberOfItems: apps.length,
      itemListElement: apps.map((a, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: {
          '@type': 'WebApplication',
          name: a.title,
          url: SITE + a.dir + '/',
          description: a.desc,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web',
          inLanguage: 'ja',
          isAccessibleForFree: true,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
        },
      })) },
  ];
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
  return `    ${LD_BEGIN}\n    <script type="application/ld+json">\n${json}\n    </script>\n    ${LD_END}`;
}

function applyLd(html, apps) {
  const re = new RegExp(`[ \\t]*${LD_BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${LD_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`);
  html = html.replace(re, '');
  return html.replace('</head>', jsonLd(apps) + '\n</head>');
}

/* ---- sitemap.xml。Google に 「このページたちが あります」と わたす 一覧 ---- */
function sitemap(apps) {
  const url = (loc, lastmod, prio) =>
    `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${prio}</priority>\n  </url>`;
  const newest = apps.map((a) => a.date).sort().pop();
  const rows = [url(SITE, newest, '1.0')]
    .concat(apps.map((a) => url(SITE + a.dir + '/', a.date, '0.8')));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    rows.join('\n') + '\n</urlset>\n';
}

function main() {
  const apps = loadApps();

  /* ルート */
  let root = readFile('index.html');
  root = applyHead(root, {
    title: SITE_NAME + '｜小学校の先生が作った無料の教育・知育アプリ',
    desc: SITE_DESC,
    url: SITE,
  });
  root = applyLd(root, apps);
  writeFile('index.html', root);

  /* 各アプリ */
  for (const a of apps) {
    if (GENERATED.has(a.dir)) continue;              /* 生成物は build-islands.mjs が やる */
    const p = a.dir + '/index.html';
    if (!fs.existsSync(path.join(ROOT, p))) { console.log('  みつからない: ' + p); continue; }
    const next = applyHead(readFile(p), {
      title: a.title + '｜' + SITE_NAME,
      desc: a.desc + APP_DESC_TAIL,
      url: SITE + a.dir + '/',
    });
    writeFile(p, next);
  }

  writeFile('sitemap.xml', sitemap(apps));

  console.log(`アプリ ${apps.length}こ（うち 生成物 ${apps.filter((a) => GENERATED.has(a.dir)).length}こは build-islands.mjs 側）`);
  if (!changed.length) console.log('変わった ファイル: なし');
  else console.log((CHECK ? '変わる ファイル:\n  ' : '書きかえた ファイル:\n  ') + changed.join('\n  '));
}

if (path.resolve(process.argv[1] || '') === path.resolve(fileURLToPath(import.meta.url))) main();
