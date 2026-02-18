---
layout: null
---
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>かがせんのHAPPYアプリ集</title>
    
    <!-- Google Fonts: Mochiy Pop One (可愛い日本語フォント) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;700&display=swap" rel="stylesheet">

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- Tailwind設定（カフェ風カラーに戻しました） -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        'pop': ['"Mochiy Pop One"', 'sans-serif'],
                        'maru': ['"Zen Maru Gothic"', 'sans-serif'],
                    },
                    colors: {
                        'natural-bg': '#FFFEFA',    /* 背景：生成り色 */
                        'natural-brown': '#5D4037', /* 文字：こげ茶 */
                        'soft-orange': '#FFCCBC',   /* やさしいサーモンオレンジ */
                        'soft-green': '#C5E1A5',    /* 抹茶ミルク色 */
                        'soft-blue': '#B3E5FC',     /* 淡い空色 */
                        'soft-pink': '#F8BBD0',     /* 淡いピンク */
                        'soft-purple': '#E1BEE7',   /* 淡い紫 */
                        'accent-orange': '#FFAB91', /* アクセント */
                    },
                    boxShadow: {
                        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
                    }
                }
            }
        }
    </script>

    <style>
        /* 背景：方眼紙風のデザインを復活 */
        body {
            background-color: #FFFEFA;
            background-image: linear-gradient(#F5F5F0 1px, transparent 1px), linear-gradient(90deg, #F5F5F0 1px, transparent 1px);
            background-size: 40px 40px;
        }
        
        /* カードのホバーアニメーション */
        .app-card {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .app-card:hover {
            transform: translateY(-4px);
        }
    </style>
</head>
<body class="font-maru text-natural-brown min-h-screen flex flex-col">

    <!-- ヘッダーエリア（カフェ風デザイン） -->
    <header class="w-full bg-white/80 backdrop-blur-sm py-4 border-b border-orange-100 sticky top-0 z-20">
        <div class="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <!-- ロゴ -->
            <div class="text-center md:text-left">
                <h1 class="font-pop text-lg md:text-xl text-natural-brown tracking-widest flex items-center gap-2">
                    <span class="text-accent-orange">✻</span>
                    かがせんのHAPPYアプリ集
                    <span class="text-accent-orange">✻</span>
                </h1>
                <p class="text-gray-400 text-xs tracking-wide ml-6">
                    学校生活をもっと楽しく！
                </p>
            </div>

            <!-- 検索バー（丸みのある優しいデザイン） -->
            <div class="relative w-full md:w-80">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i data-lucide="search" class="text-gray-400 w-4 h-4"></i>
                </div>
                <input type="text" id="searchInput" 
                    class="block w-full pl-10 pr-3 py-2 border-2 border-orange-50 rounded-2xl leading-5 bg-white placeholder-gray-300 focus:outline-none focus:border-soft-orange focus:ring-0 transition duration-150 ease-in-out text-sm text-natural-brown"
                    placeholder="アプリをさがす...">
            </div>
        </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="flex-grow container mx-auto px-4 py-8">
        
        <!-- カテゴリフィルター -->
        <div class="flex flex-wrap gap-3 mb-8 justify-center md:justify-start" id="categoryContainer">
            <button class="filter-btn active px-5 py-2 rounded-xl text-sm font-bold bg-accent-orange text-white shadow-soft transition-all tracking-wider" data-category="all">
                すべて
            </button>
            <button class="filter-btn px-5 py-2 rounded-xl text-sm font-bold bg-white text-gray-500 border border-orange-100 hover:bg-orange-50 transition-all tracking-wider" data-category="game">
                <i data-lucide="gamepad-2" class="inline-block w-4 h-4 mr-1 mb-0.5 opacity-70"></i> ゲーム
            </button>
            <button class="filter-btn px-5 py-2 rounded-xl text-sm font-bold bg-white text-gray-500 border border-orange-100 hover:bg-orange-50 transition-all tracking-wider" data-category="study">
                <i data-lucide="graduation-cap" class="inline-block w-4 h-4 mr-1 mb-0.5 opacity-70"></i> 授業用
            </button>
            <button class="filter-btn px-5 py-2 rounded-xl text-sm font-bold bg-white text-gray-500 border border-orange-100 hover:bg-orange-50 transition-all tracking-wider" data-category="tool">
                <i data-lucide="timer" class="inline-block w-4 h-4 mr-1 mb-0.5 opacity-70"></i> 便利ツール
            </button>
        </div>

        <!-- 表示件数とソート -->
        <div class="flex justify-between items-center mb-6 px-1">
            <p class="text-xs text-gray-400"><span id="countDisplay" class="font-bold text-natural-brown text-base">0</span> 件</p>
            <div class="flex bg-white rounded-lg p-1 border border-orange-100">
                <button id="sortNew" class="px-3 py-1 text-xs font-bold rounded bg-orange-50 text-natural-brown">新着順</button>
                <button id="sortPopular" class="px-3 py-1 text-xs font-bold rounded text-gray-400 hover:bg-orange-50 hover:text-natural-brown transition">人気順</button>
            </div>
        </div>

        <!-- アプリ一覧（カードグリッド） -->
        <div id="appGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- ここにJavaScriptでカードが生成されます -->
        </div>

        <!-- データなし表示 -->
        <div id="noData" class="hidden text-center py-20">
            <div class="inline-block p-4 rounded-full bg-white border border-orange-100 mb-4">
                <i data-lucide="coffee" class="w-8 h-8 text-gray-300"></i>
            </div>
            <p class="text-gray-400 text-sm">条件に合うアプリが見つかりませんでした。</p>
        </div>

    </main>

    <!-- フッター -->
    <footer class="bg-white/60 border-t border-orange-100 py-8 mt-12">
        <div class="container mx-auto px-4 text-center">
            <p class="text-gray-400 text-xs">
                &copy; 2026 かがせんのHAPPYアプリ集
            </p>
        </div>
    </footer>

    <!-- JavaScriptロジック -->
    <script>
        // アプリデータ
        // colorClass: カードの枠線やアイコン背景に使うクラス（tailwind.configの色）
        const appsData = [
            {
                id: 1,
                title: "わくわくタイマー",
                description: "残り時間がひと目でわかる！掃除や給食の時間に使ってね。音もなるよ！",
                category: "tool",
                tags: ["便利ツール"],
                date: "2026/02/18",
                views: 1240,
                colorClass: "soft-green", // 緑系
                icon: "timer",
                link: "#"
            },
            {
                id: 2,
                title: "ドキドキあみだくじ",
                description: "誰が当たるかな？席替えや当番決めにぴったり！アニメーション付き。",
                category: "tool",
                tags: ["便利ツール"],
                date: "2026/02/15",
                views: 856,
                colorClass: "soft-orange", // オレンジ系
                icon: "shuffle",
                link: "#"
            },
            {
                id: 3,
                title: "計算マスター",
                description: "九九やたしざんの特訓だ！タイムアタックに挑戦してランキングを目指そう。",
                category: "study",
                tags: ["授業用"],
                date: "2026/02/10",
                views: 2103,
                colorClass: "soft-blue", // 青系
                icon: "calculator",
                link: "#"
            },
            {
                id: 4,
                title: "シカくんとしりとり",
                description: "AIのシカくんと戦おう！強い言葉を知っているかな？",
                category: "game",
                tags: ["ゲーム"],
                date: "2026/01/25",
                views: 532,
                colorClass: "soft-pink", // ピンク系
                icon: "message-circle",
                link: "#"
            },
            {
                id: 5,
                title: "走り高跳び目標計算機",
                description: "身長と50m走のタイムから、あなたの目標高さを計算します。",
                category: "study",
                tags: ["授業用"],
                date: "2026/02/18",
                views: 45,
                colorClass: "soft-purple", // 紫系
                icon: "activity",
                link: "#"
            }
        ];

        // 状態管理
        let currentCategory = 'all';
        let currentSort = 'new';
        let searchQuery = '';

        // DOM要素
        const appGrid = document.getElementById('appGrid');
        const countDisplay = document.getElementById('countDisplay');
        const noData = document.getElementById('noData');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const searchInput = document.getElementById('searchInput');
        const sortNewBtn = document.getElementById('sortNew');
        const sortPopularBtn = document.getElementById('sortPopular');

        // 初期描画
        renderApps();

        // イベントリスナー
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('bg-accent-orange', 'text-white', 'active', 'shadow-soft');
                    b.classList.add('bg-white', 'text-gray-500', 'border', 'border-orange-100');
                });
                btn.classList.remove('bg-white', 'text-gray-500', 'border', 'border-orange-100');
                btn.classList.add('bg-accent-orange', 'text-white', 'active', 'shadow-soft');

                currentCategory = btn.dataset.category;
                renderApps();
            });
        });

        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderApps();
        });

        sortNewBtn.addEventListener('click', () => {
            toggleSortBtn(sortNewBtn, sortPopularBtn);
            currentSort = 'new';
            renderApps();
        });

        sortPopularBtn.addEventListener('click', () => {
            toggleSortBtn(sortPopularBtn, sortNewBtn);
            currentSort = 'popular';
            renderApps();
        });

        function toggleSortBtn(active, inactive) {
            active.classList.remove('text-gray-400', 'hover:bg-orange-50');
            active.classList.add('bg-orange-50', 'text-natural-brown');
            inactive.classList.remove('bg-orange-50', 'text-natural-brown');
            inactive.classList.add('text-gray-400', 'hover:bg-orange-50');
        }

        function renderApps() {
            let filtered = appsData.filter(app => {
                const matchCategory = currentCategory === 'all' || app.category === currentCategory;
                const matchSearch = app.title.toLowerCase().includes(searchQuery) || 
                                    app.description.toLowerCase().includes(searchQuery);
                return matchCategory && matchSearch;
            });

            filtered.sort((a, b) => {
                if (currentSort === 'new') {
                    return new Date(b.date) - new Date(a.date);
                } else {
                    return b.views - a.views;
                }
            });

            countDisplay.textContent = filtered.length;
            appGrid.innerHTML = '';

            if (filtered.length === 0) {
                appGrid.classList.add('hidden');
                noData.classList.remove('hidden');
            } else {
                appGrid.classList.remove('hidden');
                noData.classList.add('hidden');

                filtered.forEach(app => {
                    const card = document.createElement('a');
                    card.href = app.link;
                    // カフェ風：枠線を細く、影を柔らかく、角丸を大きく
                    card.className = `group block bg-white rounded-2xl overflow-hidden border-2 border-${app.colorClass} shadow-soft hover:shadow-card h-full flex flex-col relative app-card`;
                    
                    const isNew = new Date(app.date) > new Date('2026-02-01');
                    const newBadge = isNew ? `<span class="absolute top-2 right-2 bg-accent-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 tracking-widest">NEW</span>` : '';

                    card.innerHTML = `
                        ${newBadge}
                        <!-- アイコンエリア（淡い背景色） -->
                        <div class="bg-${app.colorClass}/20 p-6 flex justify-center items-center h-32 group-hover:bg-${app.colorClass}/30 transition duration-300">
                            <i data-lucide="${app.icon}" class="text-natural-brown w-12 h-12 opacity-80 group-hover:scale-110 transition-transform duration-300"></i>
                        </div>
                        
                        <!-- コンテンツエリア -->
                        <div class="p-5 flex-grow flex flex-col items-center text-center">
                            <h3 class="text-lg text-natural-brown mb-2 border-b-2 border-${app.colorClass}/30 pb-1 px-4 font-pop">${app.title}</h3>
                            <p class="text-gray-500 mb-4 flex-grow text-xs leading-relaxed">
                                ${app.description}
                            </p>
                            
                            <!-- データ表示 -->
                            <div class="w-full flex justify-between items-center text-[10px] text-gray-400 mt-2 mb-3 px-2">
                                <span>📅 ${app.date}</span>
                                <span>👀 ${app.views}</span>
                            </div>

                            <!-- ボタン -->
                            <span class="bg-${app.colorClass} text-white py-1.5 px-6 rounded-lg text-sm shadow-sm group-hover:opacity-80 transition tracking-widest">
                                OPEN
                            </span>
                        </div>
                    `;
                    appGrid.appendChild(card);
                });
                
                lucide.createIcons();
            }
        }
    </script>
</body>
</html>
