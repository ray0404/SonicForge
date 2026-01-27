Starting Sonic Forge TUI...
[CLI] Launching Engine with: /data/data/com.termux/files/usr/bin/chromium-browser
Fatal Error: Error: net::ERR_ABORTED at http://127.0.0.1:3000/headless.html
    at navigate (file:///data/data/com.termux/files/home/Projects/PWA_SonicForge/SonicForge/node_modules/puppeteer-core/lib/esm/puppeteer/cdp/Frame.js:180:27)
    at async Deferred.race (file:///data/data/com.termux/files/home/Projects/PWA_SonicForge/SonicForge/node_modules/puppeteer-core/lib/esm/puppeteer/util/Deferred.js:33:20)
    at async CdpFrame.goto (file:///data/data/com.termux/files/home/Projects/PWA_SonicForge/SonicForge/node_modules/puppeteer-core/lib/esm/puppeteer/cdp/Frame.js:146:25)
    at async CdpPage.goto (file:///data/data/com.termux/files/home/Projects/PWA_SonicForge/SonicForge/node_modules/puppeteer-core/lib/esm/puppeteer/api/Page.js:576:20)
    at async AudioBridge.init (file:///data/data/com.termux/files/home/Projects/PWA_SonicForge/SonicForge/dist/cli/engine/audio-bridge.js:43:9)
    at async Command.<anonymous> (file:///data/data/com.termux/files/home/Projects/PWA_SonicForge/SonicForge/dist/cli/index.js:38:9)
