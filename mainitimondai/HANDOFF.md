# mainitimondai — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
  新しい Tailwind クラスを書いたら再生成:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o mainitimondai/tailwind.css --content "mainitimondai/**/*.html" --minify
  ```
- `fonts.css` + `fonts/` … Mochiy Pop One / Zen Maru Gothic の**同梱サブセット**（リポジトリ全体の使用文字3232字・SIL OFL）。全アプリ共通のセットなので、作り直すときは他のアプリと一緒に（kanji-bouken/build-fonts.mjs の流儀）。
- 1nen〜6nen はサブフォルダ（../tailwind.css ../fonts.css 参照）。Inter は system-ui へ置換。
- **Firebase（2〜6年ページの成績記録・gstatic ESM import）は機能依存のため温存** → release-check の既知リストに残っている。
