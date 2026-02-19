// ここにアプリの情報を書いていくよ！
const appsData = [
    {
        title: "宿題提出ポスト",
        description: "先生の仕事を減らす!? QRコードで提出状況が一瞬でわかるよ。",
        category: "teacher",       // フィルター用 (japanese, math, science, social, others, teacher)
        tagName: "先生用",          // 画面に表示するタグ名
        date: "2026/02/19",        // 作った日
        colorClass: "subject-gray",// 色 (subject-red, blue, green, orange, purple, gray)
        icon: "send",              // アイコン名 (lucide.dev/icons から選べる)
        link: "shukudai/index.html" // 飛ばす先のファイル
    },
    {
        title: "体育作戦ボード",
        description: "体育の試合や練習で使える！マグネットみたいに動かせるよ。",
        category: "others",
        tagName: "体育",
        date: "2026/02/19",
        colorClass: "subject-purple",
        icon: "users",
        link: "taiiku-board/index.html"
    },
    {
        title: "わくわくタイマー",
        description: "残り時間がひと目でわかる！掃除や給食の時間に使ってね。",
        category: "teacher",
        tagName: "便利ツール",
        date: "2026/02/18",
        colorClass: "subject-green",
        icon: "timer",
        link: "timer/index.html"
    }
    // 新しいアプリはここに追加してね
];