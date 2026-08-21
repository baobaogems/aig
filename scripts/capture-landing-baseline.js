// Chụp baseline giao diện landing (feat/reskin) + đo getComputedStyle.
// Chạy: node capture-baseline.js  (dev server phải sống ở localhost:3000)
const P = "/Users/baobao/.claude/skills/chrome-devtools/scripts/node_modules";
const puppeteer = require(require.resolve("puppeteer", { paths: [P] }));
const fs = require("fs");
const path = require("path");

const URL = "http://localhost:3000/";
const OUT = process.argv[2];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
];
// Sections theo đúng thứ tự render trong app/page.tsx
const SECTIONS = [
  ["nav", "nav, header"],
  ["hero", "#top"],
  ["problem", "#problem"],
  ["flow", "#flow"],
  ["safety", "#safety"],
  ["evidence", "#evidence"],
  ["footer", "footer"],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Cuộn hết trang để mọi IntersectionObserver bắn, rồi chờ reveal chạy xong.
async function settleReveal(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  // đợi mọi .reveal thành .reveal-visible + transition kết thúc
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll(".reveal")].every((el) =>
          el.classList.contains("reveal-visible")
        ),
      { timeout: 15000 }
    )
    .catch(() => console.warn("  ! còn .reveal chưa visible sau 15s"));
  await sleep(1200); // transition tail
}

const STYLE_PROPS = [
  "backgroundColor", "color", "fontFamily", "fontSize", "fontWeight",
  "lineHeight", "letterSpacing", "fontVariantNumeric", "textShadow",
  "boxShadow", "borderRadius", "borderColor", "borderWidth",
  "backdropFilter", "mixBlendMode", "opacity", "padding", "margin",
  "transition", "animation", "transform",
  // Tailwind v4 dịch translate/scale/rotate ra CÁC THUỘC TÍNH RIÊNG, không gộp
  // vào `transform`. Đo thiếu chúng thì hover kiểu -translate-y-0.5 trông như
  // "không đổi gì" — đúng lỗi đã làm sai baseline 20:06 ngày 21/08/2026.
  "translate", "scale", "rotate", "filter",
];

// Thuộc tính so sánh trước/sau khi rê chuột. Tách riêng vì hover chỉ quan tâm
// những gì đổi được, không cần đo cả typography.
const HOVER_PROPS = [
  "boxShadow", "backgroundColor", "color", "opacity", "borderColor", "borderWidth",
  "transform", "translate", "scale", "rotate", "filter", "textDecorationColor",
];

async function run() {
  const browser = await puppeteer.launch({ headless: "new" });
  const report = { url: URL, capturedAt: new Date().toISOString(), viewports: {} };

  for (const vp of VIEWPORTS) {
    const dir = path.join(OUT, vp.name);
    fs.mkdirSync(dir, { recursive: true });
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto(URL, { waitUntil: "networkidle0", timeout: 60000 });
    await settleReveal(page);
    console.log(`[${vp.name}] reveal xong`);

    // 1. full page
    await page.screenshot({ path: path.join(dir, "00-full-page.png"), fullPage: true });

    // 2. từng section
    let i = 1;
    const missing = [];
    for (const [name, sel] of SECTIONS) {
      const el = await page.$(sel);
      if (!el) { missing.push(name); continue; }
      try {
        await el.screenshot({ path: path.join(dir, `${String(i).padStart(2, "0")}-${name}.png`) });
        i++;
      } catch {
        // phần tử tồn tại nhưng không hiển thị ở viewport này (vd nav ẩn dưới sm)
        missing.push(`${name} (có trong DOM nhưng không visible)`);
      }
    }
    if (missing.length) console.warn(`[${vp.name}] không thấy section:`, missing.join(", "));

    // 3. hover states (chỉ desktop — mobile không có hover thật)
    const hovers = [];
    if (vp.name === "desktop") {
      const targets = await page.evaluate(() => {
        const seen = new Set();
        // Card (.card-lift) đứng TRƯỚC a/button: card là <div>, nếu không gọi tên
        // riêng thì không bao giờ lọt vào phép đo hover.
        // [class*="card-lift"] bắt cả .card-lift (nền sáng) lẫn .card-lift-dark (nền tối).
        // Selector `.card-lift` KHÔNG khớp `.card-lift-dark` — card sẽ lặng lẽ rơi khỏi
        // phép đo và bảng hover trông y như lúc glow không chạy.
        return [...document.querySelectorAll('[class*="card-lift"]'), ...document.querySelectorAll("a, button")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.width < 40 || r.height < 20) return false;
            const key = (el.textContent || "").trim().slice(0, 30);
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .slice(0, 10)
          .map((el, idx) => {
            el.setAttribute("data-hv", String(idx));
            return { idx, label: (el.textContent || "").trim().slice(0, 40), tag: el.tagName };
          });
      });
      for (const t of targets) {
        const el = await page.$(`[data-hv="${t.idx}"]`);
        if (!el) continue;
        const before = await page.evaluate((e, props) => {
          const cs = getComputedStyle(e);
          return Object.fromEntries(props.map((p) => [p, cs[p]]));
        }, el, HOVER_PROPS);
        await el.hover();
        await sleep(700); // chờ transition hover
        const after = await page.evaluate((e, props) => {
          const cs = getComputedStyle(e);
          return Object.fromEntries(props.map((p) => [p, cs[p]]));
        }, el, HOVER_PROPS);
        const changed = Object.fromEntries(
          Object.keys(after).filter((k) => after[k] !== before[k]).map((k) => [k, `${before[k]}  ->  ${after[k]}`])
        );
        const file = `hover-${String(t.idx).padStart(2, "0")}.png`;
        try { await el.screenshot({ path: path.join(dir, file) }); } catch { /* không visible */ }
        hovers.push({ label: t.label, tag: t.tag, file, changed, noChange: Object.keys(changed).length === 0 });
        await page.mouse.move(0, 0);
        await sleep(300);
      }
    }

    // 4. getComputedStyle của các mốc thị giác + biến CSS gốc
    const styles = await page.evaluate((props, sections) => {
      const pick = (el) => {
        if (!el) return null;
        const cs = getComputedStyle(el);
        return Object.fromEntries(props.map((p) => [p, cs[p]]));
      };
      const out = { sections: {}, typography: {}, numbers: [], cssVars: {}, motion: {} };
      for (const [name, sel] of sections) out.sections[name] = pick(document.querySelector(sel));

      const h1 = document.querySelector("h1");
      out.typography.h1 = pick(h1);
      out.typography.h1Text = h1 ? h1.textContent.trim().slice(0, 80) : null;
      out.typography.h2 = pick(document.querySelector("h2"));
      out.typography.body = pick(document.querySelector("p"));

      // mọi phần tử mà nội dung nhìn như một con số / metric
      out.numbers = [...document.querySelectorAll("*")]
        .filter((el) => el.children.length === 0 && /^[\d.,%$]+\s*\S{0,3}$/.test((el.textContent || "").trim()) && (el.textContent || "").trim().length > 0)
        .slice(0, 12)
        .map((el) => ({ text: el.textContent.trim(), ...pick(el) }));

      const root = getComputedStyle(document.documentElement);
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        for (const r of rules) {
          if (r.style) for (const p of r.style) if (p.startsWith("--")) out.cssVars[p] = root.getPropertyValue(p).trim();
        }
      }
      // đếm keyframes thật sự tồn tại
      out.motion.keyframes = [];
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        for (const r of rules) if (r.type === CSSRule.KEYFRAMES_RULE) out.motion.keyframes.push(r.name);
      }
      out.motion.revealCount = document.querySelectorAll(".reveal").length;
      out.motion.revealVisible = document.querySelectorAll(".reveal-visible").length;
      out.motion.scrollHeight = document.body.scrollHeight;
      return out;
    }, STYLE_PROPS, SECTIONS);

    report.viewports[vp.name] = { viewport: vp, styles, hovers, missingSections: missing };
    await page.close();
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "computed-styles.json"), JSON.stringify(report, null, 2));
  console.log("OK ->", OUT);
}

run().catch((e) => { console.error(e); process.exit(1); });
