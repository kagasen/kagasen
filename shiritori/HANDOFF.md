# shiritori — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
  新しい Tailwind クラスを書いたら再生成:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o shiritori/tailwind.css --content "shiritori/**/*.html" --minify
  ```
- `vendor/` … React 18 開発版 + babel-standalone（unpkg の置き換え。JSXをブラウザ内変換する構成のまま）。
