# うごきのきろく — 引き継ぎメモ

小学生向け運動チャレンジ＆成長ログアプリ。完全オフライン（localStorage）・PWA。

## 構成
- `index.html` … 本体（CSS/JS込みの単一ファイル、ビルド不要）
- `backup-kit.js` … きろくの「バックアップ＆ひきつぎ」共通部品（3アプリ同梱コピー方式。下記参照）
- `manifest.json` / `sw.js` / `icon.svg` … PWA。**アセット更新時は sw.js の `CACHE` バージョンを繰り上げる**（v1→v2…）
- ポータル登録は ルートの `apps.js`、サムネイルは `images/ugoki-no-kiroku.svg`

## 大前提（設計合意）
- サーバー・API・CDNなし。フォントもシステムフォント（オフライン初回起動でも崩れない）
- データは localStorage キー `ugokiNoKiroku_v1` に単一JSONで保存
- 表記はひらがな中心、タップターゲット48px以上

## 12種目と記録方式
| 種目 | 方式 |
|---|---|
| なわとび | 技19種×連続回数（自己ベスト管理）＋30秒はやまわしチャレンジ（まえ/うしろ、折れ線グラフ） |
| てつぼう | 検定20技チェック → 級判定（2技=1級きざみ、20技=特級） |
| マットうんどう | 10技チェック（難易度★・コツ付き） |
| とびばこ | 6技 × 何段とべたか（2〜8段、最高段を保持） |
| すいえい | 検定22段階（20級→2段）チェック＋泳法別距離ログ（累計バー）。20級「かおに水」〜13級あたりは小1向けのやさしい水慣れ課題。旧12段階(id: s10〜sS2)のデータは load() 内で新id(sw〜)へ自動移行 |
| マラソン | 距離・タイム入力、累計km、目標バー（10km→42.195km→100km）、グラフ |
| サッカー/バスケ/バレー/野球/ドッジ/リレー | `BALL_SPORTS` 定義の汎用チャレンジカード（各7個）。type:'count'=回数・距離・秒の自己ベスト（`low:true` はタイム系で小さいほど良い）、type:'check'=できたチェック。ページは `viewBallSport()` が共通描画 |

## 級・検定データの出典
栃木県教育委員会「みんなが使えるチャレンジカード集」（小学生のための体力つくりの手引き, 平成21年）を参考。
- 鉄棒検定カード（20技・得点→級）
- なわとびチャレンジカード（技ごとの回数→級。二重とび100回=特級、50回=準特級）
- 水泳がんばりカード（10級→2段）
- 30秒はやまわしの目安（70回→二重とび可、90回→連続二重、100回→三重とび）
- なわとび級表は原本の表が読み取りづらい箇所があり一部補間している

## ゲーミフィケーション
- XP: 記録+10 / 技初達成+30 / 自己ベスト+20 / バッジ+50 / 7日連続+100
- レベル: 必要XP = 100 + (レベル-1)×25 の累積
- キャラ進化: たまご(Lv1)→ひよこ(Lv3)→とり(Lv6)→つばさ(Lv11)→でんせつのとり(Lv21)。SVGは `charSvg()` 内
- バッジ132種（`BADGES` 配列、`cat` でカテゴリ分け、`test(S)` 関数で判定。きろく10/れんぞく5/レベル5/なわとび24/てつぼう10/マット10/とびばこ8/すいえい14/マラソン8/ボール6種目×5/スペシャル8）。獲得演出はモーダル＋自前コンフェッティ（`confettiBurst()`）。旧31種のidはすべて新100種に残してあるので獲得済みバッジは消えない
- 連続記録: 「今日の日付での記録」のみ streak にカウント。7の倍数日で+100XP
- **取り消し時はXPも巻き戻す**: チェック外し・水泳検定取り消し・マラソン記録削除は、対応する records の1件を `removeRecordXp()` で消して totalXp から差し引く（レベルは totalXp 由来なので自動で戻る）。ever_◯◯ からも外すので、付け直せば初達成+30も再付与される＝トグルの往復でXPは増減ゼロ。獲得済みバッジは取り消さない方針（バッジXPは初回のみなので farming 不可）
- 全技にSVGイラスト付き（`TETSU_ART`/`MAT_ART`/`TOBI_ART` は棒人間＋オレンジの動き矢印、なわとびは `nawaArt()` がパラメータ{back,cross,multi,feet,label}から生成）

## バックアップ＆ひきつぎ（backup-kit.js・2026-07-04）
- せってい画面「💾 きろくを まもる」→ `BackupKit.open()`。書き出し＝封筒JSON `{kagasenBackup:1, app, appName, exportedAt, data}` のファイルDL＋テキストコピーの2方式。読み込み＝ファイル or 貼り付け → 検証 → プレビュー（いまの きろく vs ファイルの きろく：なまえ/レベル/XP/きろく数/バッジ数/最終記録日）→ 確認して全置換。
- **安全設計**: 壊れたJSON・別アプリの封筒（app不一致）は既存データに触れず拒否。置換直前に現データを `ugokiNoKiroku_v1_mae` へ1世代退避（誤操作時は手で戻せる）。旧「データをほぞん」の封筒なしJSONも `looksLike`（profile＋records配列）判定で後方互換読み込み可。外部送信なし。
- **共通部品の流儀**: `backup-kit.js` は3アプリ（ugoki / level-up-adventure / kanji-bouken）に同一ファイルを同梱コピー（three.min.js と同じ方式）。アプリ固有部分（appId・storageKey・looksLike・summarize）は各 index.html の `BackupKit.init({...})` に置く。**部品を直したら3フォルダ全部に配り直し、各 index.html の `?v=` と各 sw.js の CACHE を繰り上げる**。
- 旧 `exportData()`（素のJSONダウンロード）はこの部品に置き換えて撤去済み。

## データ構造（localStorage）
```
{ profile:{name,grade,charName,totalXp,createdAt},
  records:[{id,sport,date,label,xp}],
  nawatobi:{best:{技id:回数}, speed:[{date,mae,ushiro}]},
  tetsubo:{done:[]}, mat:{done:[]}, tobibako:{dan:{技id:段}},
  suiei:{kyu:[], log:[{date,stroke,m}]}, marathon:{log:[{id,date,m,sec}]},
  badges:[], streak:{last,count,best}, ever_◯◯:[] }
```

## sw.js の activate 修正（2026-07-07）
- **バグ修正**: activate の古キャッシュ掃除が `k !== CACHE`（自分以外全部削除）だったため、同一オリジン（GitHub Pages）で他アプリのオフラインキャッシュを消していた。自アプリのプレフィックスだけ削除する条件（`k.startsWith('(自分のキャッシュ名)-') && k !== CACHE`）に修正。CACHE名・ASSETSは不変（キャッシュ繰り上げ不要、sw.js自体の更新はバイト差分で自動配布される）。

## backup-kit v2（2026-07-07）— このHANDOFFが部品の source of truth
- **v2の変更**: localStorage キーが複数あるアプリ用に `collect()`（現状を1オブジェクトに集約）/ `restore(data)`（書き戻し。`_mae` 退避も restore 側の責任）フックを追加。両方セットで指定すると storageKey は使われない。従来の単一 storageKey 方式は挙動不変（後方互換・このアプリはこちら）。
- **同梱アプリは9個に拡大**: ugoki-no-kiroku / level-up-adventure / kanji-bouken（従来3）＋ typing（3キー・collect/restore）/ shukudai / shinmatorikusu / classroom-board（2キー・collect/restore）/ taiiku-relay / sikou-tool-app。sakkanojikan は自前のファイル保存があるため対象外（同HANDOFF参照）。
- 部品を直したら**9フォルダ全部に配り直し**、各エントリHTMLの `?v=` と各 sw.js の CACHE を繰り上げること（今回 v1→v2、ugoki-cache v7→v8）。
- 検証済み（2026-07-07）: typing 3キーの書き出し/読み込み/退避、classroom-board 2キー（キー削除含む）、単一キー4アプリの一周、v2でも既存 ugoki の書き出しが従来どおり動くこと。
