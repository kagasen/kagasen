# kannjibusyu-ta — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
  新しい Tailwind クラスを書いたら再生成:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o kannjibusyu-ta/tailwind.css --content "kannjibusyu-ta/**/*.html" --minify
  ```
- フォント … Google Fonts CDN をやめて**システムフォント**へ置換（任意の入力文字を表示するアプリのためサブセット同梱は不可）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## index.html 化（2026-07-07）
- 本体ファイルを `kanjibusyu-ta.html` → `index.html` にリネーム（フォルダURL直アクセスの404を解消、他アプリと同じ「フォルダ + index.html」の慣例に統一）。`apps.js` のリンク・`manifest.json` の `start_url`・`sw.js` の ASSETS とオフライン時ナビゲーションフォールバックを揃えて修正。sw.js の CACHE は v1→v2。

## ゲームが起動しないバグ修正（2026-07-07）
- **原因**: 2026-07-06 の脱CDNフォント置換で `const FONT_FAMILY = ''Hiragino Maru Gothic ProN', ...'` がクォート崩れの**構文エラー**になり、スクリプト全体（ゲーム本体）が死んでいた。置換でフォント列が二重になってもいた。
- **修正**: `"'Hiragino Maru Gothic ProN', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif"` に修正（重複も解消）。sw.js CACHE v3。
- **検証**: canvas 全面描画・タップで TITLE→SELECT→PLAY 遷移を確認。console errorなし。
- **再発防止**: release-check.mjs の検査項目7（インラインJS構文チェック）で今後は自動検出。
