#!/usr/bin/env python3
# =====================================================================
# ポータル用サムネイル（../images/sekai-o-mawarou.jpg）を作りなおすスクリプト
#   使い方:  cd sekai-o-mawarou && python3 build-thumb.py
# ---------------------------------------------------------------------
# ★2026-08-24・ユーザー指示「世界を回ろうのサムネイルがダサいです。世界地図の上に
#   飛行機で旅をしている感じでキャッチコピーを入れるものにして。**SVGはダサいので、
#   画像で作ってください**」。
#   ＝ rekishi-battle/build-thumb.py と まったく同じ考え方で、**手描きの絵は やめて
#     ゲームで じっさいに つかっている素材**から 組み立てる:
#       ・世界地図 … map-data.js（MAP_PATHS / MAP_OTHER / MAP_CENTER・Natural Earth）
#       ・国旗     … flags-data.js（flag-icons の PNG。data:URI が そのまま入っている）
#       ・大陸の色 … index.html の CONT_COLOR と 同じ値
#   ★生成物（.jpg）を 手で いじらないこと。直すときは **このスクリプトを直して 作りなおす**
#     （CLAUDE.md §4）。SVGには もどさない。
# ---------------------------------------------------------------------
# ★★★ポータルのカードは 画像を height:168px ＋ object-fit:cover で 出す
#   ＝**たてだけ 中央で 切られる**。400x260 に 直したとき、どの画面幅でも かならず
#   見えるのは **y=74〜186**（カード幅602pxのとき。せまいほど 広く見える）。
#   → キャッチコピー・旅のルート・国旗は ぜんぶ **y=78〜182** に 入れてある。
#   → お気に入り★ボタン（48px・左上）が 400x260換算で x=5〜37 / y=79〜111 に かぶるので、
#     コピーは 中央ぞろえにして 左はしが x=45 より 右に くるように している（下の assert）。
#   ★棚（横スクロール）のタイルは 244x132 で、下55%に 題名用の 暗幕が かかる。
#     大事なものを **下に 置かない**のは そのため。
# =====================================================================
import os, re, json, base64, io, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "images", "sekai-o-mawarou.jpg")

S = 3                       # 出す大きさ＝400x260 の 3倍（iPadの きれいな画面むけ）
W, H = 400 * S, 260 * S
FONT_B = "/System/Library/Fonts/ヒラギノ角ゴシック W8.ttc"   # 太いゴシック（見出し）
FONT_M = "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc"   # すこし細い（そえ字）
EMOJI = "/System/Library/Fonts/Apple Color Emoji.ttc"

# --- ゲームと 同じ色（index.html の --sea / CONT_COLOR / buildMap と そろえる） ---
SEA      = (11, 37, 64)      # #0b2540  海
LAND_OTH = (34, 65, 94)      # #22415e  ちいさい島など（MAP_OTHER）
LAND     = (61, 99, 130)     # #3d6382  ふつうの国
STROKE   = (11, 37, 64)      # 国ざかいの線＝海と同じ色（ゲームと同じ）
CONT_COLOR = {"asia": "#f0913f", "europe": "#5b9bf0", "africa": "#43b97c",
              "namerica": "#ee6f63", "samerica": "#a878e0", "oceania": "#25b8b4"}
GOLD = (255, 209, 102)       # 旅のルートの色（ゲームの「つながった線」と同じ 黄色）

def hx(s):
    return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))

# ---------- 1. データを 読む（.js を 正規表現で ひらく。手で 写さない） ----------
def jsvar(path, name, quoted=False):
    src = open(os.path.join(HERE, path), encoding="utf-8").read()
    if quoted:
        return re.search(r'var %s = "([^"]+)"' % name, src).group(1)
    return json.loads(re.search(r'var %s = (\{.*?\});' % name, src, re.S).group(1))

VB = [float(v) for v in jsvar("map-data.js", "MAP_VIEWBOX", True).split()]
PATHS = jsvar("map-data.js", "MAP_PATHS")
CENTER = jsvar("map-data.js", "MAP_CENTER")
OTHER = re.search(r'var MAP_OTHER = "([^"]+)"',
                  open(os.path.join(HERE, "map-data.js"), encoding="utf-8").read()).group(1)
COUNTRIES = jsvar("country-data.js", "COUNTRIES")
FLAGS = jsvar("flags-data.js", "FLAGS")

# ---------- 2. 地図を 置く場所を 決める ----------
#  よこ幅いっぱいに 合わせて、たては まん中（＝北極・南極の はしだけ 海になる）。
#  ★たてに合わせると 左右を 60度ぶんも 切ることになり、ブラジルや アフリカが 欠ける。
K = W / VB[2]                      # 1度 あたり 何px か
#  ★★たての位置が この絵の 命。**キャッチコピーの下(y=120〜180)に 旅のルートが 来る**ように
#    まん中より SHIFT ぶん 下げる。下げないと 日本・アメリカが コピーの うしろに かくれる
#    （1回目に 作って じっさい そうなった）。
SHIFT = 13 * S
OY = (H - VB[3] * K) / 2 + SHIFT   # 上下の あまり（海で うめる）

def pt(x, y):
    return ((x - VB[0]) * K, (y - VB[1]) * K + OY)

def polys(d):
    """M/L/Z だけの パスを 多角形の list に する（map-data.js は 曲線を つかっていない）"""
    out = []
    for sub in d.split("M")[1:]:
        nums = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', sub)]
        p = [pt(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]
        if len(p) >= 3:
            out.append(p)
    return out

# ---------- 3. 旅のルート（★ここを 書きかえれば ルートが 変わる） ----------
#  日本を 出て **東まわりで 地球を1しゅう**して 帰ってくる（ゲームの ねらいそのもの）。
#  ★この地図は 日本が まん中（東経150度中心）なので、ブラジル→エジプト は
#    **画面の 右はしから 出て 左はしに 入る**＝大西洋を わたる。そのまま つなぐと
#    画面を 横切る 変な線になるので、下の draw_route で **画面の外を まわして** 描く。
#  ★4か国の **ループ**（日本に 帰ってくる）。ブラジルや オーストラリアは
#    400x260換算で y=183以下＝**カードで 切られる**ので 入れない（上の★★★）。
ROUTE = ["JP", "US", "EG", "IN", "JP"]
STOPS = ["JP", "US", "EG", "IN"]              # 国旗を 出す 4か国
#  ふくらませる量。**ぜんぶ 下向き（＋）**にして コピーの うしろに 入らないようにする。
#  ★エジプト→インドは 下に ふくらませる＝アラビア海を まわる 船の道すじに 見える
#    （まっすぐだと サウジアラビアの 上を 一直線に 通って つまらない）。
LIFT = {("JP", "US"): 22, ("US", "EG"): 18, ("EG", "IN"): 24, ("IN", "JP"): 15}
#  区間に のせる のりもの。★**海の上に 置ける区間だけ**（下の sea_here）。
#   🚢フェリーも 試したが、エジプト→インドは アラビア半島・インド・ソマリアで
#   海が こまぎれになり、旗から 27はなれた 海が 1つも 見つからなかった（実測0こ）ので
#   **ひこうき 1つだけ**にしてある。増やすときは 海の ひろい区間に すること。
SEG_ICON = {("JP", "US"): "✈️"}

img = Image.new("RGB", (W, H), SEA)

# ---------- 4. 世界地図（ゲームと 同じ 描きかた） ----------
land = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ld = ImageDraw.Draw(land)
for p in polys(OTHER):
    ld.polygon(p, fill=LAND_OTH + (255,))
for code, d in PATHS.items():
    c = COUNTRIES.get(code)
    fill = LAND
    if code in STOPS and c:
        fill = hx(CONT_COLOR[c["cont"]])       # ルートの国は 大陸の色で 光らせる
    for p in polys(d):
        ld.polygon(p, fill=fill + (255,), outline=STROKE + (255,), width=max(1, S // 3))
img.paste(land, (0, 0), land)

# ---------- 5. 旅のルート（点線）＋ 飛行機 ----------
def bez(a, b, lift):
    """a→b を すこし ふくらませた 曲線（点の list）に する。lift＝ふくらむ量(400x260換算)"""
    mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + lift * S
    return [((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * mx + t * t * b[0],
             (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * my + t * t * b[1])
            for t in [i / 60 for i in range(61)]]

def dashes(pts, dash=7 * S, gap=5 * S):
    """点の列を 点線に 切る。1本ずつ 線分の list で かえす"""
    out, on, acc, cur = [], True, 0, [pts[0]]
    for i in range(1, len(pts)):
        d = math.dist(pts[i - 1], pts[i])
        acc += d
        cur.append(pts[i])
        if acc >= (dash if on else gap):
            if on and len(cur) > 1:
                out.append(cur)
            on, acc, cur = not on, 0, [pts[i]]
    if on and len(cur) > 1:
        out.append(cur)
    return out

rt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
rd = ImageDraw.Draw(rt)
segs = []                     # {"pts": 点の列, "key": (国, 国)}
for i in range(len(ROUTE) - 1):
    key = (ROUTE[i], ROUTE[i + 1])
    a, b = pt(*CENTER[key[0]]), pt(*CENTER[key[1]])
    lift = LIFT.get(key, 0)
    if abs(a[0] - b[0]) > W * 0.55:
        # ★地球は まるい: 遠回りに見える 組み合わせは **画面の外を まわす**（大西洋わたり）。
        #   ＝画面を よこ切る 変な線に ならず、「1しゅうしている」ことも 伝わる。
        if a[0] > b[0]:
            segs.append({"pts": bez(a, (b[0] + W, b[1]), lift), "key": key})
            segs.append({"pts": bez((a[0] - W, a[1]), b, lift), "key": key})
        else:
            segs.append({"pts": bez(a, (b[0] - W, b[1]), lift), "key": key})
            segs.append({"pts": bez((a[0] + W, a[1]), b, lift), "key": key})
    else:
        segs.append({"pts": bez(a, b, lift), "key": key})
for sg in segs:
    for d in dashes(sg["pts"]):
        rd.line(d, fill=GOLD + (240,), width=int(2.6 * S), joint="curve")
img.paste(rt, (0, 0), rt)

# ---------- 6. のりもの（ゲームと 同じ ✈️ひこうき / 🚢フェリー） ----------
#  ★Apple Color Emoji は 決まった大きさでしか ひらけない（このMacは 96 と 160）。
#    大きいほうで 描いてから 縮める＝ふちが きれいに 出る。
EMOJI_PX = 160

def emoji(ch, size):
    im = Image.new("RGBA", (EMOJI_PX * 2, EMOJI_PX * 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((0, 0), ch, font=ImageFont.truetype(EMOJI, EMOJI_PX), embedded_color=True)
    return im.crop(im.getbbox()).resize((size, size), Image.LANCZOS)

def sea_here(x, y, rad):
    """その まわりが ぜんぶ 海か（land の 透明ぶんを 見る）"""
    if x - rad < 0 or y - rad < 0 or x + rad >= W or y + rad >= H:
        return False
    box = land.crop((int(x - rad), int(y - rad), int(x + rad), int(y + rad)))
    return box.getextrema()[3][1] == 0          # アルファの さいだいが 0＝陸が 1つも ない

for sg in segs:
    ch = SEG_ICON.get(sg["key"])
    if not ch:
        continue
    p2 = sg["pts"]
    m = len(p2) // 2
    #  ★★のりものは **海の上**に 置く（1回目は フェリーが タイの上を 走っていた）。
    #    まん中から 前後に ずらしながら、まわりが ぜんぶ海で・国旗から はなれていて・
    #    画面のはしでも ない ところを さがす。見つからない区間には 置かない。
    mid = None
    for off in [0] + [d for i in range(1, m) for d in (i, -i)]:
        q = p2[m + off]
        if q[0] < 42 * S or q[0] > W - 42 * S:
            continue
        if any(math.dist(q, pt(*CENTER[c])) < 27 * S for c in STOPS):
            continue
        if sea_here(q[0], q[1], int(15 * S)):
            mid = q
            break
    if mid is None:
        continue
    ic = emoji(ch, int(27 * S))
    if ch == "✈️":                                   # 絵文字は 右上むき → 進む向きに まわす
        ang = math.degrees(math.atan2(p2[m - 6][1] - p2[m + 6][1], p2[m + 6][0] - p2[m - 6][0]))
        ic = ic.rotate(ang - 45, resample=Image.BICUBIC, expand=True)
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))     # うしろに うすい 影＝地図に うもれない
    ImageDraw.Draw(sh).ellipse([mid[0] - 17 * S, mid[1] - 17 * S, mid[0] + 17 * S, mid[1] + 17 * S],
                               fill=(6, 20, 38, 105))
    sh = sh.filter(ImageFilter.GaussianBlur(3.5 * S))   # ★ぼかす。くっきりの丸だと シールに見える
    img.paste(sh, (0, 0), sh)
    img.paste(ic, (int(mid[0] - ic.width / 2), int(mid[1] - ic.height / 2)), ic)

# ---------- 6b. 国旗（ゲームで つかっている ほんものの PNG） ----------
def flag(code, size):
    raw = base64.b64decode(FLAGS[code].split(",", 1)[1])
    f = Image.open(io.BytesIO(raw)).convert("RGBA")
    k = size / min(f.width, f.height)
    f = f.resize((int(f.width * k), int(f.height * k)), Image.LANCZOS)
    f = f.crop(((f.width - size) // 2, (f.height - size) // 2,
                (f.width - size) // 2 + size, (f.height - size) // 2 + size))
    m = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    f.putalpha(m.resize((size, size), Image.LANCZOS))
    return f

for n, code in enumerate(STOPS, 1):
    cx, cy = pt(*CENTER[code])
    r = int(10 * S)
    ring = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rr = ImageDraw.Draw(ring)
    rr.ellipse([cx - r - int(3 * S), cy - r - int(3 * S), cx + r + int(3 * S), cy + r + int(3 * S)],
               fill=(6, 20, 38, 110))                    # 影
    rr.ellipse([cx - r - int(1.8 * S), cy - r - int(1.8 * S),
                cx + r + int(1.8 * S), cy + r + int(1.8 * S)], fill=(255, 255, 255, 255))
    img.paste(ring, (0, 0), ring)
    f = flag(code, r * 2)
    img.paste(f, (int(cx - r), int(cy - r)), f)
    # 番号（1〜4）＝「じゅんばんに まわる」が ひと目で わかる。
    # ★**旗の 右下**に 出すこと。上に 出すと キャッチコピーに かぶる（1回目に そうなった）。
    nd = ImageDraw.Draw(img)
    nf = ImageFont.truetype(FONT_B, int(9.5 * S))
    bx, by = cx + r * 0.92, cy + r * 0.92
    nd.ellipse([bx - 6.4 * S, by - 6.4 * S, bx + 6.4 * S, by + 6.4 * S], fill=(226, 78, 103, 255),
               outline=(255, 255, 255, 255), width=int(1.3 * S))
    bb = nd.textbbox((0, 0), str(n), font=nf)
    nd.text((bx - (bb[2] - bb[0]) / 2 - bb[0], by - (bb[3] - bb[1]) / 2 - bb[1]), str(n),
            font=nf, fill=(255, 255, 255, 255))

# ---------- 7. キャッチコピー（★安全ゾーン y=78〜182 の いちばん上） ----------
#  赤帯では なく **やわらかい 暗幕**にする（地図を かくさないため）。
scrim = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(scrim)
top, bot = 76 * S, 122 * S
for y in range(top, bot):
    t = (y - top) / (bot - top)
    a = int(215 * (1 - abs(t - 0.45) * 1.7)) if 0 <= t <= 1 else 0
    sd.line([(0, y), (W, y)], fill=(7, 20, 38, max(0, a)))
scrim = scrim.filter(ImageFilter.GaussianBlur(2 * S))
img.paste(scrim, (0, 0), scrim)

d = ImageDraw.Draw(img)
COPY = "カードをつないで 世界一周！"
SUB = "ひこうき・船・リニアで 50の国を たびしよう"
f1 = ImageFont.truetype(FONT_B, int(23 * S))
b1 = d.textbbox((0, 0), COPY, font=f1)
tx = (W - (b1[2] - b1[0])) // 2 - b1[0]
ty = 79 * S
print("  コピーの 左はし x=%.0f（★ボタンは x=37まで。45より 右なら OK）" % (tx / S))
assert tx > 45 * S, "コピーが 長すぎ: お気に入り★ボタンに かぶる（tx=%d, 上限 %d）" % (tx, 45 * S)
d.text((tx, ty), COPY, font=f1, fill=(255, 255, 255, 255),
       stroke_width=int(1.4 * S), stroke_fill=(6, 22, 44, 255))
f2 = ImageFont.truetype(FONT_M, int(11.5 * S))
b2 = d.textbbox((0, 0), SUB, font=f2)
d.text(((W - (b2[2] - b2[0])) // 2 - b2[0], 104 * S), SUB, font=f2,
       fill=(255, 224, 130, 255), stroke_width=int(0.9 * S), stroke_fill=(6, 22, 44, 255))

# ---------- 8. 書き出し ----------
img.save(OUT, "JPEG", quality=86, optimize=True, progressive=True)
print("できました:", os.path.normpath(OUT), os.path.getsize(OUT) // 1024, "KB")
