// アプリのアイコン（icon-192.png・icon-512.png）を作る。若竹の緑の地に、白いラベルと朱の虫めがね。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）。maskable でも欠けないよう、絵は真ん中の円（直径80%）に収める
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#2f5d3a"/>
      <rect x="27" y="24" width="38" height="50" rx="5" fill="#fff" stroke="#1f4128" stroke-width="2"/>
      <rect x="32" y="31" width="28" height="4" rx="2" fill="#2a2420"/>
      <rect x="32" y="40" width="28" height="3" rx="1.5" fill="#cfc4b0"/><rect x="32" y="47" width="22" height="3" rx="1.5" fill="#cfc4b0"/><rect x="32" y="54" width="25" height="3" rx="1.5" fill="#cfc4b0"/>
      <circle cx="62" cy="60" r="11" fill="#fffdf8" stroke="#b8402a" stroke-width="4.5"/>
      <line x1="70" y1="68" x2="77" y2="75" stroke="#b8402a" stroke-width="6" stroke-linecap="round"/></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
