/* ------------------------------------------------------------------ *
 * 2. データ：ミニゲーム
 *    kind …… どの「型（エンジン）」で動かすか。第1段は tsunagu だけ実装ずみ。
 *    jhs  …… 🎓「中学でも つかうよ」の印
 *    soon …… まだ中身が入っていない（じゅんびちゅう表示）
 * ------------------------------------------------------------------ */
var LAMP_R = 1, BATT_V = 1.5, REF_I = BATT_V / LAMP_R;
/* モーターは まめでんきゅうと おなじ とおりにくさ（明るさと 回る はやさを くらべやすい ように）。
   けんりゅうけいは でんきの みちの じゃまを ほとんど しない ＝ とても 小さい ていこう。
   MAX_I …… これいじょう ながれる つなぎ方は あぶない あつかい（けんりゅうけいだけを でんちに
   つなぐ／でんきゅうの りょうはしを けんりゅうけいで つなぐ、など ほんものなら こわれる つなぎ方）。 */
var MOTOR_R = 1, GALV_R = 0.05, MAX_I = 10;

/* ながれた でんりゅうを「でんち1こ＋でんきゅう1こ」を 1.0 と した ときの ばいりつに して
   5だんかいに わける。off いがいは そのまま 明るさ／回る はやさ／はりの ふれ に つかう。
   ・faint  とても くらい（でんきゅう3こ 直列 ＝ 0.33）
   ・dim    くらい      （でんきゅう2こ 直列 ＝ 0.50）
   ・full   ふつう      （でんち1こ・でんきゅう1こ ＝ 1.00）
   ・bright とても 明るい（でんち2こ 直列 ＝ 2.00） */
function iCat(ratio){
  return ratio < 0.06 ? 'off'
       : ratio < 0.42 ? 'faint'
       : ratio < 0.78 ? 'dim'
       : ratio < 1.35 ? 'full' : 'bright';
}

/* でんじしゃく の じょうけん。3もん 共通。つよさ ∝ まきかず × でんりゅう（しんが 鉄の とき）。 */
var JISHAKU_VARS = [
  { id:'maki',   label:'コイルの まきかず',       values:[{ label:'100かい', v:100 }, { label:'200かい', v:200 }] },
  { id:'denchi', label:'かんでんちの 数（直列）', values:[{ label:'1こ',    v:1   }, { label:'2こ',    v:2   }] },
  { id:'shin',   label:'しんの ざいりょう',       values:[{ label:'鉄',     v:'tetsu' }, { label:'アルミ', v:'alumi' }] }
];
/* もののとけ方 の じょうけん。per50 は 水50mL に とける りょう（g）。じっさいの ようかい度を まるめた 数ち。
   えらびようが 1つしか ない 行は「この じっけんは 食塩で やる」の 意味（loadJikken が 先に 入れる）。 */
var TOKE_MONO = {
  shio:   { name:'食塩',     per50:{ 20:18, 60:19 }, water:'#D7E9F5', grain:'#FFFFFF', line:'#9FB4C4' },
  myoban: { name:'ミョウバン', per50:{ 20:6,  60:29 }, water:'#E3DCF6', grain:'#F6F2FF', line:'#A99AD6' }
};
var TOKE_MIZU = { id:'mizu', label:'水の りょう', values:[{ label:'50mL', v:50 }, { label:'100mL', v:100 }] };
var TOKE_ONDO = { id:'ondo', label:'水の おん度', values:[{ label:'20ど', v:20 }, { label:'60ど', v:60 }] };
var TOKE_VARS = [
  { id:'mono', label:'とかす もの', values:[{ label:'食塩', v:'shio' }, { label:'ミョウバン', v:'myoban' }] },
  TOKE_MIZU, TOKE_ONDO
];
/* えらびようが 1つしか ない 行は、はじめから 入って いる（＝「この じっけんは 食塩で やる」の 意味） */
var TOKE_VARS_SHIO   = [ { id:'mono', label:'とかす もの', values:[{ label:'食塩', v:'shio' }] }, TOKE_MIZU, TOKE_ONDO ];
var TOKE_VARS_MYOBAN = [ { id:'mono', label:'とかす もの', values:[{ label:'ミョウバン', v:'myoban' }] }, TOKE_MIZU, TOKE_ONDO ];
/* たねの 発芽の じょうけん。🔬かんがえかたの島（条件制御）で つかう。
   発芽に いるのは 水・空気・てきとうな温度 の 3つだけ。日光と 肥料は いらない。
   （書いて いない じょうけんは「あり」あつかい。だから 表に 出す 行を 問題ごとに えらべる） */
var HG = {
  mizu:   { id:'mizu',   label:'水',     values:[{ label:'あり', v:1 }, { label:'なし', v:0 }] },
  kuki:   { id:'kuki',   label:'空気',   values:[{ label:'あり', v:1 }, { label:'水に しずめる', v:0 }] },
  ondo:   { id:'ondo',   label:'温度',   values:[{ label:'20ど', v:20 }, { label:'5ど', v:5 }] },
  hikari: { id:'hikari', label:'日光',   values:[{ label:'あてる', v:1 }, { label:'あてない', v:0 }] },
  hiryo:  { id:'hiryo',  label:'肥料',   values:[{ label:'あり', v:1 }, { label:'なし', v:0 }] }
};
var HATSUGA_A = [HG.mizu, HG.ondo, HG.hikari, HG.hiryo];
var HATSUGA_B = [HG.mizu, HG.kuki, HG.ondo, HG.hiryo];

/* 水よう液の せいしつ表。**道具の けっかは ぜんぶ ここから 計算する**（正かいの 手じゅんは 用意しない）。
   さんせい＝炭酸水・うすい塩酸／中せい＝食塩水・さとう水／アルカリせい＝石灰水・アンモニア水。
   awa（見た目で 分かる あわ）だけは 道具を つかわなくても 見える。 */
var SUI_EKI = [
  { id:'shio',    name:'食塩水',       sei:'中',      ato:'白い つぶ',    nioi:false, tetsu:false, sekkai:false, awa:false },
  { id:'sato',    name:'さとう水',     sei:'中',      ato:'黒く こげる',  nioi:false, tetsu:false, sekkai:false, awa:false },
  { id:'tansan',  name:'炭酸水',       sei:'さん',    ato:'なし',        nioi:false, tetsu:false, sekkai:true,  awa:true  },
  { id:'ensan',   name:'うすい塩酸',   sei:'さん',    ato:'なし',        nioi:true,  tetsu:true,  sekkai:false, awa:false },
  { id:'sekkai',  name:'石灰水',       sei:'アルカリ', ato:'白い つぶ',   nioi:false, tetsu:false, sekkai:false, awa:false },
  { id:'anmonia', name:'アンモニア水', sei:'アルカリ', ato:'なし',        nioi:true,  tetsu:false, sekkai:false, awa:false }
];
/* 道具。read＝メモに のこす みじかい けっか、full＝したに 出す ことば。 */
var SUI_TOOLS = [
  { id:'litmus', name:'リトマス紙', hint:'リトマス紙を つける びんを えらぼう',
    read:function(e){
      return e.sei === 'さん'      ? { t:'さんせい',    c:'#E05A4A' }
           : e.sei === 'アルカリ'  ? { t:'アルカリせい', c:'#1B7FA8' }
                                   : { t:'中せい',      c:'#5A7C93' };
    },
    full:function(e){
      return e.sei === 'さん'      ? '青い リトマス紙が 赤に なった ＝ さんせい'
           : e.sei === 'アルカリ'  ? '赤い リトマス紙が 青に なった ＝ アルカリせい'
                                   : 'どちらの 色も かわらない ＝ 中せい';
    } },
  { id:'evap', name:'じょうはつ', hint:'蒸発皿で 水を とばす びんを えらぼう',
    read:function(e){ return { t:e.ato, c:(e.ato === 'なし' ? '#5A7C93' : '#8A5B00') }; },
    full:function(e){
      return e.ato === 'なし' ? '水が とんだ あと、何も のこらなかった（気体が とけて いる）'
                             : 'あとに ' + e.ato + '（固体が とけて いる）';
    } },
  { id:'nioi', name:'におい', hint:'手で あおいで におう びんを えらぼう（ぜったいに なめない）',
    read:function(e){ return e.nioi ? { t:'つんと する', c:'#8A5B00' } : { t:'におい なし', c:'#5A7C93' }; },
    full:function(e){ return e.nioi ? 'つんと した においが した' : 'においは しなかった'; } },
  { id:'tetsu', name:'鉄くぎ', hint:'鉄くぎを 入れる びんを えらぼう',
    read:function(e){ return e.tetsu ? { t:'鉄が とけた', c:'#E05A4A' } : { t:'かわらない', c:'#5A7C93' }; },
    full:function(e){ return e.tetsu ? '鉄くぎが あわを 出して とけた' : '鉄くぎは かわらなかった'; } },
  { id:'sekkai', name:'石灰水', hint:'石灰水を 入れる びんを えらぼう',
    read:function(e){ return e.sekkai ? { t:'白く にごる', c:'#8A5B00' } : { t:'かわらない', c:'#5A7C93' }; },
    full:function(e){ return e.sekkai ? '石灰水が 白く にごった（二酸化炭素が とけて いる）' : '石灰水は かわらなかった'; } }
];

/* 花の つくりの「あたり」。3もん 共通 */
var HANA_TARGETS = [
  { id:'meshibe',  label:'めしべ',  hits:[[300,186,26]] },
  { id:'oshibe',   label:'おしべ',  hits:[[238,204,26],[362,204,26]] },
  { id:'hanabira', label:'花びら',  hits:[[196,146,34],[404,146,34]] },
  { id:'gaku',     label:'がく',    hits:[[230,306,26],[370,306,26]] },
  { id:'shibou',   label:'子ぼう',  hits:[[300,288,26]] }
];
/* 川の 図の「あたり」。曲がりの 外がわ／内がわ が この単元の キモ */
var KAWA_TARGETS = [
  { id:'jouryu', label:'上流',                 hits:[[66,150,30]] },
  { id:'soto1',  label:'上の 曲がりの 外がわ', hits:[[240,40,30]] },
  { id:'uchi1',  label:'上の 曲がりの 内がわ', hits:[[240,146,30]] },
  { id:'uchi2',  label:'下の 曲がりの 内がわ', hits:[[440,244,30]] },
  { id:'soto2',  label:'下の 曲がりの 外がわ', hits:[[440,352,30]] },
  { id:'karyu',  label:'下流',                 hits:[[556,340,30]] }
];
/* グラフの「あたり」 */
var GRAPH_TARGETS = [
  { id:'jiku_x', label:'よこじく',             hits:[[316,387,30]] },
  { id:'jiku_y', label:'たてじく',             hits:[[48,208,30]] },
  { id:'ten1',   label:'25cmの 点',            hits:[[110,234,28]] },
  { id:'ten2',   label:'50cmの 点',            hits:[[247,194,28]] },
  { id:'ten4',   label:'100cmの 点',           hits:[[520,137,28]] },
  { id:'nazo',   label:'しらべて いない ところ', hits:[[566,200,28]] }
];

/* 人のからだ の「あたり」。3もん 共通なので ここに 1つだけ おく。
   hits は [x, y, はんけい]。lx/ly は みつけた ときの 名ふだの ばしょ。 */
var TAI_TARGETS = [
  { id:'kuchi',  label:'口',     hits:[[300,116,26]],              lx:392, ly:108 },
  { id:'hai',    label:'肺',     hits:[[250,192,28],[350,192,28]], lx:196, ly:170 },
  { id:'shinzo', label:'心臓',   hits:[[300,228,22]],              lx:424, ly:214 },
  { id:'kanzo',  label:'かん臓', hits:[[258,266,28]],              lx:186, ly:258 },
  { id:'i',      label:'胃',     hits:[[346,274,28]],              lx:424, ly:282 },
  { id:'shocho', label:'小腸',   hits:[[300,338,26]],              lx:424, ly:348 },
  { id:'daicho', label:'大腸',   hits:[[246,340,20],[354,340,20]], lx:186, ly:378 }
];

/* 「どの でんきゅうでも いい」タイプの goal を つくる ヘルパー。
   もんだいが 「3このうち 1こだけ 消せるように」と 言って いるのに、消すのを l3 に 決めうちに
   すると、l1 で 作った 子が ×に なる。おなじ 勉強なので ぜんぶ 通す（goal.anyOf に わたす）。 */
function goalOnly1Off(ids){                        /* 並列。スイッチを 切ると どれか 1こだけ 消える */
  return ids.map(function(x){
    var rest = ids.filter(function(y){ return y !== x; });
    var all = {}; ids.forEach(function(y){ all[y] = 'full'; });
    return [ { sw:{s1:true},  on:ids.slice(), bright:all },
             { sw:{s1:false}, on:rest, off:[x] } ];
  });
}
function goalTrunkSplit(ids){                      /* 1こ とおった あと 2本に わかれる。みきは どれでも いい */
  return ids.map(function(t){
    var br = {};
    ids.forEach(function(y){ br[y] = (y === t ? 'dim' : 'faint'); });
    return [ { on:ids.slice(), bright:br } ];
  });
}
