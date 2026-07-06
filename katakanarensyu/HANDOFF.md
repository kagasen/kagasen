# katakanarensyu — 引き継ぎメモ

## 脱CDN（2026-07-06）
- `fonts.css` + `fonts/` … Mochiy Pop One / Zen Maru Gothic の**同梱サブセット**（リポジトリ全体の使用文字3232字・SIL OFL）。全アプリ共通のセットなので、作り直すときは他のアプリと一緒に（kanji-bouken/build-fonts.mjs の流儀）。
- `kana/*.json` … **カタカナの筆順データ（kana-svg-data v0.0.2）を同梱**。旧: cdn.jsdelivr.net から実行時 fetch（オフラインだと なぞり書き不能だった）。
