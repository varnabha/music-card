/**
 * Capture .sp-card (front) + optional .qr-card (back) as PNG.
 * Prefer POST /api/save-print → project Prints/ (server.py).
 * Then File System Access folder pick. Fallback: browser downloads.
 */
(() => {
  const CARDS = [
    { slug: "chaand-baaliyan", file: "card.html", title: "Chaand Baaliyan" },
    { slug: "saiyaan", file: "saiyaan.html", title: "Saiyaan" },
    { slug: "i-think-they-call-this-love", file: "i-think-they-call-this-love.html", title: "I Think They Call This Love" },
    { slug: "cant-help-falling-in-love", file: "cant-help-falling-in-love.html", title: "Can't Help Falling in Love" },
    { slug: "saudebaazi", file: "saudebaazi.html", title: "Saudebaazi" },
    { slug: "kabhi-jo-badal-barse", file: "kabhi-jo-badal-barse.html", title: "Kabhi Jo Badal Barse" },
  ];

  let printsDir = null;
  let apiSaveOk = null; // null unknown, true/false after probe
  let lastSaveMethod = null;

  function setStatus(msg) {
    const el = document.getElementById("saveStatus");
    if (el) el.textContent = msg;
  }

  async function ensureHtml2Canvas() {
    if (window.html2canvas) return window.html2canvas;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load html2canvas"));
      document.head.appendChild(s);
    });
    return window.html2canvas;
  }

  async function probeApiSave() {
    if (apiSaveOk !== null) return apiSaveOk;
    try {
      const res = await fetch("/api/save-print?name=_probe.txt", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "ok",
      });
      apiSaveOk = res.ok;
    } catch {
      apiSaveOk = false;
    }
    return apiSaveOk;
  }

  async function pickPrintsFolder() {
    if (!window.showDirectoryPicker) {
      setStatus("Folder pick unavailable — using server Prints/ or downloads.");
      return null;
    }
    printsDir = await window.showDirectoryPicker({
      id: "prints-folder",
      mode: "readwrite",
      startIn: "documents",
    });
    setStatus(`Prints folder set: ${printsDir.name}`);
    return printsDir;
  }

  async function writeBlob(name, blob) {
    if (!blob || blob.size === 0) {
      throw new Error(`Empty image for ${name} — capture failed`);
    }

    if (await probeApiSave()) {
      const res = await fetch(`/api/save-print?name=${encodeURIComponent(name)}`, {
        method: "POST",
        headers: { "Content-Type": blob.type || "application/octet-stream" },
        body: blob,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Server save failed for ${name}: ${res.status} ${text}`);
      }
      lastSaveMethod = "api";
      return { method: "api", name };
    }

    if (printsDir) {
      const handle = await printsDir.getFileHandle(name, { create: true });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      lastSaveMethod = "folder";
      return { method: "folder", name };
    }

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    lastSaveMethod = "download";
    return { method: "download", name };
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (b) => {
            if (!b) {
              try {
                const data = canvas.toDataURL("image/png");
                const bin = atob(data.split(",")[1]);
                const arr = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
                resolve(new Blob([arr], { type: "image/png" }));
              } catch (e) {
                reject(new Error("Could not export canvas (image may be blocked). Try http://localhost."));
              }
              return;
            }
            resolve(b);
          },
          "image/png",
          1
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  function waitForImages(root) {
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
  }

  async function captureElement(el, html2canvas) {
    await waitForImages(el);
    const isBack = el.classList.contains("qr-card");
    const canvas = await html2canvas(el, {
      scale: 3,
      backgroundColor: isBack ? "#0c1822" : "#ffffff",
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
    return canvasToBlob(canvas);
  }

  function waitForIframe(iframe) {
    return new Promise((resolve, reject) => {
      const done = () => {
        try {
          const doc = iframe.contentDocument;
          if (!doc) return reject(new Error("Cannot read iframe (open via http://localhost, not file://)"));
          resolve(doc);
        } catch (e) {
          reject(e);
        }
      };
      if (iframe.contentDocument?.readyState === "complete") {
        setTimeout(done, 500);
      } else {
        iframe.addEventListener("load", () => setTimeout(done, 700), { once: true });
      }
    });
  }

  async function exportCardFromDoc(doc, slug, html2canvas) {
    const front = doc.querySelector(".sp-card");
    if (!front) throw new Error(`Missing front card in ${slug}`);

    const frontBlob = await captureElement(front, html2canvas);
    await writeBlob(`${slug}-front.png`, frontBlob);

    const back = doc.querySelector(".qr-card");
    if (back) {
      const backBlob = await captureElement(back, html2canvas);
      await writeBlob(`${slug}-back.png`, backBlob);
    }

    const svg = front.querySelector("svg.sp-cover");
    if (svg) {
      const clone = svg.cloneNode(true);
      if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], {
        type: "image/svg+xml;charset=utf-8",
      });
      await writeBlob(`${slug}-art.svg`, svgBlob);
    }

    const img = front.querySelector("img.sp-cover");
    if (img?.src) {
      try {
        if (img.src.startsWith("data:")) {
          const res = await fetch(img.src);
          await writeBlob(`${slug}-art.png`, await res.blob());
        } else {
          const res = await fetch(img.src);
          const imgBlob = await res.blob();
          const ext = img.src.includes(".png") ? "png" : "jpg";
          await writeBlob(`${slug}-art.${ext}`, imgBlob);
        }
      } catch {
        /* ignore art copy failure */
      }
    }
  }

  async function exportFromIframe(iframe, slug) {
    const html2canvas = await ensureHtml2Canvas();
    const doc = await waitForIframe(iframe);
    await exportCardFromDoc(doc, slug, html2canvas);
  }

  function doneMessage(count) {
    if (lastSaveMethod === "api") {
      return `Done. Saved ${count} card(s) into project Prints/.`;
    }
    if (lastSaveMethod === "folder" && printsDir) {
      return `Done. Saved ${count} card(s) into “${printsDir.name}”.`;
    }
    return `Done. Downloaded files. Start with: python3 server.py — then Save writes into Prints/.`;
  }

  async function maybePickFolder() {
    if (await probeApiSave()) {
      setStatus("Saving into project Prints/ via local server…");
      return;
    }
    if (!printsDir && window.showDirectoryPicker) {
      try {
        await pickPrintsFolder();
      } catch {
        setStatus("Folder pick cancelled — downloading files instead.");
      }
    }
  }

  async function exportAll() {
    await ensureHtml2Canvas();
    await maybePickFolder();

    const frames = [...document.querySelectorAll("iframe[data-slug]")];
    let i = 0;
    for (const iframe of frames) {
      i += 1;
      const slug = iframe.dataset.slug;
      setStatus(`Saving ${i}/${frames.length}: ${slug}…`);
      await exportFromIframe(iframe, slug);
    }
    setStatus(doneMessage(frames.length));
  }

  async function exportOne(slug) {
    await ensureHtml2Canvas();
    await maybePickFolder();
    const iframe = document.querySelector(`iframe[data-slug="${slug}"]`);
    if (!iframe) throw new Error(`No iframe for ${slug}`);
    setStatus(`Saving ${slug}…`);
    await exportFromIframe(iframe, slug);
    setStatus(
      lastSaveMethod === "api" || lastSaveMethod === "folder"
        ? `Saved ${slug}-front.png & back`
        : `Downloaded ${slug} PNG(s)`
    );
  }

  async function exportCurrentPage(slug) {
    const html2canvas = await ensureHtml2Canvas();
    await maybePickFolder();
    setStatus(`Saving ${slug}…`);
    await exportCardFromDoc(document, slug, html2canvas);
    setStatus(
      lastSaveMethod === "api" || lastSaveMethod === "folder"
        ? `Saved ${slug}-front.png & back into Prints/`
        : `Downloaded ${slug} PNG(s)`
    );
  }

  window.PrintsExport = {
    CARDS,
    pickPrintsFolder,
    exportAll,
    exportOne,
    exportCurrentPage,
    setStatus,
    probeApiSave,
  };
})();
