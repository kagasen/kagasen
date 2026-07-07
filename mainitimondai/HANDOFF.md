# mainitimondai — 引き継ぎメモ

## 脱CDN（2026-07-06・完全オフライン化）
- `tailwind.css` … Tailwind CDN の置き換え。**使用クラスだけの静的ビルド**。
  新しい Tailwind クラスを書いたら再生成:
  ```
  printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > /tmp/tw.css
  npx tailwindcss@3.4.17 -i /tmp/tw.css -o mainitimondai/tailwind.css --content "mainitimondai/**/*.html" --minify
  ```
- `fonts.css` + `fonts/` … Mochiy Pop One / Zen Maru Gothic の**同梱サブセット**（リポジトリ全体の使用文字3232字・SIL OFL）。全アプリ共通のセットなので、作り直すときは他のアプリと一緒に（kanji-bouken/build-fonts.mjs の流儀）。
- 1nen〜6nen はサブフォルダ（../tailwind.css ../fonts.css 参照）。Inter は system-ui へ置換。
- ~~Firebase（2〜6年ページの成績記録・gstatic ESM import）は機能依存のため温存~~ → **2026-07-07 訂正: 実際は死にコードだったため撤去**（下記「共通エンジン化」参照）。

## PWA化（2026-07-07・全アプリ一括）
- `manifest.json` / `sw.js` / `icon.svg` を追加。エントリHTMLに theme-color / manifest / apple-touch-icon / SW登録（http(s)のみ・file://では登録しない）を追記。
- SWキャッシュ名は「(アプリID)-cache-v1」。ローカルアセット全部をプリキャッシュ（ネットワーク優先・失敗時キャッシュ）。**アセットを更新したら sw.js の CACHE を繰り上げ、ASSETS の顔ぶれも見直す**こと。
- **注意: Cache Storage は同一オリジン（GitHub Pages）で全アプリ共有**。activate の古キャッシュ掃除は自アプリのプレフィックス（`(アプリID)-cache-`）だけを対象にしてある。`k !== CACHE` だけの条件に戻すと他アプリのオフラインキャッシュを消してしまうので戻さない。

## 共通エンジン化（2026-07-07）— 2〜6年の「同一コード×5枚」を解消
- **構成**: 各学年ページを「`Nnen/data.js`（問題データ＋タイトル＋選択肢記号）＋ 薄い `Nnen/index.html`（約20行のシェル）＋ 共通 `quiz.js` / `quiz.css`（本体・全学年で1枚）」に分離。**ロジックのバグ修正は quiz.js の1箇所で済む**。
- **1nen は対象外**: 「１ねんせいまいにちショートストーリー」というクイズではない別アプリ（読み物・重複なし）のため現状維持。
- **学年差は data.js の3項目だけ**: `title`（2年=「まいにちなぞとき」ひらがな表記 / ６年=全角数字）・`choices`（2年=['1','2','3','4'] / 3〜6年=['ア','イ','ウ','エ']）・`csv`（1行=「問題,答え,解説」）。
- **Firebase 撤去の経緯**: 旧ページの saveQuizResult（班番号つき成績保存）/ showResults は「定義のみ・呼び出しゼロ・UIゼロ」の死にコードで、firebaseConfig も空（`'{}'`）のため初期化が常に失敗していた＝一度も動いていない。しかも gstatic からの ESM import が**オフライン時にページ全体を落としていた**（module script は import 失敗で全体が死ぬ）。撤去により2〜6年ページが本当にオフラインで動くようになった。release-check の KNOWN_EXTERNAL からも削除済み（再発したら❌検出）。
- **移行の検証（2026-07-07）**: 全学年で「フィルタ前後の問題数一致」を機械確認＝**同じ日付で原本と同じ問題が出る**（2026-07-07 の5学年ぶんを実ブラウザで原本データと照合済み）。解答フロー（正解色・不正解メッセージ・解説・戻る）・SWキャッシュ v1→v2 も検証済み。
- **更新手順**: 問題を直す → その学年の `data.js` を編集 → `index.html` の `data.js?v=N` と `sw.js` の CACHE を繰り上げ。ロジックを直す → `quiz.js` → 全学年 `index.html` の `quiz.js?v=N` と CACHE を繰り上げ。
