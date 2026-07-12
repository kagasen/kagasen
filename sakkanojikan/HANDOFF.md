# sakkanojikan — 引き継ぎメモ

## 脱CDN（2026-07-06）
- Tailwind は元から同梱の `tailwind.min.js`（Play CDN のJS版・ユーザー設計）で動く。**CDNフォールバックだけ撤去**した。
- M PLUS Rounded 1c → システムフォント（丸ゴシック系）へ置換。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## Tailwind を静的CSSへ移行（2026-07-10・古いiPad対応）
- `tailwind.min.js`（Play CDN のJS版ランタイム）は ES2020構文（`?.`/`??`）を含み、**iPadOS 13.3以前のSafariでは構文エラーになりスタイルが全滅**していたため、他アプリと同じ静的 `tailwind.css` へ移行した（見た目は同一）。
- 再生成コマンド: `npx tailwindcss@3.4.17 --content sakkanojikan/index.html -o sakkanojikan/tailwind.css --minify`（動的クラスは全てファイル内の文字列リテラルなので content 走査で拾える）。
- `<link rel="stylesheet" href="tailwind.css">` は**カスタム `<style>` より後**に置く（release-check 項目9 のCSS順序ルール）。
- sw.js は CACHE v2 に繰り上げ、ASSETS を tailwind.min.js → tailwind.css に差し替え済み。

## バックアップ部品（backup-kit）を意図的に入れていない（2026-07-07）
- このアプリには既に「ファイル保存/読み込み」（sakka_exportData / sakka_importData＝作品単位のJSON入出力）があり、守るべきデータ（書きかけの作品）はそれでカバー済みのため、backup-kit の横展開対象から除外した。機能を重複させない判断。
