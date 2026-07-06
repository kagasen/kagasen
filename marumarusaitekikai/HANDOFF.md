# marumarusaitekikai — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
  新しい Tailwind クラスを書いたら再生成:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o marumarusaitekikai/tailwind.css --content "marumarusaitekikai/**/*.html" --minify
  ```
- `vendor/lucide.min.js` … unpkg の置き換え（アイコン）。
