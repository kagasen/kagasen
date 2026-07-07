# hantai-no-kotoba（はんたいの言葉）— 引き継ぎメモ

## 概要
写真と言葉を見て、反対の意味を4択から選ぶ低学年向けの国語ゲーム。
構成＝`index.html`（本体・CSS/JS込み）＋ `questions.js`（問題データ）。localStorage 未使用（記録は持たない）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。index.html に theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ）を追記。
- SWキャッシュ名は「hantai-no-kotoba-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げる**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の掃除は自アプリのプレフィックスだけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消すので戻さない。
