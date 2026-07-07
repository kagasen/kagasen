# sikou-tool-app — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
- **重要（2026-07-07 修正）**: このアプリはReact製で**UIのTailwindクラスはすべてビルドされたJS（`app.bundle.js`）の中にある**。当初の脱CDNビルドが `--content "…/**/*.html"` でHTMLしか走査せず、JS内のクラスが全部purgeされて**レイアウト崩壊（左に素のまま縦積み）していた**。生成時は必ず `app.bundle.js` を走査対象に含めること:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o sikou-tool-app/tailwind.css \
    --content "sikou-tool-app/index.html,sikou-tool-app/app.bundle.js,sikou-tool-app/topicsData.js" --minify
  ```
  Reactソースを変えたら **app.bundle.js を再ビルド → その後 tailwind.css を再生成**（順序重要。tailwindはバンドル内のクラス文字列リテラルを走査する）。config無し=デフォルト（元CDNもカスタムconfig無し）。CSSサイズの目安: 約24KB（4.8KBに縮んでいたら走査漏れ＝崩壊のサイン）。
- フォント … Google Fonts CDN をやめて**システムフォント**へ置換（任意の入力文字を表示するアプリのためサブセット同梱は不可）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## バックアップ＆ひきつぎ（2026-07-07・backup-kit v2）
- 共通部品 `backup-kit.js?v=2` を同梱（設計・運用ルールは ugoki-no-kiroku/HANDOFF.md 参照）。💾ボタン → `BackupKit.open()`。
- 封筒JSON `{kagasenBackup:1, app:'(アプリID)', ...}` で書き出し/読み込み。置換前に `(キー名)_mae` へ1世代退避。別アプリの封筒・壊れたJSONは拒否。
- **部品を直したら同梱している全アプリに配り直し、`?v=` と sw.js の CACHE を繰り上げる**（今回 CACHE v1→v2 済み）。
