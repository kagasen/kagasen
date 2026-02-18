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

    <!-- Tailwind CSS (スタイリング用) -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Lucide Icons (アイコン用) -->
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- Tailwind設定 -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        'pop': ['"Mochiy Pop One"', 'sans-serif'],
                    },
                    colors: {
                        // 落ち着いたナチュラル・北欧風パレットに変更
                        'natural-bg': '#FFFEFA',    /* 背景：ほぼ白に近い生成り */
                        'natural-brown': '#5D4037', /* 文字：こげ茶 */
                        'soft-orange': '#FFCCBC',   /* やさしいサーモンオレンジ */
                        'soft-green': '#C5E1A5',    /* 抹茶ミルクのような緑 */
                        'soft-blue': '#B3E5FC',     /* 淡い空色 */
                        'accent-orange': '#FFAB91', /* アクセント用オレンジ */
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
        /* 背景：ドット柄を廃止し、もっとシンプルな質感に */
        body {
            background-color: #FFFEFA;
            /* 方眼紙のような薄いグリッドで知的な可愛さを演出 */
            background-image: linear-gradient(#F5F5F0 1px, transparent 1px), linear-gradient(90deg, #F5F5F0 1px, transparent 1px);
            background-size: 40px 40px;
        }
        
        /* ふわふわ動くアニメーション（速度をゆっくりに） */
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
        }
        .animate-float {
            animation: float 4s ease-in-out infinite;
        }
    </style>
</head>
<body class="font-pop text-natural-brown min-h-screen flex flex-col">

    <!-- ヘッダーエリア -->
    <!-- 背景を白ベースに変更し、清潔感と落ち着きを出す -->
    <header class="w-full bg-white/80 backdrop-blur-sm py-4 border-b border-orange-100 sticky top-0 z-10">
        <div class="container mx-auto px-4 text-center">
            <h1 class="text-xl md:text-2xl text-natural-brown tracking-widest flex items-center justify-center gap-2">
                <span class="text-accent-orange">✻</span>
                かがせんのHAPPYアプリ集
                <span class="text-accent-orange">✻</span>
            </h1>
            <p class="text-gray-400 mt-1 text-xs tracking-wide">
                先生も子どもも、みんなでワクワク！
            </p>
        </div>
    </header>

    <!-- メインコンテンツ -->
    <main class="flex-grow container mx-auto px-4 py-10">
        
        <!-- アプリ一覧（カードグリッド） -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

            <!-- カード 1: 授業用タイマー -->
            <a href="#" class="group block transform transition duration-500 hover:-translate-y-1">
                <!-- 枠線を細くし、影を柔らかく -->
                <div class="bg-white rounded-2xl overflow-hidden border-2 border-soft-green shadow-soft group-hover:shadow-card h-full flex flex-col">
                    <!-- アイコン背景を少し淡く -->
                    <div class="bg-soft-green/30 p-6 flex justify-center items-center h-32 group-hover:bg-soft-green/50 transition duration-300">
                        <i data-lucide="timer" class="text-natural-brown w-16 h-16 animate-float opacity-80"></i>
                    </div>
                    <div class="p-5 flex-grow flex flex-col items-center text-center">
                        <h3 class="text-lg text-natural-brown mb-2 border-b-2 border-soft-green/50 pb-1 px-4">わくわくタイマー</h3>
                        <p class="text-gray-500 mb-4 flex-grow text-xs leading-relaxed">
                            残り時間がひと目でわかる！<br>掃除や給食の時間に使ってね。
                        </p>
                        <!-- ボタンも彩度を落とす -->
                        <span class="bg-soft-green text-white py-1.5 px-6 rounded-lg text-sm shadow-sm group-hover:bg-[#AED581] transition tracking-widest">
                            OPEN
                        </span>
                    </div>
                </div>
            </a>

            <!-- カード 2: 席替え/くじ引き -->
            <a href="#" class="group block transform transition duration-500 hover:-translate-y-1">
                <div class="bg-white rounded-2xl overflow-hidden border-2 border-soft-orange shadow-soft group-hover:shadow-card h-full flex flex-col">
                    <div class="bg-soft-orange/30 p-6 flex justify-center items-center h-32 group-hover:bg-soft-orange/50 transition duration-300">
                        <i data-lucide="shuffle" class="text-natural-brown w-16 h-16 animate-float opacity-80" style="animation-delay: 0.5s;"></i>
                    </div>
                    <div class="p-5 flex-grow flex flex-col items-center text-center">
                        <h3 class="text-lg text-natural-brown mb-2 border-b-2 border-soft-orange/50 pb-1 px-4">ドキドキあみだくじ</h3>
                        <p class="text-gray-500 mb-4 flex-grow text-xs leading-relaxed">
                            誰が当たるかな？<br>席替えや当番決めにぴったり！
                        </p>
                        <span class="bg-soft-orange text-white py-1.5 px-6 rounded-lg text-sm shadow-sm group-hover:bg-[#FFAB91] transition tracking-widest">
                            OPEN
                        </span>
                    </div>
                </div>
            </a>

            <!-- カード 3: 計算カード/ドリル -->
            <a href="#" class="group block transform transition duration-500 hover:-translate-y-1">
                <div class="bg-white rounded-2xl overflow-hidden border-2 border-soft-blue shadow-soft group-hover:shadow-card h-full flex flex-col">
                    <div class="bg-soft-blue/30 p-6 flex justify-center items-center h-32 group-hover:bg-soft-blue/50 transition duration-300">
                        <i data-lucide="calculator" class="text-natural-brown w-16 h-16 animate-float opacity-80" style="animation-delay: 1s;"></i>
                    </div>
                    <div class="p-5 flex-grow flex flex-col items-center text-center">
                        <h3 class="text-lg text-natural-brown mb-2 border-b-2 border-soft-blue/50 pb-1 px-4">計算マスター</h3>
                        <p class="text-gray-500 mb-4 flex-grow text-xs leading-relaxed">
                            九九やたしざんの特訓だ！<br>タイムアタックに挑戦しよう。
                        </p>
                        <span class="bg-soft-blue text-white py-1.5 px-6 rounded-lg text-sm shadow-sm group-hover:bg-[#81D4FA] transition tracking-widest">
                            OPEN
                        </span>
                    </div>
                </div>
            </a>

        </div>

    </main>

    <!-- フッター -->
    <footer class="bg-white py-6 border-t border-gray-100 mt-8">
        <div class="container mx-auto px-4 text-center">
            <p class="text-gray-400 text-xs">
                &copy; 2026 かがせんのHAPPYアプリ集
            </p>
        </div>
    </footer>

    <!-- Lucide Iconsの実行 -->
    <script>
        lucide.createIcons();
    </script>
</body>
</html>
