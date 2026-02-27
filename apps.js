const appsData = [
    {
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
        title: "思考ツール",
        description: "考えを整理しよう！ふせんや図解・テンプレートを自由に配置できるボードアプリです。",
        category: "others",        // その他
        tagName: "その他",
        date: "2026/02/27",
        colorClass: "subject-purple",
        image: "images/sikou-tool.jpg", // サムネイル画像
        link: "sikou-tool-app/index.html"
    }
];