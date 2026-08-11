#!/usr/bin/env python3
# =====================================================================
# ポータル用サムネイル（../images/rekishi-battle.jpg）を作りなおすスクリプト
#   使い方:  cd rekishi-battle && python3 build-thumb.py
# ---------------------------------------------------------------------
# ★2026-08-11・ユーザー指示「SVGだとダサいので、それなら この画像（＝じっさいの
#   バトル画面）を使ってください」。だから **手描きの絵は やめて、ゲームで使っている
#   ほんものの素材**（背景webp＋キャラのスプライト）から 組み立てている。
#   ★生成物（.jpg）を 手で いじらないこと。直すときは **このスクリプトを直して 作りなおす**
#     （CLAUDE.md §4）。
# ---------------------------------------------------------------------
# ★★★ポータルのカードは height:160px ＋ object-fit:cover ＝ **たてだけ 中央で切られる**。
#   400x260 に 直したとき、どの画面幅でも かならず見えるのは **y=78〜182 だけ**。
#   → 赤帯（キャッチコピー）と 人物の列は ぜんぶ そこに 入れてある。
#   → お気に入り★ボタンが 400x260換算で x=7〜40 / y=83〜105 に かぶるので、
#     **帯の文字が そこに かからない**大きさに してある（中央ぞろえで 左はしは x≈33*S）。
#   確認は 320 / 343 / 392 / 602px幅の カードに 並べて 見ること（1れつのときが いちばん切れる）。
# =====================================================================
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "images", "rekishi-battle.jpg")

S = 3                      # 出す大きさ＝400x260 の 3倍（iPadの きれいな画面むけ）
W, H = 400 * S, 260 * S
FONT = "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc"   # 太いゴシック（見出し用）

# --- スプライトの ものさし（build-sprites.py と 同じ値。片方だけ 変えないこと） ---
FIGURE_FRAC = 0.60         # 人物の高さ ÷ キャンバス(256)の一辺
FOOT_RATIO = 0.20          # 足元の線 ÷ 一辺（キャンバス下ばしから）

BAND_TOP, BAND_H = 79 * S, 37 * S       # 赤帯（400x260換算で y=79〜116）
FOOT_Y = 178 * S                        # 人物の 足元の線（400x260換算で y=178）
#   ★181 だと **1れつ表示(602px)のとき すねから下が 切れた**。182が 見える下ばしなので
#     足もとに 4pxの よゆうを のこす。ここと 下の ALLY_H/ENEMY_H は セットで 直すこと。
ALLY_H = 55 * S                          # 味方の 見た目の高さ（帯の下 116〜足もと178 に おさまる大きさ）
ENEMY_H = 51 * S                         # 敵は すこし小さく＝おくにいる感じ

def sprite(path, target_h, flip=False):
    """スプライトを「人物の高さ = target_h」になるように 拡大縮小して かえす。
       いっしょに『足元の線が 画像の下から 何pxか』も かえす。"""
    im = Image.open(os.path.join(HERE, path)).convert("RGBA")
    scale = target_h / (FIGURE_FRAC * im.width)
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    if flip:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    return im, int(FOOT_RATIO * im.width)

def put(canvas, im, foot, cx, foot_y, shadow_w=None):
    """足元が (cx, foot_y) に くるように はりつける。
       ★足もとに うすい かげを 先に おく＝おかないと 人物が **ういて 見える**（実際 そう見えた）。"""
    if shadow_w:
        sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).ellipse(
            [cx - shadow_w / 2, foot_y - shadow_w * 0.13, cx + shadow_w / 2, foot_y + shadow_w * 0.13],
            fill=(10, 8, 5, 110))
        canvas.alpha_composite(sh)
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(foot_y - (im.height - foot))))

def hpbar(draw, cx, y, w, ratio, color):
    """ゲームと同じ HPバー（そこは くろ、うえに 色）"""
    h = max(3, int(2.2 * S))
    x0, x1 = int(cx - w / 2), int(cx + w / 2)
    draw.rounded_rectangle([x0, y, x1, y + h], radius=h // 2, fill=(20, 16, 12, 220))
    draw.rounded_rectangle([x0, y, int(x0 + w * ratio), y + h], radius=h // 2, fill=color)

# ---------- 1. 背景（本能寺の変。ゲームで じっさいに 出るもの） ----------
bg = Image.open(os.path.join(HERE, "images/bg/honnnoujinohenn.webp")).convert("RGBA")
k = H / bg.height
bg = bg.resize((int(bg.width * k), H), Image.LANCZOS)
# 燃える天守が 右がわに 来るように 切る（右よせ）
bg = bg.crop((bg.width - W, 0, bg.width, H))
img = Image.new("RGBA", (W, H))
img.alpha_composite(bg)

# ---------- 2. 味方（左・右をむく）＝ゲームの出撃メンバー ----------
allies = [("images/chars/shotoku/walk.webp", 62), ("images/chars/yoritomo/atk.webp", 128),
          ("images/chars/nobunaga/atk.webp", 196)]
for path, cx in allies:
    im, foot = sprite(path, ALLY_H)
    put(img, im, foot, cx * S, FOOT_Y, shadow_w=int(ALLY_H * 0.62))

# ---------- 3. 敵（右・左をむく。ひっくりかえして 向きを 変える） ----------
enemies = [("images/enemies/ashigaru/walk.webp", 258), ("images/enemies/ashigaru/stand.webp", 300),
           ("images/enemies/mitsuhide/stand.webp", 348)]
for path, cx in enemies:
    im, foot = sprite(path, ENEMY_H, flip=True)
    put(img, im, foot, cx * S, FOOT_Y + int(1.5 * S), shadow_w=int(ENEMY_H * 0.58))

# ---------- 4. HPバー（ゲームの見た目に そろえる） ----------
d = ImageDraw.Draw(img)
for cx, ratio in [(62, 1.0), (128, 0.86), (196, 1.0)]:
    hpbar(d, cx * S, FOOT_Y - ALLY_H - int(5 * S), 30 * S, ratio, (102, 187, 106, 255))
for cx, ratio in [(258, 0.72), (300, 1.0), (348, 0.55)]:
    hpbar(d, cx * S, FOOT_Y - ENEMY_H - int(4.5 * S), 26 * S, ratio, (239, 83, 80, 255))

# ---------- 5. 赤帯＋キャッチコピー（ゲームの おしらせ帯と 同じ見た目） ----------
band = Image.new("RGBA", (W, BAND_H))
bd = ImageDraw.Draw(band)
for y in range(BAND_H):                      # 上から下へ 赤の グラデーション
    t = y / BAND_H
    bd.line([(0, y), (W, y)], fill=(int(214 - 74 * t), int(48 - 27 * t), int(49 - 28 * t), 252))
bd.rectangle([0, 0, W, int(0.9 * S)], fill=(255, 205, 210, 200))
bd.rectangle([0, BAND_H - int(0.9 * S), W, BAND_H], fill=(109, 15, 15, 220))
img.alpha_composite(band, (0, BAND_TOP))

d = ImageDraw.Draw(img)
COPY = "遊びながら 歴史がわかる！"
font = ImageFont.truetype(FONT, int(23 * S))
bbox = d.textbbox((0, 0), COPY, font=font)
tx = (W - (bbox[2] - bbox[0])) // 2 - bbox[0]
ty = BAND_TOP + (BAND_H - (bbox[3] - bbox[1])) // 2 - bbox[1]
# ★左はしが ★ボタン(x=40*S)に かからないか みはる（かかったら 字を小さくする）
assert tx > 44 * S, "コピーが 長すぎ: お気に入り★ボタンに かぶる（tx=%d）" % tx
d.text((tx, ty), COPY, font=font, fill=(255, 255, 255, 255),
       stroke_width=int(1.1 * S), stroke_fill=(120, 12, 12, 255))

# ---------- 6. 書き出し ----------
img.convert("RGB").save(OUT, "JPEG", quality=84, optimize=True, progressive=True)
print("かきだし:", os.path.normpath(OUT), img.size,
      "%.0f KB" % (os.path.getsize(OUT) / 1024))
