const appsData = [
    {
        id: "energy-no-shima",
        draft: true,   /* まだ公開しない（ポータルのカード・sitemapに出さない）*/
        title: "エネルギーの島",
        description: "でんき回路・てこ・ふりこ・発電など、エネルギーを たしかめる 6つのゲーム・全104もん。4つの島 ぜんぶで かんがえかたの島が ひらくよ。",
        category: "science",
        tagName: "理科",
        date: "2026/08/30",
        colorClass: "subject-orange",
        image: "images/energy-no-shima.svg",
        link: "energy-no-shima/index.html"
    },
    {
        id: "tsubutsubu-no-shima",
        draft: true,   /* まだ公開しない（ポータルのカード・sitemapに出さない）*/
        title: "つぶつぶの島",
        description: "もののとけ方・水よう液・もえ方・重さを「つぶ」で考える 4つのゲーム・全13もん。4つの島 ぜんぶで かんがえかたの島が ひらくよ。",
        category: "science",
        tagName: "理科",
        date: "2026/08/30",
        colorClass: "subject-purple",
        image: "images/tsubutsubu-no-shima.svg",
        link: "tsubutsubu-no-shima/index.html"
    },
    {
        id: "inochi-no-shima",
        draft: true,   /* まだ公開しない（ポータルのカード・sitemapに出さない）*/
        title: "いのちの島",
        description: "人のからだ・植物そだて・食物れんさ・花・メダカの 5つのゲーム・全15もん。4つの島 ぜんぶで かんがえかたの島が ひらくよ。",
        category: "science",
        tagName: "理科",
        date: "2026/08/30",
        colorClass: "subject-green",
        image: "images/inochi-no-shima.svg",
        link: "inochi-no-shima/index.html"
    },
    {
        id: "chikyu-no-shima",
        draft: true,   /* まだ公開しない（ポータルのカード・sitemapに出さない）*/
        title: "ちきゅうの島",
        description: "月と太陽・天気の変化・流れる水・土地のつくりの 4つのゲーム・全12もん。4つの島 ぜんぶで かんがえかたの島が ひらくよ。",
        category: "science",
        tagName: "理科",
        date: "2026/08/30",
        colorClass: "subject-blue",
        image: "images/chikyu-no-shima.svg",
        link: "chikyu-no-shima/index.html"
    },
    {
        id: "sekai-o-mawarou",
        title: "せかいをまわろう！",
        description: "カードをドラッグして12しゅうかんの世界一周の旅ていを組み立てるゲーム。ひこうき・フェリー・リニアで国をつなごう。旅した国は「国ずかん」にたまるよ。",
        category: "social",
        tagName: "社会",
        date: "2026/08/16",
        colorClass: "subject-green",
        image: "images/sekai-o-mawarou.jpg",
        link: "sekai-o-mawarou/index.html"
    },
    {
        id: "rekishi-battle",
        title: "レキシバトル",
        description: "歴史人物42人のカードで合戦！弥生から明治まで51ステージを進み、勝つとクイズ→カードがもらえてレベルアップ。年表ずかんやまめちしきつき。",
        category: "social",
        tagName: "社会",
        date: "2026/08/11",
        colorClass: "subject-green",
        image: "images/rekishi-battle.jpg",
        link: "rekishi-battle/index.html"
    },
    {
        id: "todofuken-bouken",
        title: "都道府県の冒険",
        description: "気球で日本一周！地図タップやシルエットクイズで都道府県の位置・形・県庁所在地・名物をマスター。合格するとご当地カードがもらえるよ。",
        category: "social",
        tagName: "社会",
        date: "2026/07/27",
        colorClass: "subject-green",
        image: "images/todofuken-bouken.svg",
        imageFit: "contain",
        link: "todofuken-bouken/index.html"
    },
    {
        id: "ugoki-no-kiroku",
        title: "うごきのきろく",
        description: "なわとび・てつぼう・水泳・ボール運動など全12種目を記録して、たまごの相棒を育てよう！学校の検定カードと同じ「級」で自分ののびがわかるよ。",
        category: "others",        // 体育は「その他」に分類
        tagName: "体育",
        date: "2026/07/02",
        colorClass: "subject-purple",
        image: "images/ugoki-no-kiroku.jpg",
        link: "ugoki-no-kiroku/index.html"
    },
    {
        id: "level-up-adventure",
        title: "自分レベルアップアドベンチャー",
        description: "毎日の習慣やToDoをこなしてEXPをため、アバターをレベルアップ！コインで家具やペットを買えて、続けるほど「鎖（れんぞく記録）」がのびるよ。",
        category: "others",
        tagName: "その他",
        date: "2026/06/28",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/level-up-adventure.jpg",
        link: "level-up-adventure/index.html"
    },
    {
        id: "kanji-bouken",
        title: "漢字の冒険",
        description: "学年の島を冒険しながら漢字を手書きでマスター！漢字図鑑や、コインで家具を買えるマイルームもあるよ。",
        category: "japanese",
        tagName: "国語",
        date: "2026/06/06",
        colorClass: "subject-red",
        image: "images/kanji-bouken-thumbnail-v2.jpg",
        link: "kanji-bouken/index.html"
    },
    {
        id: "hantai-no-kotoba",
        title: "はんたいの言葉",
        description: "写真と言葉を見て、反対の意味を4択から選ぶ低学年向けの国語ゲームです。",
        category: "japanese",
        tagName: "国語",
        date: "2026/05/05",
        colorClass: "subject-red",
        image: "images/thumbnails-v2/hantai-no-kotoba.jpg",
        link: "hantai-no-kotoba/index.html"
    },
    {
        id: "hiraganarensyu",
        title: "ひらがなカタカナれんしゅう",
        description: "ひらがなとカタカナを おてほんを見ながら なぞりがき！書きじゅんも たしかめられて、5もじのテストにも チャレンジできるよ。",
        category: "japanese",
        tagName: "国語",
        date: "2026/08/30",
        colorClass: "subject-red",
        image: "images/thumbnails-v2/hiraganarensyu.jpg",
        link: "hiraganarensyu/index.html"
    },
    {
        id: "shinmatorikusu",
        title: "心マトリクス",
        description: "今の心の状態をマトリクスで可視化して言葉にしよう。アクションの後の変化も記録できる、メタ認知をうながすアプリ。",
        category: "others",
        tagName: "その他",
        date: "2026/03/13",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/shinmatorikusu.jpg",
        link: "shinmatorikusu/index.html"
    },
    {
        id: "vision-training",
        title: "ビジョントレーニング",
        description: "目を動かす練習をして、見つける力や集中力を高めよう！色々なトレーニングを選べるよ。",
        category: "others",
        tagName: "その他",
        date: "2026/03/02",
        colorClass: "subject-blue",
        image: "images/thumbnails-v2/vision-training.jpg",
        link: "vision-training/index.html"
    },
    {
        id: "marumarusaitekikai",
        title: "〇〇な最適解",
        description: "みんなの答えを予想してお題に一番合う「最適解」を見つけるゲーム！",
        category: "management",
        tagName: "学級経営",
        date: "2026/02/26",
        colorClass: "subject-yellow",
        image: "images/thumbnails-v2/marumarusaitekikai.jpg",
        link: "marumarusaitekikai/index.html"
    },
    {
        id: "shukudai",
        title: "宿題提出ポスト",
        description: "先生の仕事を減らす!? QRコードで提出状況が一瞬でわかるよ。",
        category: "teacher",       // 先生用
        tagName: "先生用",
        date: "2026/02/19",
        colorClass: "subject-gray",
        image: "images/thumbnails-v2/shukudai.jpg", // サムネイル画像
        link: "shukudai/index.html"
    },
    {
        id: "taiikusakusennbo-do",
        title: "体育作戦ボード",
        description: "体育の試合や練習で使える！マグネットみたいに動かせるよ。",
        category: "others",        // 体育は「その他」に分類
        tagName: "体育",
        date: "2026/02/19",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/taiikusakusennbo-do.jpg", // サムネイル画像
        link: "taiikusakusennbo-do/index.html"
    },
    {
        id: "taiikuti-muwake",
        title: "体育チーム分け",
        description: "体育の授業などで使える！スムーズにチーム分けができるよ。",
        category: "others",        // 体育は「その他」に分類
        tagName: "体育",
        date: "2026/02/19",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/taiikuti-muwake.jpg",    // サムネイル画像
        link: "taiikuti-muwake/index.html"
    },
    {
        id: "shiritori",
        title: "しりとり魔神",
        description: "最強しりとり魔神と何回ラリーできるかな？。",
        category: "japanese",
        tagName: "国語",
        date: "2026/02/22",
        colorClass: "subject-red",
        image: "images/thumbnails-v2/shiritori.jpg", // サムネイル画像
        link: "shiritori/index.html"
    },
    {
        id: "kyushoku-kuji",
        title: "給食おかわりくじ",
        description: "給食のおかわりを誰がするか、楽しくくじ引きで決めよう！",
        category: "teacher",       // 先生用カテゴリー
        tagName: "先生用",
        date: "2026/02/19",
        colorClass: "subject-gray",
        image: "images/thumbnails-v2/kyushoku-kuji.jpg", // サムネイル画像
        link: "kyushoku-kuji/index.html"
    },
    {
        id: "taiiku-tournament",
        title: "体育トーナメントメーカー",
        description: "4〜41チームのトーナメント表を自動作成！試合タイマーつきで本番も万全。",
        category: "others",        // 体育は「その他」に分類
        tagName: "体育",
        date: "2026/02/22",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/taiiku-tournament.jpg", // サムネイル画像
        link: "taiiku-tournament/index.html"
    },
    {
        id: "taiiku-league",
        title: "体育リーグ戦メーカー",
        description: "総当たりのリーグ戦スケジュールを自動作成！コート数も指定できて順位表も自動計算。",
        category: "others",        // 体育は「その他」に分類
        tagName: "体育",
        date: "2026/02/22",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/taiiku-league.jpg", // サムネイル画像
        link: "taiiku-league/index.html"
    },
    {
        id: "mainitimondai",
        title: "毎日問題",
        description: "1年生から6年生まで、毎日チャレンジできる謎解き問題！学年を選んでスタート！",
        category: "others",        // その他に分類
        tagName: "その他",
        date: "2026/02/23",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/mainitimondai.jpg", // サムネイル画像
        link: "mainitimondai/index.html"
    },
    {
        id: "taiiku-relay",
        title: "体育リレーチーム編成メーカー",
        description: "タイムを入力するだけで公平なリレーチームを自動作成！ドラッグ＆ドロップで手動調整も可能。",
        category: "others",        // 体育は「その他」に分類
        tagName: "体育",
        date: "2026/02/23",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/taiiku-relay.jpg", // サムネイル画像
        link: "taiiku-relay/index.html"
    },
    {
        id: "group-maker",
        title: "スポーツグループ分け",
        description: "スキルレベルを考慮してバランスの良いグループを自動作成！ドラッグ＆ドロップで微調整も可能。",
        category: "teacher",       // 先生用
        tagName: "先生用",
        date: "2026/02/23",
        colorClass: "subject-gray",
        image: "images/thumbnails-v2/group-maker.jpg", // サムネイル画像
        link: "group-maker/index.html"
    },
    {
        id: "sekigae",
        title: "教室の席替えツール",
        description: "教室のサイズや席の種類を設定し、ランダムに席替え！ドラッグ＆ドロップで微調整も可能。",
        category: "teacher",       // 先生用
        tagName: "先生用",
        date: "2026/02/23",
        colorClass: "subject-gray",
        image: "images/thumbnails-v2/sekigae.jpg", // サムネイル画像
        link: "sekigae/index.html"
    },
    {
        id: "classroom-board",
        title: "教室サポートボード",
        description: "タイマーや時間割、お絵かきツールなど、授業をサポートする機能が一つになった電子黒板アプリです。",
        category: "teacher",       // 先生用
        tagName: "先生用",
        date: "2026/02/25",
        colorClass: "subject-gray",
        image: "images/thumbnails-v2/classroom-board.jpg", // サムネイル画像
        link: "classroom-board/index.html"
    },
    {
        id: "sikou-tool-app",
        title: "思考ツール",
        description: "考えを整理しよう！ふせんや図解・テンプレートを自由に配置できるボードアプリです。",
        category: "others",        // その他
        tagName: "その他",
        date: "2026/02/27",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/sikou-tool-app.jpg", // サムネイル画像
        link: "sikou-tool-app/index.html"
    },
    {
        id: "sakkanojikan",
        title: "作家の時間",
        description: "しつもんに答えるだけで、キミだけの本ができる！お話づくりサポートアプリです。",
        category: "japanese",      // 国語
        tagName: "国語",
        date: "2026/03/12",
        colorClass: "subject-red",
        image: "images/thumbnails-v2/sakkanojikan.jpg",
        link: "sakkanojikan/index.html"
    },
    {
        id: "kannjibusyu-ta",
        title: "漢字部首シューティング",
        description: "部首とつくりを組み合わせて漢字を作ろう！シューティングゲームで楽しく漢字を覚えられるよ。",
        category: "japanese",
        tagName: "国語",
        date: "2026/03/17",
        colorClass: "subject-red",
        image: "images/thumbnails-v2/kannjibusyu-ta.jpg",
        link: "kannjibusyu-ta/index.html"
    },
    {
        id: "kotobasagashi",
        title: "言葉さがし",
        description: "10×10の文字の中にかくれた言葉をドラッグで見つけよう！たて・よこ・ななめ・逆さ読みもOK！1分間で何語見つけられるかな？",
        category: "japanese",
        tagName: "国語",
        date: "2026/03/19",
        colorClass: "subject-red",
        image: "images/thumbnails-v2/kotobasagashi.jpg",
        link: "kotobasagashi/index.html"
    },
    {
        id: "typing",
        title: "キッズタイピング",
        description: "学年を選んでローマ字タイピングを練習しよう！短文タイピングや70のとっくんもあるよ。",
        category: "others",
        tagName: "その他",
        date: "2026/03/27",
        colorClass: "subject-purple",
        image: "images/thumbnails-v2/typing.jpg",
        link: "typing/index.html"
    }
];
