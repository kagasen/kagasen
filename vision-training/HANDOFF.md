# vision-training — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
  新しい Tailwind クラスを書いたら再生成:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o vision-training/tailwind.css --content "vision-training/**/*.html" --minify
  ```
  ※ このアプリは JS で \`border-\${colorClass}\` のように動的にクラスを組み立てるため、ビルド時に **safelist** が必要（subject-*/accent-orange/natural-brown の bg/border と /10 /30）。tailwind.config 相当は再生成時に忘れずに。
- `fonts.css` + `fonts/` … Mochiy Pop One / Zen Maru Gothic の**同梱サブセット**（リポジトリ全体の使用文字3232字・SIL OFL）。全アプリ共通のセットなので、作り直すときは他のアプリと一緒に（kanji-bouken/build-fonts.mjs の流儀）。
- `vendor/` … React 18 + babel-standalone + lucide（count-items / trace-line が使用）。

## iPadでダブルタップ拡大→戻せない不具合の修正（2026-07-08）
- **症状**: iPadで2回連続タップすると画面がアップになり、戻せなくなる。
- **原因**: 5サブアプリの viewport が `maximum-scale=1.0, user-scalable=no` だった。iOS Safariでは `user-scalable=no` は**無視される**のでダブルタップ拡大は起きる一方、ホーム画面起動(PWA standalone)では効くことがあり**ピンチで戻せなくなる**という最悪の組み合わせ。`body{touch-action:none}` も iOSではダブルタップ拡大を確実には抑止できていなかった。
- **修正**（count-items / find-diff / find-same / number-touch / trace-line）:
  1. viewport を `width=device-width, initial-scale=1.0` に（`maximum-scale`/`user-scalable=no` を撤去 → 万一ズレてもピンチアウトで戻せる）。
  2. `body` の `touch-action` を **`manipulation`** に（ダブルタップ拡大だけ無効化・ピンチと通常タップは維持）。もともと `none` だった3アプリ(count-items/number-touch/trace-line)も `manipulation` へ。
- **触っていない意図的な `none`**: number-touch のゲーム盤 `div`（インライン `touch-action:none`）と trace-line の描画コンテナ（Tailwind `touch-none`＝`.touch-none{touch-action:none}` はバンドル済み）は、指ドラッグやタップ判定のためそのまま。bodyだけ manipulation にしたので描画中のスクロール防止は従来どおり効く。
- キャッシュ: サブアプリHTMLは root の `sw.js` がプリキャッシュするため CACHE を v1→v2 に繰り上げ。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。
