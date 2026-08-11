#!/usr/bin/env python3
"""
レキシバトル バトル用スプライト切り出しスクリプト

生成AI（Nano Banana Pro）が出した「4コマ並びのポーズシート」を
images/chars/{id}/stand|walk|atk|down.webp に切り分ける（人物ごとのフォルダを自動で作る）。

    python3 build-sprites.py himiko          # 1人だけ（sheets/himiko_sheet.png を読む）
    python3 build-sprites.py                 # *_sheet.png 全部
    python3 build-sprites.py himiko --debug  # 確認用のプレビューPNGも出す

■ 背景ぬきについて（ここが一番のキモ）
生成AIに「背景は透明」と頼んでも、透明そのものではなく
“透明を表すグレーの市松模様” を絵として描いてくることがある（卑弥呼のシートが実際そうだった）。
このスクリプトは3通りすべてを受けつける:
  A) 本当に透明（alpha付き）        → そのまま使う
  B) グレーの市松模様               → 模様の周期・位相・濃淡2色を推定して抜く
  C) 単色べた塗り（マゼンタ等）     → その色を抜く
B では「濃いグレーの上」と「薄いグレーの上」の2つの見え方が同じ絵について手に入るので、
  P濃 = a*F + (1-a)*G濃 ,  P薄 = a*F + (1-a)*G薄
の連立から半透明度 a と本来の色 F を復元できる。おかげで光の輪や炎のような
ふんわりしたエフェクトも、市松模様を残さずきれいに抜ける。

■ コマの切り出し
 - 地面の線・コマわくの線（細くて長い線）を先に消す。つないでしまうと升目に切れないため
 - 行の空白で「段」に分け、段ごとに列の空白でコマに分ける（1段4コマ／2段／3段どれでもよい）
 - ラベル文字（①たち 等）の帯・小さすぎるコマは自動で捨てる
 - 全コマを「同じ倍率・その段の足元の高さ」で正方形キャンバスに置く。
   ゲーム側はこの正方形をそのまま表示すれば、コマを入れかえても人物が飛びはねない。

★ 出力順は必ず stand / walk / atk / down（読む順＝左上から右へ、次の段）。
   コマが5つ以上ある（同じポーズが2案ある）シートは CELL_PICK で何番目を使うか指定する。
   指定が無いときは番号つきのプレビューPNGを出して止まるので、それを見て決める。
"""
import sys, os, glob, re
from collections import deque
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
CHARS = os.path.join(HERE, "images", "chars")
# シート原本(1枚1.5MB前後)の置き場は sheets/。GitHub Pages に載せたくないので images/ の外に置き、
# .gitignore で除外している。まちがえて images/chars/ や images/chars/{id}/ に入れても拾うが、
# その場合は公開フォルダに巨大PNGが残るので、実行のたびに注意を出す。
SHEETS = os.path.join(HERE, "sheets")

ENEMIES = os.path.join(HERE, "images", "enemies")

# ★敵の絵（2026-08-07）。この一覧に書いた id は images/enemies/{id}/ へ出す。
#   味方42人と同じ道具でよいが、出し先だけ分けている
#   （chars-data.js の boss/minion の img: と対応。プロンプトは PROMPTS-enemy.md）。
#   ★ここに1行足すだけで敵として扱われる。コードのほかの場所を直さなくてよい。
ENEMY_IDS = {
    # ボス17（面の順）
    "kunakoku", "moriya", "iruka", "tennentou", "shutendoji", "tomomori", "fubirai",
    "ounin", "yoshimoto", "mitsuhide", "mitsunari", "meireki", "nazo", "kurofune",
    "enomoto", "hanbatsu", "baltic",
    # ざこ12（何面かで使い回す）
    "yayoihei", "kodaihei", "heishihei", "genhei", "ashigaru", "bakuhei",
    "yamainokage", "mononoke", "hinoko", "houdan", "koe", "aranami",
}
# 人でないもの（船・火の玉・波・声）。頭のはばで大きさをそろえる補正が意味を持たないので外す。
#   ★人の顔・頭が無い絵に HEAD_BLEND をかけると、でたらめな倍率になる。
NON_HUMAN = {"kurofune", "baltic", "hinoko", "houdan", "koe", "aranami", "nazo", "ounin",
             "meireki", "yamainokage", "mononoke"}


def out_root(cid):
    """その id の出し先。敵は images/enemies/、味方は images/chars/"""
    return ENEMIES if cid in ENEMY_IDS else CHARS


def sheet_path(cid):
    for p in (os.path.join(SHEETS, cid + "_sheet.png"),
              os.path.join(CHARS, cid + "_sheet.png"),
              os.path.join(CHARS, cid, cid + "_sheet.png"),
              os.path.join(CHARS, cid, "sheet.png")):
        if os.path.exists(p): return p
    return None


def all_sheets():
    found = glob.glob(os.path.join(SHEETS, "*_sheet.png"))
    found += glob.glob(os.path.join(CHARS, "*_sheet.png"))
    found += glob.glob(os.path.join(CHARS, "*", "*sheet.png"))
    ids = set()
    for p in found:
        base = os.path.basename(p)
        ids.add(os.path.basename(os.path.dirname(p)) if base == "sheet.png"
                else base[:-len("_sheet.png")])
    return sorted(ids)

ORDER = ["stand", "walk", "atk", "down"]
OUT_SIZE = 256           # 1コマの出力px。バトル表示は64px前後なので十分
WEBP_Q = 86
GRAY_SAT = 18            # R/G/Bの差がこれ以下ならニュートラルグレー
GRAY_LO, GRAY_HI = 60, 170
SOFT_SAT = 42            # 半透明復元をかけてよい色みのゆるさ（広げすぎると光がにじむ）
# マゼンタ背景ぬきのしきい値（2026-08-07・敵29枚で追加）。
#   マゼンタらしさ min(R-G, B-G) が MAG_HI 以上＝背景 / MAG_LO 以下＝絵 / あいだは半とうめい。
#   ★MAG_BRIGHT（明るさの下限）が要る理由: 蘇我入鹿の むらさきの衣のような
#     「暗い紫」は マゼンタらしさが50前後あるので、明るさで分けないと服が半分すけてしまう。
MAG_LO, MAG_HI = 45, 95
MAG_BRIGHT = 150         # R か B がこれ以上明るくないと背景とみなさない
MAG_AREA = 0.06          # マゼンタが画面のこの割合をこえたら「マゼンタ背景のシート」
WHITE_MIN = 232          # 紙の白とみなす明るさ（コマとコマのすきま・まわりの余白）
WHITE_GROW = 3           # 紙の白をふとらせるpx（さかいめの半とうめいを消す）
# ★人物の大きさをそろえるための2つ（2026-07-30）。
#   もとは「その段の高さ」でキャンバスの大きさを決めていたので、頭の上にエフェクトが
#   のびている人ほど段が縦長になり、人物だけ小さく出ていた（実測で最大1.40倍のひらき。
#   織田信長・中臣鎌足が小さく、大隈重信が大きかった）。
#   いまは「たちコマの人物の高さ」で決めるので、42人ぜんぶ同じ大きさになる。
#   ★FIGURE_FRAC を大きくすると人物は大きくなるが、頭上のエフェクトが切れる。
#     0.663 は「いちばんエフェクトが縦長な織田信長でも切れない」ぎりぎりの値（余裕2%）。
#     ここを変えたら index.html の SPRITE_ZOOM（= 0.853 / FIGURE_FRAC）も直すこと。
FIGURE_FRAC = 0.60       # たちコマの人物の高さ ÷ キャンバスの一辺
FOOT_RATIO = 0.20        # 足元の線からキャンバス下ばしまで ÷ 一辺（全員そろえる）
# ★高さをそろえただけでは「大きさが同じ」に見えない（2026-07-30・ユーザー指摘）。
#   絵によって頭の大きさの描きかたが違い、烏帽子のように背の高いかぶりものがあると、
#   高さのうち帽子のぶんだけ体と顔が小さくなるため（中臣鎌足の頭51 ↔ 大隈重信の頭71）。
#   そこで「頭のはば ÷ 人物の高さ」も見て、半分だけ混ぜて大きさを補正する。
#   HEAD_BLEND=0（高さだけでそろえる）〜1（頭の大きさだけでそろえる）。
#   1にすると頭はそろうが背たけがバラバラになるので、まん中の0.5にしている。
HEAD_REF = 0.3766        # 42人の「頭のはば ÷ 人物の高さ」の中央値（この値を1.0とする）
                         # 実測の幅は 0.280（中大兄皇子）〜0.520（板垣退助＝旗の誤検出）
HEAD_BLEND = 0.5
ADJ_LIMIT = (0.80, 1.25) # 補正倍率の上限・下限（測りまちがえたときの暴走よけ）
# ↑この2つは「42人ぶんの実測」から決めた（2026-07-30）。人物の高さを1としたとき、
#   足元より上に必要なのは最大1.307（卑弥呼の後光）、下に必要なのは最大0.298
#   （中臣鎌足の やられ が低く描かれている）。合計1.605なので FIGURE_FRAC は 0.623 以下。
#   FOOT_RATIO は 0.298×0.60=0.179 以上、1−1.307×0.60=0.216 以下。まん中をとって0.195。
#   はみ出すときは生成時に「※注意」を出すので、出たらこの2つを見直すこと。
PAD_RATIO = 0.07         # （旧方式の名ごり。いまは使っていない）
FLIP_POSES = ("stand", "walk", "atk")   # 左向きなら反転するコマ。down は倒れ方が変わるので触らない
# 向きの自動判定（facing）が外れる人の手動指定（2026-08-06・ユーザー指摘）。
#   "flip" … 元絵が左向きなのに facing が気づけない → かならず反転する
#   "keep" … 元絵はもう右向きなのに facing が「左」と外す → ぜったいに反転しない
# ★facing は「顔（肌色）と 髪・帽子（暗い色）のどちらが右か」で決めているので、
#   ぼうず頭（髪が無い）・白い軍帽（暗くない）だと材料が足りずに外れる。
#   **どちら向きに外れるかは人によってちがう**ので、必ず出来上がりを目で見て決めること。
# ★42人ぜんぶ目で見て確かめた結果、外れるのはこの2人だけ。
# ★down（やられ）は42人とも「頭が右」でそろっているので、ここでは触らない（FLIP_POSES のみ）。
# ★"flip"/"keep" を1つ書くと たち・あるき・こうげき ぜんぶに効く。
#   {"atk": "keep"} のように書くと そのコマだけ。**こうげきのコマだけ外れる人が多い**
#   （技のエフェクトの光や、顔をかたむけたポーズで 肌色・暗い色の重心がずれるため）。
FACE_FIX = {
    "gyoki":      "keep",           # ぼうず頭。元絵は右向きなのに「左」と判定され、よけいに反転されていた
    # ★東郷平八郎は**元のシートの中でコマごとに向きがちがう**（たちだけ左向き）。
    #   人まるごと "flip" と書くと、もともと右向きの あるき・こうげき まで逆にしてしまう。
    "togo":       {"stand": "flip", "walk": "keep", "atk": "keep"},
    "chikamatsu": {"atk": "keep"},  # ↓ここから下はこうげきのコマだけ（2026-08-06にユーザー指摘で42人ぶん確認）
    "imoko":      {"atk": "keep"},
    "okuma":      {"atk": "keep"},
    "sesshu":     {"atk": "keep"},
    "mutsu":      {"atk": "flip"},  # この人だけ逆（「正面」と判定されて反転されなかった）
    # --- 敵（2026-08-07）。★どれも「こうげきのコマだけ」外れる。
    #     矢や黒い判子が右がわに大きく描かれるので、暗い色の重心が右に寄って
    #     「左向き」と判定され、よけいに反転されていた（ログが atk:左→反転 なので "keep"）。
    "moriya":     {"atk": "keep"},  # 射た矢が右に3本
    "ashigaru":   {"atk": "keep"},  # 突き出した長い槍が右に
    "mononoke":   "keep",           # からかさ。1本足で「顔（肌色）」が無いので 材料が足りない
    "houdan":     {"stand": "keep", "walk": "keep"},  # けむりのしっぽが左＝正しい向き
    "fubirai":    {"atk": "keep"},  # 射た矢が右に5本
    "hanbatsu":   {"atk": "keep"},  # 大きな判子と黒い×の風が右に
    "yoshimoto":  {"atk": "keep"},  # 突き出した大身槍と白い光が右に
}
LINE_THICK = 8           # これ以下の太さで横（縦）にずっと伸びる線は「地面線・わく線」とみなす
LINE_COVER = 0.55        # 幅（高さ）のこの割合以上をおおっていたら線とみなす
FRAME_SEG = 0.15         # コマわくが並んでいるときの、わく線1本ぶんの長さの下限（幅にたいする割合）
CELL_MIN = 0.16          # いちばん大きいコマに対して、この割合より小さい塊はコマとみなさない
THIN_PIECE = 8           # たて・よこどちらかがこのpx以下の小片は線のにじみ。コマにくっつけない
                         # （4→8 に上げた。伊藤博文のコマわくの破片が8pxで残っていたため。
                         #   ほかに消えるのは地面線の削りかす（幅6〜8px＝画面上2〜4px）だけ。2026-08-03）
CHECKER_HIT = 0.40       # 市松らしさが「濃薄の差」のこの割合をこえたら模様とみなす。
                         # 実測: 背景=0.5前後 / ふつうの絵=0.3以下（build-sprites の checker_score 参照）

# コマが4つより多いシート専用の指定。読む順（左上→右、次の段）で何番目を
# stand / walk / atk / down に使うか（1はじまり）。
# 生成AIが「こうげき」や「やられ」を2案出してくることがあるので、良いほうを選ぶ。
# 決めかたは {id}_cells.png（番号つきプレビュー）を見るだけ。
# (3, 4) のようにまとめて書くと、その2つを1コマとして合体させる
# （はなれて描かれた斬げきの光などを、その人物といっしょに出すため）。
CELL_PICK = {
    # --- 敵29体（2026-08-07）。どれも「4コマだが、はなれて描かれた物が別のコマに数えられた」型。
    #     番号は {id}_cells.png を見て決めた。( ) でくくったものは1コマに合体させる。
    "ounin":     (1, 2, (3, 4), 5),      # 3と4＝炎の体と、前へ広がる炎。合体
    "ashigaru":  (1, (2, 3), 4, 5),      # 3＝あるきコマの槍（手からはなれて描かれている）
    "bakuhei":   (1, 2, 3, (5, 4)),      # 5＝たおれた本人 / 4＝ぬげて飛ぶ陣笠
    "houdan":    (1, 2, 3, (4, 5)),      # 4＝たおれたときのけむり
    "baltic":    (1, 2, 3, (4, 5)),      # 4＝ふき出す黒いけむり
    "kurofune":  (2, 3, 4, (5, 1)),      # ★合体は大きいほうを先に書く（5＝たおれた大砲 / 1＝けむり）
    "nakanooe":   (1, 2, 3, 5),        # 4は3の左右ちがい。右向きの3を採用
    "michinaga":  (1, 2, 3, 5),        # 同上（4は正面向き）
    "imoko":      (1, 2, 4, 6),        # 4＝紙がまう方をこうげきに。5は後ろ姿なので6を採用
    "yoshitsune": (1, 2, 3, 6),        # 4,5は1,2の別案
    # ※ kiyomori は 2026-07-30 の refine_grid で赤い斬げきの光がちゃんと残るようになり、
    #    人物とひとつのコマにつながったので指定不要になった（もとは (1,2,(3,4),5)）。
    "sesshu":     (1, 2, 3, 5),        # 4は3の別案（すみのはねが小さい方）
    "yoshimasa":  (1, 2, 4, 5),        # 3は2の別案（足のはこびちがい）
    # --- 2026-07-30 に足した23人ぶんのうち、コマが4つでなかった9人 ---
    "hideyoshi":  (1, 2, 3, (4, 5)),   # 4＝たおれたときに落ちた刀とひょうたん。5の人物と合体させる
    "hiroshige":  (1, 2, 3, 5),        # 4は3の別案（波が小さい方）
    "perry":      (1, 2, 3, 5),        # 4はラベルが「やられ」だが絵はこうげきの別案（黒船のけむり）。
                                       # ほんとうの やられ は5
    "saigo":      (1, 2, 4, (5, 6)),   # 3は2の別案。5＝たおれた西郷のとなりの犬。6と合体させる
    "okubo":      (1, 2, 3, 5),        # 4は3の別案
    "takayoshi":  (1, 2, 4, 5),        # 3は2の別案（歩幅ちがい）。こうげきは下の段の4
    "togo":       (1, 2, 3, (4, 5)),   # 5＝たおれたときにぬげた帽子。4の人物と合体させる
    "noguchi":    (1, 2, 3, 6),        # 4は3の別案・5は2の別案。やられは6
}
# ※ murasaki / tokimune は 2026-07-28 に4コマちょうどのシートへ作り直したので指定不要。

# ★後光や炎のような「うすい光」ごしに、となりのコマとくっついてしまうシート用。
# くっついた状態では CELL_PICK で番号を選ぶこともできない（1つのコマとして数えられるため）。
# ここに書いた点をふくむ絵を、切り出しの前に消す。予備のポーズが1つ多いときに使う。
# 座標はシートPNGの実寸 (x, y)。{id}_cells.png ではなく元のPNGで測ること。
DROP_SEED = {
    "xavier": [(950, 400)],            # 上がわの予備の「やられ」。後光とつながっていた。
                                       # 下がわ（4コマめ）のきれいな方を使う
    # 足軽の「やられ」の下に、地面に落ちた槍が1本ねている（2026-08-07）。
    # これが こうげきのコマと同じ かたまりに数えられて、コマの箱が右はしまで広がり、
    # 人物が右に寄って小さく見えていた。槍だけ消す。
    "ashigaru": [(1426, 660)],
}

# 金色の後光のような「色のついた大きな光」は、市松模様の上にのると色みが強く出るので
# 既定の SOFT_SAT では半透明復元の対象から外れ、模様が絵として残ってしまう。
# ゆるめすぎると髪や顔まで溶けるので、全体は動かさずここで人物ごとに上書きする。
# ★うすい光（半とうめいの効果）を まるごと消したいときに、その光の中の点(x,y)を書く。
# 市松の上にのった色つきの光は、位相がずれているシートだと復元しきれず、
# 模様が絵として残ってしまうことがある（伊藤博文のこうげきの金色の光。2026-08-03にユーザー指摘）。
# 人物や紙は黒い輪郭で囲まれているので、「明るい画素だけ」をたどる塗りつぶしは輪郭で止まる。
# だから光だけ消せて、人物と持ち物はそのまま残る。
# 座標はシートPNGの実寸 (x, y)。{id}_cells.png ではなく元のPNGで測ること。
GLOW_SEED = {
    "hirobumi": [(1480, 200),          # こうげきの金色のおうぎ形の光
                 (1524, 250)],         # そのコマわくの外がわに1マスぶん残った市松の帯
}

# ★★白っぽい持ち物が「市松背景」とまちがえられて 消えるときの逃がし道（2026-08-09）。
#   徳川家光の刀で起きた: 刀の中身が **ほぼ真っ白(254)**、市松の薄いマスも **真っ白(255)** で、
#   さらに 刀が細いので、まわりの市松が 平均に まざりこんで「ここは市松だ」と判定された
#   （下の match / local / resid の3つ）。結果、**刀の まん中だけ ごっそり消えて**
#   切っ先だけが 宙に浮いた。
#   → この四角の中だけは「**ふちから つながっている背景**」しか消さない
#     （模様との照合を しない）。刀の中身は 黒い輪郭で 閉じているので ふちから とどかず、残る。
#   ★書きかたは シートの実寸 (x0, y0, x1, y1)。1コマぶんずつ書く（4コマ分かれているため）。
#   ★**四角は 小さめに**。大きくすると、その中の ほんものの背景まで 残ってしまう。
KEEP_BOX = {
    # 徳川家光: たちコマ と あるきコマ の 刀（1コマ516px幅のシート）
    "iemitsu": [(255, 100, 485, 325), (516 + 255, 100, 516 + 485, 325)],
}
SOFT_SAT_BY = {
    "xavier": 110,                     # 金の後光。42のままだと市松が残る（2026-07-28）
    "hirobumi": 110,                   # 金色の おうぎ形の光。同上（2026-07-30）
}

# 人物の大きさの手直し（自動の補正にさらに かけ算する。1.0＝手直しなし）。
# ★頭のはばの自動測定は、頭のすぐ横に持ち物があるとつながって太く出てしまう。
#   そういう人だけここで戻す。見た目で「小さい／大きい」と感じたときもここをいじる。
#   ★数字を変えたら生成しなおすこと（index.html 側は直さなくてよい）。
# ★★**縦だけ 引き伸ばす**つまみ（2026-08-09・ユーザー指摘「大隈重信の身長が低すぎる」）。
#   SIZE_ADJUST は たて・よこ 同じだけ大きくするので、背が低い人に使うと
#   **顔と体まで 太くなって しまう**（ユーザーの言葉「ただの拡大だと顔や体がデカくなりすぎる」）。
#   こちらは **たてだけ** のばすので、まわりと 身長だけ そろう。
#   ★足元は 動かない（下の top の計算で、のばしたぶんも いっしょに ずらしている）。
#   ★どれくらい のばすかは **背たけの実測**で決める:
#     `stand.webp の 絵の高さ ÷ キャンバス` が 42人の中央値 60.2% になるように。
#     大隈重信は 48.4% だったので 60.2/48.4 ≒ 1.24。
#   ★1.3をこえると 顔が たてに のびて 見た目が こわれる。そこまで要るなら 絵を描きなおすこと。
STRETCH_Y = {
    "okuma": 1.24,
}
SIZE_ADJUST = {
    "itagaki":    1.16,                # 赤い旗が頭のすぐ横にあり、頭とつながって太く測られる
    # ↓ここから下は「見た目で大きい」とユーザーが感じたぶんの手直し。
    #   自動の補正（頭のはば）だけでは大きく見える人がいる＝絵ごとの体つきの差。
    # ★0.884 は 0.865 と同じ結果になる値。2026-08-07に「暴走よけを自動ぶんだけにする」と
    #   式を変えたとき、この人だけ下限(0.80)で止まっていたので、同じ大きさになるよう書きなおした
    #   （見た目は 2026-08-03 に決めたときのまま。CLAUDE.md §3「勝手に変えない」）
    "okuma":      0.884,               # 2026-07-30に0.91→2026-08-03にもう少し小さく
    "chikamatsu": 0.93,                # 2026-08-03
    "meiji":      0.93,                # 2026-08-03
    # --- 敵（2026-08-07）。★味方3人（織田信長・卑弥呼・北条時宗）と並べて見くらべて決めた。
    #     大きくしているのは どれも「背たけより高い持ち物」があって、そのぶん本体が
    #     小さく描き出されてしまう絵（槍・弓・旗さしもの・碇）。
    "ashigaru":   1.45,                # 槍が背たけの1.6倍。いちばん小さく出ていた
    "yoshimoto":  1.18,                # 大身槍
    "moriya":     1.15,                # 大きな弓
    "mitsunari":  1.15,                # 背中の旗さしもの
    "mononoke":   1.15,                # 一本足のからかさ
    "tomomori":   1.12,                # 碇と旗
    "mitsuhide":  1.12,                # 旗さしものと三日月の前立て
    "kodaihei":   1.08,                # 大きな盾
    "tennentou":  1.06,
    "fubirai":    1.06,
    "bakuhei":    1.05,
}


# ---------------------------------------------------------------- 小道具
def boxsum(a, r):
    """半径 r の箱フィルタの合計（積分画像）"""
    a = a.astype(np.float64)
    h, w = a.shape
    p = np.zeros((h + 1, w + 1), dtype=np.float64)
    p[1:, 1:] = a.cumsum(0).cumsum(1)
    ys = np.clip(np.arange(h) - r, 0, h); ye = np.clip(np.arange(h) + r + 1, 0, h)
    xs = np.clip(np.arange(w) - r, 0, w); xe = np.clip(np.arange(w) + r + 1, 0, w)
    return (p[np.ix_(ye, xe)] - p[np.ix_(ys, xe)]
            - p[np.ix_(ye, xs)] + p[np.ix_(ys, xs)])


def dilate(mask, r):
    return boxsum(mask, r) > 0.5


def facing(img):
    """コマの向きを判定して +1(右向き) / -1(左向き) / 0(正面・判定不能) を返す。

    人物は かならず右を向いていないと、たちコマとあるきコマを交互に出したときに
    クルクル回って見える（2026-07-27 卑弥呼のあるきが左向きで出て発覚）。
    生成AIは「右向き」と書いても左向きを出してくることがあるので、ここで機械的に直す。

    見かた: 顔（肌色）は向いているがわ、髪・帽子・後頭部は反対がわに来る。
    頭のあたりだけを見て、肌色のかたまりが 髪より右にあれば右向き。
    ぼうず頭・かぶとなどで髪が拾えないときは、肌色と シルエット全体の中心を比べる。
    """
    a = np.array(img).astype(int)
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    sol = al > 60
    ys, xs = np.nonzero(sol)
    if xs.size < 200: return 0
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    head = np.zeros_like(sol)
    head[y0:y0 + max(1, int((y1 - y0) * 0.45))] = True      # 上から45%＝頭のあたり
    skin = sol & head & (r > 195) & (g > 145) & (g < 240) & (b > 115) & (b < 210) & ((r - b) > 33)
    dark = sol & head & (r < 115) & (g < 100) & (b < 95)    # 髪・帽子・かぶと
    hx = np.nonzero(head & sol)[1]
    if skin.sum() < 40 or hx.size < 40: return 0
    width = max(1.0, float(hx.max() - hx.min()))
    sk = np.nonzero(skin)[1].mean()
    ref = np.nonzero(dark)[1].mean() if dark.sum() >= 40 else hx.mean()
    d = (sk - ref) / width
    if abs(d) < 0.06: return 0                              # 正面向き＝どちらでもない
    return 1 if d > 0 else -1


def runs(flags, min_len=1):
    out, s = [], None
    for i, f in enumerate(flags):
        if f and s is None: s = i
        elif not f and s is not None:
            if i - s >= min_len: out.append((s, i - 1))
            s = None
    if s is not None and len(flags) - s >= min_len: out.append((s, len(flags) - 1))
    return out


def flood_from_border(cand):
    """ふちからつながっている cand だけ True にして返す（人物の中の灰色を守る保険）"""
    h, w = cand.shape
    bg = np.zeros((h, w), dtype=bool)
    q = deque()
    ys, xs = np.nonzero(cand[[0, h - 1], :])
    for y, x in zip(ys, xs):
        yy = 0 if y == 0 else h - 1
        if not bg[yy, x]: bg[yy, x] = True; q.append((yy, x))
    ys, xs = np.nonzero(cand[:, [0, w - 1]])
    for y, x in zip(ys, xs):
        xx = 0 if x == 0 else w - 1
        if not bg[y, xx]: bg[y, xx] = True; q.append((y, xx))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    return bg


# ---------------------------------------------------------------- 背景ぬき
def fit_grid(transitions):
    """等間隔に並んだ境目の位置から 周期T と 位相ph を最小二乗で出す"""
    t = np.array(transitions, dtype=np.float64)
    if len(t) < 4: return None
    T0 = np.median(np.diff(t))
    idx = np.round((t - t[0]) / T0)
    A = np.vstack([idx, np.ones_like(idx)]).T
    T, ph = np.linalg.lstsq(A, t, rcond=None)[0]
    return (T, ph) if T > 4 else None


def refine_grid(gray, bg, T0):
    """1行・1列から当てはめた市松の 周期T・位相 を、背景ぜんたいと照らして詰める。

    ★これが無いと横長のシートで破たんする。1行だけの当てはめでは周期が 0.05px ほど
      ずれることがあり、13px の市松だと 160マス先（＝2000px先）で白黒が入れかわる。
      そうなると「模様の色との照合」も「半透明の復元」もでたらめな場所を見るので、
      コマわくの中の模様が絵として残ってしまう。
      実測(2026-07-30): 濃薄の差が 伊藤博文 17.7 / 徳川家康 0.3 / 杉田玄白 0.0
      （0＝当てずっぽう）だったものが、詰めたあと 32 / 37 / 38 になった。

    やりかた: 市松は「よこの矩形波 × たての矩形波」に分けて書けるので、
    背景の明るさのゆらぎ（かすみ・グラデーション）を引いた W との相関は
    行列のかけ算2回で位相の全組み合わせぶんまとめて出せる。いちばん強いものを選ぶ。
    """
    h, w = gray.shape
    R = int(round(T0 * 2))
    n = boxsum(bg.astype(np.float64), R); n[n < 1] = 1
    mean = boxsum(np.where(bg, gray, 0.0), R) / n
    W = np.where(bg, gray - mean, 0.0)          # 市松の凹凸だけ残す。背景以外は0
    xs = np.arange(w, dtype=np.float64)
    ys = np.arange(h, dtype=np.float64)
    best = None
    # ↓ 中身が正しくても macOS の BLAS が overflow 等の警告を出すので黙らせる
    #   （全部0の行列のかけ算でも出る。numpy 2.0.2 で確認）
    with np.errstate(all="ignore"):
        for T in np.arange(T0 - 0.25, T0 + 0.2501, 0.01):
            ph = np.arange(0.0, T, 0.5)         # 位相は0.5px きざみで足りる
            SX = np.where(np.floor((xs[:, None] - ph[None, :]) / T) % 2 == 0, 1.0, -1.0)
            SY = np.where(np.floor((ys[:, None] - ph[None, :]) / T) % 2 == 0, 1.0, -1.0)
            S = SY.T @ (W @ SX)                 # S[たての位相, よこの位相]
            i = int(np.argmax(np.abs(S)))
            iy, ix = divmod(i, S.shape[1])
            if best is None or abs(S[iy, ix]) > best[0]:
                best = (abs(S[iy, ix]), float(T), float(ph[ix]), float(ph[iy]))
    return best[1], best[2], best[3]


def detect_checker(gray, hard_bg):
    """市松模様の 周期T・位相・濃淡2色 を推定。見つからなければ None"""
    vals = gray[hard_bg]
    if vals.size < 5000: return None
    mid = (vals.min() + vals.max()) / 2.0
    lo, hi = vals[vals < mid], vals[vals >= mid]
    if lo.size < 500 or hi.size < 500: return None
    Gd, Gl = float(np.median(lo)), float(np.median(hi))
    # 薄い市松（230/246 のような低コントラスト）もあるので、ここは小さめでよい。
    # 本当の単色背景なら、このあとの fit_grid が境目を見つけられず None になる。
    if Gl - Gd < 8: return None

    h, w = gray.shape
    def edges_along(line, ok):
        b = line < (Gd + Gl) / 2
        e = [i for i in range(1, len(line)) if ok[i] and ok[i - 1] and b[i] != b[i - 1]]
        return e
    yrow = int(np.argmax(hard_bg.sum(axis=1)))
    xcol = int(np.argmax(hard_bg.sum(axis=0)))
    gx = fit_grid(edges_along(gray[yrow], hard_bg[yrow]))
    gy = fit_grid(edges_along(gray[:, xcol], hard_bg[:, xcol]))
    if not gx or not gy: return None
    T = (gx[0] + gy[0]) / 2.0
    phx, phy = gx[1], gy[1]
    T, phx, phy = refine_grid(gray, hard_bg, T)      # ★1行の当てはめでは横長シートで足りない

    yy, xx = np.mgrid[0:h, 0:w]
    parity = ((np.floor((xx - phx) / T) + np.floor((yy - phy) / T)).astype(np.int64)) % 2
    # どちらの parity が「濃い」かを実測で決める
    p0 = gray[hard_bg & (parity == 0)]
    if p0.size == 0: return None
    dark_parity = 0 if np.median(p0) < (Gd + Gl) / 2 else 1
    is_dark = (parity == dark_parity)
    return dict(T=T, is_dark=is_dark, Gd=Gd, Gl=Gl)


def checker_score(v, T):
    """その画素が「市松模様の上」らしいかの点数。模様の格子の位置を使わないのがミソ。

    市松では、ななめ T ずれた所は同じ色（同じ市松のマス）、たて・よこ T ずれた所は
    ちがう色（となりのマス）になる。だから
        よこ・たての差 － ななめの差
    は、模様の上では「濃薄の差」くらい大きく、ふつうの絵（平らな所・輪郭の段差）では
    ほぼ0になる。格子の位置合わせがいらないので、シートの端で格子がずれていても効く。
    ★これが要る理由: 白い刀の軌跡や金の後光が模様にかぶると明るさがずれ、
      色の照合（match）では拾えなくなる。ここは明るさのずれに影響されない。
    """
    d = max(2, int(round(T)))
    def roll(dy, dx): return np.roll(np.roll(v, dy, 0), dx, 1)
    same = np.mean([np.abs(v - roll(sy * d, sx * d)) for sy in (-1, 1) for sx in (-1, 1)], axis=0)
    opp = np.mean([np.abs(v - roll(sy * d, sx * d)) for sy, sx in ((0, 1), (0, -1), (1, 0), (-1, 0))], axis=0)
    return boxsum(opp - same, d) / boxsum(np.ones_like(v), d)


def magentaness(rgb):
    """マゼンタらしさ。min(R-G, B-G) で測る。

    ★赤(R高・G低・B低)は B-G が小さいので混ざらない。ここが効くポイント。
      (R+B)/2-G のような測りかたにすると、くちびるや炎の赤まで背景と判定してしまう。
    """
    return np.minimum(rgb[:, :, 0] - rgb[:, :, 1], rgb[:, :, 2] - rgb[:, :, 1])


def key_magenta(rgb, h, w):
    """マゼンタ(#FF00FF)背景のシートを抜く（2026-08-07・敵の29枚で追加）。

    敵のシートは炎・光・けむりが多いので、市松ではなくマゼンタ背景で作ってもらっている
    （PROMPTS-enemy.md）。ところが生成AIは
      ・コマごとに マゼンタの四角を描き、そのあいだに **白い紙のすきま** を空ける
      ・まわりに **白い余白** をつける（四隅が白いので、四隅の色を見る従来のやりかたでは
        マゼンタではなく白を背景と判定してしまう）
      ・コマのふちに **黒いわく線** を描く（線は strip_lines があとで消す）
    という出しかたをしてくる。そこで:
      ① マゼンタは無条件に背景（絵の中でマゼンタは使わない約束）
      ② 白い紙は「**白だけをたどって画面のふちから届く所**」だけ背景にする
         ★マゼンタを通ってはいけない。通すと、コマの中の白い矢・白い旗・白い光まで
           ふちとつながって消えてしまう（物部守屋の矢・足軽の旗で実際に起きる）
    """
    m = magentaness(rgb)
    bright = np.maximum(rgb[:, :, 0], rgb[:, :, 2])
    hard = (m >= MAG_HI) & (bright >= MAG_BRIGHT)
    if hard.mean() < MAG_AREA:
        return None
    # ふちのギザギザ（絵とマゼンタが混ざった画素）は半とうめいにして なめらかに見せる
    ramp = np.clip((MAG_HI - m) / float(MAG_HI - MAG_LO), 0.0, 1.0)
    alpha = np.where(bright >= MAG_BRIGHT, ramp, 1.0) * 255.0
    # 白い紙のすきま・余白（白だけをたどってふちから届く所）
    white = (rgb.min(axis=2) >= WHITE_MIN) & (rgb.max(axis=2) - rgb.min(axis=2) <= GRAY_SAT)
    # ★紙の白は 2〜3px ふとらせて消すこと。マゼンタと白のさかいめには
    #   「白っぽい半とうめい」の画素が残り、コマのまわりに **うすい四角いわく** が出る
    #   （物部守屋・今川義元で実際に出た。2026-08-07）。
    alpha[dilate(flood_from_border(white), WHITE_GROW)] = 0.0
    # ふちに残るピンクのにじみを消す（半とうめいの所だけ、赤と青を緑に近づける）
    out = rgb.copy()
    edge = alpha < 250
    out[:, :, 0] = np.where(edge, np.minimum(rgb[:, :, 0], rgb[:, :, 1] + MAG_LO), rgb[:, :, 0])
    out[:, :, 2] = np.where(edge, np.minimum(rgb[:, :, 2], rgb[:, :, 1] + MAG_LO), rgb[:, :, 2])
    return out, alpha, "マゼンタ背景（白い余白も除去）"


def key_background(arr, soft_sat=SOFT_SAT, keep=None):
    """RGBA配列 → (RGB float, alpha 0-255) 。背景を抜く。

    keep … KEEP_BOX の四角の一覧。その中では「ふちから つながっている背景」だけを消す
           （白い刀のような、市松とまちがえられる持ち物を まもるため）。
    """
    h, w, _ = arr.shape
    a0 = arr[:, :, 3]
    rgb = arr[:, :, :3].astype(np.float64)
    if (a0 < 250).any():
        return rgb, a0.astype(np.float64), "もともと透明"

    # ★マゼンタ背景を いちばん先に見る（敵のシートはこれ。四隅は白いことが多いので、
    #   四隅を見る単色ぬきより前に置かないと 白を背景と判定してしまう）
    km = key_magenta(rgb, h, w)
    if km is not None:
        return km

    mx, mn = rgb.max(axis=2), rgb.min(axis=2)
    v = rgb.mean(axis=2)
    # 市松模様の濃さは絵によってまるで違う（卑弥呼＝濃いグレー87/137、聖徳太子＝ほぼ白230/246）。
    # ふちの1周は必ず背景なので、そこの実測から「背景とみなすグレーの範囲」を決める。
    ring = np.zeros((h, w), dtype=bool)
    ring[:2] = ring[-2:] = True; ring[:, :2] = ring[:, -2:] = True
    bv = v[ring & (mx - mn <= GRAY_SAT)]
    if bv.size > w:
        lo, hi = np.percentile(bv, 1) - 12, np.percentile(bv, 99) + 12
    else:
        lo, hi = GRAY_LO, GRAY_HI
    cand = (mx - mn <= GRAY_SAT) & (v >= lo) & (v <= hi)
    # ★コマわくで囲まれたシートでは、わくが「ふちからの塗りつぶし」をせき止めてしまい、
    #   わくの中の背景がぜんぶ絵として残る（伊藤博文のシート。2026-07-30）。
    #   そこで わく線・地面線の帯だけは通れるようにして塗りつぶす。
    #   通すのは線の帯だけなので、人物の輪郭（曲がっていて短い）は通れず、
    #   顔や髪の中まで塗りつぶしが もれることはない。
    #   最後に & cand して、線そのものは背景あつかいにしない。
    pass_thru = lines_mask(~cand, cand.shape)
    hard = flood_from_border(cand | pass_thru) & cand
    if hard.sum() < h * w * 0.05:
        # グレー背景ではない → 四隅の色を単色背景とみなして抜く
        corner = np.median(np.stack([rgb[0, 0], rgb[0, -1], rgb[-1, 0], rgb[-1, -1]]), axis=0)
        dist = np.linalg.norm(rgb - corner, axis=2)
        hard = flood_from_border(dist < 60)
        alpha = np.where(hard, 0.0, 255.0)
        return rgb, alpha, "単色背景 %s" % corner.astype(int).tolist()

    # ★KEEP_BOX の中は「ふちからの塗りつぶし」の結果を そのまま守る（下の照合で消させない）
    keepmask = np.zeros((h, w), dtype=bool)
    for (x0, y0, x1, y1) in (keep or []):
        keepmask[max(0, y0):min(h, y1), max(0, x0):min(w, x1)] = True
    hard_safe = hard.copy()

    ck = detect_checker(v, hard)
    alpha = np.where(hard, 0.0, 255.0)
    if ck is None:
        return rgb, alpha, "グレー背景（単純ぬき）"

    T = ck["T"]; Gd, Gl = ck["Gd"], ck["Gl"]

    # 市松のマスごとの平均色を、その場所のまわりだけから出す（濃いマスの平均 Pd / 薄いマスの平均 Pl）。
    # このあとの「照合」と「半透明の復元」の両方でつかう。
    R = int(round(T))
    md, ml = ck["is_dark"].astype(np.float64), (~ck["is_dark"]).astype(np.float64)
    nd, nl = boxsum(md, R), boxsum(ml, R)
    nd[nd < 1] = 1; nl[nl < 1] = 1
    Pd = np.stack([boxsum(rgb[:, :, c] * md, R) / nd for c in range(3)], axis=2)
    Pl = np.stack([boxsum(rgb[:, :, c] * ml, R) / nl for c in range(3)], axis=2)

    # --- 模様そのものと照合して、閉じた輪の内がわに閉じこめられた背景も拾う
    #     （光の輪・炎の輪など。ふちからの塗りつぶしだけでは届かない）
    #     色つきの光がかぶって明るさがずれた模様はここでは拾えないので、下の「透けぐあい」で拾う。
    # ★「その場所に濃淡の差がある（＝市松が本当に見えている）」を条件に足すこと。
    #   色だけで決めると、白いひげ・白髪が薄いマスの色(228)とほぼ同じなので抜けて穴があく
    #   （伊藤博文のひげが緑にすけて見えた。2026-08-03にユーザー指摘）。
    #   位相がずれていて差が逆に出ることがあるので、絶対値で見る。
    amp = (Pl - Pd).mean(axis=2)
    has_checker = np.abs(amp) > 12
    Gpred = np.where(ck["is_dark"], Gd, Gl)
    match = (np.abs(rgb - Gpred[:, :, None]) < 20).all(axis=2) & has_checker
    match = dilate((boxsum(match, 2) / 25.0) > 0.6, 2) & cand
    hard = hard | match
    # ★上の照合はシート全体で1組の濃淡（Gd/Gl）を使うので、背景にうすい かすみ や
    #   グラデーションがかかっていると外れる（伊藤博文は 上が179/228・下が195/217 だった）。
    #   そこで「その場所の濃淡（Pd/Pl）」とも照合する。まわりの実測なのでかすみに強い。
    #   ★平らにぬった絵も Pd≒Pl≒その色 になって当たってしまうので、
    #     その場所にちゃんと濃淡の差がある（＝市松が見えている）ことを条件に足す。
    near = (np.abs(rgb - np.where(ck["is_dark"][:, :, None], Pd, Pl)) < 18).all(axis=2)
    local = dilate((boxsum(near & (amp > 12), 2) / 25.0) > 0.6, 2) & cand
    hard = hard | big_parts(local & (~hard), int(T * T * 4))
    # 色つきの半とうめいがかぶって残った模様を、格子の位置を使わない判定で拾う
    # （中臣鎌足の白い刀の軌跡・聖武天皇の金の後光・紫式部のコマわくの中）。
    # 念のため、まとまった広さのかたまりだけ採用する（絵の輪郭の反応は細いので落ちる）。
    score = checker_score(v, T)
    resid = score > (Gl - Gd) * CHECKER_HIT
    hard = hard | big_parts(resid & (~hard), int(T * T * 4))
    # ★KEEP_BOX の中だけ、照合で足したぶんを 取りけす（ふちからの塗りつぶしぶんは のこす）
    if keepmask.any():
        hard = np.where(keepmask, hard_safe, hard)
    alpha = np.where(hard, 0.0, 255.0)

    # P濃 - P薄 = (1-a)(G濃 - G薄)  →  a
    one_minus_a = np.clip(((Pd - Pl).mean(axis=2)) / (Gd - Gl), 0.0, 1.0)
    a = 1.0 - one_minus_a
    Gm = (Gd + Gl) / 2.0
    Pm = (Pd + Pl) / 2.0
    safe = np.maximum(a, 1e-3)[:, :, None]
    F = np.clip((Pm - (1.0 - a)[:, :, None] * Gm) / safe, 0, 255)

    # --- 半透明の復元をかける範囲: 背景のすぐ外がわだけ。
    # 全面にかけると、絵の柄で Pd と Pl が食いちがい、髪や顔まで溶けてぼやける（実測ずみ）。
    # ★さらに「模様がすけて見えている所」だけに限る。色みと明るさだけで決めると、
    #   灰色の髪やうすい色の紙が背景と同じ範囲に入ってしまい、溶かされて穴があく
    #   （伊藤博文＝白髪＋巻物 で実測。市松が 179/228 で髪の灰色とほぼ同じだった。2026-07-30）。
    #   すけているなら下の市松が見えるので checker_score が立つ。ふつうの絵では立たない。
    fringe = dilate(hard, int(T * 2)) & (~hard)
    soft = (fringe & (mx - mn <= soft_sat) & (v >= lo - 20) & (v <= hi + 40)
            & (score > (Gl - Gd) * 0.12))
    # ★KEEP_BOX の中では 半とうめいの復元も かけない（白い刀が うすく溶けるため）
    if keepmask.any():
        soft = soft & (~keepmask)
    if soft.sum() == 0:
        return rgb, alpha, "市松ぬき（半透明なし）"
    newa = np.where(soft, a * 255.0, alpha)
    rgb_out = np.where(soft[:, :, None], F, rgb)
    newa = np.where(hard | (newa < 40), 0.0, newa)   # うっすら残る幽霊は消す
    return rgb_out, newa, "市松ぬき＋半透明復元 (T=%.1f, 濃%.0f/薄%.0f, %d px)" % (
        T, Gd, Gl, int(soft.sum()))


# ---------------------------------------------------------------- 切り出し
def drop_seeds(rgb, alpha, seeds, cid):
    """DROP_SEED で指定した点をふくむ絵を消して、新しい alpha を返す。

    見わけかた: 後光や炎はうすい光なので明るい。**暗い画素だけ**をたどれば、
    光ごしにくっついていた人物どうしはちゃんと分かれる（ザビエルで実測）。
    ただし暗いのは輪郭・かみ・服だけなので、そのままだと顔（はだ色）が残る。
    輪郭は閉じた輪になっているので、ふちからとどかない所＝中みも消す。
    """
    solid = alpha > 40
    lab, ds, _ = blobs(solid & (rgb.mean(axis=2) < 200))
    lu = np.repeat(np.repeat(lab, ds, axis=0), ds, axis=1)
    up = np.zeros(solid.shape, dtype=lab.dtype)
    up[:lu.shape[0], :lu.shape[1]] = lu
    kill = np.zeros(solid.shape, dtype=bool)
    for x, y in seeds:
        if not (0 <= y < up.shape[0] and 0 <= x < up.shape[1]) or up[y, x] == 0:
            raise SystemExit("[%s] DROP_SEED の点 (%d,%d) に絵がありません" % (cid, x, y))
        kill |= (up == up[y, x])
    kill = ~flood_from_border(~kill)          # 輪郭の内がわ（顔など）もまとめて消す
    kill = dilate(kill, 10) & solid           # 輪郭のすぐ外の光も消す
    return np.where(kill, 0.0, alpha)


def find_lines(solid):
    """地面の線・コマわくの線の位置を (axis, s, e) で返す。axis=1 は横の線（行 s〜e）。

    見わけかたは「**ひとつづきに長くのびているか**」。人物の体をよこぎる行も
    絵のある画素の数だけなら多くなるが、それは人物ごとに切れた短い区間の寄せ集めになる。
    地面の線は切れ目なく1本つながっているので、いちばん長い区間の長さで見わけられる。
    （画素数で見ていたころは、足元のすぐ上の行がこんでいるせいで聖武天皇の地面線を
      消しそこねていた。2026-07-28）"""
    h, w = solid.shape
    out = []
    work = solid.copy()          # 見つけた線は消しながら進む（次の判定をじゃましないため）
    for axis, span in ((1, w), (0, h)):
        cover = work.sum(axis=axis) / float(span)
        for s, e in runs(cover > LINE_COVER):
            if e - s + 1 > LINE_THICK: continue
            mid = work[(s + e) // 2, :] if axis == 1 else work[:, (s + e) // 2]
            segs = [b - a + 1 for a, b in runs(mid)]
            # ★4コマがそれぞれ四角いわくで囲まれているシートでは、わく線1本は
            #   シート幅の2割ほどしかないので「ひとつづき」では見つけられない。
            #   そういうときは「長い区間がいくつも並んで、合わせて幅の大半をおおう」で見わける
            #   （伊藤博文のシートで必要になった。2026-07-30）。
            #   足元のこんだ行は区間が1つ足のぶんしかないので、ここには当たらない。
            frame = [t for t in segs if t >= span * FRAME_SEG]
            if max(segs or [0]) < span * LINE_COVER and not (
                    len(frame) >= 2 and sum(frame) >= span * LINE_COVER):
                continue                                        # 人物の寄せ集めだった
            if axis == 1: work[s:e + 1, :] = False
            else:         work[:, s:e + 1] = False
            out.append((axis, s, e))
    return out


def lines_mask(solid, shape):
    """find_lines の結果を、その帯ぜんぶを True にした盤にして返す"""
    m = np.zeros(shape, dtype=bool)
    for axis, s, e in find_lines(solid):
        if axis == 1: m[s:e + 1, :] = True
        else:         m[:, s:e + 1] = True
    return m


def drop_glow(rgb, alpha, seeds, cid):
    """GLOW_SEED で指定した点をふくむ「うすい光」を消して、新しい alpha を返す。

    drop_seeds と考えかたは同じで、たどる色が逆。あちらは暗い画素をたどって
    人物どうしを切りはなす。こちらは**明るい画素だけ**をたどるので、
    黒い輪郭で囲まれた人物や紙には入りこまず、光だけを消せる。
    """
    solid = alpha > 40
    pale = solid & (rgb.mean(axis=2) > 150)
    lab, ds, _ = blobs(pale)
    lu = np.repeat(np.repeat(lab, ds, axis=0), ds, axis=1)
    up = np.zeros(solid.shape, dtype=lab.dtype)
    up[:lu.shape[0], :lu.shape[1]] = lu
    kill = np.zeros(solid.shape, dtype=bool)
    for x, y in seeds:
        if not (0 <= y < up.shape[0] and 0 <= x < up.shape[1]) or up[y, x] == 0:
            raise SystemExit("[%s] GLOW_SEED の点 (%d,%d) に うすい光がありません" % (cid, x, y))
        kill |= (up == up[y, x])
    kill = dilate(kill, 3) & solid            # 光のふちのにじみも消す
    return np.where(kill, 0.0, alpha)


def strip_lines(solid):
    """地面の線・コマわくの線を消す。細くて長い線は、はなれたコマ同士をつないでしまう
    （小野妹子・聖武天皇の地面線、紫式部のコマわくで実際に起きた）。

    ★消す帯を上下に2pxずつ広げてはいけない。線のはしのにじみは消えるが、
      地面線のすぐ上に足がある人物（杉田玄白・徳川家光・小村寿太郎）が
      上下に切りはなされてコマが2つに割れる（2026-07-30に実際にやらかした）。"""
    out = solid.copy()
    found = find_lines(solid)
    for axis, s, e in found:
        if axis == 1: out[s:e + 1, :] = False
        else:         out[:, s:e + 1] = False
    return out, len(found)


def blobs(solid, ds=2):
    """絵のかたまり（連結成分）を拾う。→ (間引いた盤のラベル, ds, かたまり一覧)
    行・列の投影で切ると、刀の軌跡やふきだしがとなりの列にはみ出したとたんに破たんするので、
    かたまり単位であつかう。ds倍に間引いた盤で塗りつぶすが、最後に元の絵と重ねるので
    ふちの精度は落ちない。
    ★ds を大きくすると速いが、近くにある別のコマ同士がくっついてしまう。ds=4 では
      中臣鎌足の刀の軌跡と やられのコマ、紫式部のとなり合うコマわくが実際にくっついた。"""
    h, w = solid.shape
    hh, ww = h // ds, w // ds
    sm = solid[:hh * ds, :ww * ds].reshape(hh, ds, ww, ds).any(axis=(1, 3))
    lab = np.zeros((hh, ww), dtype=np.int32)
    out = []
    nb = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1))
    for sy, sx in zip(*np.nonzero(sm)):
        if lab[sy, sx]: continue
        cur = len(out) + 1
        q = deque([(sy, sx)]); lab[sy, sx] = cur
        y0 = y1 = sy; x0 = x1 = sx; cnt = 0
        while q:
            y, x = q.popleft(); cnt += 1
            if y < y0: y0 = y
            if y > y1: y1 = y
            if x < x0: x0 = x
            if x > x1: x1 = x
            for dy, dx in nb:
                ny, nx = y + dy, x + dx
                if 0 <= ny < hh and 0 <= nx < ww and sm[ny, nx] and not lab[ny, nx]:
                    lab[ny, nx] = cur; q.append((ny, nx))
        out.append(dict(id=cur, x0=x0 * ds, y0=y0 * ds,
                        x1=min(w - 1, (x1 + 1) * ds - 1), y1=min(h - 1, (y1 + 1) * ds - 1),
                        n=cnt * ds * ds))
    return lab, ds, out


def strip_edges(mask, x0, y0, x1, y1):
    """コマのふちにぴったり沿って走る、まっすぐな線を消す。
    コマわく（紫式部のシートは4コマが四角い枠で囲まれている）と、
    足元の地面の線（小野妹子・聖武天皇）がこれにあたる。
    ★まん中を通る刀（中臣鎌足・平清盛）を消さないよう、ふちの数pxだけを見る。"""
    w, h = x1 - x0 + 1, y1 - y0 + 1
    for _ in range(LINE_THICK):
        if y1 <= y0 or x1 <= x0: break
        cut = False
        for edge in ("top", "bottom", "left", "right"):
            if edge == "top":    line, span = mask[y0, x0:x1 + 1], w
            elif edge == "bottom": line, span = mask[y1, x0:x1 + 1], w
            elif edge == "left":  line, span = mask[y0:y1 + 1, x0], h
            else:                 line, span = mask[y0:y1 + 1, x1], h
            if line.sum() < span * 0.85: continue      # ふち全体をおおう線ではない
            if edge == "top":      mask[y0, x0:x1 + 1] = False; y0 += 1
            elif edge == "bottom": mask[y1, x0:x1 + 1] = False; y1 -= 1
            elif edge == "left":   mask[y0:y1 + 1, x0] = False; x0 += 1
            else:                  mask[y0:y1 + 1, x1] = False; x1 -= 1
            cut = True
        if not cut: break
    return mask, x0, y0, x1, y1


def big_parts(mask, min_area):
    """mask のうち、まとまった広さのかたまりだけ残す（細い線・ギザギザは落とす）"""
    if not mask.any(): return mask
    lab, ds, bs = blobs(mask)
    keep = [b["id"] for b in bs if b["n"] >= min_area]
    if not keep: return np.zeros_like(mask)
    lu = np.repeat(np.repeat(lab, ds, axis=0), ds, axis=1)
    up = np.zeros(mask.shape, dtype=lab.dtype)
    up[:lu.shape[0], :lu.shape[1]] = lu
    return np.isin(up, keep) & mask


def head_width(mask, x0, x1, y0, y1):
    """頭のはばを測る。人物の上から45%の帯で「横につながっている いちばん長い部分」の70%点。

    ★max ではなく70%点なのをまちがえないこと。max だと笠や軍帽の つば を頭とみなしてしまう
      （伊能忠敬は max=89 / 70%点=66、小野妹子は 80 / 58。2026-07-30 実測）。
      つばは数行しかないので、70%点にすればひろわない。
    ★「横につながっている いちばん長い部分」なので、はなれた持ち物（つえ・旗）は入らない。
      ただし頭にくっついている持ち物までは分けられない → SIZE_ADJUST で手直しする。
    """
    hh = y1 - y0 + 1
    ws = []
    for y in range(y0, y0 + max(1, int(hh * 0.45))):
        row = mask[y, x0:x1 + 1]
        edge = np.flatnonzero(np.diff(np.concatenate(([0], row.astype(np.int8), [0]))))
        ws.append(int((edge[1::2] - edge[0::2]).max()) if edge.size else 0)
    return float(np.percentile(ws, 70)) if ws else 0.0


def find_cells(solid):
    """コマを読む順（左上→右、つぎの段）に並べて返す。考えかたは
      ・大きなかたまり＝人物。コマ1つにつき1人
      ・小さなかたまり＝持ち物・とんでいる紙・きらきら等。同じ段の近い人物にくっつける
      ・どの段にも重ならない小さなかたまり＝ラベル文字（①たち や ③）。捨てる
    cell["ids"] はそのコマに属するかたまり番号。ここで形どおりに切り出すので、
    となりの人物の刀がはみ出していても写りこまない。
    band=(by0,by1) はその段の上下で、足元をそろえるのに使う。"""
    lab, ds, bs = blobs(solid)
    if not bs: return [], [], (lab, ds)
    big = max(b["n"] for b in bs)
    people = [b for b in bs if b["n"] >= big * CELL_MIN]
    # ★ひどく細長い小片は、消しきれなかった線のにじみ（コマわくのふちの1〜2px）。
    #   人物にくっつけると点線になって残る（伊藤博文で40個ついていた。2026-07-30）。
    #   絵の細かい部分（とんでいる紙・きらきら・すみのしぶき）はどの辺も THIN_PIECE より太い。
    smalls = [b for b in bs if b["n"] < big * CELL_MIN
              and min(b["x1"] - b["x0"] + 1, b["y1"] - b["y0"] + 1) > THIN_PIECE]

    # 段に分ける（人物だけで）: 上ばしが今の段の下ばしより下なら新しい段
    people.sort(key=lambda b: b["y0"])
    rows, cur = [], []
    for b in people:
        if cur and b["y0"] > max(x["y1"] for x in cur) - (b["y1"] - b["y0"]) * 0.5:
            rows.append(cur); cur = []
        cur.append(b)
    if cur: rows.append(cur)

    out = []
    for row in rows:
        band = (min(b["y0"] for b in row), max(b["y1"] for b in row))
        for b in sorted(row, key=lambda b: b["x0"]):
            out.append(dict(b, band=band, ids=[b["id"]]))

    # 小さなかたまりを、上下が重なる段の中でいちばん近い人物にくっつける
    lost = 0
    for s in smalls:
        cand = [c for c in out if s["y0"] <= c["band"][1] and s["y1"] >= c["band"][0]]
        if not cand:
            lost += 1; continue                      # ラベル文字。捨てる
        def dist(c):
            dx = max(c["x0"] - s["x1"], s["x0"] - c["x1"], 0)
            dy = max(c["y0"] - s["y1"], s["y0"] - c["y1"], 0)
            return dx * dx + dy * dy
        c = min(cand, key=dist)
        c["ids"].append(s["id"])
        c["x0"] = min(c["x0"], s["x0"]); c["x1"] = max(c["x1"], s["x1"])
        c["y0"] = min(c["y0"], s["y0"]); c["y1"] = max(c["y1"], s["y1"])
    return out, lost, (lab, ds)


def numbered_preview(src, cells, cid):
    """コマに番号をふったプレビュー。CELL_PICK を決めるために出す。"""
    from PIL import ImageDraw
    sc = 700.0 / src.width
    cv = Image.new("RGBA", (int(src.width * sc), int(src.height * sc)), (150, 200, 235, 255))
    cv.alpha_composite(src.resize(cv.size, Image.LANCZOS))
    d = ImageDraw.Draw(cv)
    for i, c in enumerate(cells):
        box = [c["x0"] * sc, c["y0"] * sc, c["x1"] * sc, c["y1"] * sc]
        d.rectangle(box, outline=(220, 0, 0, 255), width=3)
        d.text((box[0] + 6, box[1] + 4), str(i + 1), fill=(220, 0, 0, 255))
    p = os.path.join(HERE, "%s_cells.png" % cid)
    cv.convert("RGB").save(p)
    return p


def slice_sheet(path, cid, debug=False, force_flip=(), pick=None):
    arr = np.array(Image.open(path).convert("RGBA"))
    rgb, alpha, how = key_background(arr, SOFT_SAT_BY.get(cid, SOFT_SAT), KEEP_BOX.get(cid))
    ndrop = DROP_SEED.get(cid)
    if ndrop:
        alpha = drop_seeds(rgb, alpha, ndrop, cid)
        how += " / 消したコマ %d" % len(ndrop)
    nglow = GLOW_SEED.get(cid)
    if nglow:
        alpha = drop_glow(rgb, alpha, nglow, cid)
        how += " / 消した光 %d" % len(nglow)
    solid, nlines = strip_lines(alpha > 40)

    src = Image.fromarray(np.dstack([
        np.clip(rgb, 0, 255).astype(np.uint8),
        np.clip(alpha, 0, 255).astype(np.uint8)]))

    cells, dropped, (lab, ds) = find_cells(solid)
    if not cells:
        raise SystemExit("[%s] 中身が見つからない。背景ぬきに失敗している" % cid)
    pick = pick or CELL_PICK.get(cid)
    if pick:
        flat = [i for g in pick for i in (g if isinstance(g, (tuple, list)) else (g,))]
        if max(flat) > len(cells):
            raise SystemExit("[%s] CELL_PICK が %s だが、コマは %d 個しか見つからない"
                             % (cid, pick, len(cells)))
        got = []
        for g in pick:
            grp = [cells[i - 1] for i in (g if isinstance(g, (tuple, list)) else (g,))]
            c = dict(grp[0])
            for o in grp[1:]:                       # はなれて描かれた光などを合体させる
                c["ids"] = c["ids"] + o["ids"]
                c["x0"] = min(c["x0"], o["x0"]); c["x1"] = max(c["x1"], o["x1"])
                c["y0"] = min(c["y0"], o["y0"]); c["y1"] = max(c["y1"], o["y1"])
                # ★段(band)も広げること。band は切り出しの上下の範囲そのものなので、
                #   合体させる相手が上や下にはみ出していると、書いた順しだいで
                #   相手のほうだけが残る（黒船のやられ＝けむりだけになった。2026-08-07）。
                c["band"] = (min(c["band"][0], o["band"][0]), max(c["band"][1], o["band"][1]))
            got.append(c)
        cells = got
    if len(cells) != 4:
        p = numbered_preview(src, cells, cid)
        raise SystemExit(
            "[%s] コマが %d 個みつかった（4つでない）。%s を見て、使う4コマの番号を\n"
            "      CELL_PICK に足すか --pick 1,2,3,5 のように指定してください。" % (cid, len(cells), p))

    h, w = solid.shape
    up = np.zeros((h, w), dtype=lab.dtype)
    lu = np.repeat(np.repeat(lab, ds, axis=0), ds, axis=1)       # 間引いた盤を元の大きさに戻す
    up[:lu.shape[0], :lu.shape[1]] = lu

    # 倍率は全コマ共通。大きさの基準は「たちコマの人物の高さ」＋「頭のはば」（§FIGURE_FRAC）。
    # 足元はたちコマの足元にそろえる。
    hstand = cells[0]["y1"] - cells[0]["y0"] + 1
    st = cells[0]
    hw = head_width(np.isin(up, st["ids"]) & solid, st["x0"], st["x1"], st["y0"], st["y1"])
    # ★人でないもの（船・火の玉・波）は「頭のはば」で補正しない。顔が無いので測れないため
    blend = 0.0 if cid in NON_HUMAN else HEAD_BLEND
    adj = (HEAD_REF / (hw / hstand)) ** blend if hw > 0 else 1.0
    # ★暴走よけ(ADJ_LIMIT)は **自動の補正だけ** にかける。手で書いた SIZE_ADJUST は信じてそのままかける
    #   （2026-08-07。足軽のように「槍が背たけの1.6倍」ある絵は、自動の上限1.25では足りないため）
    adj = min(max(adj, ADJ_LIMIT[0]), ADJ_LIMIT[1])
    adj *= SIZE_ADJUST.get(cid, 1.0)
    side = int(round(hstand / (FIGURE_FRAC * adj)))
    foot = int(round(side * FOOT_RATIO))          # 足元の線＝キャンバス下ばしから foot px
    # たちコマが自分の段の下ばしからどれだけ浮いているか。これを引いて置くことで、
    # 「段の下ばし」ではなく「たちコマの足元」がどの人物でも同じ高さに来る。
    # （段の下ばしは、やられコマが低く描かれていると下がってしまい、人物が浮いていた）
    off_s = cells[0]["band"][1] - cells[0]["y1"]
    frames = []
    for c in cells:
        by0, by1 = c["band"]
        # そのコマのかたまりだけを残す。長方形で切るとなりの人物の刀が写りこむため
        mine = np.isin(up, c["ids"]) & solid
        mine, _, _, _, _ = strip_edges(mine, c["x0"], c["y0"], c["x1"], c["y1"])
        cimg = np.dstack([np.clip(rgb, 0, 255).astype(np.uint8),
                          np.where(mine, np.clip(alpha, 0, 255), 0).astype(np.uint8)])
        foot_top = by1 - max(4, int((by1 - by0 + 1) * 0.08))     # 足元とみなす帯
        # 横の基準は「足元の中心」。持ち物のはみ出しで人物がズレないようにする
        # （たち＝鏡を前に出す / あるき＝出さない、で中心が変わってしまうため）
        fx = np.nonzero(mine[foot_top:by1 + 1].any(axis=0))[0]
        anchor = (int(fx.mean()) if fx.size else (c["x0"] + c["x1"]) // 2) - c["x0"]
        cell = Image.fromarray(cimg).crop((c["x0"], by0, c["x1"] + 1, by1 + 1))
        board = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        # ★たてだけ のばす（STRETCH_Y）。よこは さわらないので 顔は太らない。
        sy = STRETCH_Y.get(cid, 1.0)
        ch0 = by1 - by0 + 1
        if sy != 1.0:
            cell = cell.resize((c["x1"] - c["x0"] + 1, max(1, int(round(ch0 * sy)))), Image.LANCZOS)
        # たちコマの足元を foot の線にそろえる。
        # ★のばしたときは **足元までの きょり も のびる**ので、そこも sy 倍すること
        #   （ここを直さないと 人が 宙に浮く／地面に めりこむ）。
        top = int(round(side - foot - (ch0 - off_s) * sy))
        if top < 0:
            print("[%s] ※注意: %s の上が %dpx はみ出して切れます（FIGURE_FRAC を下げる）"
                  % (cid, ORDER[len(frames)], -top))
        if top + cell.size[1] > side:
            print("[%s] ※注意: %s の下が %dpx はみ出して切れます（FOOT_RATIO を上げる）"
                  % (cid, ORDER[len(frames)], top + cell.size[1] - side))
        cw = c["x1"] - c["x0"] + 1
        left = side // 2 - anchor
        if left < 0 or left + cw > side:
            print("[%s] ※注意: %s の横が %dpx はみ出して切れます（SIZE_ADJUST を下げる）"
                  % (cid, ORDER[len(frames)], max(-left, left + cw - side)))
        board.paste(cell, (left, top))
        frames.append(board.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS))

    # --- 向きをそろえる。左向きで出てきたコマは反転する（生成し直さない）
    #     たおれたコマ(down)は「右向きの人が後ろへふっとぶ＝頭が左」が正しいので触らない。
    made, dirs = [], []
    for i, name in enumerate(ORDER):
        f = facing(frames[i])
        flip = (f < 0 and name in FLIP_POSES) or (name in force_flip)
        fix = FACE_FIX.get(cid)                     # 自動判定が外れる人の手直し
        if isinstance(fix, str): fix = dict((p, fix) for p in FLIP_POSES)
        act = (fix or {}).get(name)
        if name in FLIP_POSES:
            if act == "flip": flip = True
            elif act == "keep": flip = False
        if flip: frames[i] = frames[i].transpose(Image.FLIP_LEFT_RIGHT)
        dirs.append("%s:%s%s" % (name, {1: "右", -1: "左", 0: "正面"}[f], "→反転" if flip else ""))

    outdir = os.path.join(out_root(cid), cid)  # 1体ごとのフォルダ。無ければ作る（敵は images/enemies/）
    if not os.path.isdir(outdir): os.makedirs(outdir)
    for img, name in zip(frames, ORDER):
        out = os.path.join(outdir, "%s.webp" % name)
        img.save(out, "WEBP", quality=WEBP_Q, method=6)
        made.append((name, os.path.getsize(out)))

    print("[%s] %s / 消した線 %d本 / 大きさ補正 ×%.3f（頭のはば %.2f）"
          % (cid, how, nlines, adj, hw / hstand))
    print("      向き " + " / ".join(dirs))
    print("      捨てた小片 %d / コマ %s" % (dropped,
          [(c["x0"], c["band"][0], c["x1"], c["band"][1]) for c in cells]))
    print("      " + "  ".join("%s %.0fKB" % (n, s / 1024) for n, s in made))

    if debug:
        bgc = (150, 200, 235, 255)
        cv = Image.new("RGBA", (4 * 270 + 20, OUT_SIZE + 170), bgc)
        for i, img in enumerate(frames):
            cv.paste(img, (20 + i * 270, 10), img)
            for j, s in enumerate((64, 48)):
                t = img.resize((s, s), Image.LANCZOS)
                cv.paste(t, (20 + i * 270 + 100, OUT_SIZE + 30 + j * 70), t)
        dp = os.path.join(HERE, "%s_debug.png" % cid)
        cv.save(dp); print("      debug: %s" % dp)
    return made


def bump_asset_v():
    """index.html の ASSET_V を1つ繰り上げる（画像のキャッシュよけ。CLAUDE.md §4）。

    ★これが無いと、絵を作りなおしてもブラウザが前の絵を出しつづける。
      2026-08-03に実際にハマった（大きさを直しても画面がまったく変わらなかった）。
      人が手で繰り上げるのを忘れるので、絵を作る道具の側で必ずやることにした。
    """
    p = os.path.join(HERE, "index.html")
    if not os.path.exists(p): return None
    with open(p, encoding="utf-8") as f:
        s = f.read()
    m = re.search(r"var ASSET_V = (\d+);", s)
    if not m:
        print("※注意: index.html に ASSET_V が見つからないのでキャッシュよけを繰り上げできません")
        return None
    n = int(m.group(1)) + 1
    with open(p, "w", encoding="utf-8") as f:
        f.write(s[:m.start()] + "var ASSET_V = %d;" % n + s[m.end():])
    return n


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    debug = "--debug" in sys.argv
    # 自動判定が外れたときの手動指定: --flip walk,atk （そのコマを必ず反転する）
    # コマが5つ以上あるシート用: --pick 1,2,3,5 （読む順の何番目を使うか）
    force_flip, pick = (), None
    for i, a in enumerate(sys.argv):
        if a == "--flip" and i + 1 < len(sys.argv):
            force_flip = tuple(x.strip() for x in sys.argv[i + 1].split(","))
            if force_flip and force_flip[0] in args: args.remove(force_flip[0])
        if a == "--pick" and i + 1 < len(sys.argv):
            spec = sys.argv[i + 1]
            pick = tuple(int(x) for x in spec.split(","))
            if spec in args: args.remove(spec)
    args = [a for a in args if a not in force_flip]
    if not args: args = all_sheets()
    if not args:
        raise SystemExit("sheets/ に *_sheet.png がありません")
    n = 0
    for cid in args:
        p = sheet_path(cid)
        if not p:
            print("[%s] シートが無い（sheets/%s_sheet.png を置いてください）" % (cid, cid)); continue
        if not p.startswith(SHEETS):
            print("[%s] ※シートが公開フォルダ(images/)にあります。1枚1.5MBあるので\n"
                  "      sheets/%s_sheet.png へ移してください" % (cid, cid))
        slice_sheet(p, cid, debug, force_flip, pick)
        n += 1
    if n:
        v = bump_asset_v()
        if v: print("index.html の ASSET_V を %d にしました（画像のキャッシュよけ）" % v)


if __name__ == "__main__":
    main()
