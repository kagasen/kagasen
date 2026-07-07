/* =====================================================================
   quiz.js — 毎日謎解き 共通エンジン（2〜6年で共有・本体はこの1枚）
   学年ごとの違い（タイトル・選択肢の記号・問題データ）は 各学年フォルダの
   data.js（window.MAINICHI_QUIZ）に置く。ロジックの修正はこのファイルだけ直す。
   このファイルを直したら 各学年 index.html の quiz.js?v=N と sw.js の CACHE を
   繰り上げること（データだけ直したときは その学年の data.js?v=N を繰り上げ）。
   ※旧構成にあった Firebase コードは「呼び出し・UIともに無い死にコード」かつ
     CDN import がオフライン起動を壊していたため 2026-07-07 に撤去した。
   ===================================================================== */
(function () {
    'use strict';

    const cfg = window.MAINICHI_QUIZ;
    if (!cfg) { console.error('quiz.js: 先に data.js（window.MAINICHI_QUIZ）を読み込むこと'); return; }

    /* ---------- 画面の組み立て（全学年共通のマークアップ） ---------- */
    document.getElementById('app').innerHTML = `
    <div class="container">
        <h1 class="text-4xl font-extrabold text-gray-800 mb-8" id="appTitle"></h1>

        <div id="startPage" class="p-6">
            <p class="text-xl font-semibold text-gray-700 mb-4">日付を選んでテストを開始してください。</p>

            <label for="quizDate" class="block text-left text-gray-600 mb-2">日付を選んでください:</label>
            <input type="date" id="quizDate" class="mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500">

            <button id="startButton">テストを開始する</button>
        </div>

        <div id="quizPage" style="display: none;">
            <div class="question-box">
                <p id="question" class="text-xl font-semibold text-gray-700 mb-4">問題がここに表示されます。</p>
                <div id="choiceButtons" class="choice-buttons"></div>
            </div>
            <div id="feedback" class="feedback"></div>
            <div id="explanation" class="explanation" style="display: none;"></div>
            <div>
                <button id="backButton" class="back-button">戻る</button>
            </div>
        </div>
    </div>

    <div id="messageBox" class="message-box">
        <p id="messageText"></p>
        <button id="messageBoxCloseButton">OK</button>
    </div>`;
    document.getElementById('appTitle').textContent = cfg.title;

    /* ---------- 問題データ（CSV: 問題,答え,解説） ---------- */
    const questions = cfg.csv.split('\n').map((row) => {
        const columns = row.split(',');
        return {
            question: columns[0] ? columns[0].trim() : '', // 問題文
            answer: columns[1] ? columns[1].trim() : '',   // 答え
            explanation: columns[2] ? columns[2].trim() : '解説はありません。' // 解説 (ない場合はデフォルトメッセージ)
        };
    }).filter(q => q.question !== '' && q.answer !== ''); // 問題と答えが空の行は除外

    // 念のため、問題数が365日分あるか確認（警告のみ）
    if (questions.length < 365) {
        console.warn(`問題数が365日分 (${questions.length}問) よりも少ないです。日付によっては同じ問題が出ます。`);
    }

    let currentQuestionIndex; // 現在の問題のインデックス
    let selectedQuizDate; // ユーザーが選択した日付

    // DOM要素の取得
    const startPage = document.getElementById('startPage');
    const quizPage = document.getElementById('quizPage');
    const quizDateInput = document.getElementById('quizDate');
    const startButton = document.getElementById('startButton');

    const questionElement = document.getElementById('question');
    const choiceButtonsContainer = document.getElementById('choiceButtons'); // 選択肢ボタンのコンテナ
    const feedbackElement = document.getElementById('feedback');
    const explanationElement = document.getElementById('explanation'); // 解説表示エリア
    const backButton = document.getElementById('backButton'); // 戻るボタンの要素を取得
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const messageBoxCloseButton = document.getElementById('messageBoxCloseButton');

    /**
     * カスタムメッセージボックスを表示する関数。
     * alert() の代わりに使用します。
     * @param {string} message - 表示するメッセージ。
     */
    function showMessageBox(message) {
        messageText.textContent = message;
        messageBox.style.display = 'block';
    }

    /**
     * カスタムメッセージボックスを非表示にする関数。
     */
    function hideMessageBox() {
        messageBox.style.display = 'none';
    }

    // メッセージボックスの閉じるボタンにイベントリスナーを追加
    messageBoxCloseButton.addEventListener('click', hideMessageBox);

    /**
     * 指定された日付の「年間の日数」を計算します。
     * この値を使って、日付ごとに一意の問題を決定します。
     * @param {Date} date - 計算対象の日付オブジェクト。
     * @returns {number} - その年の1月1日からの経過日数。
     */
    function getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0); // その年の1月1日
        // タイムゾーンのオフセットを考慮して正確な日数を計算
        const diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24; // 1日のミリ秒数
        return Math.floor(diff / oneDay);
    }

    /**
     * ユーザーが選択した日付に基づいて、その日の問題（インデックス）を初期化します。
     * これにより、同じ日付であれば常に同じ問題が表示されます。
     * @param {string} dateString - ユーザーが選択した日付の文字列 (YYYY-MM-DD形式)。
     */
    function initializeDailyQuestion(dateString) {
        selectedQuizDate = new Date(dateString); // 選択された日付をDateオブジェクトに変換
        // 問題配列のインデックスは、0始まりの経過日数と問題数で割り算することで決定
        // getDayOfYear は1月1日を1と数えるので、配列インデックスに合わせるため-1する
        // 問題数が365個未満の場合でも、日付に対応する問題を循環して表示
        currentQuestionIndex = (getDayOfYear(selectedQuizDate) - 1) % questions.length;

        // 負のインデックスにならないように調整 (getDayOfYearが0を返す可能性は低いが安全策)
        if (currentQuestionIndex < 0) {
            currentQuestionIndex = 0;
        }

        loadQuestion(); // 問題を読み込む
    }

    /**
     * 現在の問題をUIに読み込みます。
     * 選択肢ボタンを生成し、フィードバックをリセットします。
     */
    function loadQuestion() {
        const questionData = questions[currentQuestionIndex];
        questionElement.textContent = questionData.question; // 問題文を設定
        feedbackElement.textContent = ''; // フィードバックをクリア
        feedbackElement.className = 'feedback'; // フィードバックのCSSクラスをリセット
        explanationElement.textContent = ''; // 解説をクリア
        explanationElement.style.display = 'none'; // 解説を非表示

        // 選択肢ボタンを生成（記号は学年の data.js で指定: 2年=1〜4 / 3〜6年=ア〜エ）
        choiceButtonsContainer.innerHTML = '';
        cfg.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.textContent = choice;
            btn.className = 'choice-btn';
            btn.addEventListener('click', () => answerSelected(choice));
            choiceButtonsContainer.appendChild(btn);
        });
    }

    /**
     * 選択肢が選ばれたときの処理。
     * @param {string} selectedChoice - クリックされた選択肢の文字。
     */
    function answerSelected(selectedChoice) {
        const questionData = questions[currentQuestionIndex];

        // 正解の文字列を正規化（全角・半角を統一）
        const cleanedSelected = selectedChoice.normalize('NFKC').toLowerCase();
        const cleanedCorrect = String(questionData.answer).normalize('NFKC').toLowerCase();
        const isCorrect = cleanedSelected === cleanedCorrect;

        // ボタンを全て無効化し、正解・不正解の色を表示
        const buttons = choiceButtonsContainer.querySelectorAll('.choice-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            const btnChoice = btn.textContent.normalize('NFKC').toLowerCase();
            if (btnChoice === cleanedCorrect) {
                btn.classList.add('correct-choice');
            } else if (btnChoice === cleanedSelected && !isCorrect) {
                btn.classList.add('incorrect-choice');
            }
        });

        if (isCorrect) {
            feedbackElement.textContent = '正解！素晴らしい！';
            feedbackElement.classList.add('correct');
            showMessageBox('正解！素晴らしい！');
        } else {
            feedbackElement.textContent = `不正解... 正しい答えは ${questionData.answer} です。`;
            feedbackElement.classList.add('incorrect');
            showMessageBox(`不正解... 正しい答えは ${questionData.answer} です。`);
        }

        // 解説を表示
        explanationElement.textContent = `【解説】\n${questionData.explanation}`;
        explanationElement.style.display = 'block';
    }

    /**
     * 開始ボタンがクリックされたときの処理。
     * 日付を検証し、クイズページに切り替えます。
     */
    startButton.addEventListener('click', () => {
        const selectedDate = quizDateInput.value;

        // 日付の検証
        if (!selectedDate) {
            showMessageBox('日付を選択してください。');
            return;
        }

        // 開始ページを非表示にし、クイズページを表示
        startPage.style.display = 'none';
        quizPage.style.display = 'block';

        // 選択された日付に基づいて問題を初期化
        initializeDailyQuestion(selectedDate);
    });

    /**
     * 戻るボタンがクリックされたときの処理。
     * クイズページを非表示にし、開始ページを表示します。
     */
    backButton.addEventListener('click', () => {
        quizPage.style.display = 'none'; // クイズページを非表示
        startPage.style.display = 'block'; // 開始ページを表示
    });

    // 日付入力欄に今日の日付をセット
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 月は0から始まるので+1
    const day = String(today.getDate()).padStart(2, '0');
    quizDateInput.value = `${year}-${month}-${day}`; // 今日の日付を入力欄に設定
})();
