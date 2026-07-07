# kotobasagashi（言葉さがし）— 引き継ぎメモ

## 概要
10×10の文字盤にかくれた言葉をドラッグで見つける言葉さがしゲーム（たて・よこ・ななめ・逆さ読み対応、1分間チャレンジ）。
構成＝`index.html` 1ファイル完結（CSS/JS/辞書込み）。localStorage 未使用（記録は持たない）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。index.html に theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ）を追記。
- SWキャッシュ名は「kotobasagashi-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げる**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の掃除は自アプリのプレフィックスだけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消すので戻さない。
