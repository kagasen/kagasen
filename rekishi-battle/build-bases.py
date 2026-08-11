#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""レキシバトル: 人物いがいの絵（城・町・つくるもの・ちからのアイコン）を作る道具。

  sheets/base_{id}.png  →  images/bases/{id}.webp     （城・町・つくるもの）
  sheets/pw_{id}.png    →  images/ui/pw/{id}.webp     （城のちからのアイコン）

★人物・敵は build-sprites.py（4コマのシートを切り分ける道具）。こちらは **1枚絵**なので、
  やることは「背景をぬく → まわりの余白を切る → 大きさをそろえる」の3つだけ。
★背景ぬきは build-sprites.py の key_background() を **そのまま呼んでいる**（同じ道具を2つ持たない）。
  マゼンタ(#FF00FF)背景・白い紙の余白・ふちのピンクのにじみの始末は あちらに全部書いてある。

使い方:
  python3 build-bases.py                # sheets/base_*.png を ぜんぶ
  python3 build-bases.py tenshu kabe    # その id だけ
  python3 build-bases.py --pw           # sheets/pw_*.png を ぜんぶ
  python3 build-bases.py --pw yumi      # その id だけ
  python3 build-bases.py --debug        # 途中の判定をくわしく出す

★走らせると index.html の ASSET_V が自動で1つ上がる（キャッシュよけ。CLAUDE.md §4）。
"""

import os
import sys
import importlib.util

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHEETS = os.path.join(HERE, "sheets")
BASES = os.path.join(HERE, "images", "bases")
PWDIR = os.path.join(HERE, "images", "ui", "pw")

# ---- build-sprites.py を読みこむ（ファイル名にハイフンが入っているので importlib で） ----
_spec = importlib.util.spec_from_file_location("bsprites", os.path.join(HERE, "build-sprites.py"))
bs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bs)

# ============================ 大きさの約束 ============================
# ★ここの数値は index.html の CSS とペア。片方だけ変えないこと（PROMPTS-base.md §大きさの約束）。
#     .unit.base.has-sprite .sprite img { width:190%; height:190% }
#     .unit.base.has-sprite .hpbar { margin-bottom: calc(var(--unit-w)*0.70 + 4px) }
#   FILL_H を変えたら hpbar の 0.70 も変える（0.70 ≒ 1.90×FILL_H − 1.0 を --unit-w に直した値）。
BASE_SIZE = 512          # 出力の一辺(px)。バトルでの表示は 180px前後なので じゅうぶん
BASE_FILL_H = 0.88       # 絵のたては キャンバスの何わりまでか
BASE_FILL_W = 0.92       # 絵のよこは キャンバスの何わりまでか
# ★城は「下ばしに くっつけて 横まん中」。地面の線に そのまま乗せるための約束
#   （CSSは bottom:0 で置くだけ。人物のような足元の補正をしない）。

PW_SIZE = 128            # ちからのアイコンの出力の一辺(px)。ボタンでは26px前後
PW_FILL = 0.94           # アイコンは たても よこも いっぱいに（まん中ぞろえ）

WEBP_Q = 90
SPECK = 0.02             # いちばん大きいかたまりの この割合より小さい点は ゴミとして落とす


def load_rgba(path):
    im = Image.open(path).convert("RGBA")
    return np.asarray(im).astype(np.float64), im.size


def cut_background(path, debug=False):
    """背景をぬいて (RGB float, alpha 0-255) を返す。中身は build-sprites.py と同じ道具。"""
    arr, size = load_rgba(path)
    rgb, alpha, how = bs.key_background(arr)
    if debug:
        print("    背景: %s（%dx%d）" % (how, size[0], size[1]))
    return rgb, alpha, how


def drop_specks(alpha):
    """ぽつんと残った小さな点を落とす（コマわくのかけら・紙のよごれ）。

    ★いちばん大きいかたまりだけを残す のは やりすぎ。城の旗ざお・しゃちほこ・
      くさりのように、本体とつながっていない部品が ふつうにある。
      なので「いちばん大きいかたまりの2%より小さいもの」だけを落とす。
    """
    solid = alpha >= 128
    if not solid.any():
        return alpha
    lab, ds, parts = bs.blobs(solid)
    big = max(p["n"] for p in parts)
    keep = [p["id"] for p in parts if p["n"] >= big * SPECK]
    lu = np.repeat(np.repeat(lab, ds, axis=0), ds, axis=1)
    up = np.zeros(solid.shape, dtype=lab.dtype)
    up[:lu.shape[0], :lu.shape[1]] = lu
    out = alpha.copy()
    out[~np.isin(up, keep)] = 0.0
    return out


def bbox(alpha, thr=16):
    ys, xs = np.nonzero(alpha >= thr)
    if len(ys) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def compose(rgb, alpha, size, fill_w, fill_h, bottom):
    """切りぬいた絵を、正方形のキャンバスの決まった大きさ・決まった位置に置く。

    bottom=True  … 下ばしに くっつけて 横まん中（城・町・つくるもの＝地面に立つもの）
    bottom=False … たても よこも まん中（ちからのアイコン）
    """
    box = bbox(alpha)
    if box is None:
        raise ValueError("絵が見つかりません（背景ぬきに失敗している）")
    x0, y0, x1, y1 = box
    w, h = x1 - x0 + 1, y1 - y0 + 1

    src = np.dstack([rgb, alpha]).astype(np.uint8)[y0:y1 + 1, x0:x1 + 1]
    im = Image.fromarray(src)          # dtype uint8・4ch なので RGBA と分かる

    # たて・よこ どちらかが 先にいっぱいになるほうに合わせる（形はぜったいに ゆがめない）
    k = min(size * fill_w / float(w), size * fill_h / float(h))
    nw, nh = max(1, int(round(w * k))), max(1, int(round(h * k)))
    im = im.resize((nw, nh), Image.LANCZOS)

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = (size - nw) // 2
    py = (size - nh) if bottom else (size - nh) // 2
    out.paste(im, (px, py))
    return out, (w, h, nw, nh)


def build_one(cid, kind, debug=False):
    src = os.path.join(SHEETS, ("pw_" if kind == "pw" else "base_") + cid + ".png")
    if not os.path.exists(src):
        print("  × %s: %s が ありません" % (cid, os.path.relpath(src, HERE)))
        return False
    print("  ・%s" % cid)
    rgb, alpha, how = cut_background(src, debug)
    alpha = drop_specks(alpha)
    if kind == "pw":
        im, info = compose(rgb, alpha, PW_SIZE, PW_FILL, PW_FILL, bottom=False)
        outdir = PWDIR
    else:
        im, info = compose(rgb, alpha, BASE_SIZE, BASE_FILL_W, BASE_FILL_H, bottom=True)
        outdir = BASES
    os.makedirs(outdir, exist_ok=True)
    dst = os.path.join(outdir, cid + ".webp")
    im.save(dst, "WEBP", quality=WEBP_Q, method=6)
    print("    %s → %s（切りぬき %dx%d → %dx%d・%.1fKB）"
          % (how, os.path.relpath(dst, HERE), info[0], info[1], info[2], info[3],
             os.path.getsize(dst) / 1024.0))
    return True


def preview(kind):
    """作った絵を1枚にならべて出す（切りぬけているか・大きさがそろっているかの目視用）。"""
    outdir = PWDIR if kind == "pw" else BASES
    if not os.path.isdir(outdir):
        return
    names = sorted(f for f in os.listdir(outdir) if f.endswith(".webp") and not f.startswith("_"))
    if not names:
        return
    cell = 160
    cols = 6
    rows = (len(names) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (60, 60, 60, 255))
    for i, n in enumerate(names):
        im = Image.open(os.path.join(outdir, n)).convert("RGBA").resize((cell, cell), Image.LANCZOS)
        sheet.alpha_composite(im, ((i % cols) * cell, (i // cols) * cell))
    # ★たしかめ用の絵は sheets/ に出す（images/ の中に置くと GitHub Pages に載ってしまう）
    os.makedirs(SHEETS, exist_ok=True)
    p = os.path.join(SHEETS, "_preview_" + kind + ".png")
    sheet.save(p)
    print("  たしかめ用: %s" % os.path.relpath(p, HERE))


def main():
    kind = "pw" if "--pw" in sys.argv else "base"
    debug = "--debug" in sys.argv
    ids = [a for a in sys.argv[1:] if not a.startswith("--")]

    pre = "pw_" if kind == "pw" else "base_"
    if not ids:
        if not os.path.isdir(SHEETS):
            print("sheets/ が ありません。生成した絵を sheets/%s{id}.png で保存してください" % pre)
            return
        ids = sorted(f[len(pre):-4] for f in os.listdir(SHEETS)
                     if f.startswith(pre) and f.endswith(".png"))
    if not ids:
        print("sheets/%s*.png が 1枚も ありません（PROMPTS-base.md の手順を見てください）" % pre)
        return

    print("%s を %d枚 作ります" % ("ちからのアイコン" if kind == "pw" else "城・町の絵", len(ids)))
    ok = 0
    for cid in ids:
        try:
            if build_one(cid, kind, debug):
                ok += 1
        except Exception as e:      # 1枚こけても のこりは作る
            print("  × %s: %s" % (cid, e))
    if ok:
        preview(kind)
        v = bs.bump_asset_v()
        if v:
            print("ASSET_V を %d に繰り上げました（キャッシュよけ）" % v)
    print("できあがり: %d / %d" % (ok, len(ids)))


if __name__ == "__main__":
    main()
