const { chromium } = require('./frontend/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();

  const capture = async (name, viewport) => {
    const page = await browser.newPage({ viewport });
    try {
      await page.goto('http://127.0.0.1:5174/login', { waitUntil: 'networkidle' });
    } catch (e) {
      await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
    await page.close();
  };

  await capture('login-desktop', { width: 1440, height: 900 });
  await capture('login-tablet', { width: 820, height: 900 });
  await capture('login-mobile', { width: 375, height: 900 });

  await browser.close();
})();

