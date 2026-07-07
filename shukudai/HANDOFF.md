# 宿題提出管理アプリ（shukudai） — 引き継ぎメモ

QRコードで宿題提出をチェックするアプリ。単一 `index.html`。

## 完全オフライン化（2026-07-06）
CDN読み込みをすべて同梱に置き換えた（release-check の既知リストからも削除済み＝再発したら❌検出）。

- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**なので、
  index.html に新しい Tailwind クラスを書いたら再生成が必要:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o shukudai/tailwind.css --content shukudai/index.html --minify
  ```
- `qrcode.min.js` … qrcodejs@1.0.0（QR生成）
- `barcode-detector.min.js` … barcode-detector@3.2.0 IIFE（ネイティブBarcodeDetectorが無い
  iPad/Safari向けZXing-wasmポリフィル）
- `zxing_reader.wasm` … zxing-wasm@3.1.0 の reader wasm。**index.html 冒頭の
  `BarcodeDetectionAPI.prepareZXingModule({overrides:{locateFile}})` が取得先をこのローカル
  ファイルに向けている**（これが無いと fastly.jsdelivr.net に取りに行く）。
  barcode-detector を更新したら、バンドル内の zxing-wasm バージョンに合わせて wasm も差し替えること。
- フォント … Noto Sans JP の CDN をやめて**システムフォント**
  （児童名など任意の文字を表示するためサブセット同梱は不可。CLAUDE.md の原則どおり）。
  印刷用QRウィンドウのテンプレート内フォントも同様に置き換え済み。

検証済み: QR生成→ポリフィル（ローカルwasm）での読み取り round-trip、外部リクエストゼロ、console errorなし。

## 残
- PWA化（manifest.json / sw.js / icon.svg）は未対応。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。
- **罠: index.html は印刷（QR一括印刷）ウィンドウ用HTMLをテンプレート文字列で組み立てており、`</head>` と `</body>` がファイル内に2回ある**。機械的に「最初の `</body>` の前に挿入」するとテンプレート内に混入し、テンプレート内の `</script>` がメインスクリプトを分断して**アプリ全体が壊れる**（2026-07-07のPWA一括適用で実際に発生→修正済み）。挿入系の編集は必ずファイル末尾の本物のタグ位置で行うこと（taiikuti-muwake も同じ構造）。

## バックアップ＆ひきつぎ（2026-07-07・backup-kit v2）
- 共通部品 `backup-kit.js?v=2` を同梱（設計・運用ルールは ugoki-no-kiroku/HANDOFF.md 参照）。💾ボタン → `BackupKit.open()`。
- 封筒JSON `{kagasenBackup:1, app:'(アプリID)', ...}` で書き出し/読み込み。置換前に `(キー名)_mae` へ1世代退避。別アプリの封筒・壊れたJSONは拒否。
- **部品を直したら同梱している全アプリに配り直し、`?v=` と sw.js の CACHE を繰り上げる**（今回 CACHE v1→v2 済み）。
