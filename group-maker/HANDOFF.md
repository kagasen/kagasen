# group-maker — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
  新しい Tailwind クラスを書いたら再生成:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o group-maker/tailwind.css --content "group-maker/**/*.html" --minify
  ```
- フォント … Google Fonts CDN をやめて**システムフォント**へ置換（任意の入力文字を表示するアプリのためサブセット同梱は不可）。
- **重要**: このアプリはUIクラスがインライン `<script>` 内の文字列にも多数ある（`createMemberItem`/`updateGroupSummaries` 等）。Tailwind再生成は `--content "group-maker/index.html"`（=HTML＋インラインJSを走査）で行うこと。**tailwind.css を作り直したら `index.html` の `tailwind.css?v=N` と `sw.js` の ASSETS を繰り上げる**（HTTPキャッシュが古いCSSを配信し続けてボタン色などが消える事故を防ぐため。2026-07-08に `?v=2` 導入）。

## 男女＆点数バランス分け・組み直し（2026-07-08）
- **データ構造**: メンバーに `gender`（'male'/'female'/'unset'・既定unset）を追加。スキルは従来どおり 'very-good'/'good'/'neutral'/'bad'/'very-bad'。
- **入力（ステップ1）**: 名前は1行1人のまま。人数ライブカウンター（`#name-count`）、「番号だけ○人（30/35/40）」で番号メンバーを即用意してステップ2直行（`.quick-fill`）、クリアボタンを追加。
- **性別入力（ステップ2）**: 名前の横に `.gender-toggle` ボタン。タップで 男子→女子→未設定 と循環（その場で色・文字だけ更新＝スクロール位置を保つ）。
- **バランス分け**（`createBalancedGroups`）: `SKILL_SCORE`＝得意5/少し得意4/普通3/少し苦手2/苦手1。①人数を均等（差最大1）②各チームの平均点を均等（合計点の低い所へ高スキルを入れる貪欲法）③男女は同性の人数で重み付け（`GENDER_W=2.5`）して均等化。毎回シャッフルで「もう一度組み直す」（`#reshuffle-groups`）が別の組み合わせを出す。`shuffleArray` は配列を返すよう変更済み。
- **結果画面**: グループ見出しの下に `.group-summary`（人数・男Ｎ女Ｎ・平均Ｎ点。平均はスキル表示中のみ）。各メンバー行に男女バッジ。ドラッグ移動後は `updateGroupSummaries()` で再計算。`groupsResult` はドロップ時に同期される。
- 検証: 12人→3グループが全て「4人・男2女2・平均3.0点」、30人→4グループも人数差1・男女ほぼ均等・平均2.8〜3.3で均等を確認。sw.js CACHE v1→v2、tailwind.css 再生成（?v=2）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。
