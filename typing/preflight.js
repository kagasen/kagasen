/**
 * Finder から file:// で開いたとき、Babel が app.js を読めず白画面になることがあるため通知する。
 * http://localhost/... で開けば問題ない。
 */
(function () {
    if (window.location.protocol !== 'file:') return;
    if (window.__KAGASEN_TYPING_FILE_WARN__) return;
    window.__KAGASEN_TYPING_FILE_WARN__ = true;

    function show() {
        var box = document.createElement('div');
        box.setAttribute('role', 'alert');
        box.style.cssText =
            'position:fixed;left:0;right:0;top:0;z-index:99999;padding:14px 18px;font-size:15px;line-height:1.6;' +
            'background:#fef3c7;border-bottom:3px solid #f59e0b;color:#92400e;font-family:system-ui,sans-serif;' +
            'box-shadow:0 4px 12px rgba(0,0,0,.12);';
        box.innerHTML =
            '<strong>【重要】</strong> Finder から直接開いていると、タイピング画面が真っ白・動かないことがあります（Safariの制限）。' +
            '<br><strong>対処：</strong> フォルダ内の <code style="background:#fde68a;padding:2px 6px;border-radius:4px;">start-local-server.command</code> をダブルクリックしてサーバを起動し、' +
            'ブラウザで <code style="background:#fde68a;padding:2px 6px;border-radius:4px;">http://localhost:8765/typing/</code> を開いてください。' +
            '<br><span style="font-size:13px;opacity:.9;">（ターミナルが開いたらそのままにしておき、終わるときはターミナルで Ctrl+C）</span>';
        if (document.body) document.body.insertBefore(box, document.body.firstChild);
        else document.addEventListener('DOMContentLoaded', function () {
            document.body.insertBefore(box, document.body.firstChild);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
    else show();
})();
