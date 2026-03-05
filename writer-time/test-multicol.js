const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(`
            <style>
                .container {
                    writing-mode: vertical-rl;
                    height: 25.7cm;
                    column-width: 17cm;
                    column-gap: 4cm;
                }
            </style>
            <div class="container" id="box">
                ${'あ'.repeat(5000)}
            </div>
        `);
        const rect = await page.evaluate(() => {
            const el = document.getElementById('box');
            return {
                width: el.scrollWidth,
                height: el.scrollHeight
            };
        });
        console.log(rect);
        await browser.close();
    } catch(e) {
        console.log("No puppeteer");
    }
})();
