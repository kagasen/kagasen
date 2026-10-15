#!/usr/bin/env python3
"""歴史人物の歌のカード画像を、歴史バトルの実素材から作る。"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
GAME = ROOT / "rekishi-battle" / "images"
OUT = Path(__file__).with_name("rekishi-jinbutsu-v2.webp")
W, H = 1280, 720
FONT = "/System/Library/Fonts/ヒラギノ角ゴシック W9.ttc"


def font(size):
    return ImageFont.truetype(FONT, size)


def fit_cover(im):
    scale = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
    x = (im.width - W) // 2
    y = (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))


def outlined_text(draw, xy, value, size, fill, stroke="#18243A", width=8):
    draw.text(xy, value, font=font(size), fill=fill, stroke_width=width, stroke_fill=stroke)


def paste_character(canvas, name, action, center_x, foot_y, height):
    # スプライトの透明余白を取り除き、ゲームで使うキャラ絵をそのまま置く。
    sprite = Image.open(GAME / "chars" / name / f"{action}.webp").convert("RGBA")
    sprite = sprite.crop(sprite.getchannel("A").getbbox())
    width = round(sprite.width * height / sprite.height)
    sprite = sprite.resize((width, height), Image.Resampling.LANCZOS)
    edge = sprite.getchannel("A").filter(ImageFilter.MaxFilter(15))
    halo = Image.new("RGBA", sprite.size, (255, 229, 150, 0))
    halo.putalpha(edge.point(lambda a: round(a * 0.83)))
    x, y = round(center_x - width / 2), foot_y - height
    canvas.alpha_composite(halo, (x, y))
    canvas.alpha_composite(sprite, (x, y))


bg = fit_cover(Image.open(GAME / "bg" / "honnnoujinohenn.webp").convert("RGBA"))
shade = Image.new("RGBA", (W, H))
sd = ImageDraw.Draw(shade)
for x in range(W):
    strength = round(205 - 135 * x / W)
    sd.line((x, 0, x, H), fill=(11, 22, 40, strength))
bg = Image.alpha_composite(bg, shade)

# 小さなカードでも顔とポーズが見えるよう、実際のゲームの攻撃絵を大きく並べる。
paste_character(bg, "himiko", "atk", 817, 665, 350)
paste_character(bg, "yoshitsune", "atk", 1104, 679, 342)
paste_character(bg, "nobunaga", "atk", 980, 582, 470)

draw = ImageDraw.Draw(bg)
draw.rounded_rectangle((49, 44, 469, 111), radius=27, fill="#9C3029", outline="#F9D69A", width=4)
outlined_text(draw, (76, 54), "歌っておぼえる日本史", 39, "#FFF1BD", "#69221F", 2)
outlined_text(draw, (46, 129), "歴史人物", 115, "#FFFFFF", "#142338", 10)
outlined_text(draw, (48, 275), "42人の歌", 105, "#FFE05E", "#662518", 9)
draw.rounded_rectangle((48, 554, 659, 643), radius=19, fill="#A12B2D", outline="#FFD47D", width=4)
outlined_text(draw, (71, 568), "5回でおぼえる！", 64, "#FFFFFF", "#65201C", 3)
draw.rectangle((10, 10, W - 11, H - 11), outline="#F6D188", width=7)

bg.convert("RGB").resize((800, 450), Image.Resampling.LANCZOS).save(OUT, "WEBP", quality=91, method=6)
print(OUT)
