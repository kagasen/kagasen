# sakkanojikan — 引き継ぎメモ

## 脱CDN（2026-07-06）
- Tailwind は元から同梱の `tailwind.min.js`（Play CDN のJS版・ユーザー設計）で動く。**CDNフォールバックだけ撤去**した。
- M PLUS Rounded 1c → システムフォント（丸ゴシック系）へ置換。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## バックアップ部品（backup-kit）を意図的に入れていない（2026-07-07）
- このアプリには既に「ファイル保存/読み込み」（sakka_exportData / sakka_importData＝作品単位のJSON入出力）があり、守るべきデータ（書きかけの作品）はそれでカバー済みのため、backup-kit の横展開対象から除外した。機能を重複させない判断。
