# hiraganarensyu — 引き継ぎメモ

## 脱CDN（2026-07-06）
- `fonts.css` + `fonts/` … Mochiy Pop One / Zen Maru Gothic の**同梱サブセット**（リポジトリ全体の使用文字3232字・SIL OFL）。全アプリ共通のセットなので、作り直すときは他のアプリと一緒に（kanji-bouken/build-fonts.mjs の流儀）。
- `kana/*.json` … **なぞり書きの筆順データ（kana-svg-data v0.0.2）を同梱**。旧: cdn.jsdelivr.net から実行時 fetch（オフラインだと なぞり書き不能だった）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。
