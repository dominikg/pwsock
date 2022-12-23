import {chromium} from "playwright-core";
import {exec} from 'node:child_process';
const startPlaywrightServer = async () => {
    const headless =true;
    const isCI = false;
    const args = [];
    if (isCI) {
        args.push('--no-sandbox', '--disable-setuid-sandbox');
    }
    if (headless) {
        args.push('--headless');
    }
    return chromium.launchServer({
        headless,
        args
    });
};

let browserServer, wsEndpoint, browser, page, dev;

try {
    browserServer = await startPlaywrightServer();
    wsEndpoint = browserServer.wsEndpoint();
    browser = await chromium.connect(wsEndpoint);
    page = await browser.newPage();
    console.log(`trying page.goto with https://playwright.dev`);
    await page.goto('https://playwright.dev');
    console.log('SUCCESS')
    const url = 'http://localhost:5173';
    console.log(`starting vite dev server on ${url}`)
    dev = exec('vite dev');
    // wait a bit so vite devserver is started
    await new Promise(resolve => {setTimeout(resolve,500)})
    await fetch(url).then(res => res.text()).then(text => {
        console.log(`fetched ${url}\n`, text);
    });

    console.log(`trying page.goto with ${url}`)
    await page.goto(url); // this fails
    console.log('SUCCESS')
} catch (e) {
    console.error('ERROR',e);
} finally {
    await Promise.allSettled([
        dev?.kill('SIGTERM'),
        page?.close(),
        browser?.close(),
        browserServer.close()
    ].filter(Boolean))
}