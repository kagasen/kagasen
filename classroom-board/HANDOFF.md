# classroom-board — 引き継ぎメモ

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
