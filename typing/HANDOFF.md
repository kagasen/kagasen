# キッズタイピングマスター（typing） — 引き継ぎメモ

学年別タイピング練習。**複数ページ構成**（例外的にビルドあり: `npm run build:typing` が
app.js(JSX) → app.compiled.js を esbuild で変換）。

- `index.html` … 学年えらびトップ
- `2nen〜6nen/index.html` … 学年別練習（React 18 UMD + app.compiled.js）
- `nagare2nen〜6nen.html` … 流れ（カリキュラム）ページ
- `tokkun70/` … 70のとっくん（index + level01〜70、React）
- `shop.html`

## 完全オフライン化（2026-07-06）＝Firebase以外を同梱
- `tailwind.css` … 全ページ共通の静的ビルド（Tailwind CDN置き換え・約34KB）。
  **どのページでも新しいTailwindクラスを書いたら再生成**:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o typing/tailwind.css \
    --content "typing/**/*.html,typing/app.js,typing/app.compiled.js,typing/preflight.js" --minify
  ```
  参照はトップ階層=`tailwind.css`、サブフォルダ=`../tailwind.css`。
- `vendor/` … react.production.min.js / react-dom.production.min.js（18.3.1）、
  lucide.min.js（1.23.0）。unpkg の置き換え（75ページ）。
- `fonts/` + `fonts.css` … Mochiy Pop One / Zen Maru Gothic(400/700/900) を
  **アプリの使用文字だけにサブセット化**した woff2（SIL OFL・計約850KB）。
  生成は `node typing/build-fonts.mjs`（要 python3+fontTools）。
  **出題語・文言を増やしたら再実行**（未収録字はシステムフォント代替）。
- **Firebase（www.gstatic.com）は温存** … index.html 末尾の訪問カウンター（appClicks）。
  外部サービスのため同梱不可＝release-check では typing は既知リスト（警告）に残る。
  オフライン時は `typeof firebase === 'undefined'` ガードで静かにスキップする。

検証済み: トップ（同梱フォント適用）・3nen（React動作）・tokkun70/level01（描画）で
外部リクエストが Firebase のみ／ゼロ、console errorなし。

## 残
- PWA化（manifest.json / sw.js / icon.svg）は未対応。多ページ構成なのでキャッシュ一覧が長くなる点に注意。
