# キッズタイピングマスター（typing） — 引き継ぎメモ

学年別タイピング練習。**複数ページ構成**（例外的にビルドあり: `npm run build:typing` が
app.js(JSX) → app.compiled.js を esbuild で変換）。

## 外観リニューアル（2026-09-02）
- 出題内容・モード・採点などの機能は変えず、`polish.css` でトップ画面と2〜6年生の練習画面の背景・カード・配色・立体感だけを刷新。
- 対象ページでは body に `typing-home` / `typing-play` を付けて適用範囲を限定。70のとっくん・流れる単語・ショップ固有のデザインには影響させない。
- ペットショップの9種類は `images/pets/{species}-{egg|baby|teen|adult}.png` の生成画像へ刷新。全36点が別画像で、たまご→ヒナ→こども→大人の順に切り替わる。大人は体格・羽や尾／しっぽ・衣装・装飾を大幅に進化させ、こどもとの差が明確。ショップでは9種類すべて、購入前にたまご段階の画像を表示する。
- SWキャッシュは `typing-cache-v8`。`polish.css` とペット画像36点もプリキャッシュ対象。

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

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## バックアップ＆ひきつぎ（2026-07-07・backup-kit v2）
- 共通部品 `backup-kit.js?v=2` を同梱（設計・運用ルールは ugoki-no-kiroku/HANDOFF.md 参照）。💾ボタン → `BackupKit.open()`。
- 封筒JSON `{kagasenBackup:1, app:'(アプリID)', ...}` で書き出し/読み込み。置換前に `(キー名)_mae` へ1世代退避。別アプリの封筒・壊れたJSONは拒否。
- **部品を直したら同梱している全アプリに配り直し、`?v=` と sw.js の CACHE を繰り上げる**（今回 CACHE v1→v2 済み）。
