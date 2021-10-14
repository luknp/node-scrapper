const puppeteer = require("puppeteer");
const axios = require("axios");
require("dotenv").config();

const SCRAPED_URL = process.env.SCRAPED_URL;
const QUERY_SELECTOR = process.env.QUERY_SELECTOR;
const REQUEST_INTERVAL_MS = process.env.REQUEST_INTERVAL_MS || 5000;
const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;
console.log(QUERY_SELECTOR)

let oldElement = "";
let newElement = "";

async function scrap() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
  );
  await page.goto(SCRAPED_URL, { waitUntil: "networkidle0" });
  const data = await page.evaluate(
    () => document.querySelector(`${QUERY_SELECTOR}`).innerText
  );
  await browser.close();
  return data;
}

async function sendNotification(payload) {
  if (API_URL) {
    await axios.post(API_URL, payload, {
      headers: {
        Authorization: `Basic ${API_KEY}`,
      },
    });
  }
}

async function task() {
  newElement = await scrap();
  console.log(newElement);
  if (newElement !== oldElement) {
    console.log(`NEW CAR: ${newElement}`);
    sendNotification(`NEW CAR: ${newElement}: ${SCRAPED_URL}`);
  }
  oldElement = newElement;
}

if (!SCRAPED_URL || !QUERY_SELECTOR) {
  console.error("Missing configuration in .env file");
  return -1;
}

(async () => {
  await sendNotification("node scraper start");
  console.log("start");
  await task();
})();
setInterval(() => task(), REQUEST_INTERVAL_MS);
