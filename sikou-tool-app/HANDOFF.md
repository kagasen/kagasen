# sikou-tool-app — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
- **重要（2026-07-07 修正）**: このアプリはReact製で**UIのTailwindクラスはすべてビルドされたJS（`app.bundle.js`）の中にある**。当初の脱CDNビルドが `--content "…/**/*.html"` でHTMLしか走査せず、JS内のクラスが全部purgeされて**レイアウト崩壊（左に素のまま縦積み）していた**。生成時は必ず `app.bundle.js` を走査対象に含めること:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o sikou-tool-app/tailwind.css \
    --content "sikou-tool-app/index.html,sikou-tool-app/app.bundle.js,sikou-tool-app/topicsData.js" --minify
  ```
  Reactソースを変えたら **app.bundle.js を再ビルド → その後 tailwind.css を再生成**（順序重要。tailwindはバンドル内のクラス文字列リテラルを走査する）。config無し=デフォルト（元CDNもカスタムconfig無し）。CSSサイズの目安: 約24KB（4.8KBに縮んでいたら走査漏れ＝崩壊のサイン）。
- フォント … Google Fonts CDN をやめて**システムフォント**へ置換（任意の入力文字を表示するアプリのためサブセット同梱は不可）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## 保存場所を IndexedDB へ（2026-09-16）
localStorage（全アプリ共通・約5MB）を写真でうめないよう、ページの保存を **IndexedDB（DB `sikou-tool-app` / キー `pages`）** に移した。
- **共通部品 `kioku-db.js`**（sikou-tool-app / classroom-board に同一ファイル。直したら両方に配り直し＋`?v=`＋CACHE）。DB名＝アプリ名・ストア `kv`・値は文字列。
  - `load()` … localStorage に旧キーが**ある＝そちらが新しい**（未引っ越し／IndexedDB が使えずそちらへ保存した）→ IndexedDB に書いて**読み返して一致したら** localStorage を消す。
    IndexedDB に別のデータがあれば消さずに `キー_mae` へ退避。
  - `save(raw)` … 1つずつ順に書く（書いている間に来たものは最新1つだけ）。load() がおわるまで待つ。IndexedDB が失敗したら localStorage へにがす。
  - IndexedDB が無い・開けない（プライベートブラウズ／Safari 14.1 の open が返らない不具合→`databases()` で起こす・8秒で諦め）→ これまでどおり localStorage。
  - `importRaw(raw)` … バックアップ読みこみ。前のデータを `キー_mae` に退避。以後の save は止める（古い画面が上書きしない）→ BackupKit の onImported で完了を待って reload。
- `app.jsx`: 起動時に `kioku.load()` を待ってから `root.render`（`bootRaw`）。初期状態は `initialState()` で1回だけ作る（むかしは描画のたびに JSON を読み直していた）。
  保存は `kioku.save(raw).then(ok => setSaveFailed(!ok))`。`window.sikouKioku` をバックアップが使う。
- index.html: `kioku-db.js?v=1` を bundle より先に。BackupKit は collect/restore/onImported（`latest()` と `importRaw()`）。`app.bundle.js?v=5`、SW `sikou-tool-app-cache-v9`（kioku-db.js も ASSETS に）。
- 写真を縮める処理（下の 2026-09-15）はそのまま残した（IndexedDB でも小さいほうが速い）。tailwind.css はクラスを足していないので再生成していない。
- 検証(localhost): 旧 localStorage の保存（写真160万文字）→ ひらくと IndexedDB へ引っ越し・localStorage は空・写真とふせんが表示。
  localStorage を完全に満杯にしても ふせん追加が IndexedDB に保存され、再読みこみで残る。バックアップ読みこみ→反映＋`pages_mae` 退避。
  IndexedDB が無い想定（window.indexedDB を消す）でも localStorage で読み書きできる。**iPad 実機は未確認**。

## 写真で全アプリの保存場所をうめていた（2026-09-15）
症状は **タイピングのペットショップで「いまは きろくが ほぞんできません」と出てペットが買えない**（iPad）。
原因はこのアプリ。localStorage は **kagasen.github.io の全アプリで分け合う約5MB** なのに、
- 貼った写真を**元の大きさのまま**（iPadの写真で数MB）data URL で保存していた（表示は400px幅なのに）
- 「元に戻す」の履歴 `past`/`future` まで保存していたので、動かすたびに**同じ写真のコピーが増えて**いた
- 保存の失敗は `catch(_){}` で だまって握りつぶしていた

直したこと（`app.jsx`）:
- 保存するときは `past`/`future` を空にする（**元に戻すは読みこみ直すと使えなくなる**。そのかわり容量が数分の1）
- `shrinkImageDataUrl()` … 300,000文字をこえる画像は長い辺1000pxの JPEG(0.85) に縮める。貼るとき＋ひらいたときに1回（前の版の大きな写真も縮めて場所をあける）。
  小さい画像はそのまま（透過PNGを白ぬりにしない）
- 保存に失敗したら 画面の上に赤いおしらせを出す
- 検証: 旧形式（400万文字の写真＋履歴3つ＝1,610万文字）→ ひらくと 49万文字。新しく貼った 4.7MB の写真 → 38万文字。
- **端末の場所があくのは、その端末で この新しい版をいちど ひらいたとき**。
- `app.bundle.js?v=4`、SW `sikou-tool-app-cache-v8`。

## バックアップ＆ひきつぎ（2026-07-07・backup-kit v2）
- 共通部品 `backup-kit.js?v=2` を同梱（設計・運用ルールは ugoki-no-kiroku/HANDOFF.md 参照）。💾ボタン → `BackupKit.open()`。
- 封筒JSON `{kagasenBackup:1, app:'(アプリID)', ...}` で書き出し/読み込み。置換前に `(キー名)_mae` へ1世代退避。別アプリの封筒・壊れたJSONは拒否。
- **部品を直したら同梱している全アプリに配り直し、`?v=` と sw.js の CACHE を繰り上げる**（今回 CACHE v1→v2 済み）。
