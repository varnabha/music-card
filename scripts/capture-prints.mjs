/**
 * Headless capture of all card fronts/backs (+ art) into Prints/.
 * Usage: node scripts/capture-prints.mjs
 * Requires: local server on PORT (default 5173) and playwright.
 */
import { chromium } from "playwright";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PRINTS = path.join(ROOT, "Prints");
const PORT = process.env.PORT || "5173";
const BASE = `http://127.0.0.1:${PORT}`;

const CARDS = [
  { slug: "chaand-baaliyan", file: "card.html" },
  { slug: "saiyaan", file: "saiyaan.html" },
  { slug: "i-think-they-call-this-love", file: "i-think-they-call-this-love.html" },
  { slug: "cant-help-falling-in-love", file: "cant-help-falling-in-love.html" },
  { slug: "saudebaazi", file: "saudebaazi.html" },
  { slug: "kabhi-jo-badal-barse", file: "kabhi-jo-badal-barse.html" },
];

async function loadHtml2Canvas(page) {
  await page.addScriptTag({
    url: "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
  });
  await page.waitForFunction(() => typeof window.html2canvas === "function");
}

async function captureCard(page, slug) {
  const results = await page.evaluate(async (cardSlug) => {
    const waitForImages = (root) => {
      const imgs = [...root.querySelectorAll("img")];
      return Promise.all(
        imgs.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete && img.naturalWidth > 0) return resolve();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 3000);
            })
        )
      );
    };

    const toPngBytes = async (el, bg) => {
      await waitForImages(el);
      const canvas = await window.html2canvas(el, {
        scale: 3,
        backgroundColor: bg,
        useCORS: true,
        allowTaint: false,
        imageTimeout: 15000,
        logging: false,
        onclone: (doc) => {
          doc.querySelectorAll(".sp-card, .qr-card").forEach((node) => {
            node.style.boxShadow = "none";
          });
          doc.querySelectorAll("img.sp-cover").forEach((img) => {
            img.style.display = "block";
            img.style.maxWidth = "100%";
            img.style.height = "auto";
          });
        },
      });
      const dataUrl = canvas.toDataURL("image/png");
      return dataUrl;
    };

    const out = { front: null, back: null, artSvg: null, artPngDataUrl: null, artPngUrl: null };
    const front = document.querySelector(".sp-card");
    if (!front) throw new Error(`Missing .sp-card for ${cardSlug}`);
    out.front = await toPngBytes(front, "#ffffff");

    const back = document.querySelector(".qr-card");
    if (back) out.back = await toPngBytes(back, "#0c1822");

    const svg = front.querySelector("svg.sp-cover");
    if (svg) {
      const clone = svg.cloneNode(true);
      if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      out.artSvg = new XMLSerializer().serializeToString(clone);
    }

    const img = front.querySelector("img.sp-cover");
    if (img?.src) {
      if (img.src.startsWith("data:")) out.artPngDataUrl = img.src;
      else out.artPngUrl = img.src;
    }

    return out;
  }, slug);

  const writeDataUrl = async (fileName, dataUrl) => {
    const b64 = dataUrl.split(",")[1];
    const buf = Buffer.from(b64, "base64");
    const dest = path.join(PRINTS, fileName);
    await writeFile(dest, buf);
    return { fileName, bytes: buf.length };
  };

  const written = [];
  written.push(await writeDataUrl(`${slug}-front.png`, results.front));
  if (results.back) written.push(await writeDataUrl(`${slug}-back.png`, results.back));

  if (results.artSvg) {
    const dest = path.join(PRINTS, `${slug}-art.svg`);
    await writeFile(dest, results.artSvg, "utf8");
    written.push({ fileName: `${slug}-art.svg`, bytes: Buffer.byteLength(results.artSvg) });
  }

  if (results.artPngDataUrl) {
    written.push(await writeDataUrl(`${slug}-art.png`, results.artPngDataUrl));
  } else if (results.artPngUrl) {
    const res = await fetch(results.artPngUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = results.artPngUrl.includes(".png") ? "png" : "jpg";
    const fileName = `${slug}-art.${ext}`;
    await writeFile(path.join(PRINTS, fileName), buf);
    written.push({ fileName, bytes: buf.length });
  }

  return written;
}

async function main() {
  await mkdir(PRINTS, { recursive: true });

  // Health check
  const health = await fetch(`${BASE}/saudebaazi.html`).catch(() => null);
  if (!health?.ok) {
    throw new Error(`Server not reachable at ${BASE}. Start: python3 server.py`);
  }

  const browser = await chromium.launch({
    headless: true,
    channel: "chrome", // use system Google Chrome (no Playwright browser download)
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  const all = [];
  for (const card of CARDS) {
    const url = `${BASE}/${card.file}`;
    console.log(`Capturing ${card.slug}…`);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForSelector(".sp-card");
    // Give QR libs a beat if present
    await page.waitForTimeout(400);
    await loadHtml2Canvas(page);
    const written = await captureCard(page, card.slug);
    for (const w of written) {
      console.log(`  ${w.fileName} (${w.bytes} bytes)`);
      all.push(w);
    }
  }

  // Ensure saudebaazi art exists even if capture skipped
  const rose = path.join(ROOT, "assets", "rose.png");
  const saudeArt = path.join(PRINTS, "saudebaazi-art.png");
  if (existsSync(rose) && !existsSync(saudeArt)) {
    await copyFile(rose, saudeArt);
    console.log("  copied assets/rose.png → saudebaazi-art.png");
  }

  await browser.close();
  console.log(`\nWrote ${all.length} files into ${PRINTS}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
