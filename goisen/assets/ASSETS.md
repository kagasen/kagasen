# 語彙線の画像・効果音

ゲーム用の画像20点と効果音は、すべてこの制作作業で生成した。インターネットから画像・音声素材をダウンロードしていない。実行時の外部通信も不要。

## モンスター画像

- 制作ツール: built-in `image_gen`。各キャラクターを個別に透過PNGで生成した（元画像は各1254×1254）。
- 仕上げ: Python Pillowでアルファ値が8を超える領域を検出し、その領域を切り出す。縦横408px以内に縮小し、512×512の透明キャンバス中央に配置。四辺に約10%の余白を確保した。`WEBP`、`exact=True`、`method=6`、品質82から段階的に下げて80KB以下で保存。元の透過を保持した。
- 書き出し先: `monsters/<id>.webp`。すべて512×512、RGBA。四隅のアルファ値は0。

以下の「共通プロンプト」に、表の個別プロンプトを末尾に連結して1体ずつ生成した。追加モンスターもこの方式を使う。

```text
Use case: stylized-concept. Asset type: one original transparent 2D monster sprite for a Japanese elementary-school word-battle game. Draw ONE complete full-body character, viewer-facing with a slight three-quarter turn, centered in a square canvas with at least 10% empty padding on every side. Genuine alpha transparency. Shared game style: distinctive hand-inked adventure illustration, confident dark-navy variable-width contours, graphic shapes, selective flat cel shading, vivid but tasteful colors, crisp readable silhouette, expressive face, small handcrafted irregularities. Cool and exciting for children ages 7–12; friendly enough for school. No background, floor, cast shadow, scenery, lettering, numbers, symbols resembling readable text, border, panel, watermark, gore, realistic horror, or imitation of any existing franchise.
```

| ID | 個別プロンプト |
|---|---|
| `mori1` | A leafy emerald forest slime: squat translucent-looking green body rendered in opaque 2D shapes, little sprout on head, two leaf-like arms, mischievous grin, dark teal undersides and warm lime highlights. |
| `mori2` | A small brave mushroom-cap warrior: broad rust-red cap with ivory spots, cream face, teal tunic, holding a twig spear angled upward, short boots, spirited determined expression. |
| `mori_boss` | BOSS: a large noble wolf with a deep forest-green moss and leaf mane, glowing green eyes, antler-like branching crown, leaf armor accents, powerful paws and confident guardian stance. More ornate than ordinary monsters, complete body fully in frame. |
| `kazan1` | A nimble fire salamander with warm orange-red scales, a lively flame tail, amber eyes and small clawed feet, daring grin, fire only as part of its body. |
| `kazan2` | A sturdy rock golem built from asymmetrical charcoal basalt slabs with bright molten lava cracks and chunky fists, sturdy grounded pose, expressive golden eyes. |
| `kazan_boss` | BOSS: a fierce but school-friendly crimson fire dragon with both wings spread, curved horns, layered scale armor, golden belly, and a hint of flame breath near its muzzle. Majestic ornate silhouette; every wing tip fully in frame. |
| `umi1` | A jellyfish knight with a translucent-looking turquoise bell rendered in opaque 2D shapes, expressive face, small shell shield, flowing tentacles like a knight's cape, brave posture. |
| `umi2` | A shark swordsman, broad blue-gray snout, dorsal fin shaped like a swept sword blade, holding a curved sword made of polished shell, sea-blue armor accents, bold toothy grin. |
| `umi_boss` | BOSS: a giant regal octopus kraken king, curling eight visible tentacles fully inside frame, coral crown, ornate pearl-and-shell chest armor, holding a trident, deep indigo and coral palette, imposing but approachable. |
| `sora1` | An energetic electric bird with angular lightning-bolt feathers, cobalt and bright gold plumage, spread wings and sharp heroic expression, small electric arcs around feathers only. |
| `sora2` | A cloud genie with swirling white and blue cloud body, expressive eyes, golden wrist cuffs, holding a small thunder drum, wisps forming arms and a tapered floating lower body. |
| `sora_boss` | BOSS: an armored griffin with eagle head, lion body, wings fully spread inside frame, polished storm-silver and gold armor plates, controlled lightning arcs in feathers, confident fierce expression, ornate crown-like helm. |
| `maou1` | A cartoony skeleton swordsman, expressive friendly skull face, violet scarf streaming behind, short curved sword, mismatched simple armor, adventurous stance, playful rather than frightening. |
| `maou2` | A hooded dark mage with a face in shadow except bright curious eyes, layered indigo-violet robes, floating open spell-book, abstract glowing rune-like marks with NO readable letters, magic wisps contained close to body. |
| `maou_boss` | FINAL BOSS: a grand demon king with elegant sweeping cape, curved horns, dark plum and crimson armor, huge quill-pen staff held like a royal scepter, luminous violet eyes, dramatic layered silhouette and crown accents, imposing but kid-friendly, full body and cape completely in frame. |

## 背景画像

- 制作ツール: built-in `image_gen`。各世界を個別に生成した（元画像は各1774×887、2:1）。
- 仕上げ: PillowのLanczosで1280×640に縮小。RGB WebP、`method=6`、品質82から段階的に下げて150KB以下で保存した。中央はモンスターを重ねるため、比較的落ち着いた構図にした。
- 書き出し先: `bg/<world>.webp`。

共通プロンプト:

```text
Use case: stylized-concept. Asset type: landscape battle-stage background for an offline Japanese elementary-school word game. ONE environment only, no characters or creatures. Wide 2:1 panorama, composed for final 1280x640 crop. Shared game style: distinctive hand-inked 2D adventure illustration, confident dark-navy variable-width outlines, graphic painterly shapes, selective flat cel shading, rich vivid but tasteful colors, subtle handmade texture. Center 45% of the image visually calm and open for a monster sprite; interesting architecture and foliage concentrated toward the sides and upper edge. Ground plane or stage line at about 80% height, open foreground. Exciting and atmospheric yet friendly for ages 7–12. No text, letters, numbers, logos, frames, UI, people, monsters, or readable symbols.
```

| 世界 | 個別プロンプト |
|---|---|
| `mori` | Mysterious deep forest clearing. Layered ancient trees and mossy trunks at the far sides, broad leaves and shafts of jade sunlight, soft mist behind an open center, earthy stone-and-grass stage near lower fifth. |
| `kazan` | Volcanic cavern and distant caldera with glowing orange lava streams along the far sides, dark basalt formations, smoky red sky, sturdy charcoal rock battle stage near lower fifth; keep center clear of eruptions. |
| `umi` | Underwater temple ruins, broken coral-encrusted columns on sides, turquoise shafts of sunlight from water above, distant blue depth, sea plants and carved stone floor near lower fifth; calm open center. |
| `sora` | Floating castle among thunder clouds high above the sky, stone towers framing sides, distant storm-lit clouds, restrained gold lightning far away, cloud-and-stone battlement floor near lower fifth; open center. |
| `maou` | Dark demon-king castle hall, tall gothic arches and violet torch flames on side walls, distant throne silhouette small and subdued, deep indigo and plum stone, open central floor near lower fifth; dramatic but school-friendly. |

## 効果音

`../sfx.js`はWebAudioだけで音を合成する。音声ファイルは使わない。起動時に短いノイズバッファと約0.46秒の畳み込みリバーブを生成する。三角波の倍音を重ねた短い音、ベル状の和音、フィルターを動かしたノイズの剣風、低音の衝撃を組み合わせた。マスター音量は0.48。消音や音声機能が使えない場合にも、公開APIは安全に呼べる。`../sfx-test.html`で全種類を試聴できる。

効果音の追加時は`run(function (t) { ... })`内で`pluck`、`bell`、`swoosh`、`impact`などを組み合わせる。音の開始はAudioContextの時刻`t`から予約する。iPadでは最初のタップ内で`GoiSFX.unlock()`を呼ぶ。

## 追加サウンド・BGM

`../sfx.js`に追加した音楽と効果音もすべてオリジナルのWebAudio合成で、音声ファイルや外部URLはない。`select()`は高域を走る短いノイズ、非整数倍のサイン波、残響を重ねた抜刀風の「カシャーン」。`tick(2..12)`は同じ金属音を約0.1秒に縮め、音階に沿って上昇させる。約8回/秒の操作を想定して音量と高域を抑えている。

`superCharge()`は約0.6秒の上昇スイープ。`special(level)`は約0.5秒のチャージから低音の衝撃とノイズの割れる音に入り、「ド・パ・ピン」の上昇ベル列と星屑のような高音で結ぶ。レベル3ではベル列と余韻を増やし、全体は約2秒以内。`jackpot()`は正解後のコイン・星のような連続ベルと短い輝きのノイズで約1.2秒。いずれも録音素材は使わない。

BGMの`title`、`map`、`battle`、`boss`、`ending`は、それぞれ固有の旋律・応答句・和声進行・テンポと音色を持つ16小節のループ。メロディー、ベース、薄い和音、キック、スネア、ハイハットをオシレーターとノイズで生成し、WebAudio時刻の先読みスケジューラーで鳴らす。トラック切り替えは約0.65秒のクロスフェード、停止は約0.45秒のフェード。BGMバスの標準ゲインは0.18、効果音は0.48。`chance()`、`superCharge()`、`special()`、`jackpot()`、`clear()`の間はBGMを約70%下げる。消音は両バスに適用する。画面が非表示の間はBGMの予約を止め、表示に戻ると再開する。初回のユーザー操作で`unlock()`を呼ぶまでは再生せず、先に指定した`bgm(track)`は解錠後に開始する。`../sfx-test.html`で全音と各BGMを確認できる。
