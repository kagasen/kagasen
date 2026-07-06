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
