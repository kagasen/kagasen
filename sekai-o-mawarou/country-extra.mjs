// 手で書くデータ（build-data.mjs が読む）。ここを直して再生成する。
// ・どの国をアプリに出すか（196ヶ国）
// ・小学生向けの国名（Natural Earth の正式名称だと長いものだけ上書き）
// ・面している海（⛴フェリーの判定に使う）
// ・ベーシック40 / ハードで追加する国
//
// ★数え方: 国連加盟193ヶ国＋バチカン＋パレスチナ＋コソボ＝196ヶ国（日本の地図帳と同じ考え方）。
//   香港・マカオ・グリーンランドなどは「国」ではないので入れていない。

// ───────── 出す国（196ヶ国）。値は上書きしたいものだけ書く ─────────
export const EXTRA = {
  // アジア
  JP: { ja: '日本' }, KR: { ja: 'かんこく' }, KP: { ja: 'きたちょうせん' }, CN: { ja: '中国' },
  MN: { ja: 'モンゴル' }, TW_SKIP: undefined,
  IN: {}, PK: {}, BD: {}, NP: { ja: 'ネパール' }, BT: {}, LK: {}, MV: { cont: 'asia' },
  TH: { ja: 'タイ' }, VN: {}, LA: {}, KH: {}, MM: {}, MY: {}, SG: {}, BN: {}, ID: {}, TL: {}, PH: {},
  KZ: {}, UZ: {}, TM: {}, KG: {}, TJ: {}, AF: {},
  IR: {}, IQ: {}, SY: {}, LB: {}, IL: {}, PS: { ja: 'パレスチナ', cap: 'ラマラ' },
  JO: {}, SA: {}, YE: {}, OM: {},
  AE: { ja: 'アラブしゅちょうこく' }, QA: {}, BH: {}, KW: {}, TR: {}, CY: {}, GE: {}, AM: {}, AZ: {},
  // ※ PS（パレスチナ）と SS（南スーダン）は元データに首都が入っていないので手で入れる

  // ヨーロッパ
  GB: { ja: 'イギリス' }, IE: {}, FR: {}, DE: {}, IT: {}, ES: {}, PT: {}, NL: {}, BE: {}, LU: {},
  CH: {}, AT: {}, LI: {}, MC: {}, AD: {}, SM: {}, VA: { ja: 'バチカン' }, MT: {},
  DK: {}, NO: {}, SE: {}, FI: {}, IS: {}, EE: {}, LV: {}, LT: {},
  PL: {}, CZ: {}, SK: {}, HU: {}, RO: {}, BG: {}, GR: {}, AL: {}, MK: {}, RS: {}, XK: { ja: 'コソボ' },
  ME: {}, BA: {}, HR: {}, SI: {}, UA: {}, BY: {}, MD: {}, RU: {},

  // アフリカ
  EG: {}, LY: {}, TN: {}, DZ: {}, MA: {}, MR: {}, ML: { ja: 'マリ' }, NE: {}, TD: {}, SD: {},
  SS: { cap: 'ジュバ' },
  ER: {}, DJ: {}, ET: {}, SO: {}, KE: {}, UG: {}, RW: {}, BI: {}, TZ: {},
  CF: { ja: 'ちゅうおうアフリカ' }, CM: {}, NG: {}, BJ: {}, TG: {}, GH: {}, CI: {}, LR: {}, SL: {},
  GN: {}, GW: {}, GM: {}, SN: {}, CV: {}, BF: {},
  GQ: {}, GA: {}, CG: { ja: 'コンゴきょうわこく' }, CD: { ja: 'コンゴみんしゅきょうわこく' },
  AO: {}, ZM: {}, MW: {}, MZ: {}, ZW: {}, BW: {}, NA: {}, ZA: { ja: 'みなみアフリカ' },
  LS: {}, SZ: {}, MG: {}, KM: {}, MU: { cont: 'africa' }, SC: { cont: 'africa' }, ST: {},

  // 北アメリカ
  US: { ja: 'アメリカ' }, CA: {}, MX: {}, GT: {}, BZ: {}, SV: {}, HN: {}, NI: {}, CR: {}, PA: {},
  CU: {}, JM: {}, HT: {}, DO: { ja: 'ドミニカきょうわこく' }, BS: {}, TT: {}, BB: {},
  DM: { ja: 'ドミニカこく' }, LC: {}, VC: {}, GD: {}, AG: {}, KN: {},

  // 南アメリカ
  BR: {}, AR: {}, CL: {}, PE: {}, CO: {}, VE: {}, EC: {}, BO: {}, PY: {}, UY: {}, GY: {}, SR: {},

  // オセアニア
  AU: {}, NZ: {}, PG: {}, FJ: {}, SB: {}, VU: {}, WS: {}, TO: {}, TV: {}, KI: {},
  NR: { cap: 'ヤレン' },
  MH: {}, FM: {}, PW: { cap: 'マルキョク' },
  // ※ NR（ナウル）は元データに首都が入っていないので手で入れる

  // 海外の飛び地どうしの国境は消す（子どもが混乱するため）
  // 例: フランス⇔ブラジル／スリナムは「仏領ギアナ」、オランダ⇔フランスは「シント・マールテン島」
  __cutBorders: [['FR', 'BR'], ['FR', 'SR'], ['NL', 'FR']],
  // 元データ（world-atlas）に国境が入っていない国は手で足す
  __addBorders: [['XK', 'RS'], ['XK', 'ME'], ['XK', 'AL'], ['XK', 'MK']],
  // ★2026-08-23 追加。元データが「べつの土地」としてあつかっているが、
  //   日本の地図帳ではその国の一部として描かれる土地を、国にくっつける。
  //   ★ここを入れないと「となり国」が抜ける。実例:
  //     ソマリランドを別あつかいにすると **ソマリアとジブチが となり国にならない**
  //     （ユーザー報告 2026-08-23 の点検で見つかった）。
  //   ★係争地（西サハラ・シアチェン氷河）と台湾は **さわらない**。
  //     日本の地図帳でも点線・別あつかいで、どちらに入れても政治的な判断になるため。
  __mergeLand: {
    'Somaliland': 'SO',   // 国連未加盟。日本の地図帳では ソマリアの一部 → ソマリア⇔ジブチが つながる
    'N. Cyprus': 'CY',    // 北キプロス。日本の地図帳では キプロスの一部（島が2色に割れない）
    'Hong Kong': 'CN',    // ホンコン＝中国の特別行政区（地図に小さな穴があかない）
    'Macao': 'CN',        // マカオ＝同上
  },
};
delete EXTRA.TW_SKIP;

// ───────── ベーシック40（有名な国。大陸のバランスをとってある）─────────
export const BASIC40 = [
  'JP', 'KR', 'CN', 'IN', 'TH', 'VN', 'PH', 'ID', 'SA', 'MN',                 // アジア10
  'GB', 'FR', 'DE', 'IT', 'ES', 'RU', 'NL', 'CH', 'SE', 'GR',                 // ヨーロッパ10
  'EG', 'KE', 'ZA', 'NG', 'MA', 'ET',                                          // アフリカ6
  'US', 'CA', 'MX', 'CU', 'JM',                                                // 北アメリカ5
  'BR', 'AR', 'PE', 'CL', 'CO',                                                // 南アメリカ5
  'AU', 'NZ', 'FJ', 'PG',                                                      // オセアニア4
];

// ───────── ハードで追加する国（合わせて約100ヶ国になる）─────────
export const HARD_EXTRA = [
  'KP', 'TR', 'IR', 'IQ', 'IL', 'AE', 'MY', 'SG', 'BD', 'PK', 'NP', 'LK', 'MM', 'KH', 'KZ', 'UZ',
  'AF', 'QA', 'JO', 'SY',
  'PL', 'PT', 'BE', 'AT', 'NO', 'DK', 'FI', 'IE', 'CZ', 'HU', 'UA', 'RO', 'HR', 'RS', 'BG', 'IS',
  'DZ', 'TN', 'LY', 'SD', 'GH', 'TZ', 'UG', 'MG', 'CM', 'CI', 'SN', 'ZW',
  'GT', 'CR', 'PA', 'DO', 'HT',
  'VE', 'EC', 'BO', 'UY', 'PY',
  'SB', 'VU', 'WS', 'TO',
];

// ───────── 大洋（⛴フェリーの判定に使う。ユーザー決定「同じ海・洋に面していればOK」）─────────
// ★2026-08-16 のバランス検証で、海だけ（大洋なし）だと つながる国の組み合わせが 21.5%しかなく、
//   12週の旅程が どうやっても 完成しないことが分かった。大洋を入れると 配られた時点の
//   「こわれ」が 中央値4→2 に下がり、ゲームとして成立する。（検証は HANDOFF.md）
//   地中海・黒海は 大洋には つなげない（地中海の国が「大西洋に面している」ことに なってしまうため）。
export const OCEANS = {
  pac: { ja: '太平洋' },
  atl: { ja: '大西洋' },
  ind: { ja: 'インドよう' },
};
export const OCEAN_OF = {
  ohotsuku: 'pac', nihonkai: 'pac', koukai: 'pac', higashi: 'pac', minamishina: 'pac',
  philippine: 'pac', serebesu: 'pac', coral: 'pac', tasman: 'pac', minamitaiheiyo: 'pac',
  bering: 'pac', taiheiyo_na: 'pac',
  hokkai: 'atl', irish: 'atl', norway: 'atl', iberia: 'atl', baltic: 'atl', guinea: 'atl',
  nishiafrica: 'atl', minamiafrica: 'atl', caribbean: 'atl', mexico: 'atl',
  taiseiyo_na: 'atl', taiseiyo_sa: 'atl', hokkyoku: 'atl',
  arafura: 'ind', bengal: 'ind', arabia: 'ind', indoafrica: 'ind', mozambique: 'ind',
  persia: 'ind', kouumi: 'ind',
};

// ───────── 海（⛴フェリーの判定に使う）─────────
// ★ここが「同じ海に面していればフェリーで行ける」の元データ。
//   上の OCEAN_OF によって、それぞれの海は 大洋にも つながる。
export const SEAS = {
  ohotsuku:   { ja: 'オホーツク海',      members: ['RU', 'JP'] },
  nihonkai:   { ja: '日本海',            members: ['JP', 'KR', 'KP', 'RU'] },
  koukai:     { ja: '黄海',              members: ['CN', 'KR', 'KP'] },
  higashi:    { ja: '東シナ海',          members: ['JP', 'CN', 'KR'] },
  minamishina:{ ja: '南シナ海',          members: ['CN', 'VN', 'PH', 'MY', 'BN', 'ID', 'SG', 'KH', 'TH'] },
  philippine: { ja: 'フィリピン海',      members: ['JP', 'PH', 'PW'] },
  serebesu:   { ja: 'セレベス海・ジャワ海', members: ['ID', 'MY', 'PH', 'BN', 'TL', 'SG'] },
  arafura:    { ja: 'アラフラ海・チモール海', members: ['AU', 'ID', 'PG', 'TL'] },
  // モルディブは アフリカがわではなく インドがわ。遠すぎるフェリーが できないようにするため
  bengal:     { ja: 'ベンガルわん',      members: ['IN', 'BD', 'MM', 'LK', 'TH', 'MV'] },
  arabia:     { ja: 'アラビア海',        members: ['OM', 'PK', 'IN', 'IR', 'YE', 'MV', 'SO', 'AE'] },
  persia:     { ja: 'ペルシャわん',      members: ['IR', 'IQ', 'KW', 'SA', 'BH', 'QA', 'AE', 'OM'] },
  kouumi:     { ja: '紅海',              members: ['EG', 'SD', 'ER', 'DJ', 'SA', 'YE', 'JO', 'IL'] },
  caspian:    { ja: 'カスピ海',          members: ['RU', 'KZ', 'TM', 'IR', 'AZ'] },
  kokkai:     { ja: '黒海',              members: ['TR', 'BG', 'RO', 'UA', 'RU', 'GE'] },
  chichukai:  { ja: '地中海',            members: ['ES', 'FR', 'IT', 'MT', 'SI', 'HR', 'BA', 'ME', 'AL', 'GR', 'TR', 'CY', 'SY', 'LB', 'IL', 'PS', 'EG', 'LY', 'TN', 'DZ', 'MA', 'MC'] },
  baltic:     { ja: 'バルトかい',        members: ['SE', 'FI', 'EE', 'LV', 'LT', 'PL', 'DE', 'DK', 'RU'] },
  hokkai:     { ja: '北海',              members: ['GB', 'NO', 'DK', 'DE', 'NL', 'BE', 'FR'] },
  irish:      { ja: 'ドーバー海きょう・アイリッシュ海', members: ['GB', 'IE', 'FR'] },
  norway:     { ja: 'ノルウェー海',      members: ['NO', 'IS', 'GB'] },
  hokkyoku:   { ja: '北極海',            members: ['RU', 'NO', 'US', 'CA', 'IS'] },
  iberia:     { ja: 'ビスケーわん・イベリアの海', members: ['FR', 'ES', 'PT', 'MA'] },
  guinea:     { ja: 'ギニアわん',        members: ['NG', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'GH', 'TG', 'BJ', 'CI', 'LR', 'ST'] },
  nishiafrica:{ ja: '西アフリカの海',    members: ['MA', 'MR', 'SN', 'GM', 'GW', 'GN', 'SL', 'LR', 'CV', 'CI'] },
  minamiafrica:{ ja: '南東大西洋',   members: ['ZA', 'NA', 'AO'] },
  indoafrica: { ja: '西インドよう', members: ['ZA', 'MZ', 'TZ', 'KE', 'SO', 'MG', 'KM', 'MU', 'SC'] },
  mozambique: { ja: 'モザンビーク海きょう', members: ['MZ', 'MG', 'KM', 'TZ'] },
  caribbean:  { ja: 'カリブ海',          members: ['CU', 'JM', 'HT', 'DO', 'BS', 'TT', 'BB', 'LC', 'VC', 'GD', 'DM', 'AG', 'KN', 'MX', 'BZ', 'GT', 'HN', 'NI', 'CR', 'PA', 'CO', 'VE', 'GY'] },
  mexico:     { ja: 'メキシコわん',      members: ['US', 'MX', 'CU'] },
  taiheiyo_na:{ ja: '東太平洋', members: ['US', 'CA', 'MX', 'GT', 'SV', 'HN', 'NI', 'CR', 'PA', 'CO', 'EC', 'PE', 'CL'] },
  taiseiyo_na:{ ja: '北大西洋', members: ['US', 'CA', 'BS'] },
  taiseiyo_sa:{ ja: '南大西洋', members: ['BR', 'UY', 'AR', 'GY', 'SR', 'VE'] },
  coral:      { ja: 'サンゴ海',          members: ['AU', 'PG', 'SB', 'VU', 'FJ'] },
  tasman:     { ja: 'タスマン海',        members: ['AU', 'NZ'] },
  minamitaiheiyo:{ ja: '南太平洋のしまじま', members: ['FJ', 'TO', 'WS', 'TV', 'KI', 'NR', 'VU', 'SB', 'PG', 'MH', 'FM', 'PW', 'NZ'] },
  bering:     { ja: 'ベーリング海',      members: ['RU', 'US'] },
};
