const { useState, useEffect, useCallback, useRef } = React;

// --- データ定義 ---

// WORDS_LOW と WORDS_HIGH は window オブジェクトから読み込むため削除

const ROMAJI_MAPPING = [
    { k: 'きゃ', r: ['kya'] }, { k: 'きゅ', r: ['kyu'] }, { k: 'きょ', r: ['kyo'] },
    { k: 'しゃ', r: ['sya', 'sha'] }, { k: 'しゅ', r: ['syu', 'shu'] }, { k: 'しょ', r: ['syo', 'sho'] },
    { k: 'ちゃ', r: ['tya', 'cha', 'cya'] }, { k: 'ちゅ', r: ['tyu', 'chu', 'cyu'] }, { k: 'ちょ', r: ['tyo', 'cho', 'cyo'] },
    { k: 'にゃ', r: ['nya'] }, { k: 'にゅ', r: ['nyu'] }, { k: 'にょ', r: ['nyo'] },
    { k: 'ひゃ', r: ['hya'] }, { k: 'ひゅ', r: ['hyu'] }, { k: 'ひょ', r: ['hyo'] },
    { k: 'みゃ', r: ['mya'] }, { k: 'みゅ', r: ['myu'] }, { k: 'みょ', r: ['myo'] },
    { k: 'りゃ', r: ['rya'] }, { k: 'りゅ', r: ['ryu'] }, { k: 'りょ', r: ['ryo'] },
    { k: 'ぎゃ', r: ['gya'] }, { k: 'ぎゅ', r: ['gyu'] }, { k: 'ぎょ', r: ['gyo'] },
    { k: 'じゃ', r: ['ja', 'zya', 'jya'] }, { k: 'じゅ', r: ['ju', 'zyu', 'jyu'] }, { k: 'じょ', r: ['jo', 'zyo', 'jyo'] },
    { k: 'びゃ', r: ['bya'] }, { k: 'びゅ', r: ['byu'] }, { k: 'びょ', r: ['byo'] },
    { k: 'ぴゃ', r: ['pya'] }, { k: 'ぴゅ', r: ['pyu'] }, { k: 'ぴょ', r: ['pyo'] },
    { k: 'ふぁ', r: ['fa'] }, { k: 'ふぃ', r: ['fi'] }, { k: 'ふぇ', r: ['fe'] }, { k: 'ふぉ', r: ['fo'] },
    { k: 'てぃ', r: ['thi'] }, { k: 'でぃ', r: ['dhi'] },
    { k: 'あ', r: ['a'] }, { k: 'い', r: ['i'] }, { k: 'う', r: ['u', 'wu'] }, { k: 'え', r: ['e'] }, { k: 'お', r: ['o'] },
    { k: 'か', r: ['ka', 'ca'] }, { k: 'き', r: ['ki'] }, { k: 'く', r: ['ku', 'cu'] }, { k: 'け', r: ['ke'] }, { k: 'こ', r: ['ko', 'co'] },
    { k: 'さ', r: ['sa'] }, { k: 'し', r: ['si', 'shi', 'ci'] }, { k: 'す', r: ['su'] }, { k: 'せ', r: ['se', 'ce'] }, { k: 'そ', r: ['so'] },
    { k: 'た', r: ['ta'] }, { k: 'ち', r: ['ti', 'chi'] }, { k: 'つ', r: ['tsu', 'tu'] }, { k: 'て', r: ['te'] }, { k: 'と', r: ['to'] },
    { k: 'な', r: ['na'] }, { k: 'に', r: ['ni'] }, { k: 'ぬ', r: ['nu'] }, { k: 'ね', r: ['ne'] }, { k: 'の', r: ['no'] },
    { k: 'は', r: ['ha'] }, { k: 'ひ', r: ['hi'] }, { k: 'ふ', r: ['fu', 'hu'] }, { k: 'へ', r: ['he'] }, { k: 'ほ', r: ['ho'] },
    { k: 'ま', r: ['ma'] }, { k: 'み', r: ['mi'] }, { k: 'む', r: ['mu'] }, { k: 'め', r: ['me'] }, { k: 'も', r: ['mo'] },
    { k: 'や', r: ['ya'] }, { k: 'ゆ', r: ['yu'] }, { k: 'よ', r: ['yo'] },
    { k: 'ら', r: ['ra'] }, { k: 'り', r: ['ri'] }, { k: 'る', r: ['ru'] }, { k: 'れ', r: ['re'] }, { k: 'ろ', r: ['ro'] },
    { k: 'わ', r: ['wa'] }, { k: 'を', r: ['wo'] }, { k: 'ん', r: ['nn'] }, // 'ん' は nn のみとする
    { k: 'が', r: ['ga'] }, { k: 'ぎ', r: ['gi'] }, { k: 'ぐ', r: ['gu'] }, { k: 'げ', r: ['ge'] }, { k: 'ご', r: ['go'] },
    { k: 'ざ', r: ['za'] }, { k: 'じ', r: ['ji', 'zi'] }, { k: 'ず', r: ['zu'] }, { k: 'ぜ', r: ['ze'] }, { k: 'ぞ', r: ['zo'] },
    { k: 'だ', r: ['da'] }, { k: 'ぢ', r: ['di'] }, { k: 'づ', r: ['du'] }, { k: 'で', r: ['de'] }, { k: 'ど', r: ['do'] },
    { k: 'ば', r: ['ba'] }, { k: 'び', r: ['bi'] }, { k: 'ぶ', r: ['bu'] }, { k: 'べ', r: ['be'] }, { k: 'ぼ', r: ['bo'] },
    { k: 'ぱ', r: ['pa'] }, { k: 'ぴ', r: ['pi'] }, { k: 'ぷ', r: ['pu'] }, { k: 'ぺ', r: ['pe'] }, { k: 'ぽ', r: ['po'] },
    { k: 'ぁ', r: ['la', 'xa'] }, { k: 'ぃ', r: ['li', 'xi'] }, { k: 'ぅ', r: ['lu', 'xu'] }, { k: 'ぇ', r: ['le', 'xe'] }, { k: 'ぉ', r: ['lo', 'xo'] },
    { k: 'ゃ', r: ['lya', 'xya'] }, { k: 'ゅ', r: ['lyu', 'xyu'] }, { k: 'ょ', r: ['lyo', 'xyo'] },
    { k: 'っ', r: ['ltsu', 'xtsu', 'ltu', 'xtu'] },
    { k: 'ー', r: ['-'] }, { k: '、', r: [','] }, { k: '。', r: ['.'] }, { k: '？', r: ['?'] }, { k: '！', r: ['!'] },
    { k: '２', r: ['2'] }, { k: '３', r: ['3'] } // 全角数字対応
];

const RANK_LIST = [
    { min: 400, max: Infinity, name: '神' },
    { min: 350, max: 399, name: '天才' },
    { min: 300, max: 349, name: '秀才' },
    { min: 251, max: 299, name: 'タイピングの星' },
    { min: 221, max: 250, name: 'タイピング王' },
    { min: 201, max: 220, name: 'タイピングマスター' },
    { min: 181, max: 200, name: '伝説のタイパー' },
    { min: 161, max: 180, name: '神速タイパー' },
    { min: 141, max: 160, name: '音速タイパー' },
    { min: 121, max: 140, name: '光速タイパー' },
    { min: 101, max: 120, name: '超人タイパー' },
    { min: 91, max: 100, name: '達人タイパー' },
    { min: 81, max: 90, name: '名人タイパー' },
    { min: 71, max: 80, name: 'ベテランタイパー' },
    { min: 61, max: 70, name: '一人前タイパー' },
    { min: 51, max: 60, name: 'はん人前タイパー' },
    { min: 41, max: 50, name: '見習いタイパー' },
    { min: 31, max: 40, name: 'チーターレベル' },
    { min: 21, max: 30, name: 'うさぎレベル' },
    { min: 11, max: 20, name: 'かめレベル' },
    { min: 1, max: 10, name: 'ひよこレベル' },
    { min: 0, max: 0, name: 'はじまりの一歩' },
    { min: -Infinity, max: -1, name: 'どんまい' }
];

const FINGER_MAP = {
    '1': 'L_PINKY', 'q': 'L_PINKY', 'a': 'L_PINKY', 'z': 'L_PINKY',
    '2': 'L_RING', 'w': 'L_RING', 's': 'L_RING', 'x': 'L_RING',
    '3': 'L_MIDDLE', 'e': 'L_MIDDLE', 'd': 'L_MIDDLE', 'c': 'L_MIDDLE',
    '4': 'L_INDEX', 'r': 'L_INDEX', 'f': 'L_INDEX', 'v': 'L_INDEX',
    '5': 'L_INDEX', 't': 'L_INDEX', 'g': 'L_INDEX', 'b': 'L_INDEX',
    '6': 'R_INDEX', 'y': 'R_INDEX', 'h': 'R_INDEX', 'n': 'R_INDEX',
    '7': 'R_INDEX', 'u': 'R_INDEX', 'j': 'R_INDEX', 'm': 'R_INDEX',
    '8': 'R_MIDDLE', 'i': 'R_MIDDLE', 'k': 'R_MIDDLE', ',': 'R_MIDDLE',
    '9': 'R_RING', 'o': 'R_RING', 'l': 'R_RING', '.': 'R_RING',
    '0': 'R_PINKY', 'p': 'R_PINKY', ';': 'R_PINKY', '/': 'R_PINKY', '-': 'R_PINKY'
};

const KEYBOARD_LAYOUT = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', ''],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', ''],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', '']
];

// --- ヘルパー関数 ---

const getRank = (score) => {
    const rank = RANK_LIST.find(r => score >= r.min && score <= r.max);
    return rank ? rank.name : '';
};

const getValidFirstPatterns = (kana) => {
    if (!kana) return [];
    let patterns = [];

    // 「っ」の後ろに子音が続く場合（kkoなど）を先に登録し、優先度を高くする
    if (kana.startsWith('っ') && kana.length > 1) {
        const nextKana = kana.slice(1);
        const nextPatterns = getValidFirstPatterns(nextKana);
        nextPatterns.forEach(p => {
            const firstChar = p.romaji[0];
            if (!['a', 'i', 'u', 'e', 'o', '-'].includes(firstChar)) {
                patterns.push({ len: 1 + p.len, romaji: firstChar + p.romaji });
            }
        });
    }

    // その後で通常のパターン（単独の「っ」= ltsu など）を登録する
    for (let m of ROMAJI_MAPPING) {
        if (kana.startsWith(m.k)) {
            m.r.forEach(rStr => patterns.push({ len: m.k.length, romaji: rStr }));
        }
    }

    return patterns;
};

// 残りのひらがなから最もオーソドックスなローマ字文字列を生成
const generateDefaultRomaji = (kana) => {
    let result = '';
    let remaining = kana;
    while (remaining.length > 0) {
        let match = false;
        if (remaining.startsWith('っ') && remaining.length > 1) {
            const nextKana = remaining.slice(1);
            for (let m of ROMAJI_MAPPING) {
                if (nextKana.startsWith(m.k)) {
                    const firstChar = m.r[0][0];
                    if (!['a', 'i', 'u', 'e', 'o', '-'].includes(firstChar)) {
                        result += firstChar;
                        remaining = remaining.slice(1);
                        match = true;
                        break;
                    }
                }
            }
        }
        if (match) continue;

        for (let m of ROMAJI_MAPPING) {
            if (remaining.startsWith(m.k)) {
                result += m.r[0];
                remaining = remaining.slice(m.k.length);
                match = true;
                break;
            }
        }
        if (!match) {
            result += remaining[0];
            remaining = remaining.slice(1);
        }
    }
    return result;
};

// --- 音声関連 ---
let audioCtx = null;
const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

const playBeep = (frequency, type, duration, vol = 0.1) => {
    if (!audioCtx) return;
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.error(e);
    }
};

const playCorrectSound = () => playBeep(880, 'sine', 0.1, 0.2);
const playMissSound = () => playBeep(150, 'sawtooth', 0.15, 0.3);

// --- コンポーネント ---

const KeyboardRow = ({ row, targetKey }) => (
    <div className="flex justify-center mb-1 sm:mb-2">
        {row.map((key, i) => {
            if (!key) return <div key={i} className="w-7 h-9 sm:w-11 sm:h-12 mx-0.5 sm:mx-1"></div>;
            const isTarget = targetKey === key;
            return (
                <div
                    key={key}
                    className={`w-7 h-9 sm:w-11 sm:h-12 mx-0.5 sm:mx-1 flex items-center justify-center rounded-md shadow-sm border-b-2 sm:border-b-4 text-sm sm:text-lg
            ${isTarget ? 'bg-yellow-300 border-yellow-500 font-bold text-red-600 scale-110 z-10 translate-y-[-2px] shadow-lg shadow-yellow-200' : 'bg-white border-gray-300 text-gray-700'}
            transition-all duration-100 uppercase`}
                >
                    {key}
                </div>
            );
        })}
    </div>
);

const Keyboard = ({ targetKey }) => {
    return (
        <div className="relative p-2 sm:p-4 bg-gray-100 rounded-xl shadow-inner mt-4 overflow-hidden">
            {KEYBOARD_LAYOUT.map((row, i) => (
                <KeyboardRow key={i} row={row} targetKey={targetKey} />
            ))}
            <HandsOverlay activeFinger={FINGER_MAP[targetKey]} />
        </div>
    );
};

const Finger = ({ cx, cy, rot, length, isActive, label }) => (
    <div
        className={`absolute flex flex-col items-center justify-start transition-all duration-200 origin-bottom pointer-events-none
      ${isActive ? 'z-30 scale-110 translate-y-[-10px] opacity-90' : 'z-20 opacity-40'}`}
        style={{
            left: `${cx}%`,
            top: `${cy}%`,
            width: 'clamp(20px, 3.5vw, 32px)',
            height: `clamp(${length * 0.7}px, ${length * 0.15}vw, ${length * 1.2}px)`,
            transform: `translate(-50%, -100%) rotate(${rot}deg)`,
        }}
    >
        <div className={`w-full h-full rounded-t-full rounded-b-lg border shadow-sm flex flex-col items-center justify-start pt-1 sm:pt-2 overflow-hidden
      ${isActive ? 'bg-yellow-300 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'bg-orange-100 border-orange-200 backdrop-blur-sm'}`}>

            {/* 爪 */}
            <div className={`w-[60%] aspect-square rounded-full border border-b-2 ${isActive ? 'bg-white border-yellow-500' : 'bg-white/80 border-orange-200'} mb-1 sm:mb-2`}></div>

            {/* 関節 */}
            <div className={`w-[80%] h-[2px] rounded-full ${isActive ? 'bg-yellow-500' : 'bg-orange-300'}`}></div>
            <div className={`w-[80%] h-[2px] rounded-full mt-1.5 sm:mt-2.5 ${isActive ? 'bg-yellow-500' : 'bg-orange-300'}`}></div>

            {/* ラベル */}
            <span className={`mt-auto mb-1 text-[9px] sm:text-[11px] font-black ${isActive ? 'text-red-600 drop-shadow-md' : 'text-gray-500/0'}`}>
                {isActive ? label : ''}
            </span>
        </div>
    </div>
);

const Palm = ({ cx, cy, isRight }) => (
    <div
        className="absolute z-10 pointer-events-none opacity-40"
        style={{
            left: `${cx}%`,
            top: `${cy}%`,
            width: 'clamp(80px, 14vw, 130px)',
            height: 'clamp(70px, 12vw, 110px)',
            transform: `translate(-50%, -50%) rotate(${isRight ? '-5deg' : '5deg'})`,
        }}
    >
        <div className="w-full h-full bg-orange-100 border border-orange-200 rounded-[40%] backdrop-blur-sm shadow-sm relative">
            {/* 手首部分の延長線 */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[70%] h-16 bg-orange-100 border-x border-orange-200 rounded-b-xl backdrop-blur-sm"></div>
        </div>
    </div>
);

const HandsOverlay = ({ activeFinger }) => {
    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {/* 左手 (Fが人差し指にくるように配置) */}
            <Palm cx={20} cy={115} isRight={false} />
            <Finger cx={11} cy={95} rot={-12} length={85} isActive={activeFinger === 'L_PINKY'} label="小指" />
            <Finger cx={18} cy={90} rot={-4} length={95} isActive={activeFinger === 'L_RING'} label="薬指" />
            <Finger cx={25} cy={87} rot={2} length={105} isActive={activeFinger === 'L_MIDDLE'} label="中指" />
            <Finger cx={32} cy={90} rot={8} length={95} isActive={activeFinger === 'L_INDEX'} label="人差指" />
            <Finger cx={38} cy={105} rot={55} length={60} isActive={activeFinger === 'L_THUMB'} label="親指" />

            {/* 右手 (Jが人差し指にくるように配置) */}
            <Palm cx={80} cy={115} isRight={true} />
            <Finger cx={53} cy={105} rot={-55} length={60} isActive={activeFinger === 'R_THUMB'} label="親指" />
            <Finger cx={59} cy={90} rot={-8} length={95} isActive={activeFinger === 'R_INDEX'} label="人差指" />
            <Finger cx={66} cy={87} rot={-2} length={105} isActive={activeFinger === 'R_MIDDLE'} label="中指" />
            <Finger cx={73} cy={90} rot={4} length={95} isActive={activeFinger === 'R_RING'} label="薬指" />
            <Finger cx={80} cy={95} rot={12} length={85} isActive={activeFinger === 'R_PINKY'} label="小指" />
        </div>
    );
};

function App() {
    // URLパラメータから ?mode=low or ?mode=high を取得（2〜6年は短文のみのため常に high）
    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname || '';
    const is2to6nenTypingOnlyShort =
        pathname.includes('/typing/2nen/') ||
        pathname.endsWith('/typing/2nen/index.html') ||
        pathname.includes('/typing/3nen/') ||
        pathname.endsWith('/typing/3nen/index.html') ||
        pathname.includes('/typing/4nen/') ||
        pathname.endsWith('/typing/4nen/index.html') ||
        pathname.includes('/typing/5nen/') ||
        pathname.endsWith('/typing/5nen/index.html') ||
        pathname.includes('/typing/6nen/') ||
        pathname.endsWith('/typing/6nen/index.html');
    const initialCourse = is2to6nenTypingOnlyShort
        ? 'high'
        : params.get('mode') === 'high'
          ? 'high'
          : 'low';

    const [gameState, setGameState] = useState('playing'); // 最初から 'playing'
    const [course, setCourse] = useState(initialCourse);
    const [score, setScore] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [missCount, setMissCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);

    // マウント時に初期データをセット
    const [words, setWords] = useState(() => {
        const wordList = initialCourse === 'low' ? [...window.WORDS_LOW] : [...window.WORDS_HIGH];
        wordList.sort(() => Math.random() - 0.5);
        return wordList;
    });

    const [currentText, setCurrentText] = useState({
        kanji: '',
        kana: '',
        remainingKana: '',
        typedRomaji: '',
        currentInput: ''
    });

    const [isShaking, setIsShaking] = useState(false);
    const pyramidRef = useRef(null);
    const currentRankRef = useRef(null);

    // 初回だけ単語をセットして、音声コンテキストを初期化可能にしておく
    useEffect(() => {
        setNextWord(words, 0);
        // 音声はユーザーの最初のキータッチで初期化される
    }, []);

    const restartGame = () => {
        initAudio();
        const wordList = course === 'low' ? [...window.WORDS_LOW] : [...window.WORDS_HIGH];
        wordList.sort(() => Math.random() - 0.5);
        setWords(wordList);
        setScore(0);
        setCorrectCount(0);
        setMissCount(0);
        setTimeLeft(60);
        setGameState('playing');
        setNextWord(wordList, 0);
    };

    const setNextWord = (wordList, index) => {
        if (index >= wordList.length) {
            // 一巡したら再シャッフルしてループ
            wordList.sort(() => Math.random() - 0.5);
            index = 0;
        }
        const word = wordList[index];
        setCurrentText({
            kanji: word.kanji,
            kana: word.kana,
            remainingKana: word.kana,
            typedRomaji: '',
            currentInput: ''
        });
        // indexを保持するためにwordsは更新しない。あるいはindexをstateに持つ。
        // 今回は単純にwordListの先頭を削っていく方式に変更。
        const newList = [...wordList];
        newList.push(newList.splice(index, 1)[0]); // 使った単語を後ろに回す
        setWords(newList);
    };

    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (gameState === 'playing' && timeLeft === 0) {
            setGameState('result');
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    // 結果画面で現在のランクへ自動スクロール
    useEffect(() => {
        if (gameState === 'result' && currentRankRef.current && pyramidRef.current) {
            setTimeout(() => {
                currentRankRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100); // 描画直後に実行させるため少し遅延させる
        }
    }, [gameState]);

    const handleKeyDown = useCallback((e) => {
        if (gameState !== 'playing') return;

        // 無視するキー
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key === 'Shift' || e.key === 'Backspace' || e.key === 'Tab' || e.key === 'Enter') return;

        let key = e.key.toLowerCase();

        // 入力が有効な文字かチェック
        if (!/^[a-z0-9\-\,\.\?\!]$/.test(key)) {
            // 全角数字などを変換
            if (key === '２') key = '2';
            else if (key === '３') key = '3';
            else if (key === '。') key = '.';
            else if (key === '、') key = ',';
            else return;
        }

        const { remainingKana, currentInput } = currentText;
        const newInput = currentInput + key;

        const patterns = getValidFirstPatterns(remainingKana);
        const validPatterns = patterns.filter(p => p.romaji.startsWith(newInput));

        if (validPatterns.length > 0) {
            initAudio(); // 最初のキー入力時に音声を初期化
            playCorrectSound();
            setScore(s => s + 1);
            setCorrectCount(c => c + 1);

            // 完全一致するパターンを探す
            const perfectMatch = validPatterns.find(p => p.romaji === newInput);

            if (perfectMatch) {
                // 確定
                const newRemaining = remainingKana.slice(perfectMatch.len);
                if (newRemaining.length === 0) {
                    // 単語クリア
                    setNextWord(words, 0);
                } else {
                    setCurrentText(prev => ({
                        ...prev,
                        remainingKana: newRemaining,
                        typedRomaji: prev.typedRomaji + perfectMatch.romaji,
                        currentInput: ''
                    }));
                }
            } else {
                // 途中まで一致
                setCurrentText(prev => ({
                    ...prev,
                    currentInput: newInput
                }));
            }
        } else {
            // ミス
            initAudio(); // 最初のキー入力時に音声を初期化
            playMissSound();
            setScore(s => s - 1);
            setMissCount(m => m + 1);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 200); // 揺れアニメーション時間
        }
    }, [gameState, currentText, words]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);


    // --- レンダリング用計算 ---
    const expectedRemainingRomaji = generateDefaultRomaji(currentText.remainingKana);

    // targetKeyの決定 (現在期待されているキーの先頭)
    let targetKey = '';
    if (currentText.remainingKana) {
        const patterns = getValidFirstPatterns(currentText.remainingKana);
        const validPatterns = patterns.filter(p => p.romaji.startsWith(currentText.currentInput));
        if (validPatterns.length > 0) {
            targetKey = validPatterns[0].romaji[currentText.currentInput.length];
        }
    }

    // 文字の長さによってクラス（フォントサイズ）を動的に変える
    const kanjiLength = currentText.kanji.length;
    let kanjiClass = "text-3xl sm:text-5xl";
    let kanaClass = "text-xl sm:text-2xl";
    let romajiClass = "text-2xl sm:text-4xl tracking-[0.1em] sm:tracking-[0.2em]";

    if (kanjiLength > 30) {
        // 非常に長い文章
        kanjiClass = "text-base sm:text-xl";
        kanaClass = "text-xs sm:text-sm";
        romajiClass = "text-sm sm:text-lg tracking-normal sm:tracking-[0.1em]";
    } else if (kanjiLength > 20) {
        // かなり長い文章
        kanjiClass = "text-lg sm:text-2xl";
        kanaClass = "text-sm sm:text-base";
        romajiClass = "text-base sm:text-xl tracking-normal sm:tracking-[0.1em]";
    } else if (kanjiLength > 12) {
        // やや長い文章
        kanjiClass = "text-xl sm:text-3xl";
        kanaClass = "text-base sm:text-xl";
        romajiClass = "text-lg sm:text-2xl tracking-[0.1em]";
    }

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center font-sans">
            <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-3px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-blink { animation: blink 1s infinite; }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(191, 219, 254, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(96, 165, 250, 0.7);
          border-radius: 4px;
        }
      `}</style>

            <div className={`w-full max-w-4xl p-2 sm:p-6 bg-white rounded-3xl shadow-2xl relative ${isShaking ? 'shake border-4 border-red-500' : 'border-4 border-transparent'}`}>

                {/* --- MENU SCREEN REMOVED --- */}

                {/* --- PLAYING SCREEN --- */}
                {gameState === 'playing' && (
                    <div>
                        {/* ヘッダー: スコアとタイマー */}
                        <div className="flex justify-between items-center mb-4 sm:mb-6 bg-blue-100 p-3 sm:p-4 rounded-xl border-2 border-blue-200">
                            <div className="flex items-center gap-3 sm:gap-6">
                                <button
                                    onClick={() => { window.location.href = '../index.html'; }}
                                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg shadow transform transition hover:scale-105 text-xs sm:text-base focus:outline-none"
                                    tabIndex="-1"
                                >
                                    ◀ メニューへ
                                </button>
                                <div className="text-xl sm:text-3xl font-black text-blue-800">
                                    スコア: <span className={score < 0 ? 'text-red-500' : 'text-blue-600'}>{score}</span>
                                </div>
                            </div>
                            <div className={`text-2xl sm:text-4xl font-black ${timeLeft <= 10 ? 'text-red-600 animate-blink' : 'text-green-600'}`}>
                                ⏳ {timeLeft}秒
                            </div>
                        </div>

                        {/* 問題表示エリア */}
                        <div className="bg-gray-50 rounded-2xl p-3 sm:p-6 text-center shadow-inner border border-gray-200 min-h-[150px] sm:min-h-[220px] flex flex-col justify-center items-center overflow-hidden w-full relative">
                            <div className={`${kanaClass} font-bold text-gray-500 mb-1 sm:mb-2 tracking-widest break-all w-full leading-tight`}>
                                {currentText.kana}
                            </div>
                            <div className={`${kanjiClass} font-black text-gray-800 mb-3 sm:mb-6 break-all w-full leading-snug`}>
                                {currentText.kanji}
                            </div>

                            <div className={`${romajiClass} font-mono font-bold flex justify-center flex-wrap w-full`}>
                                {/* 確定済みのローマ字 */}
                                <span className="text-gray-300 break-all">
                                    {currentText.typedRomaji + currentText.currentInput}
                                </span>

                                {/* これから打つローマ字 */}
                                {expectedRemainingRomaji.length > 0 && (
                                    <span className="break-all">
                                        {/* 次の1文字（赤くハイライト） */}
                                        <span className="text-red-500 underline decoration-red-300 decoration-2 sm:decoration-4 underline-offset-4">
                                            {targetKey || expectedRemainingRomaji[currentText.currentInput.length] || expectedRemainingRomaji[0]}
                                        </span>
                                        {/* それ以降の文字 */}
                                        <span className="text-gray-800">
                                            {expectedRemainingRomaji.slice((currentText.currentInput.length > 0 && expectedRemainingRomaji.startsWith(currentText.currentInput)) ? currentText.currentInput.length + 1 : 1)}
                                        </span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* キーボード UI */}
                        <Keyboard targetKey={targetKey} />
                    </div>
                )}

                {/* --- RESULT SCREEN --- */}
                {gameState === 'result' && (
                    <div className="text-center py-4 sm:py-8 flex flex-col items-center">
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mb-4">タイムアップ！</h2>

                        <div className="bg-yellow-100 rounded-3xl p-4 sm:p-6 mb-6 inline-block shadow-lg border-4 border-yellow-300 w-full max-w-lg">
                            <p className="text-lg font-bold text-gray-600 mb-1">あなたのスコア</p>
                            <p className="text-5xl sm:text-6xl font-black text-blue-600 mb-4">{score} <span className="text-xl text-gray-600">ポイント</span></p>

                            <div className="flex justify-center gap-4 sm:gap-8 mb-4 text-sm sm:text-base font-bold bg-white/50 py-2 rounded-xl">
                                <div className="text-green-600">
                                    正しく打った数: <span className="text-xl sm:text-2xl">{correctCount}</span> 回
                                </div>
                                <div className="text-red-500">
                                    ミスした数: <span className="text-xl sm:text-2xl">{missCount}</span> 回
                                </div>
                            </div>

                            <div className="border-t-2 border-yellow-200 pt-4">
                                <p className="text-lg font-bold text-gray-600 mb-1">ランク</p>
                                <p className="text-3xl sm:text-4xl font-black text-red-500 drop-shadow">
                                    {getRank(score)}
                                </p>
                            </div>
                        </div>

                        {/* ピラミッドUI */}
                        <div className="w-full max-w-lg mb-6">
                            <div
                                ref={pyramidRef}
                                className="bg-blue-50/80 p-2 sm:p-4 rounded-xl border-2 border-blue-200 h-[200px] sm:h-[260px] overflow-y-auto relative shadow-inner custom-scrollbar"
                            >
                                <div className="flex flex-col items-center space-y-1 w-full py-2">
                                    {RANK_LIST.map((rank, index) => {
                                        const isCurrent = score >= rank.min && score <= rank.max;
                                        // ピラミッドっぽくするため、下に行くほど幅を広げる（40% 〜 100%）
                                        const widthPct = 40 + (index / (RANK_LIST.length - 1)) * 60;

                                        let rangeText = '';
                                        if (rank.min === 400) rangeText = '400〜';
                                        else if (rank.max === -1) rangeText = 'マイナス';
                                        else if (rank.min === rank.max) rangeText = '0';
                                        else rangeText = `${rank.min}〜${rank.max}`;

                                        return (
                                            <div
                                                key={rank.name}
                                                ref={isCurrent ? currentRankRef : null}
                                                className={`flex items-center px-2 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-sm font-bold border transition-all ${isCurrent
                                                    ? 'bg-red-500 text-white border-red-600 scale-[1.02] shadow-md shadow-red-300 z-10'
                                                    : 'bg-white text-gray-600 border-gray-300 opacity-90'
                                                    }`}
                                                style={{ width: `${widthPct}%` }}
                                            >
                                                <span className={`w-1/4 text-left ${isCurrent ? 'text-red-100' : 'text-gray-400'}`}>{rangeText}</span>
                                                <span className="w-2/4 text-center truncate">{rank.name}</span>
                                                <span className={`w-1/4 text-right font-black ${isCurrent ? 'text-yellow-300' : ''}`}>
                                                    {isCurrent ? '◀ YOU' : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                onClick={() => restartGame()}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 sm:py-4 sm:px-10 rounded-full shadow-lg transform transition hover:scale-105 text-lg sm:text-xl"
                            >
                                もういちどあそぶ
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

// --- 70のとっくん: single | sequence | kana ---
// single: { key, total } / sequence: { pattern: 'fjfj...' } / kana: { kana: 'あい...', kanjiDisplay?: '...' }

function TokkunDrillApp() {
    const cfg = window.TOKKUN_DRILL_CONFIG || { key: 'f', total: 20, titleKanji: '', titleSub: '', backHref: 'index.html' };
    const drillMode = (cfg.kana || (Array.isArray(cfg.words) && cfg.words.length > 0)) ? 'kana' : (cfg.pattern ? 'sequence' : 'single');
    const kanaWordsMode = Array.isArray(cfg.words) && cfg.words.length > 0;
    const pattern = String(cfg.pattern || '').toLowerCase();
    const targetKeySingle = String(cfg.key || 'f').toLowerCase();

    const total = drillMode === 'kana'
        ? (kanaWordsMode
            ? cfg.words.reduce((s, w) => s + (w.kana || '').length, 0)
            : (cfg.kana || '').length)
        : drillMode === 'sequence'
            ? pattern.length
            : Math.max(1, Number(cfg.total) || 20);

    const levelNum = cfg.level != null ? Number(cfg.level) : NaN;
    const nextLevelHref = (() => {
        if (cfg.nextHref === false) return null;
        if (typeof cfg.nextHref === 'string' && cfg.nextHref.length > 0) return cfg.nextHref;
        if (!Number.isFinite(levelNum) || levelNum < 1 || levelNum >= 70) return null;
        return `level${String(levelNum + 1).padStart(2, '0')}.html`;
    })();

    const isBoss = !!cfg.boss;
    const timeLimitSec = Number(cfg.timeLimitSec) > 0 ? Number(cfg.timeLimitSec) : 0;
    const bossSuccessMsg = cfg.bossSuccessMsg != null ? cfg.bossSuccessMsg : 'お主やるなぁ';
    const bossFailMsg = cfg.bossFailMsg != null ? cfg.bossFailMsg : 'まだまだじゃな';

    const [gameState, setGameState] = useState('playing');
    const [progress, setProgress] = useState(0);
    const [missCount, setMissCount] = useState(0);
    const [isShaking, setIsShaking] = useState(false);
    const [hintMsg, setHintMsg] = useState('');
    const [burstFragments, setBurstFragments] = useState([]);
    const fragClearRef = useRef(null);

    const [wordIndex, setWordIndex] = useState(0);

    const [timeLeft, setTimeLeft] = useState(() => {
        const c = typeof window !== 'undefined' ? window.TOKKUN_DRILL_CONFIG : null;
        const t = c && c.timeLimitSec != null ? Number(c.timeLimitSec) : 0;
        return t > 0 ? t : null;
    });

    const [kanaState, setKanaState] = useState(() => {
        const c = typeof window !== 'undefined' ? window.TOKKUN_DRILL_CONFIG : null;
        if (c && Array.isArray(c.words) && c.words.length) {
            return { remainingKana: c.words[0].kana || '', currentInput: '', typedRomaji: '' };
        }
        return {
            remainingKana: c && c.kana ? c.kana : '',
            currentInput: '',
            typedRomaji: ''
        };
    });

    const restartGame = useCallback(() => {
        initAudio();
        setProgress(0);
        setWordIndex(0);
        setMissCount(0);
        setGameState('playing');
        setHintMsg('');
        setBurstFragments([]);
        if (fragClearRef.current) {
            clearTimeout(fragClearRef.current);
            fragClearRef.current = null;
        }
        const firstKana = Array.isArray(cfg.words) && cfg.words.length
            ? (cfg.words[0].kana || '')
            : (cfg.kana || '');
        setKanaState({
            remainingKana: firstKana,
            currentInput: '',
            typedRomaji: ''
        });
        setTimeLeft(timeLimitSec > 0 ? timeLimitSec : null);
    }, [cfg.kana, cfg.words, timeLimitSec]);

    useEffect(() => () => {
        if (fragClearRef.current) clearTimeout(fragClearRef.current);
    }, []);

    useEffect(() => {
        if (gameState !== 'playing' || !timeLimitSec) return;
        const id = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev == null || prev <= 0) return prev;
                const n = prev - 1;
                if (n <= 0) {
                    setGameState('bossTimeout');
                    return 0;
                }
                return n;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [gameState, timeLimitSec]);

    useEffect(() => {
        if (gameState !== 'bossTimeout') return;
        initAudio();
        playMissSound();
    }, [gameState]);

    const spawnBurstFragments = useCallback((burstChar) => {
        const ch = String(burstChar || 'f').toLowerCase();
        const ts = Date.now();
        const count = 14;
        const parts = Array.from({ length: count }, (_, i) => {
            const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
            const d = 48 + Math.random() * 92;
            return {
                id: `${ts}-${i}`,
                tx: Math.cos(a) * d,
                ty: Math.sin(a) * d,
                rot: (Math.random() - 0.5) * 240,
                s: 0.32 + Math.random() * 0.42,
                hue: i % 3 === 0 ? '#ef4444' : (i % 3 === 1 ? '#f97316' : '#eab308')
            };
        });
        setBurstFragments(parts);
        if (fragClearRef.current) clearTimeout(fragClearRef.current);
        fragClearRef.current = setTimeout(() => {
            setBurstFragments([]);
            fragClearRef.current = null;
        }, 720);
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (gameState !== 'playing') return;
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key === 'Shift' || e.key === 'Backspace' || e.key === 'Tab' || e.key === 'Enter') return;

        let key = e.key.toLowerCase();

        if (drillMode === 'kana') {
            if (!/^[a-z0-9\-\,\.\?\!]$/.test(key)) {
                if (key === '２') key = '2';
                else if (key === '３') key = '3';
                else if (key === '。') key = '.';
                else if (key === '、') key = ',';
                else return;
            }

            const { remainingKana, currentInput } = kanaState;
            const newInput = currentInput + key;

            const patterns = getValidFirstPatterns(remainingKana);
            const validPatterns = patterns.filter(p => p.romaji.startsWith(newInput));

            if (validPatterns.length > 0) {
                initAudio();
                playCorrectSound();
                setHintMsg('');
                const perfectMatch = validPatterns.find(p => p.romaji === newInput);

                if (perfectMatch) {
                    const newRemaining = remainingKana.slice(perfectMatch.len);
                    if (newRemaining.length === 0) {
                        if (kanaWordsMode && wordIndex < cfg.words.length - 1) {
                            const wi = wordIndex + 1;
                            setWordIndex(wi);
                            setKanaState({
                                remainingKana: cfg.words[wi].kana || '',
                                currentInput: '',
                                typedRomaji: ''
                            });
                        } else {
                            setKanaState(prev => ({
                                ...prev,
                                remainingKana: '',
                                typedRomaji: prev.typedRomaji + perfectMatch.romaji,
                                currentInput: ''
                            }));
                            setGameState('result');
                        }
                    } else {
                        setKanaState(prev => ({
                            ...prev,
                            remainingKana: newRemaining,
                            typedRomaji: prev.typedRomaji + perfectMatch.romaji,
                            currentInput: ''
                        }));
                    }
                } else {
                    setKanaState(prev => ({
                        ...prev,
                        currentInput: newInput
                    }));
                }
            } else {
                initAudio();
                playMissSound();
                setMissCount((m) => m + 1);
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 200);
                setHintMsg('');
            }
            return;
        }

        if (drillMode === 'sequence') {
            if (key.length !== 1 || !/^[a-z0-9\-]$/.test(key)) return;
        } else if (key.length !== 1 || !/^[a-z0-9]$/.test(key)) return;

        if (drillMode === 'sequence') {
            const expect = pattern[progress];
            if (key === expect) {
                initAudio();
                playCorrectSound();
                setHintMsg('');
                spawnBurstFragments(expect);
                setProgress((p) => {
                    const next = p + 1;
                    if (next >= total) setGameState('result');
                    return next;
                });
            } else {
                initAudio();
                playMissSound();
                setMissCount((m) => m + 1);
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 200);
                setHintMsg(cfg.hintWrong || 'つぎの キーを おしてね');
            }
            return;
        }

        if (key === targetKeySingle) {
            initAudio();
            playCorrectSound();
            setHintMsg('');
            spawnBurstFragments(targetKeySingle);
            setProgress((p) => {
                const next = p + 1;
                if (next >= total) setGameState('result');
                return next;
            });
        } else {
            initAudio();
            playMissSound();
            setMissCount((m) => m + 1);
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 200);
            setHintMsg(cfg.hintWrong || 'Fキーだよ。ゆっくりで だいじょうぶ！');
        }
    }, [gameState, drillMode, pattern, progress, total, cfg.hintWrong, spawnBurstFragments, kanaState, targetKeySingle, kanaWordsMode, wordIndex, cfg.words]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (gameState !== 'result') return;
        const lvl = cfg.level;
        if (lvl == null) return;
        if (window.TokkunStorage && typeof window.TokkunStorage.setLevelCleared === 'function') {
            window.TokkunStorage.setLevelCleared(lvl);
        }
    }, [gameState, cfg.level]);

    useEffect(() => {
        if (gameState !== 'result' && gameState !== 'bossTimeout') return;
        const onResultShortcut = (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const k = e.key.toLowerCase();
            if (k !== 'f' && k !== 'j') return;
            if (k === 'f') {
                e.preventDefault();
                restartGame();
                return;
            }
            if (k === 'j' && nextLevelHref && gameState === 'result') {
                e.preventDefault();
                window.location.href = nextLevelHref;
            }
        };
        window.addEventListener('keydown', onResultShortcut);
        return () => window.removeEventListener('keydown', onResultShortcut);
    }, [gameState, nextLevelHref, restartGame]);

    const remain = drillMode === 'kana'
        ? (kanaWordsMode
            ? kanaState.remainingKana.length + (cfg.words || []).slice(wordIndex + 1).reduce((s, w) => s + (w.kana || '').length, 0)
            : kanaState.remainingKana.length)
        : Math.max(0, total - progress);

    const seqCurrent = drillMode === 'sequence' && progress < pattern.length ? pattern[progress] : '';
    const queueCellChar = (i) => (drillMode === 'sequence' ? pattern[i] : targetKeySingle);

    let keyboardTarget = '';
    if (drillMode === 'kana' && kanaState.remainingKana) {
        const patterns = getValidFirstPatterns(kanaState.remainingKana);
        const validPatterns = patterns.filter(p => p.romaji.startsWith(kanaState.currentInput));
        if (validPatterns.length > 0) {
            const r = validPatterns[0].romaji;
            keyboardTarget = r[kanaState.currentInput.length] || '';
        }
    } else if (drillMode === 'sequence') {
        keyboardTarget = seqCurrent;
    } else {
        keyboardTarget = targetKeySingle;
    }

    let kanaRomajiTail = null;
    if (drillMode === 'kana' && kanaState.remainingKana) {
        const patterns = getValidFirstPatterns(kanaState.remainingKana);
        const validPatterns = patterns.filter(p => p.romaji.startsWith(kanaState.currentInput));
        if (validPatterns.length > 0) {
            const fullFirst = validPatterns[0].romaji;
            const restAfterFirst = fullFirst.slice(kanaState.currentInput.length);
            const restOfWhole = generateDefaultRomaji(kanaState.remainingKana).slice(fullFirst.length);
            kanaRomajiTail = { restAfterFirst, restOfWhole };
        }
    }

    return (
        <div className={`min-h-screen flex items-center justify-center font-sans relative overflow-hidden ${isBoss ? 'bg-gradient-to-b from-slate-950 via-violet-950 to-black' : 'bg-blue-50'}`}>
            {isBoss && (
                <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,#4c1d95_0%,transparent_55%)] opacity-70" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_90%,#1e1b4b_0%,transparent_45%)] opacity-90" />
                    <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    <div className="absolute bottom-6 right-4 sm:right-10 flex flex-col items-center gap-1 tokkun-demon-float">
                        <span className="text-7xl sm:text-8xl drop-shadow-[0_0_24px_rgba(168,85,247,0.8)]" role="img" aria-label="タイピング魔人">👹</span>
                        <span className="text-xs sm:text-sm font-black text-purple-300/90 tracking-widest">タイピング魔人</span>
                    </div>
                    <div className="absolute top-16 left-2 sm:left-8 text-5xl sm:text-6xl font-black text-violet-900/40 rotate-[-8deg] select-none">…</div>
                </div>
            )}
            <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-3px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes tokkun-core-burst {
          0% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0 transparent); }
          18% { transform: scale(0.42) rotate(-8deg); filter: drop-shadow(0 0 14px #f97316) drop-shadow(0 0 28px #fbbf24); }
          50% { transform: scale(1.22) rotate(4deg); filter: drop-shadow(0 0 24px #fde047) drop-shadow(0 0 40px #fb923c); }
          100% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0 transparent); }
        }
        .tokkun-core-burst {
          display: inline-block;
          transform-origin: center center;
          animation: tokkun-core-burst 0.58s cubic-bezier(0.34, 1.45, 0.64, 1);
        }

        @keyframes tokkun-ring-pop {
          0% { transform: translate(-50%, -50%) scale(0.35); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(2.35); opacity: 0; }
        }
        .tokkun-burst-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 7rem;
          height: 7rem;
          margin-left: 0;
          margin-top: 0;
          border-radius: 9999px;
          border: 5px solid rgba(251, 146, 60, 0.85);
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.7), inset 0 0 20px rgba(254, 243, 199, 0.5);
          pointer-events: none;
          animation: tokkun-ring-pop 0.55s ease-out forwards;
        }

        @keyframes tokkun-frag-fly {
          0% {
            transform: translate(-50%, -50%) scale(var(--frag-s, 0.9)) rotate(0deg);
            opacity: 1;
          }
          25% { opacity: 1; }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.12) rotate(var(--rot));
            opacity: 0;
          }
        }
        .tokkun-frag {
          position: absolute;
          left: 50%;
          top: 50%;
          font-family: ui-monospace, monospace;
          font-weight: 900;
          pointer-events: none;
          animation: tokkun-frag-fly 0.68s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.9), 0 0 18px rgba(248, 113, 113, 0.6);
        }

        .tokkun-queue-track {
          transition: transform 0.38s cubic-bezier(0.34, 1.25, 0.64, 1);
        }

        @keyframes tokkun-demon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .tokkun-demon-float { animation: tokkun-demon-float 2.8s ease-in-out infinite; }
      `}</style>

            <div className={`w-full max-w-4xl p-2 sm:p-6 rounded-3xl shadow-2xl relative z-10 ${isBoss ? 'bg-gray-100 border-4 border-purple-900 shadow-[0_0_48px_rgba(76,29,149,0.55)]' : 'bg-white'} ${isShaking ? 'shake border-4 border-red-500' : isBoss ? '' : 'border-4 border-transparent'}`}>

                {gameState === 'playing' && (
                    <div>
                        <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border-2 ${isBoss ? 'bg-slate-900/90 border-purple-700' : 'bg-blue-100 border-blue-200'}`}>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                                <button
                                    type="button"
                                    onClick={() => { window.location.href = cfg.backHref || 'index.html'; }}
                                    className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg shadow transform transition hover:scale-105 text-xs sm:text-base focus:outline-none"
                                    tabIndex="-1"
                                >
                                    ◀ メニューへ
                                </button>
                                <div className={`text-base sm:text-2xl font-black ${isBoss ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]' : 'text-blue-800'}`}>
                                    {drillMode === 'kana' ? (
                                        <>あと <span className={isBoss ? 'text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]' : 'text-blue-600'}>{remain}</span> もじ</>
                                    ) : (
                                        <>クリアまで あと <span className={isBoss ? 'text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]' : 'text-blue-600'}>{remain}</span> かい</>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
                                {timeLeft != null && (
                                    <div
                                        className={`text-xl sm:text-3xl font-black tabular-nums ${isBoss ? (timeLeft <= 3 ? 'text-red-400 animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]') : timeLeft <= 3 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}
                                        aria-live="polite"
                                    >
                                        ⏱ {timeLeft} びょう
                                    </div>
                                )}
                                <div className={`text-base sm:text-xl font-bold ${isBoss ? 'text-zinc-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]' : 'text-gray-600'}`}>
                                    ミス: <span className={missCount > 0 ? 'text-orange-400' : isBoss ? 'text-zinc-200' : 'text-gray-400'}>{missCount}</span> かい
                                </div>
                            </div>
                        </div>

                        <div className={`mb-2 text-center ${isBoss ? 'rounded-2xl bg-black/25 px-3 py-3 sm:py-4 border border-purple-500/40' : ''}`}>
                            <p className={`text-sm sm:text-base font-bold ${isBoss ? 'text-zinc-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]' : 'text-amber-800'}`}>
                                70のとっくん · レベル{Number.isFinite(levelNum) ? levelNum : '？'}
                            </p>
                            <h1 className={`text-lg sm:text-2xl font-black leading-tight px-1 ${isBoss ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]' : 'text-gray-800'}`}>{cfg.titleKanji}</h1>
                            <p className={`text-base sm:text-lg font-bold mt-2 ${isBoss ? 'text-zinc-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]' : 'text-gray-600'}`}>{cfg.titleSub}</p>
                        </div>

                        <div className={`rounded-2xl p-4 sm:p-8 text-center shadow-inner min-h-[180px] sm:min-h-[220px] flex flex-col justify-center items-center overflow-visible ${isBoss ? 'bg-slate-900/50 border-2 border-purple-800/80 shadow-[inset_0_0_24px_rgba(0,0,0,0.35)]' : 'bg-gray-50 border border-gray-200'}`}>
                            {drillMode === 'kana' && kanaWordsMode ? (
                                <>
                                    <p className="text-sm text-gray-500 font-bold mb-3">ローマ字で ひらがなを うってね（半角）</p>
                                    {cfg.words[wordIndex] ? (
                                        <p className="text-xl sm:text-2xl font-black text-gray-800 mb-4 px-1">
                                            {cfg.words[wordIndex].kanji}（{cfg.words[wordIndex].kana}）
                                        </p>
                                    ) : null}
                                    <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 items-stretch justify-center">
                                        <div className="flex-1 min-w-0 bg-white rounded-xl border-2 border-gray-300 shadow-inner p-5 sm:p-8 text-center">
                                            <div className="text-4xl sm:text-6xl font-black text-gray-800 mb-5 sm:mb-6 tracking-wide break-all">
                                                {cfg.words[wordIndex] ? cfg.words[wordIndex].kana : ''}
                                            </div>
                                            <div className="text-xl sm:text-3xl font-mono font-bold flex flex-wrap justify-center break-all border-t-2 border-dashed border-gray-200 pt-4">
                                                <span className="text-gray-400">{kanaState.typedRomaji}</span>
                                                <span className="text-gray-500">{kanaState.currentInput}</span>
                                                {kanaRomajiTail && kanaRomajiTail.restAfterFirst.length > 0 && (
                                                    <>
                                                        <span className="text-red-500 underline decoration-2 underline-offset-4">{kanaRomajiTail.restAfterFirst[0]}</span>
                                                        <span className="text-gray-800">{kanaRomajiTail.restAfterFirst.slice(1)}</span>
                                                    </>
                                                )}
                                                {kanaRomajiTail && (
                                                    <span className="text-gray-800">{kanaRomajiTail.restOfWhole}</span>
                                                )}
                                            </div>
                                        </div>
                                        {wordIndex + 1 < cfg.words.length ? (
                                            <div className="w-full sm:w-48 flex-shrink-0 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/90 p-4 flex flex-col justify-center text-center shadow-sm">
                                                <p className="text-xs font-bold text-amber-800 mb-2">つぎの たんご</p>
                                                <p className="text-lg sm:text-xl font-black text-gray-800 leading-tight">
                                                    {cfg.words[wordIndex + 1].kanji}（{cfg.words[wordIndex + 1].kana}）
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </>
                            ) : drillMode === 'kana' ? (
                                <>
                                    <p className="text-sm text-gray-500 font-bold mb-3">ローマ字で ひらがなを うってね（半角）</p>
                                    {cfg.kanjiDisplay ? (
                                        <p className="text-base sm:text-lg font-bold text-gray-800 mb-4 px-1 leading-relaxed">{cfg.kanjiDisplay}</p>
                                    ) : null}
                                    <div className="w-full max-w-3xl mx-auto bg-white/90 rounded-xl border-2 border-gray-200 p-4 sm:p-6 mb-4">
                                        <div className="text-2xl sm:text-4xl font-black text-gray-700 mb-4 break-all leading-relaxed tracking-wide">
                                            {kanaState.remainingKana || '　'}
                                        </div>
                                        <div className="text-lg sm:text-2xl font-mono font-bold flex flex-wrap justify-center break-all">
                                            <span className="text-gray-400">{kanaState.typedRomaji}</span>
                                            <span className="text-gray-500">{kanaState.currentInput}</span>
                                            {kanaRomajiTail && kanaRomajiTail.restAfterFirst.length > 0 && (
                                                <>
                                                    <span className="text-red-500 underline decoration-2 underline-offset-4">{kanaRomajiTail.restAfterFirst[0]}</span>
                                                    <span className="text-gray-800">{kanaRomajiTail.restAfterFirst.slice(1)}</span>
                                                </>
                                            )}
                                            {kanaRomajiTail && (
                                                <span className="text-gray-800">{kanaRomajiTail.restOfWhole}</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className={`text-sm font-bold mb-2 ${isBoss ? 'text-purple-200' : 'text-gray-500'}`}>いま おすキー（小文字）· あとから すすんでいくよ</p>
                                    <p className={`text-xs sm:text-sm font-bold mb-4 ${isBoss ? 'text-purple-300' : 'text-gray-400'}`}>
                                        まんなかの <span className="text-red-500 font-black">{drillMode === 'sequence' ? seqCurrent : targetKeySingle}</span> を おしてね
                                        {drillMode === 'sequence' ? '。みぎは つぎの もじ' : `。みぎは つぎの ${targetKeySingle}`}
                                    </p>
                                    <div className={`w-full max-w-3xl mx-auto overflow-hidden rounded-xl border-2 border-dashed py-6 pl-2 sm:pl-4 pr-1 ${isBoss ? 'border-purple-600/70 bg-slate-900/40' : 'border-gray-200 bg-white/80'}`}>
                                        <div
                                            className="tokkun-queue-track flex items-end gap-2"
                                            style={{
                                                transform: `translateX(calc(-1 * ${progress} * (3.5rem + 0.5rem)))`
                                            }}
                                        >
                                            {Array.from({ length: total }).map((_, i) => {
                                                const ch = queueCellChar(i);
                                                const done = i < progress;
                                                const current = i === progress;
                                                const waiting = i > progress;
                                                return (
                                                    <div
                                                        key={i}
                                                        className="w-14 flex-shrink-0 flex flex-col justify-end items-center relative overflow-visible min-h-[6.5rem] sm:min-h-[8rem]"
                                                    >
                                                        {done && (
                                                            <span className="text-green-500 text-2xl sm:text-3xl font-black leading-none pb-1" aria-hidden="true">✓</span>
                                                        )}
                                                        {current && (
                                                            <>
                                                                {progress > 0 && (
                                                                    <div key={progress} className="tokkun-burst-ring" aria-hidden="true" />
                                                                )}
                                                                {burstFragments.map((f) => (
                                                                    <span
                                                                        key={f.id}
                                                                        className="tokkun-frag text-lg sm:text-xl z-[20]"
                                                                        style={{
                                                                            color: f.hue,
                                                                            '--tx': `${f.tx}px`,
                                                                            '--ty': `${f.ty}px`,
                                                                            '--rot': `${f.rot}deg`,
                                                                            '--frag-s': f.s
                                                                        }}
                                                                    >
                                                                        {ch}
                                                                    </span>
                                                                ))}
                                                                <div className="text-5xl sm:text-7xl font-mono font-black relative z-[10] leading-none">
                                                                    <span
                                                                        key={progress}
                                                                        className={`text-red-500 underline decoration-red-300 decoration-2 sm:decoration-4 underline-offset-4 sm:underline-offset-8 inline-block ${progress > 0 ? 'tokkun-core-burst' : ''}`}
                                                                    >
                                                                        {ch}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                        {waiting && (
                                                            <span className={`text-2xl sm:text-4xl font-mono font-black select-none leading-none pb-1 ${isBoss ? 'text-slate-300' : 'text-slate-400'}`}>
                                                                {ch}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                            {hintMsg ? (
                                <p className="mt-6 text-base sm:text-lg font-bold text-orange-600 animate-pulse">{hintMsg}</p>
                            ) : (
                                <p className={`mt-6 text-sm font-bold ${isBoss ? 'text-purple-300/90' : 'text-gray-400'}`}>
                                    {drillMode === 'kana' ? 'ローマ字の ルールに したがって うってね' : (cfg.fingerHint || `いまのキーは ${drillMode === 'sequence' ? seqCurrent : targetKeySingle}`)}
                                </p>
                            )}
                        </div>

                        <Keyboard targetKey={keyboardTarget} />
                    </div>
                )}

                {gameState === 'result' && (
                    <div className="text-center py-6 sm:py-10 flex flex-col items-center px-2">
                        {isBoss && (
                            <div className="w-full max-w-lg flex flex-row justify-end items-end gap-3 mb-4 px-1">
                                <div className="bg-gray-900 text-amber-100 px-4 py-3 rounded-2xl rounded-br-sm border-2 border-purple-600 shadow-lg text-base sm:text-lg font-bold max-w-[85%]">
                                    {bossSuccessMsg}
                                </div>
                                <span className="text-5xl sm:text-6xl shrink-0" aria-hidden="true">👹</span>
                            </div>
                        )}
                        <p className="text-5xl sm:text-6xl mb-2">🎉</p>
                        <h2 className={`text-2xl sm:text-4xl font-black mb-2 ${isBoss ? 'text-amber-300' : 'text-blue-600'}`}>クリア！</h2>
                        <p className={`font-bold mb-6 text-base sm:text-lg ${isBoss ? 'text-purple-100' : 'text-gray-700'}`}>
                            {drillMode === 'kana'
                                ? 'かなを クリアできたね！'
                                : drillMode === 'sequence'
                                    ? 'もんだいを クリアできたね！'
                                    : `${targetKeySingle.toUpperCase()} を ${total} かい できたね！`}
                        </p>
                        {missCount > 0 ? (
                            <p className="text-sm sm:text-base text-gray-500 mb-6">ミスは {missCount} かい。つぎは もっと スムーズに いけるよ！</p>
                        ) : (
                            <p className="text-sm sm:text-base text-green-600 font-bold mb-6">ミス ゼロ！ すばらしい！</p>
                        )}
                        <div className="flex flex-col gap-3 w-full max-w-lg justify-center">
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 justify-center">
                                <button
                                    type="button"
                                    onClick={restartGame}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
                                >
                                    もう一度
                                </button>
                                {nextLevelHref ? (
                                    <button
                                        type="button"
                                        onClick={() => { window.location.href = nextLevelHref; }}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
                                    >
                                        次へ
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => { window.location.href = cfg.backHref || 'index.html'; }}
                                    className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
                                >
                                    ステージを選ぶ
                                </button>
                            </div>
                        </div>
                        <p className="mt-6 text-sm sm:text-base text-gray-500 font-bold leading-relaxed px-2">
                            ⌨️ キーボードでも： <span className="text-blue-600">F</span>＝もう一度
                            {nextLevelHref ? (
                                <>　/　<span className="text-green-600">J</span>＝次へ</>
                            ) : (
                                <>（つぎのステージがないときは J は つかえません）</>
                            )}
                        </p>
                    </div>
                )}

                {gameState === 'bossTimeout' && (
                    <div className="text-center py-8 sm:py-10 flex flex-col items-center px-3">
                        {isBoss && (
                            <div className="w-full max-w-lg flex flex-row justify-end items-end gap-3 mb-6 px-1">
                                <div className="bg-gray-900 text-red-200 px-4 py-3 rounded-2xl rounded-br-sm border-2 border-red-500/60 shadow-lg text-base sm:text-lg font-bold max-w-[85%] text-left">
                                    {bossFailMsg}
                                </div>
                                <span className="text-5xl sm:text-6xl shrink-0" aria-hidden="true">👹</span>
                            </div>
                        )}
                        <h2 className={`text-2xl sm:text-4xl font-black mb-3 ${isBoss ? 'text-red-300' : 'text-red-600'}`}>じかんぎれ</h2>
                        {isBoss ? (
                            <p className="text-purple-200 font-bold mb-6 text-sm sm:text-base">
                                {timeLimitSec}びょうを こえたよ。もういちど！
                            </p>
                        ) : (
                            <p className="text-gray-700 font-bold mb-6 text-sm sm:text-base">
                                じかんないで おわらなかったね。もういちど！
                            </p>
                        )}
                        <div className="flex flex-col gap-3 w-full max-w-lg justify-center">
                            <button
                                type="button"
                                onClick={restartGame}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
                            >
                                もう一度
                            </button>
                            <button
                                type="button"
                                onClick={() => { window.location.href = cfg.backHref || 'index.html'; }}
                                className="bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-full shadow-lg transform transition hover:scale-105 text-base sm:text-lg"
                            >
                                ステージを選ぶ
                            </button>
                        </div>
                        <p className="mt-6 text-sm sm:text-base text-gray-500 font-bold leading-relaxed px-2">
                            ⌨️ <span className="text-blue-600">F</span>＝もう一度
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}

// レンダリング
const root = ReactDOM.createRoot(document.getElementById('root'));
if (window.TOKKUN_DRILL_CONFIG) {
    root.render(<TokkunDrillApp />);
} else {
    root.render(<App />);
}
