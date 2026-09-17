# classroom-board — 引き継ぎメモ

## 手がきを IndexedDB へ（2026-09-16）
手がき（旧 `cb-v2-h`）は **IndexedDB（DB `classroom-board` / キー `h`）** に保存するようにした。ウィジェット設定 `cb-v2-s` は小さいので localStorage のまま。
- **共通部品 `kioku-db.js`**（sikou-tool-app / classroom-board に同一ファイル。直したら両方に配り直し＋`?v=`＋CACHE）。DB名＝アプリ名・ストア `kv`・値は文字列。
  - `load()` … localStorage に旧キーが**ある＝そちらが新しい**（未引っ越し／IndexedDB が使えずそちらへ保存した）→ IndexedDB に書いて**読み返して一致したら** localStorage を消す。
    IndexedDB に別のデータがあれば消さずに `キー_mae` へ退避。
  - `save(raw)` … 1つずつ順に書く（書いている間に来たものは最新1つだけ）。load() がおわるまで待つ。IndexedDB が失敗したら localStorage へにがす。
  - IndexedDB が無い・開けない（プライベートブラウズ／Safari 14.1 の open が返らない不具合→`databases()` で起こす・8秒で諦め）→ これまでどおり localStorage。
  - `importRaw(raw)` … バックアップ読みこみ。前のデータを `キー_mae` に退避。以後の save は止める（古い画面が上書きしない）→ BackupKit の onImported で完了を待って reload。
- index.html: `window.cbKioku` を DOMContentLoaded の前に作る。`loadData()` は手がきだけ非同期に読み、読みおわるまで `hLoaded=false` で手がきを保存しない
  （空で上書きしない）。読みこみ中に描いた線は後ろにつなぎ、undo 履歴は空にする。バックアップは h を `cbKioku.latest()`／`importRaw()`（前の手がきは `h_mae`）。
- SW `classroom-board-cache-v7`（kioku-db.js も ASSETS に）。
- 検証(localhost): 旧 localStorage の手がき→ひらくと引っ越し・localStorage は空・描画される。線を描く→IndexedDB に保存（整数化）。
  両方にデータがある場合は localStorage 側を採用し IndexedDB 側を `h_mae` に退避。バックアップ読みこみ→反映。**iPad 実機は未確認**。

## 手書きの保存を小さくした（2026-09-16）
localStorage はアプリ集の全アプリで共有（iPad 約5MB）。手書き（`cb-v2-h`）を小数の座標のまま保存していて、消さずに使うと数MBになり、
子どものアプリの保存まで失敗させていた。`saveData()` の `JSON.stringify(drawHistory, smallStroke)` で **保存するときだけ** x/y/w/h を整数にし、
となりと同じ点をとばす（ずれ0.5px以内・形式は同じ＝旧データもそのまま読める・次の保存で自動で小さくなる）。検証: 同じ線で保存量が約半分。
全アプリ共通の「保存の見はり」も `<head>` に埋めこみ（原本 `../hozon-guard.js`・手で直さない）。classroom-board-cache-v7。

## 脱CDN（2026-07-06）
- フォント … Google Fonts CDN をやめて**システムフォント**へ置換（任意の入力文字を表示するアプリのためサブセット同梱は不可）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## バックアップ＆ひきつぎ（2026-07-07・backup-kit v2）
- 共通部品 `backup-kit.js?v=2` を同梱（設計・運用ルールは ugoki-no-kiroku/HANDOFF.md 参照）。💾ボタン → `BackupKit.open()`。
- 封筒JSON `{kagasenBackup:1, app:'(アプリID)', ...}` で書き出し/読み込み。置換前に `(キー名)_mae` へ1世代退避。別アプリの封筒・壊れたJSONは拒否。
- **部品を直したら同梱している全アプリに配り直し、`?v=` と sw.js の CACHE を繰り上げる**（今回 CACHE v1→v2 済み）。

## 「何も押せない」バグ修正（2026-07-07）
- **原因**: 2026-07-06 の脱CDNフォント置換で、インラインJS内の `ctx.font = ... + 'px 'Hiragino Kaku Gothic ProN', ...'`（3箇所）と SVG文字列内の `font-family='Hiragino...'`（2箇所）がクォート崩れの**構文エラー**になり、メインスクリプト全体が死んでいた（ツール・ウィジェット全滅。エラーは SyntaxError なので console にも出にくく気づきにくい）。
- **修正**: 5箇所のクォートを修正（JS文字列は外側ダブルクォート、SVG属性は `font-family="...（内側クォートなし）"`）。sw.js CACHE v2→v3。
- **検証**: ツール切替・タイマーウィジェット開閉・ペンでcanvasに実描画・バックアップボタン、すべて動作確認済み。
- **再発防止**: release-check.mjs に「検査項目7: 全HTMLインラインJSの構文チェック」を追加（この事故は今後❌で検出される）。
