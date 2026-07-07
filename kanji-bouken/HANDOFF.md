【漢字の冒険 / kanji-bouken 引き継ぎ】

■ 現状：段取り0〜5 すべて完了（2026-06-06）。検証版アプリとして一周動作＋ポータル登録済み。
■ プラン：~/.claude/plans/grill-me-u-i-ux-2-1-6-radiant-kay.md

■ kanji-bouken/ 構成
- index.html       … 本体（プロフィール／ワールドマップ／れんしゅう／テスト／結果／きせかえ。エンジン＋二段採点込み）
- poc.html         … 検証用れんしゅうページ（採点動作確認用・参考）
- build-strokes.mjs … KanjiVG SVG取得→strokes/medians生成（node kanji-bouken/build-strokes.mjs）
- grade2-strokes.js … 生成データ30字・109×109座標・116KB（姉含む）
- grade2-data.js   … 読み方/熟語 GRADE2_INFO（★先生添削対象のたたき台）

■ 確定事項
- データ源＝KanjiVG（日本字形・全常用・筆順つき・CC BY-SA 3.0）。hanzi-writer-dataは中国字形で日本字欠落のため不採用。
- 採点：練習=calcScoreLenient（甘め・TOL=12）／テスト=calcScoreStrict（画数ゲート＋順不同貪欲マッチング＋方向一致）。perfect=100/garbage=2を確認。
- お手本=薄ピンク描画。教科書体=Klee One。完全オフライン（CDN fetchなし）。
- 保存=localStorage `kanji_save_<profileId>`（coins/equipped/unlocked/mastery）。masteryキーはコードポイント。
- ★公開時：KanjiVGのクレジット表記＋同一ライセンス継承が必要（index.html内に出典明記済み）。

■ ポータル登録：apps.js先頭にkanji-boukenエントリ追加（計25件）／images/kanji-bouken.svgサムネ作成済み。

■ プレビュー：静的配信 .claude/launch.json "static"（python3 http.server）／ポート8766

■ 追加実装（2026-06-06・第2回）
- **キャラ＝男の子／女の子**（動物廃止）。`CHARS`に6プロフィール（boy1-3/girl1-3・肌/髪違い）。`charSVG(charKey,equipped,px)`がSVGで全身描画（服色・スカート/ズボン・くつ色を反映）。プロフィール=キャラ選択。
- **着せ替えスロット解放**：`ITEMS`にshirt/pants/shoesの色アイテム（starter無料＋有料）。きせかえ画面でスロット別に購入＆装着。girlはズボン枠がスカート描画。`save.equipped={shirt,pants,shoes}`、`save.base`=キャラ。
- **漢字図鑑（view-dex）**：テストで70点以上合格した漢字を`save.dex[cp]=ベスト得点`に記録。図鑑にあつめた数・覚えた漢字（読み＋⭐得点）を表示、未獲得は「みかくにん？」。トップバーに📖ずかんボタン。
- **キャラが図鑑進捗を伝える**：マップ上部にキャラ＋吹き出し（`buddyLine()`「いま ずかんに ◯こ あつめたよ！あと ◯こ！」）。
- 検証：profile→map吹き出し→test合格6字→dex6/30記録→shopであかシャツ購入(120→20)→キャラ赤シャツ反映→reload永続 すべてOK・console errorなし。
- 旧データ互換：loadSaveが旧animal保存を新モデルへフォールバック移行（base=boy1等）。

■ 追加実装（2026-06-06・第3回）
- **テスト問題＝言葉（読み）：意味 形式**。GRADE2_INFOの各字に`quiz:{w:言葉, r:よみ, m:いみ}`を追加（全30字）。`makeQuestion()`がquiz優先で対象漢字を▢に置換し`{ch,main,read,mean}`を返す。`showTestQuestion()`がqmain＝「今▢（こんしゅう）」＋qhint＝意味「いまの 1週間のこと」を描画。quizが無い字はwords先頭→訓/音のフォールバック。`.qbar .qread`CSS追加（読みを小さく薄く）。同音異義語の誤答を防ぎ意味も学べる。
- **キャッシュ対策**：`<script src="grade2-strokes.js?v=2">` `grade2-data.js?v=2"` とバージョンクエリ付与（データ更新時はv番号を上げる）。

■ 追加実装（2026-06-06・第4回）＝ごほうび＝部屋づくりに刷新
- ユーザー選択で「着せ替え」→「**理想の部屋づくり（マイルーム）**」へ方針転換。キャラ（男の子/女の子）は部屋の住人として残す（charSVG・服はデフォルト固定、ITEMS/着せ替えコードは温存）。
- データ：`FURNITURE`（絵文字かぐ24種・40〜350コイン）、`FLOORS`（ゆか6色）、`WALLS`（かべ6種・グラデ/星空あり）、`ROOM_COLS=6×ROOM_ROWS=4`。
- セーブ拡張：`save.room={floor,wall,placed:{cellIdx:furnKey}}`、`save.furn[]`（所持かぐ）、`save.floors[]`/`save.walls[]`（所持テーマ）。loadSaveが旧セーブへ補完移行。
- 画面：**view-room（🏠マイルーム）**＝壁/床つき部屋＋6×4グリッド＋住人キャラ。「もようがえ」で編集モード→トレイのかぐを選び→セルをタップで配置、置いたかぐをタップで取り外し（=移動）。**view-shop（🛒かぐのおみせ）**＝かぐ/ゆか/かべを購入、ゆか/かべは所持品タップで適用。
- ナビ：トップバー＝📖ずかん/🏠へや/🛒おみせ。マップのキャラ吹き出しタップ→へや。結果画面ボタン→🏠へやへ。
- 主な関数：renderRoom/toggleRoomEdit/selectTrayItem/tapCell/ownedUnplaced、renderShop/buildThemeSection/buyFurniture/tapTheme。
- 検証：購入→配置→取り外し→上書き不可→ゆか(チェック)/かべ(夕やけ)適用→reload永続(coins600,placed6,furn8)→console errorなし、すべてOK。

■ 追加実装（2026-06-06・第5回）＝部屋を立体化＋家具の向き変更
- **立体ルーム（1点透視）**：フラットな壁/床→奥行きのある箱型へ。CSS clip-pathで `.r-ceil/.r-left/.r-right/.r-back/.r-floor/.r-skirt` の6レイヤーを構成（side wallは::afterで陰影）。壁紙=var(--wall)、床=var(--floor)。
- **奥行き配置**：家具はグリッドではなく `slotPos(i)` が row(0=奥..3=手前)から left/top/scale/z を算出し床の透視に沿って配置。奥ほど小さく(0.6)・手前ほど大きく(1.15)。各家具に接地シャドウ（.room-slot.has::after）。キャラは手前左に立つ。空きスロットは編集中のみ点線ドット表示。
- **家具の向き変更（フリップ）**：placedモデルを `{k:キー, f:0|1}` に拡張（loadSaveが旧 string/旧形式を移行）。設置済みをタップ→選択（赤枠＋`#roomActions`表示）→「🔄むきをかえる」で `scaleX(-1)` 反転、「🗑しまう」で撤去。選択中に空きスロットをタップで移動。
- 状態：`roomEdit/roomSel/roomSelCell`。関数：slotPos/flipSel/removeSel 追加、renderRoom/tapCell/toggleRoomEdit/selectTrayItem 改修。
- 検証：3000コイン・家具11個配置で透視表示OK、ギター/ソファをフリップ反映、選択枠・アクション表示・移動・撤去・トレイ更新OK、reload永続、console errorなし。

■ 追加実装（2026-06-06・第6回）＝部屋をアイソメトリック化（ユーザー参照画像の理想形に寄せる）
- ユーザーの参照画像（斜め見下ろしの部屋づくりゲーム）に合わせ、1点透視の箱型→**アイソメトリック（2:1ダイヤ）部屋**へ刷新。ユーザー選択＝「アイソメ部屋＋絵文字家具」。
- 幾何：`ISO={W:1000,H:760,tw2:65,th2:32.5,ox:500,oy:296,wallH:212}`。`isoCenter(c,r)`=タイル中心、`isoLat(c,r)`=タイル奥上格子点、`pX/pY`=viewBox→%、`clipPoly(pts)`=clip-path文字列。床ダイヤ4隅(P00/PC0/PCR/P0R)＋手前2面の壁(wallLClip/wallRClip、`up()`でwallH分持ち上げ)をclip-pathで描画。SVGオーバーレイ(viewBox 0 0 1000 760, preserveAspectRatio=none)にタイル格子線＋部屋アウトライン。
- 家具配置：`slotPos(i)`が `c=i%6, r=floor(i/6)` からタイル中心left/top＋z-index=10+(c+r)で奥→手前に重なり順を制御。家具は`.room-slot`(`translate(-50%,-100%)`で接地)＋`.rf`絵文字(`scaleX(f?-1:1)`でフリップ)。キャラは`isoCenter(4,1)`に立つ。空きセルは編集中のみ点線ドット。
- CSS刷新：`.iso-wall-l/.iso-wall-r`(var(--wall)、::afterで左薄/右濃の陰影)、`.iso-floor`(var(--floor)、::afterで上明下暗)、`.iso-grid`、芝生背景(radial-gradient緑)、`aspect-ratio:100/76`。グリッドは6×4(24セル)維持＝旧placed互換。placedモデル`{k,f}`・flip/move/remove(tapCell/flipSel/removeSel/roomSelCell)は第5回から不変。
- 検証：profile→coins5000・家具10個配置・床チェック/壁ゆうやけ適用→アイソメ部屋が参照画像どおり表示OK／編集モードで空きタイル点線・家具選択（赤枠）・アクション(🔄むき/🗑しまう)表示・フリップ(f 0→1)・reload永続(placed10/sofa f:1/floor f_check/wall w_sunset/coins5000)・console errorなし、すべてOK。

■ 追加実装（2026-06-06・第7回）＝かべにも かざれるように
- 家具を **ゆかだけでなく かべ（左右2面）にも** 配置できるよう拡張。FURNITURE に `wall:1` フラグ追加＝かべ用かざり：picture(え🖼️)/star(ほしかざり⭐)/lantern(ちょうちん🏮)/mirror(かがみ🪞)/window(まど🪟)＋新規 flower(かべかけ花🌸)/heart(ハート💗)。残りはゆか用。
- かべスロット幾何：`WALL_LEVELS=2`（上下2段）。左かべ＝奥行きr方向にROOM_ROWS(4)列、右かべ＝よこc方向にROOM_COLS(6)列 → 計20スロット。キー＝`'L{col}_{lvl}'`/`'R{col}_{lvl}'`。`isWallKey()`(正規表現判定)・`isWallItem()`(FURNITURE.wall)・`wallSlots()`(全キー列挙、奥の段から)・`wallSlotPos(key)`(高さ hs=[wallH*0.30, wallH*0.64]、`isoLat(0,j+.5)`/`isoLat(j+.5,0)`基準、z=6+lvl＝ゆか家具z≥10より後ろ)。
- セーブ：`save.room.placed` に文字列キー(L/R…)とゆかの数値キーが混在。loadSave正規化・ownedUnplaced・placedCountはキー非依存でそのまま動作。
- 配置ルール：tapCell が `isWallItem(roomSel)!==isWallKey(i)` を弾く（ゆか家具→かべ／かべかざり→ゆか は不可、トースト表示）。移動も同じ面同士のみ。点線ドットは選択中アイテムの種別に合わせ、かべ用ならかべだけ・ゆか用ならゆかだけ点灯。ヒントも「かべ/ゆかの おきたい ばしょを タップ！」と出し分け。フリップ/しまうはゆか家具と共通。
- CSS：`.room-slot.wallslot`＝`translate(-50%,-50%)`で点に中央寄せ・絵文字やや小さめ・接地シャドウ無効。
- 検証：ゆか3＋かべ5配置で表示OK／かべ家具選択時ドットは かべ15・ゆか0、ゆか家具選択時 ゆか21・かべ0／ゆか家具をかべに置く＝ブロック、かべかざりをゆかに置く＝ブロック／かべ家具の選択(赤枠)・アクション表示・フリップ(0→1)・しまう・reload永続(かべ5/ゆか4キー保持)・console errorなし、すべてOK。

■ 追加修正（2026-06-06・第8回）
- **マイルームを大きく**：芝生の余白が大きすぎたので ISO幾何を拡大 `{tw2:88,th2:44,ox:412,oy:344,wallH:280}`（旧 65/32.5/500/296/212）。床ダイヤ幅880・高さ690・壁高280でviewBox(1000×760)をほぼ埋め、左右余白約6%・上下約3%に。家具/キャラ/かべスロットはISO依存なので自動で追従。
- **テストが10問を超えるバグ修正**：`passQuestion()`が`testQueue.push(curCh)`でキューを伸ばし、`advanceTest`が`testIdx>=testQueue.length`で判定→パスのたびに11問12問と増えていた。修正：`testTotal`を導入（開始時の問題数を固定）。passは`splice(testIdx,1)→push`で現在の字を末尾へ回す（長さ10のまま増えない）。qno表示=`min(testResults.length+1, testTotal)`、qtot=testTotal。`advanceTest`の終了条件を`testResults.length>=testTotal`に変更。検証：3回パス→キュー長10維持・qno1のまま／3パス＋10解答＝13ステップで10問正解・重複なし・result画面「10/10」表示・console errorなし。

■ 追加実装（2026-06-07・第9回）＝図鑑に訓読み追加＋人物を1体化＋きせかえ復活
- **図鑑に訓読み表示**：renderDex のカードを音読み(音・青)/訓読み(訓・ティール)の2行表示に。`hasOn=it.on&&it.on!=='—'`・`hasKun=it.kun&&it.kun!=='—'` で空読みは省略。CSS追加：`.dex-card .dr`(flex縦)、`.dr .rl`(色#5a6b7b)、`.dr .rl b`(白字バッジ)、`.lo`(青#5b8def)、`.lk`(ティール#34b3a0)。
- **人物選択を廃止し全員「肌の白いキャラ」1体に**：ユーザー方針「部屋で十分・男にも女にも見えるキャラでみんなに親しまれる・男の子/女の子表記は廃止」。`CHARS={kid:{skin:'#ffd9b3',hair:'#5b3a1e'}}` の1体のみ（STARTERS削除）。charSVG は性別分岐(isGirl)を撤去し単一ボディに。defaultSave `base:'kid'`、loadSave で `s.base='kid'` に正規化。
- **プロフィール画面を撤去→きせかえ画面に**：view-profile セクション削除、KanjiVGクレジットは view-map へ移設済（第8回以前）。新 **view-closet（👕きせかえ）**＝コイン残高＋等身大キャラ(closet-hero)＋シャツ/ズボン/くつの3セクション。トップバーの 👤 ボタン→`👕 きせかえ`(btn purple sm, `go('closet')`)。`.btn.purple{background:var(--c-purple)}` ルール追加（未定義だった）。
- **きせかえ（服の色・柄を変更／購入）**：ITEMS拡張＝シャツに柄物 s_stripe(ボーダー)/s_dot(みずたま)/s_check(チェック)/s_star(ほしがら)＋s_rainbow(にじいろ)、ズボンに p_pink/p_green/p_denim、くつに sh_pink/sh_gold。charSVG が `sh.pat`(stripe/dot/check/star)を SVG `<pattern>`、`sh.color==='rainbow'` を `<linearGradient>` で塗り分け（id衝突回避に uid 毎回生成）。関数：renderCloset/buildWearSection/tapWear/itemSwatch（itemSwatch は柄をCSSグラデでスウォッチ表示）。所持=price0||unlocked、購入は confirm→coins減算・unlocked追加・装備、live preview/topbarアバター/部屋の住人すべて即反映。
- **起動フロー**：profile廃止に伴い `curView='map'` 初期化、setChrome は showBar に 'closet' 追加・backBtn は `v!=='map'` のみ非表示。window.load は単一プロフィール `profileId='me'` 固定（旧 kanji_last_profile セーブがあれば 'me' へ引き継ぎ・base を 'kid' に上書き）→ `go('map')`、プロフィール画面は出さない。
- 検証：起動→map直行(profileId='me'・base'kid'・旧コイン9040引継ぎ)、👕きせかえ＝3セクション22カード表示、にじいろシャツ/デニム/きんのくつ購入→coins9040→7980・装備即反映・rainbowグラデ描画・topbarアバター更新、reload永続(equipped/coins保持)、部屋の住人も新衣装、男の子/女の子・renderProfiles・isGirl・STARTERS の残存ゼロ、console errorなし、すべてOK。

■ 追加実装（2026-06-07・第10回）＝1学期74字に拡張＋10字グループ
- **収録漢字を1学期分の74字へ**：ユーザー指定の順番どおりに収録。`build-strokes.mjs` の KANJI を74字（読,雪,声,言,行,南,図,書,方,絵／知,春,思,記,曜,肉,話,聞,黄,色／黒,太,毛,高,風,晴,多,新,考,形／体,長,近,同,今,会,社,刀,切,内／店,姉,妹,線,汽,海,魚,広,前,元／岩,食,教,光,家,池,組,後,数,丸／点,買,引,羽,雲,夏,公,園,通,万／頭,来,鳥,歌）に差し替え、`node build-strokes.mjs` で grade2-strokes.js を再生成（74/74字・KanjiVG CDNからfetch）。`SAMPLE=Object.keys(GRADE2_STROKES)` がこの順を保持＝練習・テストとも順番どおり。
- **GRADE2_INFO を74字ぶん執筆**：grade2-data.js を全面差し替え。各字に on/kun/words/quiz(w,r,m) を2年生向けに作成。quiz.w は必ず対象漢字を含む（▢化が成立、フォールバック0件を確認）。※あくまで「たたき台」＝先生添削まち。
- **テスト/練習を「10字区切りグループ」に**：`GROUP_SIZE=10`、`groupCount()`(=8)、`groupRange(gi)`。モードシートの れんしゅう/テスト→`openGroupPicker(mode)`（1〜10／11〜20…71〜74 の8カード、各グループの習得数 mastered/字数 を表示、◀もどるでモードシートへ）→`pickGroup(mode,gi)`。
  - テスト：`startTest(gi)` が `groupRange(gi)` を**順番どおり**に出題（旧ランダム10字を廃止）。最終グループは4問（testTotal=実際の字数）。パス回転バグ修正（第8回）はそのまま有効。
  - 練習：`startPractice(gi)` が `practiceStart/practiceEnd` をそのグループに設定、`prevCh/nextCh` はグループ内だけを循環（部分グループ＝4字でも正しく循環）。位置表示は testCount ピル（だい n/m）を流用。
- **キャッシュ**：データ更新に伴い `grade2-strokes.js?v=3` `grade2-data.js?v=3` にバージョン繰り上げ（※今後データを更新したら必ず v 番号を上げること。`?cb=` は index.html しかバストしない）。
- CSS：`.grp-grid`/`.grp-card`(.go=練習色,.done=習得済み)/`.grp-n`/`.grp-k`/`.grp-p` 追加。
- 検証：reload後 SAMPLE=74・groups=8・grp0=読雪声言行南図書方絵・grp7=頭来鳥歌、INFO全74字quiz語OK、グループ選択カード8枚（ラベル/漢字/進捗）表示、テストgrp7=4問順番どおり(頭来鳥歌・qtot4)、練習grp2=黒〜形をグループ内循環(形→黒)・位置/10表示、部分グループ(grp7)も前後循環OK、練習画面で読(音ドク・トク/訓よ（む）/14画)表示、console errorなし、すべてOK。

■ 追加実装（2026-06-10・第11回）＝マイルームを本物の3Dへ刷新（Three.js）
- ユーザー要望「2Dで面白みに欠ける→ちゃんと3Dの部屋にして」。アイソメ（CSS clip-path＋絵文字）を廃止し、**Three.js r128（`kanji-bouken/three.min.js` 同梱・603KB・オフライン維持）** によるWebGL 3Dルームへ全面刷新。`<script src="three.min.js">` を strokes より前に読込。
- **座標系**：x=よこ(0..6)/z=おく(0..4)/y=高さ、タイル1辺=1。左かべ=x:0面・右かべ=z:0面（`WALL_H=2.6`、かざり高さ `WALL_HS=[0.83,1.61]`）。**セーブキーは2D版と完全互換**（ゆか=0..23、かべ='L{j}_{lvl}'/'R{j}_{lvl}'、placed={k,f}）。
- **かぐ30種をローポリ3Dモデル化**：`FURN3`辞書＝各かぐを Box/Cylinder/Sphere/Cone/Torus/Extrude の組み立て関数で定義（ヘルパー mt/pm/bx/cy/sp3/cn/rod/ringMesh/starShape/heartShape）。モニタ・TV画面・ランプ・ちょうちん等は emissive。**メリーゴーランド回転（userData.spin）・かんらんしゃ回転（spinZ）・ふうせんゆらゆら（bob）** のアニメ付き。星・ハートは Shape→ExtrudeGeometry。
- **テーマ＝canvasテクスチャ**：`floorTex()`（板の間=羽目板、たたみ=織目+縁、チェック、単色。全テーマにタイル目地）、`wallTex()`（ゆうやけ=グラデ、ほしぞら=LCG固定乱数の星+黄星）、`stripeTex()`（メリーゴーランド屋根）、`picArtTex()`（「え」の中身）。`R3.tex` にテーマ別キャッシュ。
- **キャラ**：charSVG(256px)→data URL→`THREE.Sprite`（ビルボード・着せ替え反映・`R3.charTexCache`）＋足元まるかげ＋上下ゆれ。位置はタイル(4,1)。
- **シーン**：ゆか=BoxGeometry(上面のみテーマ柄)、かべ2面+角柱+はばき+天端トリム、しばふの台（ジオラマ風）、HemisphereLight+DirectionalLight（PCFSoftShadow 1024）、`alpha:true`でCSS空グラデ背景、`preserveDrawingBuffer:true`（スクショ可）。
- **操作**：1本指ドラッグ=カメラ回転（az 0.12..1.45 / el 0.25..1.0）、ピンチ＆ホイール=ズーム（dist 6..13）、移動8px未満のpointerup=タップ→`tap3D()`がレイキャストで ゆかタイル/かべスロット/かぐ を判定し**既存 `tapCell()` をそのまま呼ぶ**（配置ルール・トースト・移動・しまうは2D版ロジック不変）。`.room{touch-action:none}`でiPadスクロール抑止。
- **編集モード**：空きスロットに白リング、トレイ選択中は置ける面だけ緑リング（パルス）、選択かぐは赤リング＋バウンス。**向き変更は左右反転→90°×4方向回転に拡張**（`flipSel`が `f=(f+1)%4`、loadSaveが旧f(0/1)をそのまま受容）。かべかざりは回転ボタン非表示（`#flipBtn` id追加）。
- **再構築**：`renderRoom()`→`init3D()`(1回)+`rebuild3D()`(全消し再構築・geometry/material dispose)+`startRoomLoop()`（curView==='room'中のみrAF）。`rebuild3D`末尾の `R3.scene.updateMatrixWorld(true)` は**描画前タップのレイキャスト外れ防止**（消さないこと）。リサイズはResizeObserver。
- CSS：旧 .iso-*/.room-slot/.room-char 系を削除、`.room`=aspect-ratio 100/82+canvas+`.room3d-hint`（「ゆびで くるっと まわせるよ！」、編集中は非表示）。おみせ/トレイのアイコンは絵文字のまま（3D化は部屋内のみ）。
- 検証：30種配置スクショOK・テーマ(クリーム/ほしぞら/ゆうやけ×板/チェック/たたみ)OK・タップ配置/選択/90°回転/しまうOK・ゆか家具→かべブロックOK・かべ選択時flipボタン非表示OK・かぐ越しタップは手前かぐ優先（正しい遮蔽）・reload永続・console errorなし。

■ 追加実装（2026-06-11・第12回）＝かぐ22種追加＋🎨いろをかえる
- **かぐを30種→52種へ**。家電：れいぞうこ🧊/キッチン🍳/せんたくき🧺/せんぷうき🍃(羽根回転)/おそうじロボ🤖(タイル内をくるくる移動)。かぐ・あそび：テーブル🍽️/ラグ🧶/おもちゃばこ🎁/くるま🚗/ドラム🥁/すべりだい🛝/テント⛺/じはんき🥤/ゆきだるま⛄。かべかざり：エアコン❄️/かけどけい🕐(秒針が回る)/かべだな🗄️/ガーランド🎀/つき🌙/にじ🌈/ちょうちょ🦋(羽ばたき)。ごほうび級にロケット🚀(4000・ホバー＋炎ゆらぎ)追加。すべて `FURN3` にローポリ3Dモデルあり（FURNITURE 52種=FURN3 52種、検証スクリプトで一致確認）。
- **アニメの新方式**：ビルダーが `g.userData.anim=t=>{...}` を設定→rebuild3Dが `R3.anims` に登録（既存の spin/spinZ/bob 方式も温存）。
- **🎨いろをかえる**：`FURNITURE[k].colors=[...]` を持つかぐ（ベッド/ソファ/いす/ぬいぐるみ/ランプ/テーブル/ラグ/くるま/テント＝9種・各4〜6色）は、編集モードで選択→`#colorBtn`「🎨 いろをかえる」で色を順ぐり変更。`placed={k,f,c}` に拡張（loadSaveが c を colors範囲にクランプ・旧セーブは c:0）。`buildFurn(k,ci)`→ビルダー第2引数 col、`tint(c,f)`（THREE.Color lerp）で明暗の派生色を生成。かべかざり・colorsなしのかぐではボタン非表示。
- **おみせ**：colorsを持つかぐのカードに色パレットのドット行（`.sc-dots`）を表示（購入は1回・色は部屋で自由に変更、の方式）。
- 検証：新27配置で全種表示OK・アニメ7本(扇風機/ロボ/ロケット/かけ時計×2/ちょうちょ/キャラ)動作・ソファc1=青/テントc1=青/ぬいぐるみc2=ピンク反映・colorSel 6色一周でラップ・localStorage永続・れいぞうこ/かべかざりでボタン非表示・おみせ64カード(52+6+6)＋ドット9種・console errorなし。

■ 追加実装（2026-06-11・第13回）＝おみせ分類＋かべかざり5種追加
- **おみせのかぐを3セクションに分類**：renderShop を `buildFurnSection(title,ids)` 化し、「🪑 ゆかに おく かぐ」(33)／「🖼️ かべに かざるもの」(wall:1=19)／「🌟 ごほうび級（おおきな もくひょう！）」(新設 `prize:1` フラグ=castle/rocket/carousel/ferris/dragon) に分けて表示。買うときに ゆか用/かべ用 がひと目で分かる。
- **かべかざり5種追加（計57種）**：メダル🏅(金メダル+リボン)／ポスター🦖(`dinoTex()`=canvas描画のきょうりゅう絵)／かべランプ🕯️(ブラケット+電球グロー)／こいのぼり🎏(青・赤2匹が userData.anim でゆらゆら)／ふうりん🎐(ガラス鉢+短冊が揺れる)。
- 検証：FURNITURE57=FURN3 57モデル一致・かべ19種、部屋に新5種配置で表示&アニメOK、おみせ3+2セクション(33/19/5/6/6)表示、console errorなし。

■ 追加実装（2026-06-11・第14回）＝テストを「かんじバトル」に（敵を倒すアクション演出）
- コンセプト：テスト＝モンスター討伐クエスト。1問=1体、正しく書く=こうげき。**採点・コイン・図鑑・にがて記録のロジックは一切不変**（演出レイヤーのみ追加）。
- **バトルUI**（view-write内・テスト時のみ表示／れんしゅうでは非表示）：`#battleBar`＝じぶんのキャラ(charSVG) VS 敵スプライト＋なまえ＋HPバー（ぷかぷか浮遊）。`#btProgress`＝進行ドット（⭐=たおした/💨=にげられた/👾=いま/👑=ボス/灰=これから）。
- **敵**：`MONSTERS` 9種（スライムん/ぷんぷん/ばけちゃん/とげまる/こうもりん/きのこん/もくもく/びりびり/ろぼぞう）＋`BOSS`かんじキング。`monsterSVG(m,px)`がSVG生成（共通の顔＋タイプ別ボディ）。出現順=`(testGroup*3+i)%9` でグループごとにローテ、**最終問題=必ずボス**（大型・赤HPバー・「👑ボスが あらわれた！！」バナー＋sfxBoss低音）。
- **こうげき（正解≥70）**：`playAttack(score,cb)`＝書いた字(captureThumb)が`.kanji-shot`でキャンバスから敵へ飛翔(0.4s)→命中で敵シェイク＋💥＋ダメージ数字(=点数、100点は「💯クリティカル!」金色)＋HP0→敵が回転消滅(.die)→cb()=recordTest。連続正解で`combo`カウント「🔥nれんぞく！」バッジ。ボス撃破でconfetti(40)。連打防止=attackBusy＋testBtns pointer-events無効。
- **敵の反撃（不正解/画数ゲート）**：`enemyAttackFx()`＝敵が突進(.atk)＋0.26s後に画面シェイク(.shake)。ペナルティなし（既存の「もういちど書いてみる？」リトライ継続）。コンボリセット。パス=「💨にげられた…！」トースト。
- **結果画面**：`#resultBattle`＝たおしたモンスターの行進（にげられた敵はグレー+💨）＋「👾n体たおした！👑ボスげきは！」。既存の点数/コイン/まちがい一覧はそのまま。
- 音：sfxHit(攻撃)/sfxPoof(消滅)/sfxBoss(登場)を tone() で追加。
- 開始演出：startTestで「⚔️ かんじバトル！」バナー（.bt-banner、stamp同様のfixedポップ）。
- 検証：開始バナー/敵=スライムん/HP100%/ドット10個、攻撃100点→die→次の敵、85点→「🔥2れんぞく！」、40点→反撃atk+シェイク+コンボ0+リトライUI、画数ゲート→反撃のみ、パス→💨記録、ボス=かんじキング(boss class/赤HP/バナー)、撃破→結果画面に9体行進+ボスげきは表示、れんしゅうモードはバトルUI非表示で従来どおり、console errorなし。

■ 追加実装（2026-06-11・第15回）＝キャラをアニメ調に全面刷新＋かみがたスロット
- ユーザー要望「着せ替えのクオリティが低い→アニメキャラのような顔や服装に」。`charSVG()` を完全リライト（viewBox 0 0 100 122・API/呼び出し箇所は不変→トップバー/きせかえ/部屋3Dスプライト/バトルバーすべて自動反映）。
- **アニメ調ちびキャラ（約2.5頭身）**：大きな瞳（虹彩=縦グラデ`url(#uid i)`＋瞳孔＋ハイライト大小）・太いまつげライン・眉（髪色連動）・チーク・ひかえめな鼻・開いた口（舌つき）・セル画風アウトライン（LN='#54402f'）。左右対称パーツは `mir()`（translate(100,0) scale(-1,1)）で片側定義をミラー。
- **かみがた スロット新設**：`ITEMS.hair` 8種＝short（ショートヘア★無料/くろショート）・bob（さらさらボブ/きんいろボブ）・twin（ツインテール/ピンクツイン・赤ゴム飾り）・pony（ポニーテール/きんのポニー・サイドテール）。スタイル別パーツ（backHair/deep/acc）＋共通の前髪（ジグザグ束＋天使の輪シャイン＋アホ毛）。SLOT_LABEL/defaultSave/loadSave正規化（旧セーブ→h_short_br補完）/renderClosetセクション（💇かみがた先頭）対応。
- **服の造形強化**：シャツ=襟（白）＋袖＋裾シャドウ＋ボタン（無地のみ）、柄/にじいろは従来のpattern/gradient defsをそのまま適用。ズボン=股の曲線＋裾カフ（明色）＋ポケットステッチ。くつ=スニーカー（アッパー＋白ソール＋つま先＋ひも）。腕＝筒＋手の丸。`shadeHex(hex,f)` ヘルパー追加（明暗派生色）。
- 検証：きせかえ画面で新キャラ表示＋かみがた8カード、4スタイル×柄シャツ/にじいろの組合せ描画OK、部屋3Dスプライト/バトルバー/トップバーに反映、旧セーブhair補完、console errorなし。

■ 追加実装（2026-06-11・第16回）＝男の子むけ かみがた6種＋シャツ以外のトップス7種
- **かみがた（男の子むけ）**：`ITEMS.hair` に6種追加＝ツンツンヘア/くろツンツン（style:'spiky'＝外ハネトゲ＋内ジグザグ）、マッシュ/アッシュマッシュ（'mash'＝まゆ上までの丸シルエット＋シャイン）、ヒーローヘア（'hero'＝上にさかだつ大トゲ・金）、アフロ（'afro'＝大円ドーム＋前髪アーチ）。計14種に。charSVGは標準の前髪＋サイド毛を `front` 変数化し、スタイル別に差し替える方式へリファクタ。
- **トップス（kind分岐）**：`ITEMS.shirt` に7種追加＝ネクタイシャツ（kind:'tie'＝白シャツ＋赤ネクタイ結び目つき）、パーカー あお/ピンク（'hoodie'＝フード襟（濃色）＋白ひも＋カンガルーポケット）、セーラーふく（'sailor'＝紺スクエア襟＋白ライン＋赤スカーフ・裾も紺）、ワンピース ピンク/ミント（'dress'＝Aラインスカートがズボンの上まで広がる＋白フリル線＋むねリボン。レギンス風にズボン裾が見える）、ヒーロースーツ（'hero'＝赤スーツ＋黄マント（extraBack＝体の後ろに描画）＋むねの星＋ベルト＆バックル）。計18種に。
- charSVG構造：`kind=sh.kind||'t'` で torso 組み立てを分岐（torsoBase/hemSh/collarV/buttons を部品化）。`extraBack`（マント等）は うで より前・くび より後ろに挿入。柄（pat/rainbow）は従来どおり t シャツ系に適用。
- 検証：新ヘア6×新トップスの組合せ10体を一括描画→全部OK（フード/ポケット/ひも・ネクタイ・セーラー襟+スカーフ・ワンピースの広がり+リボン・マントの黄が腰横に見える・ヒーローヘア逆立ち）、きせかえ=かみがた14/トップス18カード、旧セーブ装備保持、console errorなし。

■ 追加実装（2026-06-11・第17回）＝ぼうし＆めがねスロット新設（カチューシャ・ねこみみ含む）
- **2スロット制**（同時装着OK＝キャップ＋サングラス等）：`ITEMS.hat` 10種＝なし★/キャップあか・あお（ドーム＋前ツバ＋天ボタン）/ニットぼうし（リブ線＋ポンポン）/むぎわらぼうし（広ツバ＋赤バンド）/リボンカチューシャ/はなカチューシャ（花弁5枚ループ生成）/ねこみみ（外耳＋内耳ピンク＋バンド）/まほうのぼうし（紫コーン＋先端ボール＋星デカール＋ツバ）/おうかん（ジグザグ金冠＋宝石3つ）。`ITEMS.glasses` 6種＝なし★/まるめがね/あかぶちめがね（style:'round'）/サングラス（暗レンズ＋白グリント）/ほしサングラス（星形レンズ・パス生成）/ハートめがね。
- **「なし」アイテム方式**：hat_none/gl_none（price:0・starter）で未装着を表現。starterItems()が自動アンロック、loadSaveが旧セーブへ補完（テスト済）。
- charSVG：`glass`＝顔パーツの後・前髪(front)の前に挿入（前髪がフレーム上端に自然に重なる）。`hat`＝最後（かみ・前髪の上にかぶせる）。SLOT_LABEL/defaultSave/renderCloset（6セクション：💇🧢👓👕👖👟、シャツ→「トップス」表記に）対応。
- 検証：10コーデ一括描画（キャップ/ニット帽+丸めがね/むぎわら+ワンピ/リボンカチューシャ+ハートめがね+セーラー/はなカチューシャ/ねこみみ/王冠+星サングラス+ヒーロー/まほうのぼうし/アフロ+サングラス）すべてOK、きせかえ6セクション・hat10/glasses6カード、旧セーブ補完、console errorなし。

■ 追加実装（2026-06-13・第18回）＝1年生のしま新設（ひらがな46→カタカナ46→漢字80）
- ユーザー要望「1年ボタンで、ひらがな『あ』〜『ん』→カタカナ『ア』〜『ン』→漢字（木〜力80字）の順で 問題（れんしゅう）とテストを 2年と同様に」。
- **データ生成**：`build-grade1.mjs`（build-strokes.mjsの1年版）で KanjiVG から ひらがな46・カタカナ46・漢字80 を取得し `grade1-strokes.js`（`GRADE1_STROKES`・172字・順番＝かな→かんじ固定）を生成。`node kanji-bouken/build-grade1.mjs` で再生成（KanjiVGはかなSVGも同形式で配信＝03042.svg等）。字を変えるときは build-grade1.mjs の HIRA/KATA/KANJI を編集→再生成。
- **`grade1-data.js`（`GRADE1_INFO`・172字・たたき台）**：かな＝`{kana:'ひらがな'|'カタカナ', words:そのおとで始まる ことば例}`（テストは「その字をかく」形式＝quiz不要）。漢字＝2年と同じ `{on,kun,words,quiz{w,r,m}}`（quiz.wは必ず対象字を含む＝▢化成立を検証済）。
- **学年スイッチ機構**（index.html）：従来 `const SAMPLE=Object.keys(GRADE2_STROKES)` 固定だったのを、`GRADE_DATA={1:{strokes,info,label},2:{...}}` ＋ `let currentGrade/STROKES/SAMPLE/INFO/GROUPS` ＋ `setGrade(n)`（SAMPLE/INFO/GROUPS再構築）に刷新。初期値=2（2年は完全に従来どおり＝非回帰）。`loadCh` は `STROKES[ch]` 参照（フォールバックでG1/G2も見る）。
- **グループ＝セクション境界をまたがない**：`buildGroups()` が1年は ひらがな(46)/カタカナ(46)/かんじ(80) を各々10字ずつに区切る（18グループ＝ひら5・カタ5・かんじ8、各セクション末尾は端数）。2年は従来どおり10字チャンク8グループ。各グループは `{start,chars,tag,seq,segTot}`。グループえらびの見出しは1年「ひらがな 1/5」等・2年「1〜10」。`startPractice` は `GROUPS[gi].start/chars.length` を使用。
- **マップ**：`GRADE_DATA` がある学年（1・2）を active 表示。バッジ進捗は学年ごと（`gradeMastered(n)`）。1年=「0/172字」・2年=「0/74字」。`openModeSheet(grade)` が `setGrade` を呼ぶ（グループえらびの◀もどるは引数なし＝現状維持）。
- **かな対応**：①info panel に id `lblOn`/`rowKun` を付与し、`fillInfo` がかな時は「音」→「しゅるい」（ひらがな/カタカナ）に差し替え＋訓行を隠す。②`makeQuestion` がかな時 `{main:その字, mean:'ひらがなの「あ」を かいてね', kana:true}` を返す（▢化しない＝その字を見て書く writing test。お手本は2年同様テスト時 非表示）。③`renderDex` はかなの読み行に「ひらがな/カタカナ」を表示・ピル名詞を1年「もじ」/2年「かんじ」に出し分け。
- **セーブ互換**：mastery/dex/weak はコードポイントキー＝学年間で衝突なし。テストのクリア状況だけグループ番号キーが衝突するため `clearedKey(gi)`＝2年は従来の数値・他学年は `'g'+grade+'_'+gi`（旧2年セーブの💮/◎をそのまま維持）。finishTest/openGroupPicker 両方で使用。
- **キャッシュ**：`<script src="grade1-strokes.js?v=1"> grade1-data.js?v=1">` を grade2 より前に追加。今後1年データ更新時は v 番号繰り上げ。
- 検証：マップ＝1年/2年とも active（0/172・0/74）、グループえらび18枚（ひらがな1/5「あいうえおかきくけこ」…カタカナ1/5「アイウエオ…」かんじ1/8「木大小…」）、練習＝あ（しゅるい:ひらがな・ことば:あり/あめ/あさ・3画・訓行非表示）／木（音モク・ボク 訓き・こ）、テスト＝あ（プロンプト「あ」＋「ひらがなの『あ』を かいてね」＋バトルUI）／先（▢（さき）＋意味）、パス→次字、clearedKey g1_0=2で数値0は不変、2年へ戻して74字/8グループ/読「▢書（どくしょ）」非回帰、strokes/medians健在（あ3画/ン2画/力2画）、construct/トップレベル実行 例外なし、console errorなし。※canvasお手本はpreview_screenshotに写らない（既知のツール仕様）が strokeデータ確認済み。

■ 追加実装（2026-06-13・第19回）＝3年生のしま新設（漢字200字 習〜湯）
- ユーザー要望「3年も同様に。漢字を 習〜湯 の順で」。**学年スイッチ機構（第18回）に3年を追加するだけ**で実現＝拡張性の実証。
- **データ生成**：`build-grade3.mjs`（build-grade1.mjsの3年版・漢字のみ／重複・字数ガード付き）で `grade3-strokes.js`（`GRADE3_STROKES`・200字）を生成。`node kanji-bouken/build-grade3.mjs` で再生成。
- **重複の指摘と修正**：ユーザー提供リストは「員」が2回（99・178番目）で「院」が欠落＝ユニーク199字だった。AskUserQuestionで確認し、**178番目を「院」に修正**して200字ユニークに（小3標準どおり）。build-grade3.mjs / grade3-data.js とも修正済リストで作成。
- **`grade3-data.js`（`GRADE3_INFO`・200字・たたき台）**：2年と同じ `{on,kun,words,quiz{w,r,m}}`。quiz.wは必ず対象字を含む（検証済）。畑/皿/箱/勉等の音/訓欠けは `'—'` で対応（on/kun両方—の字はゼロ）。
- **index.html 変更は最小**：①`grade3-strokes.js?v=1` `grade3-data.js?v=1` を読込追加。②`GRADE_DATA` に `3:{strokes,info,label:'3年生'}` を1行追加。③ロック島タップのトーストを `Object.keys(GRADE_DATA).join('・')+'年'` で動的化（学年追加時に文言修正不要）。これだけで マップ3年island active化・モードシート・グループえらび(20グループ＝10字×20)・練習・テスト・clearedKey('g3_'+gi)・図鑑 がすべて自動で動く（buildGroupsの非1年branch＝10字チャンクを流用）。
- 検証：マップ＝1年(0/172)・2年(0/74)・3年(0/200)とも active／4〜6年 locked、3年モードシート「3年生の しま」、グループえらび20枚（1〜10「習詩動商物族開登事面」…191〜200「注反波打勉放速箱神湯」）、練習＝習（音シュウ 訓なら（う）・11画）、テスト最終group＝注「▢意（ちゅうい）」、院（178番目）＝「病▢（びょういん）」で正しく出題、1年/2年 非回帰（172/18・74/8・clearedKey g1_0/0）、console errorなし。

■ 追加実装（2026-06-14・第20回）＝4年生のしま新設（漢字202字 信〜唱）
- ユーザー要望「4年も同様に。信〜唱の202字」。第18〜19回の学年スイッチ機構に4年を足すだけ。
- **データ生成**：`build-grade4.mjs`（build-grade3.mjsの4年版・重複/字数ガード付）で `grade4-strokes.js`（`GRADE4_STROKES`・202字）を生成。リストは202字ユニーク・重複なしを確認済（小4標準どおり）。
- **`grade4-data.js`（`GRADE4_INFO`・202字・たたき台）**：2/3年と同じ `{on,kun,words,quiz{w,r,m}}`。**都道府県名の漢字**（栃/埼/潟/梨/岡/茨/奈/富/岐/阜/郡/滋/阪/徳/香/佐/賀/崎/熊/沖/縄/媛/鹿 等）は地名で出題（例：栃→「▢木（とちぎ）」、阜→「岐▢（ぎふ）」）。栃/埼/潟/梨/岡/茨/崎/熊/縄/媛/鹿 等は on='—' で kun のみ（fillInfo/renderDex は '—' 表示で問題なし）。quiz.w は全字 対象字を含む（検証済）。
- **index.html 変更は2点のみ**：①`grade4-strokes.js?v=1` `grade4-data.js?v=1` 読込追加。②`GRADE_DATA` に `4:{...label:'4年生'}` を1行追加。これだけで マップ4年active・グループ(21＝10字×20+2)・練習・テスト・clearedKey('g4_'+gi)・図鑑 が自動で動く。
- 検証：マップ＝1〜4年 active（172/74/200/202）・5〜6年 locked、4年モードシート「4年生の しま」、グループ21枚（1〜10「信達飛席建菜例料良照」…201〜202「冷唱」2字）、練習＝信（音シン 訓—・9画）/栃（音— 訓とち・地名ことば）、テスト最終group＝冷「▢たい（つめたい）」(2問)、栃「▢木（とちぎ）」阜「岐▢（ぎふ）」正しく出題、1〜3年 非回帰（ck g1_0/0/g3_0）、console errorなし。

■ 追加実装（2026-06-14・第21回）＝5年生のしま新設（漢字193字 像〜堂）
- ユーザー要望「5年も同様に。像〜堂」。学年スイッチ機構に5年を足すだけ。
- **データ生成**：`build-grade5.mjs`（重複/字数ガード付）で `grade5-strokes.js`（`GRADE5_STROKES`・193字）を生成。
- **不足の指摘と修正**：ユーザー提供リストは192字で、小5標準193字より1字少なく「永」が欠落していた（「久」はあり）。AskUserQuestionで確認し、ユーザー指示どおり**「永」を「久」の前に挿入**して193字に（順＝…居・永・久・毒…）。build-grade5.mjs / grade5-data.js とも修正済リスト。
- **`grade5-data.js`（`GRADE5_INFO`・193字・たたき台）**：2〜4年と同じ `{on,kun,words,quiz{w,r,m}}`。quiz.w は全字 対象字を含む（検証済）。on/kun両方—の字はゼロ。
- **index.html 変更は2点**：①`grade5-strokes.js?v=1` `grade5-data.js?v=1` 読込追加。②`GRADE_DATA` に `5:{...label:'5年生'}` を1行追加。
- 検証：マップ＝1〜5年 active（172/74/200/202/193）・6年のみ locked、5年モードシート「5年生の しま」、グループ20枚（1〜10「像経情象絶厚賞状喜解」…191〜193「領導堂」3字）、練習＝像（音ゾウ 訓—・14画）、テスト最終group＝領「▢土（りょうど）」(3問)、永「▢遠（えいえん）」正しく出題、1〜4年 非回帰、console errorなし。

■ 追加実装（2026-06-14・第22回）＝6年生のしま新設（漢字191字 視〜済）＝全学年そろう
- ユーザー要望「6年も同様に。視〜済の191字」。学年スイッチ機構に6年を足すだけ。これで1〜6年すべて active＝全学年そろった。
- **データ生成**：`build-grade6.mjs`（build-grade5.mjsの6年版・重複/字数ガード付）で `grade6-strokes.js`（`GRADE6_STROKES`・191字）を生成。リストは191字ユニーク・重複なしを確認済（小6標準どおり＝過不足なし。第19/21回のような欠落/重複は無し）。
- **`grade6-data.js`（`GRADE6_INFO`・191字・たたき台）**：2〜5年と同じ `{on,kun,words,quiz{w,r,m}}`。quiz.w は全字 対象字を含む（検証済）。届/株 は on='—' で kun のみ（fillInfo/renderDex は '—' 表示で問題なし）。胃/肺/舌/穴 等の単字も words に収録。
- **index.html 変更は2点のみ**：①`grade6-strokes.js?v=1` `grade6-data.js?v=1` 読込追加。②`GRADE_DATA` に `6:{...label:'6年生'}` を1行追加。マップの6年island（`GRADES`に n:6/191字）は既に定義済だったので、GRADE_DATA[6]の追加だけで active化・グループ(20＝10字×19+1)・練習・テスト・clearedKey('g6_'+gi)・図鑑 が自動で動く。
- 検証（preview_eval）：マップ＝1〜6年 全active・locked無し、setGrade(6)で SAMPLE191・GROUPS20（grp0「視砂腹段並降認洗異純」…grp19「済」1字）、makeQuestion('視')=「▢力（しりょく）」/makeQuestion('届')=「▢く（とどく）」(on—も正常)、clearedKey g6_0='g6_0'・g2_0=0（名前空間分離）、2年74/5年193(像経情) 非回帰、console errorなし。

■ 追加実装（2026-06-14・第23回）＝2年生を全160字に拡張（1学期74字→全字）
- ユーザー要望「2年も同じように全て作成して」＋全160字の順番リスト提供。これまで2年は1学期74字のみだったのを、**小2配当の全160字**へ拡張＝全学年そろった上で2年も完成。
- **リスト検証**：ユーザー提供160字を公式小2配当（常用漢字 学年別配当の小2＝160字）と照合→重複なし・過不足なし・完全一致を確認（3年=員重複/5年=永欠落 のような修正は不要だった）。
- **データ生成**：`build-strokes.mjs`（2年の既存ジェネレータ）の KANJI を全160字（新しい順番）に差し替え＋**重複/字数ガードを追加**（他のbuild-gradeN.mjsと同じ体裁に）→ `node kanji-bouken/build-strokes.mjs` で grade2-strokes.js を再生成（160/160字）。`SAMPLE=Object.keys(GRADE2_STROKES)` がこの順を保持。
- **`grade2-data.js`（`GRADE2_INFO`・160字・たたき台）を全面差し替え**：既存74字ぶんの読み/熟語/quizは温存し、新規86字を執筆。quiz.w は全字 対象字を含む（▢化成立を検証済）。同音・同語の重複を避けるため 分=自分/半=半分/自=自由、間=時間/時=時計 のように出し分け。
- **index.html 変更は1点のみ**：`grade2-strokes.js?v=3 → ?v=4` / `grade2-data.js?v=3 → ?v=4` にバージョン繰り上げ（必須キャッシュルール）。マップの2年island words表示は元々「160字」だったので変更不要、GRADE_DATA[2]もそのまま（中身が160字に増えただけ）。グループは自動で 16（10字×16）に。
- **セーブ注意**：2年の clearedKey は従来どおり数値（旧2年セーブ互換）。74字8グループ→160字16グループへ増えるため、旧セーブの「クリア済」スタンプはグループ番号の指す字がずれる（mastery/dexはコードポイントキーなので不変）。検証アプリ＝たたき台段階のため許容。
- 検証（preview_eval）：GRADE2 160字・GROUPS16（grp0「読雪言行南書絵図分方」…grp15「弓矢谷北牛引売弱計直」）、makeQuestion 読=「▢書（どくしょ）」/分=「自▢（じぶん）」/直=「▢す（なおす）」、clearedKey(0)=0（数値・互換）、1年172/5年193/6年191 非回帰、console errorなし。

■ 追加実装（2026-06-14・第24回）＝ずかんに学年タブ＋グループの端数を最後に合体
- **ずかん（図鑑）に 1年〜6年タブを新設**：これまで renderDex は currentGrade（マップ/練習/テストと共有）の字しか出せなかったのを、`dexGrade`（ずかん専用・currentGradeと独立）を導入。view-dex に `#dexTabs`（`.dex-tabs`/`.dex-tab`/`.dex-tab.on`＝青）を追加し、renderDex が `GRADE_DATA[dexGrade]` の strokes/info/sample で描画＋タブを動的生成。`setDexGrade(n)` で切替。`go('dex')` 時に `dexGrade=currentGrade` で初期化（ずかんを開くと今の学年から始まり、タブで自由に行き来できる。マップの現在学年は変わらない）。かな学年は「あつめた もじ」表示・currentGrade非依存。
- **グループの端数を最後のグループに合体**：buildGroups の push に merge フラグを追加。非1年（2〜6年）は端数（GROUP_SIZE未満の最後のチャンク）を直前グループに合体させ、1〜3字だけの ちいさすぎるグループを作らない。1年（かな）は merge=false で従来どおり（ひらがな/カタカナ各5グループ＝末尾6字グループは維持）。
  - 結果：4年=20グループ・最後が **191〜202の12問**（…牧冷唱）、5年=19グループ・最後が **181〜193の13問**（…燃率領導堂）、6年=19グループ・最後が **181〜191の11問**（…灰奮済）。2年(160=16G)・3年(200=20G)は端数ゼロで変化なし。グループ見出し（`g.start+1〜g.start+ks.length`）・テスト問題数（testTotal=groupRange長）・練習の循環は合体後の字数に自動追従。
- 検証（preview_eval）：g4=20G/last12「害刷治努倉札功器英牧冷唱」191〜202、g5=19G/last13 181〜193、g6=19G/last11 181〜191、g2=16G/g3=20G 不変、g1=18G かなタグ不変。ずかん＝6タブ(1〜6年)、open時 currentGrade(3)で初期化・3年タブon・0/200・200カード、6年タブ→191カード、1年タブ→「もじ」0/172・172カード、ずかん操作中 currentGrade=3のまま不変。console errorなし。スクショでタブUI確認済。

■ 追加実装（2026-06-14・第25回）＝書くマスに十字の補助線（点線・グレー）をはっきり表示
- ユーザー要望「真っ白に書くのは難しい。十字の補助線（点線・黒でなくグレー）で マスの真ん中を意識して バランスよく書けるように。全てに」。
- 実は `drawBg()`（bgキャンバス）に十字ガイドは既にあったが `rgba(180,180,180,.5)`・lineWidth1 で うすすぎて ほぼ見えなかった。これを **はっきりした グレーの点線**に改善：色 `#9aa6b2`、lineWidth=`max(s*.007,2)`、`setLineDash([1, max(s*.03,9)])`＋`lineCap='round'`＝まるい点が ならぶ 点線。たて線（s/2）・よこ線（s/2）。さらに **まんなかの交点に 強調ドット**（`#8a97a6`・半径 max(s*.012,3.5)）を追加。
- `drawBg` は `setupCanvas`（全学年・れんしゅう/テスト共通）から必ず呼ばれる＝**1か所の修正で全部に十字が出る**。bgは採点用 'dr' とは別キャンバスなので 採点・字形認識には一切 影響なし。テスト時も お手本（'gu'）は隠れるが 十字（'bg'）は出る。
- **重要な落とし穴＝上のキャンバスが十字を隠していた**：書くエリアは bg(cbg z1)/お手本(cgu z2)/書き取り(cdr z3) の3キャンバス重ね。CSS `.cw canvas{…background:var(--paper)}` で**全キャンバスに不透明クリーム背景**が付いており、上の cgu/cdr が bg の十字を完全に隠していた（getImageDataはbg単体を読むので十字を検出できてしまい、見落としやすい。実機では真っ白に見える）。修正：背景を `.cbg` だけに移し（`.cw canvas{…}`＋`.cbg{z-index:1;background:var(--paper)}`）、cgu/cdr を透明に。これで bg の十字が画面に透けて見える。
- 併せて十字を「もっと見やすく」：色 `#8a98a8`・lineWidth=`max(s*.01,3)`・dash `[1,max(s*.026,8)]`、中心ドット `#74859a`・半径`max(s*.015,4)` に強化。
- 検証（getImageData・canvasはpreview_screenshotに写らない既知仕様）：①computed background＝bg `rgb(255,253,247)` / gu・dr ともに `rgba(0,0,0,0)`透明に。②**3キャンバス合成（drawImageでbg+gu+dr重ね＝実機の見た目）**で 中心ドット[116,133,154]=#74859a・たて/よこ点線[138,152,168]・十字以外は[255,253,247]クリーム・合成上のたて線の点319個＝**画面に十字が出ることを確認**。test(1年あ・ユーザー報告と同じ画面)で検証。console errorなし。※ユーザーは file:// を開いているのでリロードで反映（index.html内インラインCSSのためキャッシュ繰り上げ不要）。

■ 追加実装（2026-07-04・第26回）＝きろくの「バックアップ＆ひきつぎ」
- 共通部品 `backup-kit.js`（3アプリ＝ugoki-no-kiroku/level-up-adventure/kanji-bouken に同一ファイルを同梱コピー。設計詳細・運用ルールは ugoki-no-kiroku/HANDOFF.md 参照）。`<script src="backup-kit.js?v=1">` を grade1-strokes より前に読込。入り口＝トップバーの💾ボタン（🔊の左）→ `BackupKit.open()`。
- 対象データ＝ `kanji_save_me` のみ（`kanji_sound`＝端末の音設定・`RESET_FLAG`＝端末フラグは対象外）。書き出し＝封筒JSON（`{kagasenBackup:1,app:'kanji-bouken',...,data}`）のファイルDL＋テキストコピー／読み込み＝検証→プレビュー（コイン/ずかん字数/クリアテスト数/かぐ/きせかえ）→確認→全置換→reload（loadSaveが全フィールドを検証・補完）。置換前に `kanji_save_me_mae` へ1世代退避。壊れたJSON・別アプリ封筒は既存データに触れず拒否。
- **重要: onImported が `RESET_FLAG` を立ててから reload する**。新端末でひきつぎ直後に resetProgressOnce()（端末ごと1回のコイン矯正）が走り、復元したてのコインが0になるのを防ぐため（バックアップはリセット後のデータ＝二重矯正防止。リセット機能自体は温存）。検証済み：フラグ無し端末で5000コインをひきつぎ→reload後も5000維持。
- このアプリは sw.js/manifest 未整備（PWA化前）のため CACHE 繰り上げは無し。PWA化するときは backup-kit.js?v=1 をキャッシュ対象に入れること。

■ 追加実装（2026-07-05・第27回）＝フォント同梱（脱Google Fonts）＋PWA化
- **フォント同梱**: `@import`(fonts.googleapis.com)を廃止し、`fonts/*.woff2` 5書体（Zen Maru Gothic 400/700/900・Klee One 400/600、SIL OFL 1.1）の `@font-face` に置換。**アプリの使用文字1510字だけにサブセット化**（全字だと数十MBになるため）して合計約2MB。生成は `node kanji-bouken/build-fonts.mjs`（要 python3＋fontTools。index.html/grade*-data/strokes/backup-kit から文字を機械収集→google/fontsリポジトリからTTF取得→サブセット）。**漢字・語句データを増やしたら build-fonts.mjs を再実行**（未収録字はシステムフォント代替＝崩れないが字体が変わる）。フォントURLは `?v=1` 付き＝更新時は繰り上げ。
- **PWA化**: `manifest.json`（standalone・theme #7ec8f0）／`icon.svg`（空グラデ＋漢＋島＋旗）／`sw.js`（`CACHE='kanji-cache-v1'`、プリキャッシュ23点＝index/backup-kit/grade1〜6のstrokes+data(遅延ロード分も)/three.min.js/フォント5/manifest/icon。ネットワーク優先+失敗時キャッシュ）。index.html に theme-color・manifest link・apple-touch-icon・SW登録（http(s)のみ、file://では登録しない）を追加。**以後、アセット更新時は sw.js の CACHE 繰り上げ必須**（?v= と一致させること）。
- release-check.mjs の KNOWN_EXTERNAL から kanji-bouken を削除（外部読み込みが再発したら❌検出される）。
- 検証: SW active・kanji-cache-v1 に23点キャッシュ・ページのリクエストが全てローカル（gstaticへのアクセスなし）・document.fonts.check で5書体ロード確認・れんしゅう画面で「読」が教科書体表示・console errorなし。

■ 追加実装（2026-07-05・第28回）＝全学年データの添削（段取り6・AI添削の第1稿）
- GRADE1〜6_INFO 全1118字を機械検査＋通読で添削。**修正 計77件**（1年7・2年13・3年17・4年15・5年15・6年10）。ユーザー（先生）の最終確認まち＝diff は git log で追える。
- **添削方針**: ①明白な誤りを修正（貝に音バイは無い→—、曲の訓「ま（がる）・まが（る）」重複タイポ→ま（げる）、存在しない語「公分」→公平、汽車=「でんしゃ」→れっしゃ、腸=「けしかする」→しょうかする、貨物=「はこんで はこぶ」等）。②常用外の読みを使う語例を排除（椅子・眼（め））。③中学以上の希少読みを削除（立=リュウ/図=はかる/体=テイ/声=こわ/会・回=エ/遠=オン/事=ズ/反=ホン・タン/度=タク/和=オ/病=ヘイ/礼=ライ/沖=チュウ/殺=サイ/格=コウ/若=もしくは/衆=シュ/厳=ゴン/律=リチ）。④単独で使わない・読みなしの語例を実語に（屋・員・帳・庫・主・対・官・候・標・各・隊・兵・副・独・素・紀・故・夕・高い山・池の水・気持ちが晴れる）。⑤常用外字・大人向け語を子ども向けに（千羽鶴・昆虫・弟子・知己・仁義・后妃・若干・批准・荘厳・健児・小康・十色・ケロケロ）。⑥**quiz語の学年内重複16組を全解消**（仕事/温度/平和/反対/医者/研究/成功/岐阜/機械/健康/栄養/快適/現在/歴史/武士/規則→片方を別語に）。⑦循環定義・交ぜ書きの意味文を修正（暴れる・書るい）。
- **検証スクリプト**: scratchpadの check-data.mjs（形式・quiz語の対象字含有・単字quiz読みの音訓整合・学年内quiz重複・かな語例の頭音）。全学年 問題0（1年の15件は「る・ん・を」等 語頭に立てない字への意図的な語例＝許容）。
- **キャッシュ**: data 6ファイル変更 → grade1-data?v=2 / grade2-data?v=5 / grade3〜6-data?v=2（index.html 静的タグ＋LAZY_GRADES＋sw.js ASSETS）。語例の文字が変わったので build-fonts.mjs 再実行（1510→1504字）→ fonts/*.woff2?v=2。sw.js CACHE v1→v2。
- 検証: 6学年ロード後に修正が全反映（貝=—・度quiz=今度・曲kun修正 ほか）、makeQuestion 各学年で正常出題（「今▢（こんど）」等）、console errorなし、release-check ❌0件。

■ 運用レバー・裏技（ユーザー確認済みの意図的な仕様。勝手に消さない）
- **チートコード**: ぼうけんマップ画面でキーボード入力「boukenmappu」→ コイン+10000（`CHEAT_CODE`/`CHEAT_COINS`、index.html末尾付近）。先生の運用・デモ用に温存。
- **resetProgressOnce() / `RESET_FLAG`**: 端末ごと1回だけ走るコイン矯正。コイン・購入品だけ戻し、図鑑・習得・クリア★は残す。バックアップ読み込み時はフラグを先に立てて二重矯正を防ぐ（第26回参照）。

■ 残（別フェーズ＝段取り6）
- GRADE1〜6_INFO の★先生添削 → **AI添削の第1稿は完了（第28回・修正77件）**。残タスク＝先生による最終確認（とくに quiz の意味文の言いまわし・学校で教える語彙との整合）。
- 収録済：1年=かな46+46+漢字80、2年=**160字（全字）**、3年=200字、4年=202字、5年=193字、6年=191字（視〜済）＝**全学年すべて全字そろった**。同じ仕組み（build-gradeN.mjs→GRADE_DATA1行追加）で増設する設計は実証済み。
- 着せ替えアイテムの拡充（柄シャツ・帽子/めがね枠など）は任意。
- 既知の軽微点：preview_screenshotはcanvas内容を描画しない（プレビューツール仕様。実機/ブラウザでは表示される。getImageDataで描画確認済み）。

## sw.js の activate 修正（2026-07-07）
- **バグ修正**: activate の古キャッシュ掃除が `k !== CACHE`（自分以外全部削除）だったため、同一オリジン（GitHub Pages）で他アプリのオフラインキャッシュを消していた。自アプリのプレフィックスだけ削除する条件（`k.startsWith('(自分のキャッシュ名)-') && k !== CACHE`）に修正。CACHE名・ASSETSは不変（キャッシュ繰り上げ不要、sw.js自体の更新はバイト差分で自動配布される）。
