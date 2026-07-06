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
