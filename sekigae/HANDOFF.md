# sekigae — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
  新しい Tailwind クラスを書いたら再生成:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o sekigae/tailwind.css --content "sekigae/**/*.html" --minify
  ```
- フォント … Google Fonts CDN をやめて**システムフォント**へ置換（任意の入力文字を表示するアプリのためサブセット同梱は不可）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## 座席タイプの循環と「視力」への名称変更（2026-07-07）
- **バグ修正**: 空席クリックの種類ローテーションが `× (none)` で止まっていた（クリックハンドラ先頭の `if (seatData.type === 'none') return;` が原因）。× をクリックしたら種類を次へ進めて「何もなし(empty)」に戻すよう修正。循環＝**何もなし→男子→女子→視力→×→何もなし…**（`seatTypes=['empty','boy','girl','front','none']` の modulo）。生徒を選択中に×をクリックしても入れ替え先にはならない（return）。
- **名称変更**: 「固定席」→「視力」に統一（席ラベル・凡例「視力の席（目が悪い人用）」・追加フォームのチェックボックス「視力（目が悪い）」）。内部の type 値は `'front'`・生徒属性 `needsFront` のまま（席替え実行ロジックは不変）。生徒リストの列名は元々「視力」だったので一致。
- sw.js CACHE v1→v2。
