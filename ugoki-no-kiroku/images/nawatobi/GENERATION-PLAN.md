# なわとび画像生成計画（n2〜n19）

## 基準画像

- 基準: `n1-1kaisen-2choyaku.png`
- 用途: image_gen のスタイル・人物同一性・画面構成の参照画像
- 固定事項:
  - 同じ小学生女子（濃い茶色のポニーテール、オレンジ色の髪留め）
  - 青い半袖体操シャツ（肩に白い2本線）
  - オレンジ色の短パン（白い脇線）
  - 白い短い靴下、青白の体育館シューズ
  - 鉄棒画像と同系統の、輪郭が明瞭で柔らかな立体感のある2.5D教材イラスト
  - 横長2:1、白背景、左から右へ進む3コマ時系列、全身表示
  - オレンジ色の縄と動作矢印、青いグリップ
  - 技名などの説明文は画像内に入れない

## 共通 image_gen プロンプトテンプレート

以下の `[ ]` 内だけを技別仕様へ置き換える。`n1-1kaisen-2choyaku.png` は「編集対象」ではなく、人物・服装・画風・構成の基準画像として渡す。

```text
Use case: scientific-educational
Asset type: elementary-school movement-record app jump-rope technique illustration

Primary request:
Create one technically accurate instructional image of the jump-rope skill "[技名]".
Show the movement as exactly THREE chronological phases arranged left-to-right in one wide 2:1 image.

Input image:
Use n1-1kaisen-2choyaku.png as the strict reference for the girl's identity, age, body proportions, hairstyle, outfit, color palette, polished 2.5D educational illustration style, white background, and three-phase composition. Do not copy its rope phases when they conflict with this skill.

Subject invariants:
The exact same Japanese elementary-school girl appears in all three phases: dark-brown high ponytail with orange hair band; bright-blue short-sleeve athletic shirt with two white shoulder stripes; orange athletic shorts with one white side stripe; white ankle socks; blue-and-white indoor athletic shoes. Keep her face, body proportions, clothing details, and colors consistent with the reference.

Skill mechanics:
- Rotation direction: [前回し／後ろ回し]
- Arm state: [通常／開く→交差→開く／交差を維持]
- Foot action: [両足／かけ足／グーチョキ／グーパー／左右ステップ／前振り]
- Revolutions per jump: [1回／2回／3回]
- LEFT phase: [開始姿勢、縄の位置、足・腕の位置]
- CENTER phase: [技の識別に最も重要な瞬間、縄と身体の前後関係]
- RIGHT phase: [着地または次周期直前、縄の位置]

Rope geometry:
Each phase has exactly one continuous orange rope connected to the OUTER END of both blue handles. Show the rope in a mechanically possible plane. The rope must never pass through the torso, arms, legs, hair, or shoes. When the rope is hidden behind the body, its visible ends and reappearance must still make the depth order understandable. For multi-revolution skills, use one solid rope at the key current position plus at most one or two lighter translucent orange trajectory echoes; do not draw multiple solid ropes that look like separate ropes.

Composition and guidance:
Wide 2:1 composition, exactly three full-body figures at equal scale and spacing, no panel borders, plain white background, faint soft floor shadows. Keep each phase and its rope spatially separate. Add only the minimum thin orange arrows needed to show [回転方向／足運び／腕の開閉]. Add one subtle left-to-right sequence arrow in unused margin only when the three phases are otherwise ambiguous.

Accuracy constraints:
Exactly three depictions of the same girl. Per depiction: exactly two arms, two hands, two legs, and two feet; natural joint and shoe directions; each hand holds exactly one handle; no disconnected rope; no impossible body twist. Make [技を見分ける最重要条件] unmistakable.

Text:
No words, labels, captions, numerals, logos, or watermarks, unless the individual approved specification explicitly requests a symbol.

Avoid:
extra people, extra limbs, extra fingers, duplicated shoes, broken handles, floating rope fragments, rope passing through the body, anatomically impossible feet, mismatched girl or outfit, photographic realism, flat SVG style, decorative scenery, excessive arrows, or a pose belonging to a different jump-rope skill.
```

## 生成順と予定ファイル名

検査で同種の問題をまとめて発見しやすいように、近い運動を連続して生成する。各画像は技別仕様の承認後に1枚ずつ生成・検査し、合格したものだけ正式名へ保存する。

### 1. 基本動作

| 順 | ID | 技名 | 予定ファイル名 | 識別の中心 |
|---:|:--:|---|---|---|
| 1 | n2 | まえとび | `n2-mae-tobi.png` | 前回し、両足で1回ずつ跳ぶ |
| 2 | n3 | うしろとび | `n3-ushiro-tobi.png` | 後ろ回し、縄が踵側から足下へ入る |

### 2. 足技

| 順 | ID | 技名 | 予定ファイル名 | 識別の中心 |
|---:|:--:|---|---|---|
| 3 | n4 | かけあしとび | `n4-kakeashi-tobi.png` | 左右交互の片足着地 |
| 4 | n5 | グーチョキとび | `n5-gu-choki-tobi.png` | 足を揃える→前後に開く |
| 5 | n6 | グーパーとび | `n6-gu-pa-tobi.png` | 足を揃える→左右に開く |
| 6 | n7 | よこステップとび | `n7-yoko-step-tobi.png` | 両足で左右へ移動 |
| 7 | n8 | まえふりとび | `n8-maefuri-tobi.png` | 片足を前へ振り出す |

### 3. 交差系

| 順 | ID | 技名 | 予定ファイル名 | 識別の中心 |
|---:|:--:|---|---|---|
| 8 | n9 | あやとび | `n9-aya-tobi.png` | 開く→胸前で交差→開く |
| 9 | n10 | こうさとび | `n10-kosa-tobi.png` | 腕を交差したまま連続 |
| 10 | n11 | うしろあやとび | `n11-ushiro-aya-tobi.png` | 後ろ回し＋開く→交差→開く |
| 11 | n12 | うしろこうさとび | `n12-ushiro-kosa-tobi.png` | 後ろ回し＋交差を維持 |

### 4. 多回旋・後ろ多回旋

| 順 | ID | 技名 | 予定ファイル名 | 識別の中心 |
|---:|:--:|---|---|---|
| 12 | n13 | にじゅうとび | `n13-niju-tobi.png` | 1ジャンプ中に前回し2回 |
| 13 | n14 | はやぶさ（あや2じゅう） | `n14-hayabusa-aya-niju.png` | 1回目通常、2回目交差 |
| 14 | n15 | こうさにじゅうとび | `n15-kosa-niju-tobi.png` | 交差を維持して前回し2回 |
| 15 | n19 | さんじゅうとび | `n19-sanju-tobi.png` | 1ジャンプ中に前回し3回 |
| 16 | n16 | うしろにじゅうとび | `n16-ushiro-niju-tobi.png` | 1ジャンプ中に後ろ回し2回 |
| 17 | n17 | うしろはやぶさ | `n17-ushiro-hayabusa.png` | 後ろ2回旋、通常→交差 |
| 18 | n18 | うしろこうさにじゅう | `n18-ushiro-kosa-niju.png` | 交差を維持して後ろ回し2回 |

## 1枚ごとの制作手順

1. 検査担当が技の回転方向、足運び、腕状態、縄の3位相を文章で確定する。
2. 共通テンプレートへ技別仕様を差し込み、基準画像を参照して built-in image_gen で候補を1枚生成する。
3. 候補名（`*-candidate-v1.png`）で保存し、原寸で制作担当が自己検査する。
4. 検査担当が技術面と視認性を検査する。NGの場合は一度に直す論点を限定して `candidate-v2` 以降を生成する。
5. OK判定後だけ正式ファイル名へコピーし、アプリ参照・キャッシュ更新・画面確認を行う。

## 品質チェックリスト

### 技術的な正しさ

- [ ] 前回し／後ろ回しの方向が技名と一致する。
- [ ] 3コマの縄の位相が時間順に進み、同じ回転の途中としてつながる。
- [ ] 縄は各コマで左右の青いハンドル外端につながった1本の連続線である。
- [ ] 縄が身体、髪、手足、靴を不自然に貫通していない。
- [ ] 縄の手前・奥・足下の重なり順で動きが理解できる。
- [ ] 両足跳び、交互足、前後開脚、左右開脚など足技が別技と混同されない。
- [ ] 通常持ち、開閉交差、交差維持の腕状態が正しい。
- [ ] 2回旋・3回旋は「複数の縄」ではなく、1本の縄の高速回転として見える。
- [ ] 着地は膝と足首が自然で、安全な姿勢に見える。

### 人体と一貫性

- [ ] 各コマに腕・手・脚・足がそれぞれ2本／2つだけある。
- [ ] 左右の手が1本ずつハンドルを握っている。
- [ ] 関節、手首、膝、足首、靴先が人間として自然な方向を向く。
- [ ] 3コマすべて同じ女児、髪型、髪留め、顔、体格、服装、配色である。
- [ ] ポニーテールの揺れは回転方向と跳躍に矛盾しない。

### わかりやすさと画面品質

- [ ] 左→中央→右の順序が説明なしでも読み取れる。
- [ ] その技を見分ける決定的瞬間が中央コマで明瞭である。
- [ ] 3人と3本の縄が隣のコマへ重ならず、全身・縄全体が切れていない。
- [ ] 矢印は必要最小限で、縄本体と混同しない細さ・位置になっている。
- [ ] 横長2:1、白背景、十分な余白、同じ縮尺、薄い床影になっている。
- [ ] 既存鉄棒画像と同じ柔らかな立体感・輪郭・青／オレンジの教材配色である。
- [ ] 不要な文字、数字、ロゴ、透かし、背景物がない。
- [ ] スマホ内の縮小表示でも、縄・足・腕の決定的な位置関係を判別できる。

## 反映前の確認

- 正式画像が揃うまでは既存の `nawaArt()` 表示を変更しない。
- 画像参照の追加、Service Worker のキャッシュ更新、旧表示の置換は検査合格後にまとめて行う。
- 技別仕様に曖昧さがある場合は生成せず、検査担当へ戻して動作を確定する。
