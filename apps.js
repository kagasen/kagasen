const appsData = [
    {
        id: "ugoki-no-kiroku",
        title: "うごきのきろく",
        description: "なわとび・てつぼう・マット・とびばこ・すいえい・マラソンにサッカー・バスケ・バレー・野球・ドッジ・リレーも加えた全12種目を記録して、たまごの相棒を「でんせつのとり」まで育てよう！学校の検定カードと同じ「級」システム（鉄棒検定20技・なわとび級表・水泳22段階）にボール運動のチャレンジカード、30秒はやまわしグラフ、全技イラスト付き、バッジ図鑑は132種。オフラインでも使えるよ。",
        category: "others",        // 体育は「その他」に分類
        tagName: "体育",
        date: "2026/07/02",
        colorClass: "subject-purple",
        image: "images/ugoki-no-kiroku.svg",
        link: "ugoki-no-kiroku/index.html"
    },
    {
        id: "level-up-adventure",
        title: "自分レベルアップアドベンチャー",
        description: "毎日の習慣やToDoをこなしてEXPをため、自分のアバターをレベルアップ！コインで部屋の家具や相棒ペットを買えて、続けるほど「鎖（れんぞく記録）」がのびるよ。デイリーミッションや称号、活動の記録カレンダーも。友だちと8文字のコードを交換すれば、カッコいい演出つきの「たいせん」で勝負できる！",
        category: "others",
        tagName: "その他",
        date: "2026/06/28",
        colorClass: "subject-purple",
        image: "images/level-up-adventure.svg",
        link: "level-up-adventure/index.html"
    },
    {
        id: "kanji-bouken",
        title: "漢字の冒険",
        description: "学年の島を冒険しながら漢字を手書きでマスター！「れんしゅう」と10問の「テスト」、覚えた漢字がのる漢字図鑑、テストでためたコインで家具を買って自分だけのマイルームを作れるよ。",
        category: "japanese",
        tagName: "国語",
        date: "2026/06/06",
        colorClass: "subject-red",
        image: "images/kanji-bouken.svg",
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
        image: "images/hantainokotoba.jpg",
        link: "hantai-no-kotoba/index.html"
    },
    {
        id: "hiraganarensyu",
        title: "ひらがなれんしゅう",
        description: "ひらがなをなぞってかいてみよう！おてほんつきのれんしゅうと、5もじのテストでがんばれるよ。",
        category: "japanese",
        tagName: "国語",
        date: "2026/04/03",
        colorClass: "subject-red",
        image: "images/hiraganarensyu.jpg",
        link: "hiraganarensyu/index.html"
    },
    {
        id: "katakanarensyu",
        title: "カタカナれんしゅう",
        description: "カタカナをなぞってかいてみよう！おてほんつきのれんしゅうと、5もじのテストでがんばれるよ。",
        category: "japanese",
        tagName: "国語",
        date: "2026/05/05",
        colorClass: "subject-blue",
        image: "images/katakanarensyu.jpg",
        link: "katakanarensyu/index.html"
    },
    {
        id: "shinmatorikusu",
        title: "心マトリクス",
        description: "今の心の状態をマトリクスで可視化して言葉にしよう。アクションの後の変化も記録できる、メタ認知をうながすアプリ。",
        category: "others",
        tagName: "その他",
        date: "2026/03/13",
        colorClass: "subject-purple",
        image: "shinmatorikusu/心マトリクス１.webp",
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
        image: "images/vision-training.jpg",
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
        image: "images/marumarunasaitekikai.jpg",
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
        image: "images/shukudai.jpg", // サムネイル画像
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
        image: "images/sakusen.jpg", // サムネイル画像
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
        image: "images/team.jpg",    // サムネイル画像
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
        image: "images/shiritori.jpg", // サムネイル画像
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
        image: "images/kyushoku.jpg", // サムネイル画像
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
        image: "images/tonament.jpg", // サムネイル画像
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
        image: "images/ri-gusen.jpg", // サムネイル画像
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
        image: "images/mainitimondai.jpg", // サムネイル画像
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
        image: "images/rire-.jpg", // サムネイル画像
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
        image: "images/guru-puwake.jpg", // サムネイル画像
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
        image: "images/sekigae.jpg", // サムネイル画像
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
        image: "images/classbo-do.jpg", // サムネイル画像
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
        image: "images/sikou-tool.jpg", // サムネイル画像
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
        image: "images/sakkanojikann.jpg",
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
        image: "images/kannjibusyu-ta.jpg",
        link: "kannjibusyu-ta/kanjibusyu-ta.html"
    },
    {
        id: "kotobasagashi",
        title: "言葉さがし",
        description: "10×10の文字の中にかくれた言葉をドラッグで見つけよう！たて・よこ・ななめ・逆さ読みもOK！1分間で何語見つけられるかな？",
        category: "japanese",
        tagName: "国語",
        date: "2026/03/19",
        colorClass: "subject-red",
        image: "images/kotobasagashi.jpg",
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
        image: "images/typing.jpg",
        link: "typing/index.html"
    }
];
