# かがせんのHAPPYアプリ集

小学生と先生のための教育アプリ集。**公開URL → https://kagasen.github.io/kagasen/**

広告なし・登録なし・完全オフライン。作者: kagasen先生

---

## このフォルダの見かた（まずここを読む）

フォルダがたくさん並んでいて分かりにくいので、**3種類しかない**と覚えると迷わない。

### ① アプリのフォルダ（青いフォルダのほとんど・28こ）

`ugoki-no-kiroku` `hiraganarensyu` `sekigae` … など。**1アプリ＝1フォルダ**で、中身はいつも同じ形。

| ファイル | なに |
|---|---|
| `index.html` | アプリ本体。CSSもJSも全部この1枚に入っている（ビルド不要） |
| `HANDOFF.md` | **そのアプリの引き継ぎメモ。触る前にまずこれを読む** |
| `manifest.json` / `sw.js` / `icon.svg` | PWA（ホーム画面に追加・オフライン起動）用 |
| `images/` `fonts/` `vendor/` | そのアプリだけが使う画像・フォント・ライブラリ |
| `build-*.mjs` `build-*.py` | データや画像を作りなおすスクリプト（**生成物を手で直さずこれを直す**） |

★アプリのフォルダは**ルート直下に置くしかない**（公開URLが `.../kagasen/アプリ名/` になるため）。
数が多くて見づらいが、まとめてサブフォルダに入れるとURLが変わってリンクが切れる。

### ② ポータル（トップページ）のファイル

| ファイル | なに |
|---|---|
| `index.html` | トップページ本体 |
| `apps.js` | **アプリ一覧の正データ**。カードの名前・説明・サムネ・リンクはここが全部 |
| `images/thumbnails-v2/` | 一覧に出るサムネイル画像（**サムネはここに入れる**） |
| `images/` 直下 | `ogp.png`（SNS共有画像）・`ogp.svg`（その原本）・`light-oak-bg.png`（背景） |
| `fonts/` `fonts.css` `tailwind.css` `vendor/` | トップページが使うフォント・CSS・アイコン |

### ③ 道具と決まりごと（さわる回数は少ない）

| ファイル | なに |
|---|---|
| `CLAUDE.md` | **全アプリ共通の「壊してはいけない前提」**。作る前に必ず読む |
| `HANDOFF.md` | ポータルの引き継ぎメモ（作業の経緯はここに書き足す） |
| `RELEASE-CHECK.md` | 公開前チェックの説明 |
| `build-seo.mjs` | 検索対策。**アプリを足したら走らせる**（タイトル・sitemap がそろう） |
| `build-ogp.mjs` | `images/ogp.svg` → `images/ogp.png` を焼く |
| `release-check.mjs` | 公開前の自動チェック |
| `start-local-server.command` | **ダブルクリックで手もとの確認用サーバーが立つ** |
| `sitemap.xml` `robots.txt` `google8…….html` | 検索エンジン向け（自動生成・さわらない） |
| `package.json` `package-lock.json` `node_modules/` | 上のスクリプトが使う道具（`node_modules` はGitHubに上げない） |

---

## よくやる作業

```bash
# 手もとで見た目を確認する
# → いちばんかんたんなのは start-local-server.command をダブルクリック（ポート8765で開く）
python3 -m http.server 8765     # → http://localhost:8765/

# アプリを足した／説明を変えたあと
node build-seo.mjs              # タイトル・description・sitemap をそろえる

# 公開まえ
node release-check.mjs          # 外部読み込みやリンク切れがないか調べる

# タイピングだけ esbuild を使う（このアプリだけの例外）
npm run build:typing
```

## アプリを1つ足すときの手順

くわしくは `CLAUDE.md` の「7. 公開時チェックリスト」。かんたんに言うと:

1. フォルダを作って `index.html` `manifest.json` `sw.js` `icon.svg` `HANDOFF.md` を置く
2. `images/thumbnails-v2/` にサムネイルを置く
3. `apps.js` にカードを1つ足す（**まだ公開したくないなら `draft: true` を1行足す**）
4. 「かがせんのHAPPYアプリ集へもどる」リンクを入れる
5. `node build-seo.mjs` → `node release-check.mjs`

---

## 気をつけること（詳しくは CLAUDE.md）

- **完全オフライン**。外部のCDN・API・サーバーは使わない。ライブラリは同梱する
- **保存は localStorage だけ**。子どもの記録を外に送らない
- **記録を消さない**。データの形を変えるときは `load()` の中で古いデータを新しい形に移す
- **キャッシュ更新を忘れない**。`.js` を直したら `index.html` の `?v=N` を、
  PWAのファイルを直したら `sw.js` の `CACHE` バージョンを繰り上げる
- **出典・ライセンス表記は消さない**（KanjiVG © Ulrich Apel / CC BY-SA 3.0 など）
