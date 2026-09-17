# キッズタイピングマスター（typing） — 引き継ぎメモ

学年別タイピング練習。**複数ページ構成**（例外的にビルドあり: `npm run build:typing` が
app.js(JSX) → app.compiled.js を esbuild で変換）。

## 外観リニューアル（2026-09-02）
- 出題内容・モード・採点などの機能は変えず、`polish.css` でトップ画面と2〜6年生の練習画面の背景・カード・配色・立体感だけを刷新。
- 対象ページでは body に `typing-home` / `typing-play` を付けて適用範囲を限定。70のとっくん・流れる単語・ショップ固有のデザインには影響させない。
- ペットショップの9種類は `images/pets/{species}-{egg|baby|teen|adult}.png` の生成画像へ刷新。全36点が別画像で、たまご→ヒナ→こども→大人の順に切り替わる。大人は体格・羽や尾／しっぽ・衣装・装飾を大幅に進化させ、こどもとの差が明確。ショップでは9種類すべて、購入前にたまご段階の画像を表示する。
- SWキャッシュは `typing-cache-v8`。`polish.css` とペット画像36点もプリキャッシュ対象。

- `index.html` … 学年えらびトップ
- `2nen〜6nen/index.html` … 学年別練習（React 18 UMD + app.compiled.js）
- `nagare2nen〜6nen.html` … 流れ（カリキュラム）ページ
- `tokkun70/` … 70のとっくん（index + level01〜70、React）
- `shop.html`

## 完全オフライン化（2026-07-06）＝Firebase以外を同梱
- `tailwind.css` … 全ページ共通の静的ビルド（Tailwind CDN置き換え・約34KB）。
  **どのページでも新しいTailwindクラスを書いたら再生成**:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o typing/tailwind.css \
    --content "typing/**/*.html,typing/app.js,typing/app.compiled.js,typing/preflight.js" --minify
  ```
  参照はトップ階層=`tailwind.css`、サブフォルダ=`../tailwind.css`。
- `vendor/` … react.production.min.js / react-dom.production.min.js（18.3.1）、
  lucide.min.js（1.23.0）。unpkg の置き換え（75ページ）。
- `fonts/` + `fonts.css` … Mochiy Pop One / Zen Maru Gothic(400/700/900) を
  **アプリの使用文字だけにサブセット化**した woff2（SIL OFL・計約850KB）。
  生成は `node typing/build-fonts.mjs`（要 python3+fontTools）。
  **出題語・文言を増やしたら再実行**（未収録字はシステムフォント代替）。
- **Firebase（www.gstatic.com）は温存** … index.html 末尾の訪問カウンター（appClicks）。
  外部サービスのため同梱不可＝release-check では typing は既知リスト（警告）に残る。
  オフライン時は `typeof firebase === 'undefined'` ガードで静かにスキップする。

検証済み: トップ（同梱フォント適用）・3nen（React動作）・tokkun70/level01（描画）で
外部リクエストが Firebase のみ／ゼロ、console errorなし。

## 残
- PWA化（manifest.json / sw.js / icon.svg）は未対応。多ページ構成なのでキャッシュ一覧が長くなる点に注意。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## バックアップ＆ひきつぎ（2026-07-07・backup-kit v2）
- 共通部品 `backup-kit.js?v=2` を同梱（設計・運用ルールは ugoki-no-kiroku/HANDOFF.md 参照）。💾ボタン → `BackupKit.open()`。
- 封筒JSON `{kagasenBackup:1, app:'(アプリID)', ...}` で書き出し/読み込み。置換前に `(キー名)_mae` へ1世代退避。別アプリの封筒・壊れたJSONは拒否。
- **部品を直したら同梱している全アプリに配り直し、`?v=` と sw.js の CACHE を繰り上げる**（今回 CACHE v1→v2 済み）。

## ペットが消える不具合の修正（2026-09-08・shop.html）
「ペットを買って おせわ → ほかのページへ → もどったら ペットが消えていた」への対処。
原因は **shop.html が記録を「ページを開いたときのメモリ」だけで持ち、書くときに localStorage を丸ごと上書きしていた**こと。次の2つで消える。
1. **もどるボタンで復活した古い画面（bfcache）**。iPad の Safari は「もどる」でページを再実行せず、
   そのとき見ていた状態のまま復活させる。買う前の画面がよみがえると一覧は空で、そこで何か操作すると
   その空の状態で保存され、買ったペットが本当に消える。
2. **保存の失敗をだまって握りつぶしていた**（`catch(e){console.warn(e)}`）。きおくの場所がいっぱい等で
   保存できなくても「かったよ！」と出るので、ページを離れた瞬間に全部なかったことになる。

直した内容（すべて shop.html 内）:
- `readSave()` / `readPoints()` … 読めた・読めない・こわれているを区別する。読めないときは**絶対に上書きしない**。
  こわれた JSON は捨てずに `typing-pet-save-v2_kowareta` へ よけてから空で開始。
- `refreshFromStorage()` … **買う・おせわ・にがす の直前に必ず localStorage を読み直す**（tokkun-storage.js と同じ流儀）。
  古い画面から押されても、いまの記録に対して操作する。すでにいないペットを押したら
  「がめんを あたらしくしたよ」と案内して、ポイントは引かない。
- `pageshow(persisted)` / `visibilitychange` / `focus` / `storage` で自動的に読み直して描き直す。
  → もどってきた瞬間に、正しいペット一覧に戻る。
- `writeKey()` … 書いたあと読み直して確認。失敗したら**消えない赤い おしらせバー**（`#save-error`）を出す。
  トーストだと「かったよ！」で上書きされて気づけないため。
- ポイントは `savePoints()` に分離し、**書く前に必ず最新残高を読み直す**。
  練習ページで増えたポイントを、開きっぱなしのショップ画面が古い残高で潰さないようにする。
- SWキャッシュは `typing-cache-v9` に繰り上げ。

検証（localhost・Chromium）: 通常フロー（購入→あたためる×3→ほかページ→もどる）で記録が残る／
古いメモリのまま購入しても既存ペットが消えない／いないペットIDでもポイントが減らない／
こわれたJSONは `_kowareta` に退避／保存失敗時に赤バー表示／成長(baby→teen→adult)・図鑑登録・にがす・
10ひき時の入れかえ、すべて動作を確認。

## 「ポイントだけ減って ペットが消える」の修正（2026-09-10・shop.html）
症状は「**買ったペットを あたためようとすると ボタンがきかず、そのまま ペットが消える**」。
2026-09-08 の修正で入れた `refreshFromStorage()`（操作の直前に localStorage を読み直す）は正しいが、
**買うときの順番が逆**だったため、次の事故が起きていた。

1. `finalizeBuy()` が **先に `spendPoints()` でポイントを引いてから** ペットを保存していた。
2. ペットの保存だけ失敗すると（きおくの ばしょが いっぱい／書けない設定）、
   **ポイントは減ったのに ペットは localStorage に のこらない**。画面には「かったよ！」と出て、カードも見えている。
3. そのあと「あたためる」を押すと `refreshFromStorage()` が いない ペットを読みこみ、
   `if (!pet)` の道に入る → **なにも起きず（＝ボタンがきかない）、再描画でカードごと消える**。

`Storage.prototype.setItem` をペットのキーだけ失敗させて、この3手順の再現を確認したうえで直した。

直した内容（すべて shop.html 内）:
- **かならず「記録を保存してから ポイントを引く」順にした**。`spendPoints()` は廃止し、
  `canPay()`（足りるか見るだけ）＋ `payPoints()`（保存が成功してから引く）に分けた。
- `finalizeBuy()` … `savePets()` が失敗したら `state.pets.pop()` で買わなかったことにして、**ポイントは1つも引かない**。
- `petAction()` … おせわの結果を保存できなければ warmCount/feedCount/playCount/stage/dex を**もとに戻して**ポイントも引かない。
- `petAction()` … **いまの すがた に合わない おせわは、ポイントを引く前にはじく**（`needStage` で判定）。
  以前は「ほかのタブで もう ヒナになったのに、古い画面の『あたためる』を押した」ときに
  **なにも起きないのにポイントだけ減っていた**（これも「ボタンがきかない」の正体のひとつ）。
- `releasePet()` … 保存できないときは にがさず もとに戻す（画面からだけ消えて、読み直すと戻ってくる ちぐはぐを防ぐ）。
- 赤いおしらせバーの文言を「ポイントは 減らないよ」に更新（実際に減らなくなったため）。
- SWキャッシュは `typing-cache-v10` に繰り上げ。

検証（localhost・Chromium／SWとキャッシュを消して最新HTMLで実施）:
①ふつうに買う→あたためる×3 で記録もポイントも正しい ②保存NGのとき おせわしてもポイントが減らない・カードも消えない
③保存NGのとき 買ってもポイントが減らない・幽霊ペットも増えない ④保存が直れば ふつうに買える
⑤記録と画面がちぐはぐなときは ポイントを引かずに画面を作り直す ⑥teen→adult＋ずかん登録（遅れて出るトーストも）
⑦保存NGのときは にがせない ⑧ふつうに にがせる・ずかんは残る ⑨10ひきのときの入れかえ（1回だけ100P）。

## 「ほぞんできません」の本当の原因は ほかのアプリ（2026-09-15）
iPad でショップが赤いおしらせを出して買えない、の原因は **思考ツール（sikou-tool-app）** が大きな写真と
「元に戻す」履歴で localStorage（kagasen.github.io の全アプリ共通・約5MB）をうめていたこと。思考ツール側を直した（その HANDOFF 参照）。
- shop.html の赤いおしらせに、保存場所が3MB以上うまっているときだけ **おとなむけの1行**（合計と、大きい順3つのキー。思考ツールは名前で出す）を足した（`storageReportHtml()`）。
  ほかのアプリが原因のときも、スクショ1枚でどのアプリか分かる。
- 赤いおしらせ・「保存してからポイントを引く」の仕組みは そのまま（正しく動いていた）。SWキャッシュは `typing-cache-v17`。
- 2026-09-16: 全アプリ共通の「保存の見はり」（原本 `../hozon-guard.js`）を typing の全HTML（tokkun70 の70面ふくむ）の `<head>` 先頭に埋めこみ。
  ショップは自前の赤いおしらせがあるので `window.KAGASEN_HOZON_QUIET = true` で共通のおしらせを出さない。typing-cache-v18。

## キーボードを指ごとに色分け（2026-09-11）
「ホームポジションを覚えず、ぜんぶ人差し指で押す子が多い」への対処。キーと指の絵を、担当する指の色でぬった。
- 色は**左右おなじ指はおなじ色**の4色・目立たないうすい色: こゆび=ピンク `#fde4ee` / くすりゆび=きみどり `#e5f5d3` /
  なかゆび=みずいろ `#dcedfc` / ひとさしゆび=うすむらさき `#ebe5fb`（ふちどりは少し濃い色）。「つぎのキー」の黄色ハイライトは今までどおり。
- `app.js`（2〜6年・70のとっくん）… `FINGER_COLORS` / `fingerColorOfKey()` を追加。キーと指の絵にインラインstyleで色、F・J に でっぱり、キーボードの下に色の見本。
  Tailwindクラスを増やしていないので tailwind.css の再生成は不要。変更後は `npm run build:typing`。
- `nagare2nen〜6nen.html` … 以前から凡例用の `FINGER_COLORS`（8色）があったが、キーはぬられていなかった。
  同じ4色の `FINGER_PALETTE` にそろえ、CSS変数（キー `--kc`/`--kb`、指 `--fc`/`--fb`）で色をつけた（`.key-active` / `.active-f` がそのまま上書きできるように）。凡例もひらがな4つに。
- **色を変えるときは app.js と nagare 5ページの両方を同じ値に**。SWキャッシュは `typing-cache-v12`。
- 同日追記（指の絵）: いったん不透明度0.9にしたら**下のキーが見えない**とユーザーから指摘 → **すけた指に うっすら色**が正解。
  いまは 光っていない指は opacity 0.4（app.js）/ 0.45（nagare）で、ぬりは キーより少し濃い `border` 色、りんかくは さらに濃い `line` 色。
  （キーと同じ `bg` 色ですけさせると ほぼ白になって色が分からない。）**指を濃く（不透明に）しないこと**。SWキャッシュは `typing-cache-v14`。
- 同日追記（押すキー）: 黄色だと分かりにくいとの指摘で、**押すキーも その指の色**に。`border` 色（少し濃い）＋ふちは `line` 色＋太字＋少し浮かせる程度。
  app.js は KeyboardRow の style、nagare は `.key-active` が CSS変数 `--kb`/`--kl` を使う。SWキャッシュは `typing-cache-v15`。
- 同日追記（押す指）: 光る指の絵も**黄色をやめて その指の色のまま**に。すけ具合を 0.4→0.7（nagare 0.45→0.75）に減らし、ふち2px・小さなかげ・少し浮かせる程度。
  ラベル（「人差指」など）は赤→こい灰色。**押すキー・押す指とも黄色に戻さないこと**（ユーザー指定）。SWキャッシュは `typing-cache-v16`。

## ペット画像を WebP にした（2026-09-10）
`images/pets/` の36点（8.3MB）を **1.7MB** にした（ルートの `build-images.mjs`）。絵は同じ。
`shop.html` の `petImage()` は `` `./images/pets/${species}-${safeStage}.webp` `` と
**名前を組み立てて**いるので、スクリプトでは直らない。手で直してある。
たまごの種類や せいちょう段階を増やすときは、ここの拡張子に注意。SWキャッシュは `typing-cache-v11`。
