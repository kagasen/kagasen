/**
 * 70のとっくん クリア状態（localStorage）
 * window.TokkunStorage を公開
 */
(function () {
    var STORAGE_KEY = 'kagasen_tokkun70_cleared';

    function read() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return {};
            var data = JSON.parse(raw);
            return typeof data === 'object' && data !== null ? data : {};
        } catch (e) {
            return {};
        }
    }

    function write(obj) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
        } catch (e) {}
    }

    window.TokkunStorage = {
        getAll: read,
        setLevelCleared: function (levelNum) {
            var n = parseInt(levelNum, 10);
            if (isNaN(n) || n < 1 || n > 70) return;
            var data = read();
            data[String(n)] = { at: Date.now() };
            write(data);
        },
        isLevelCleared: function (levelNum) {
            return !!read()[String(levelNum)];
        }
    };
})();
