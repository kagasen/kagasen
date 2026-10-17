# ポコと なかまたち（2D版）

- 使用画像: `poko-friends-2d-v1.png`（1536 × 1024、透過PNG）。アプリと一緒に保存し、Service Workerでキャッシュする。
- 制作: built-in `image_gen`。ユーザーの「立体はやめて2Dに」という修正指示を反映。3D試作はアプリに含めない。
- 3列 × 2行のアトラス。上段: ポコ（ふつう／よろこび／考え中）。下段: うさぎのリズ／ことりのピッピ／ねこのミント。
- CSS background-positionで切り替える。透過を維持し、実行時に外部サービスへ接続しない。

## 最終生成プロンプト

```text
Use case: illustration-story
Asset type: transparent 2D hand-drawn character sprite atlas for a Japanese elementary-school arithmetic game.
Create ONE 1536x1024 landscape sheet, exact 3 columns by 2 rows of 512-square cells. Each sprite's ENTIRE body within its own cell, centered, 12% blank padding. Genuine transparent background.
Art direction: charming 2D Japanese picture-book illustration drawn by a human with a chunky ink pen and opaque gouache. Very flat solid limited colors, deliberately wobbly dark plum outlines with varied pressure, tiny unfilled gaps and slightly imperfect asymmetry, a small amount of dry marker grain INSIDE flat color areas. Cute and graphic but distinctive, like a small independent illustrator's children's book. Small black dot or bean eyes, minimal faces. NO glossy giant eyes, no dimensional light, NO airbrushed highlights, no gradients, no rendered shadows, NO 3D, no polished plastic, no fur texture, no generic AI mascot aesthetics. Flat handmade shapes, bold silhouettes. White details allowed.
Top row is three poses of ONE original character: Poko, a squat coral-pink little elephant, broad floppy ears, long curling trunk, little turquoise neckerchief tied askew and a yellow star patch on its belly. No hat. Simple bean eyes, asymmetric expressive eyebrows, stubby round feet, charming funny proportions.
Top left: Poko standing with open bean eyes, waves one hand, friendly crooked smile.
Top middle: same Poko exuberantly dancing, closed crescent eyes, both hands up, trunk up, one foot raised.
Top right: same Poko thoughtfully looking up, one hand by cheek, curious eyebrow, gentle smile, no sadness.
Bottom left: periwinkle rabbit, one ear flopped over, coral bow tie, small bean eyes, clapping paws.
Bottom middle: mustard-yellow round bird with orange beak and legs, tiny teal party hat, singing with open beak, one wing raised.
Bottom right: mint green cat, pink inside pointy ears, lavender scarf, one raised paw, cheerfully smiling.
Do not put any text, letters, numbers, decorative sparkles, frames, panels, cell lines, checkerboard or background. All characters equal visual scale with padding; exactly six isolated full-body sprites. Produce actual alpha transparency. Strong flat handmade 2D style is essential.
```
