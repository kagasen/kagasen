# ルート（ポータル） — 引き継ぎメモ

## 古いiPad対応 — ES2020構文の一掃（2026-07-10）
- **「iPadでいくつかのアプリが開けない」報告の原因**: `?.`（オプショナルチェーン）と `??`（Null合体）は ES2020構文で、**iPadOS 13.3以前のSafariはパースできない**。構文エラーは1箇所でもスクリプト全体を殺すので、該当アプリは真っ白／無反応＝「開けない」になっていた。
- 直した箇所:
  - `ugoki-no-kiroku/index.html` … `??` 2箇所（esc関数・グラフのpoints）
  - `level-up-adventure/index.html` … `?.` 3箇所（プロフィール名の表示。**テンプレートリテラルの `${…}` 内**だったのが盲点）
  - `shiritori/index.html` … JSX内の `?.` 4箇所（**ブラウザ内Babelは JSXだけ変換して `?.` は素通し**なので、text/babel の中も古い書き方が必要）
  - 各アプリの `backup-kit.js`（9本）… `??` 1箇所 → 全部 v3 に繰り上げ
  - `sikou-tool-app` … esbuild のビルドに `--target=es2017` を追加して再ビルド（root の build:typing は元から es2017 だった）
  - `sakkanojikan` … Play CDN のJS版ランタイム `tailwind.min.js`（ES2020を含む）を静的 `tailwind.css` へ移行
  - 脱CDNの残骸 `tailwind.config = {…}` ブロック（ポータル・vision-training×4・level-up-adventure）を削除（`Can't find variable: tailwind` エラーの発生源。静的CSS化後は無意味）
- **再発防止**: `release-check.mjs` に項目10（ES2020+構文の検出）を追加。今後 `?.`/`??` 等を書くと❌になる。**このアプリ集の自前JSは「ES2017＋α（ES2018のスプレッド・ES2019のcatch省略まで）」縛り**。
- 検証: Playwright WebKit で全26アプリを起動しコンソール/ページエラーゼロ・スクリーンショット目視、書き換え箇所は実操作（レベルアップの名前表示・しりとりの対戦開始・うごきのきろくの初回スタート）で通過を確認。

## 脱CDN（2026-07-06）
- `tailwind.css` … 静的ビルド（content=index.html,apps.js・font-pop/maru と natural-brown のconfig付き）。
- `fonts.css` + `fonts/` … Mochiy Pop One / Zen Maru Gothic の**同梱サブセット**（リポジトリ全体の使用文字3232字・SIL OFL）。全アプリ共通のセットなので、作り直すときは他のアプリと一緒に（kanji-bouken/build-fonts.mjs の流儀）。
- `vendor/lucide.min.js` … unpkg の置き換え。
- **Firebase（訪問カウンター）は温存**。オフライン時は fbOk ガードでカウントだけ止まり、ポータル自体は動く。
