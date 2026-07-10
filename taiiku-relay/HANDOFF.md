# taiiku-relay — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
  新しい Tailwind クラスを書いたら再生成:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o taiiku-relay/tailwind.css --content "taiiku-relay/**/*.html" --minify
  ```
- フォント … Google Fonts CDN をやめて**システムフォント**へ置換（任意の入力文字を表示するアプリのためサブセット同梱は不可）。
- `vendor/lucide.min.js` … unpkg の置き換え（アイコン）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## 「番号だけ」人数カウンター追加（2026-07-08）
- 入力エリアに3つめのタブ**「番号だけ」**を追加。−／＋・直接入力で**1〜45人**を選び「この人数で用意する」で、名前＝"1".."N"・**`time:0`** の児童を一気に作る（`generateNumberedRunners`）。sekigae / group-maker と同じ人数カウンター流儀（`clampCount` で範囲外補正、`.count-input` でスピナー非表示）。
- **タイムを持たないので、生成時に自動で `showTimeData=false`（タイム隠す）＋`order-type='random'`（ランダム配置）に切りかえる**。これで結果カードに「0.00秒」「平均」が出ず、番号だけの均等ランダム編成になる。タイムは後からリストで各自入力可（`time` は数値0なので `toFixed` も安全）。
- 生成はリストを**置きかえ**る方式（既存 runners があれば `confirm`）。`saveData()` が `renderRunnerList()` を呼ぶので localStorage 保存＋再描画は一括。
- `switchTab` を2択 if/else から**3タブのループ方式**（`tabs` オブジェクト）に書き換え。`togglePrivacy` はUI同期部を **`applyPrivacyUI()`** に切り出して再利用（番号生成時にも使う）。
- 新クラスのため **tailwind.css 再生成＋`?v=2`**、sw.js CACHE v2→v3。

## 「番号だけ」に出席番号タイム入力マスを追加（2026-07-10）
- group-maker の「人数を入れる→各自を設定→編成」の流儀に合わせ、**「番号だけ」タブで人数を用意すると、出席番号ぶんのタイム入力マス（`#number-time-grid` / `#number-time-list`）が出る**ように。先生は番号のタイムを打つだけで、タイムのそろったチームを作れる（`renderNumberTimeGrid`）。
- マスに最初のタイムを入れた瞬間、`updateTimeFromGrid` が **`showTimeData`を表示・`order-type`を`random→snake`（タイム均等化）に自動で戻す**。＝「番号だけ＝隠す＋ランダム」（2026-07-08の仕様）は温存しつつ、タイムを入れ始めたら自動でタイム編成に切りかわる二段構え。タイムを1つも入れなければ従来どおり番号だけランダム。
- マスの `input` は `onchange`（＝タブ移動/確定時）で反映。`saveData()`は登録リストだけ再描画するのでマスの入力フォーカスは保たれる。Enterで次のマスへ。`clearAllData`でマスも隠す。
- 新クラス（grid-cols-2 / min-w-0 等）のため **tailwind.css 再生成＋`?v=3`**、sw.js CACHE v3→v4。

## バックアップ＆ひきつぎ（2026-07-07・backup-kit v2）
- 共通部品 `backup-kit.js?v=2` を同梱（設計・運用ルールは ugoki-no-kiroku/HANDOFF.md 参照）。💾ボタン → `BackupKit.open()`。
- 封筒JSON `{kagasenBackup:1, app:'(アプリID)', ...}` で書き出し/読み込み。置換前に `(キー名)_mae` へ1世代退避。別アプリの封筒・壊れたJSONは拒否。
- **部品を直したら同梱している全アプリに配り直し、`?v=` と sw.js の CACHE を繰り上げる**（今回 CACHE v1→v2 済み）。
