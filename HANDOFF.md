# ルート（ポータル） — 引き継ぎメモ

## 脱CDN（2026-07-06）
- `tailwind.css` … 静的ビルド（content=index.html,apps.js・font-pop/maru と natural-brown のconfig付き）。
- `fonts.css` + `fonts/` … Mochiy Pop One / Zen Maru Gothic の**同梱サブセット**（リポジトリ全体の使用文字3232字・SIL OFL）。全アプリ共通のセットなので、作り直すときは他のアプリと一緒に（kanji-bouken/build-fonts.mjs の流儀）。
- `vendor/lucide.min.js` … unpkg の置き換え。
- **Firebase（訪問カウンター）は温存**。オフライン時は fbOk ガードでカウントだけ止まり、ポータル自体は動く。
