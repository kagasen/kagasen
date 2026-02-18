    <!-- ヘッダーエリア -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div class="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
            <!-- ロゴ -->
            <div class="flex items-center gap-3">
                <div class="bg-brand-blue text-white p-2 rounded-lg">
                    <i data-lucide="monitor-play" class="w-6 h-6"></i>
                </div>
                <div>
                    <h1 class="font-pop text-lg md:text-xl text-natural-brown tracking-wide">
                        かがせんのHAPPYアプリ集
                    </h1>
                    <p class="text-xs text-gray-400">学校生活をもっと楽しく！</p>
                </div>
            </div>

            <!-- 検索バー -->
            <div class="relative w-full md:w-96">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i data-lucide="search" class="text-gray-400 w-5 h-5"></i>
                </div>
                <input type="text" id="searchInput" 
                    class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition duration-150 ease-in-out sm:text-sm"
                    placeholder="アプリを検索...">
            </div>
        </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="flex-grow container mx-auto px-4 py-8">
        
        <!-- カテゴリフィルター -->
        <div class="flex flex-wrap gap-2 mb-8 justify-center md:justify-start" id="categoryContainer">
            <button class="filter-btn active px-4 py-2 rounded-full text-sm font-bold bg-brand-blue text-white shadow-md transition-all" data-category="all">
                <i data-lucide="layout-grid" class="inline-block w-4 h-4 mr-1 mb-0.5"></i> すべて
            </button>
            <button class="filter-btn px-4 py-2 rounded-full text-sm font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all" data-category="game">
                <i data-lucide="gamepad-2" class="inline-block w-4 h-4 mr-1 mb-0.5"></i> ゲーム
            </button>
            <button class="filter-btn px-4 py-2 rounded-full text-sm font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all" data-category="study">
                <i data-lucide="graduation-cap" class="inline-block w-4 h-4 mr-1 mb-0.5"></i> 授業用
            </button>
            <button class="filter-btn px-4 py-2 rounded-full text-sm font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all" data-category="tool">
                <i data-lucide="timer" class="inline-block w-4 h-4 mr-1 mb-0.5"></i> 便利ツール
            </button>
        </div>

        <!-- 表示件数とソート -->
        <div class="flex justify-between items-center mb-6">
            <p class="text-sm text-gray-500"><span id="countDisplay" class="font-bold text-gray-800">0</span> 件表示中</p>
            <div class="flex bg-white rounded-lg p-1 border border-gray-200">
                <button id="sortNew" class="px-3 py-1 text-xs font-bold rounded bg-gray-100 text-gray-700">新着順</button>
                <button id="sortPopular" class="px-3 py-1 text-xs font-bold rounded text-gray-500 hover:bg-gray-50">人気順</button>
            </div>
        </div>

        <!-- アプリ一覧（カードグリッド） -->
        <div id="appGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- ここにJavaScriptでカードが生成されます -->
        </div>

        <!-- データなし表示 -->
        <div id="noData" class="hidden text-center py-20">
            <div class="inline-block p-4 rounded-full bg-gray-100 mb-4">
                <i data-lucide="search-x" class="w-8 h-8 text-gray-400"></i>
            </div>
            <p class="text-gray-500">条件に合うアプリが見つかりませんでした。</p>
        </div>

    </main>

    <!-- フッター -->
    <footer class="bg-white border-t border-gray-200 py-8 mt-12">
        <div class="container mx-auto px-4 text-center">
            <p class="text-gray-400 text-xs">
                &copy; 2026 かがせんのHAPPYアプリ集
            </p>
        </div>
    </footer>

    <!-- JavaScriptロジック -->
    <script>
        // アプリデータ（ここでデータを管理します）
        // category: 'game', 'study', 'tool', 'teacher'
        // color: タグの色 (bg-blue-100 text-blue-800 など)
        const appsData = [
            {
                id: 1,
                title: "わくわくタイマー",
                description: "残り時間がひと目でわかる！掃除や給食の時間に使ってね。音もなるよ！",
                category: "tool",
                tags: ["便利ツール", "全学年"],
                date: "2026/02/18",
                views: 1240,
                color: "bg-green-100 text-green-700",
                icon: "timer",
                iconBg: "bg-green-400",
                link: "#"
            },
            {
                id: 2,
                title: "ドキドキあみだくじ",
                description: "誰が当たるかな？席替えや当番決めにぴったり！アニメーション付き。",
                category: "tool",
                tags: ["便利ツール", "学級経営"],
                date: "2026/02/15",
                views: 856,
                color: "bg-orange-100 text-orange-700",
                icon: "shuffle",
                iconBg: "bg-orange-400",
                link: "#"
            },
            {
                id: 3,
                title: "計算マスター",
                description: "九九やたしざんの特訓だ！タイムアタックに挑戦してランキングを目指そう。",
                category: "study",
                tags: ["授業用", "算数"],
                date: "2026/02/10",
                views: 2103,
                color: "bg-blue-100 text-blue-700",
                icon: "calculator",
                iconBg: "bg-blue-400",
                link: "#"
            },
            {
                id: 4,
                title: "シカくんとしりとり",
                description: "AIのシカくんと戦おう！強い言葉を知っているかな？",
                category: "game",
                tags: ["ゲーム", "国語"],
                date: "2026/01/25",
                views: 532,
                color: "bg-pink-100 text-pink-700",
                icon: "message-circle",
                iconBg: "bg-pink-400",
                link: "#"
            },
            {
                id: 5,
                title: "走り高跳び目標計算機",
                description: "身長と50m走のタイムから、あなたの目標高さを計算します。",
                category: "study",
                tags: ["授業用", "体育"],
                date: "2026/02/18",
                views: 45,
                color: "bg-indigo-100 text-indigo-700",
                icon: "activity",
                iconBg: "bg-indigo-400",
                link: "#"
            }
        ];

        // 状態管理
        let currentCategory = 'all';
        let currentSort = 'new'; // 'new' or 'popular'
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

        // イベントリスナー設定
        
        // カテゴリフィルター
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // ボタンの見た目更新
                filterBtns.forEach(b => {
                    b.classList.remove('bg-brand-blue', 'text-white', 'active');
                    b.classList.add('bg-white', 'text-gray-600');
                });
                btn.classList.remove('bg-white', 'text-gray-600');
                btn.classList.add('bg-brand-blue', 'text-white', 'active');

                currentCategory = btn.dataset.category;
                renderApps();
            });
        });

        // 検索
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderApps();
        });

        // ソートボタン
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
            active.classList.remove('text-gray-500', 'bg-white', 'hover:bg-gray-50');
            active.classList.add('bg-gray-100', 'text-gray-700');
            inactive.classList.remove('bg-gray-100', 'text-gray-700');
            inactive.classList.add('text-gray-500', 'bg-white', 'hover:bg-gray-50');
        }

        // アプリ描画関数
        function renderApps() {
            // 1. フィルタリング
            let filtered = appsData.filter(app => {
                const matchCategory = currentCategory === 'all' || app.category === currentCategory;
                const matchSearch = app.title.toLowerCase().includes(searchQuery) || 
                                    app.description.toLowerCase().includes(searchQuery) ||
                                    app.tags.some(tag => tag.toLowerCase().includes(searchQuery));
                return matchCategory && matchSearch;
            });

            // 2. ソート
            filtered.sort((a, b) => {
                if (currentSort === 'new') {
                    return new Date(b.date) - new Date(a.date);
                } else {
                    return b.views - a.views;
                }
            });

            // 3. 表示更新
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
                    card.className = "app-card block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-soft h-full flex flex-col relative";
                    
                    // NEWバッジ（日付が新しい場合）
                    const isNew = new Date(app.date) > new Date('2026-02-01'); // 判定基準日
                    const newBadge = isNew ? `<span class="absolute top-3 right-3 bg-red-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10">NEW</span>` : '';

                    card.innerHTML = `
                        ${newBadge}
                        <!-- サムネイルエリア -->
                        <div class="h-40 w-full pattern-grid relative flex items-center justify-center overflow-hidden">
                            <div class="${app.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                                <i data-lucide="${app.icon}" class="text-white w-8 h-8"></i>
                            </div>
                        </div>
                        
                        <!-- コンテンツエリア -->
                        <div class="p-5 flex-grow flex flex-col">
                            <div class="flex flex-wrap gap-2 mb-3">
                                <span class="${app.color} px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">${app.tags[0]}</span>
                            </div>
                            
                            <h3 class="text-lg font-bold text-gray-800 mb-2 font-pop leading-tight">${app.title}</h3>
                            <p class="text-xs text-gray-500 mb-4 flex-grow leading-relaxed line-clamp-2">
                                ${app.description}
                            </p>
                            
                            <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                <div class="flex items-center gap-3 text-[10px] text-gray-400 font-mono">
                                    <span class="flex items-center gap-1">
                                        📅 ${app.date}
                                    </span>
                                    <span class="flex items-center gap-1">
                                        <i data-lucide="eye" class="w-3 h-3"></i> ${app.views}
                                    </span>
                                </div>
                                <span class="text-brand-blue text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    使ってみる <i data-lucide="chevron-right" class="w-3 h-3"></i>
                                </span>
                            </div>
                        </div>
                    `;
                    appGrid.appendChild(card);
                });
                
                // アイコンの再レンダリング
                lucide.createIcons();
            }
        }
    </script>
</body>
</html>
