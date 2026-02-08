const puppeteer = require("puppeteer");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2, // 고해상도
  });

  const filePath = "file://" + path.resolve("./og-card.html");

  await page.goto(filePath, {
    waitUntil: "networkidle0",
  });

  await page.screenshot({
    path: "og-image.png",
  });

  await browser.close();
  console.log("OG image generated: og-image.png");
})();
