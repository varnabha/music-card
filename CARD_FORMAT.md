# Music gift card format spec

Hand this to a designer. **Do not redesign the HTML layout** — deliver art assets and palette tokens that plug into the existing structure.

Each song = **one self-contained HTML file** (inline CSS + JS). No external stylesheets. No audio embedded in the card file.

---

## Overall structure

```
┌─────────────────────────────────────────────────────────┐
│  Screen: toolbar (no-print) + hint                      │
│  ┌──────────────────┐  ┌──────────────────┐             │
│  │  FRONT (.sp-card)│  │  BACK (.qr-card) │  side-by-side│
│  │  Spotify player  │  │  QR + dedication │  on screen  │
│  └──────────────────┘  └──────────────────┘             │
└─────────────────────────────────────────────────────────┘

Print: front page → back page (two separate sheets, 105 × 148 mm each)
```

| Property | Value |
|----------|-------|
| File type | Single `.html` per song |
| Cards per file | 2 — front player + back QR |
| Print size | **105 mm × 148 mm** (aspect **105∶148**, ≈ A6) |
| Screen layout | `.sheet-pair` — 2-column grid, stacks on mobile |
| Print flow | Front first (`page-break-after: always`), then back |
| Toolbar | Hidden when printing (`.no-print`) |
| QR generation | JS in file; user sets URL → Update QR → Print |
| Audio | **Not in card HTML.** QR links to player page (`index.html` or hosted URL). |

---

## Front card (`.sp-card`)

White Spotify-style player on a dark page background.

### Dimensions

| Element | Spec |
|---------|------|
| Card | `aspect-ratio: 105 / 148`; print: `105mm × 148mm` |
| Card background | `#fff` |
| Border radius (screen) | `18px` (square corners when printed) |
| Album art (`.sp-art`) | **1∶1 square**, `width: calc(100% - 1.6rem)`, `margin: 0.8rem auto 0`, `border-radius: 10px` |

### Section order (top → bottom)

1. **Album art area** (`.sp-art`) — themed background + SVG illustration
2. **Body** (`.sp-body`)
   - Title row: song title, artist, dedication, heart icon
   - Progress bar (decorative, static)
   - Player controls (decorative, static)
   - **chirkut** signature (`.sp-sign`)

### Album art layers

Stack inside `.sp-art`:

```
.sp-art
└── .sp-art-sky          ← CSS gradients (sky / mood base)
    ├── .sp-art-rain     ← optional CSS rain streaks
    ├── .sp-art-stars    ← CSS star speckles (radial-gradient dots)
    └── .sp-art-glow     ← CSS soft radial glow blob
└── SVG foreground       ← .sp-cover (most songs) OR .sp-moon + .sp-earring (card.html)
```

| Layer | Who builds it | Notes |
|-------|---------------|-------|
| `.sp-art-sky` | Designer → CSS | 2–3 gradients: radial accent + linear vertical sky |
| `.sp-art-rain` | Designer → CSS | Optional; angled `linear-gradient` stripes |
| `.sp-art-stars` | Designer → CSS | 4–6 `radial-gradient` 1–1.5 px dots at fixed % positions |
| `.sp-art-glow` | Designer → CSS | ~48–55% width circle, blurred radial highlight |
| SVG cover | **Designer → SVG** | Main illustration; sits above layers, `z-index: 1` |

**SVG cover (`.sp-cover`)**

- **viewBox:** `0 0 240 240` (standard across songs)
- **Rendered width:** ~78–90% of `.sp-art` (tune per illustration; reference: cat 82%, diya 78%, rose/clouds 90%)
- **Position:** centered in `.sp-art` via grid + relative positioning
- **Drop shadow:** optional `filter: drop-shadow(...)` themed to palette

**Legacy moon layout (`card.html` only)**

- `.sp-moon` — `viewBox="0 0 200 200"`, width ~58%
- `.sp-earring` — separate SVG, ~13% width, positioned absolute

### Title row text slots

| Class | Content | Font |
|-------|---------|------|
| `h1` in `.sp-titles` | Song title | UI font, **700**, dark |
| `.sp-artist` | Artist name | UI font, **400**, `#666` |
| `.sp-dedication` | Short lyric / dedication line | Display font |
| `.sp-heart` | Static filled heart icon | SVG, `#111`, 24×24 px |

Progress and controls are **non-interactive decoration** — copy from any existing card.

### Front typography & colors

**Standard (most cards):**

| Role | Font | Weight / style | Color |
|------|------|----------------|-------|
| UI (title, artist, times, controls) | **Figtree** | Title 700; artist 400 | Title `#111`, artist `#666` |
| Dedication | **Gloock** | 400, normal or italic per card | `#222` |
| Progress track | — | — | Track `#ddd`, fill/knob `#111` |
| Signature `.sp-sign` | Figtree (inherits UI) | lowercase, `letter-spacing: 0.32em`, `0.48rem` | `#b0b0b0` |

**Legacy (`card.html`):** Cormorant Garamond (display, italic dedication) + Outfit (UI).

**Dark-on-white rule:** Everything below the art area stays **dark text on white** — do not theme the player chrome per song.

---

## Back card (`.qr-card`)

Dark moody card; QR is the only functional element.

### Dimensions

Same as front: **105∶148**, print **105 mm × 148 mm**.

### Section order (top → bottom, centered)

1. **Background layers** (absolute, full bleed)
2. **`.qr-stack`** (centered column)
   - QR frame + code box
   - Dedication line (`.qr-dedication`) — *optional on some cards*
   - **chirkut** signature (`.qr-sign`)

### Background layers

```
.qr-card
└── .qr-sky           ← CSS gradients (mirror front mood, darker)
    ├── .qr-rain      ← optional
    ├── .qr-stars     ← or .qr-haze on saiyaan
    └── .qr-glow      ← soft glow behind QR (~180px, blurred)
```

Match front palette; back is typically **darker** with **light text**.

### QR placement

| Element | Spec |
|---------|------|
| `.qr-frame` | Rounded rect, cream/off-white bg, subtle gold border shadow |
| `.qr-box` | **136–148 px** square (varies slightly by card) |
| QR colors | Dark modules on light frame (e.g. `#081018` on `#f3f0ea`) |
| Position | Centered horizontally; ~12–36% from top depending on dedication |

**QR on back only — never on the front.**

### Back typography & colors

| Class | Font | Size (approx) | Color |
|-------|------|---------------|-------|
| `.qr-dedication` | Gloock (or card display font) | `1.2–1.55rem` | Theme `--glow-soft` / cream gold |
| `.qr-sign` | UI font | `0.6rem`, `letter-spacing: 0.42em`, lowercase | Theme gold at ~80% opacity |

Add `text-shadow` on dedication for legibility on dark bg.

### Saiyaan exception

- No `.qr-dedication` on back — only QR + **♥ chirkut** signature (heart SVG + text).

---

## Brand rules

| Rule | Detail |
|------|--------|
| Signature | **`chirkut`** — lowercase, wide letter-spacing, bottom of front; below QR on back |
| QR placement | **Back only** |
| No audio in HTML | Cards are print + QR link only |
| Player chrome | Front white card layout is fixed; theme only art + back |
| Heart icon | Title row heart on front (all cards); saiyaan also has heart in signature |
| Self-contained | All CSS/JS inline in the HTML file |
| Print | Enable background graphics / `print-color-adjust: exact` |

---

## Text fields per card

| File | Song title | Artist | Dedication (front + back) | Theme / cover subject |
|------|------------|--------|---------------------------|------------------------|
| `card.html` | Chaand Baaliyan | Aditya A | For a pretty Moon | Moon + earring (night gold) |
| `saiyaan.html` | Saiyaan | Kailash Kher | *(none)* | Diya lamp + moths (warm amber) |
| `i-think-they-call-this-love.html` | I Think They Call This Love | Matthew Ifield | You can say that I'm a fool | Acoustic guitar (warm lamp glow) |
| `cant-help-falling-in-love.html` | Can't Help Falling in Love | Elvis Presley | Only fools rush in | Cute sitting cat (dusk blue-gold) |
| `saudebaazi.html` | Saudebaazi | Javed Bashir | *(none)* | Provided rose graphic |
| `kabhi-jo-badal-barse.html` | Kabhi Jo Badal Barse | Arijit Singh | *(none)* | Violet night · rain on glass |

---

## Palette tokens per song (designer starting point)

Deliver as CSS custom properties (`--dusk`, `--glow`, `--glow-soft`, etc.) to swap in `:root`.

| File | Mood | `--dusk` (page bg) | `--glow` | `--glow-soft` | Notes |
|------|------|--------------------|---------|---------------|-------|
| `card.html` | Moonlit navy | `#070b14` | `#d4af6a` | `#e8d5a3` | Gold + moon cream |
| `saiyaan.html` | Deep teal + flame | `#061618` | *(amber in art)* | *(flame `#fff8e8`)* | Fraunces + Sora fonts |
| `i-think-they-call-this-love.html` | Warm room | `#081018` | `#f0c27a` | `#f6d9a8` | Sage accent `#9bb3a6` |
| `cant-help-falling-in-love.html` | Rainy dusk | `#07131f` | `#e8d5b5` | `#f2e6d4` | Sage `#8eb4c8` |
| `saudebaazi.html` | Rose bloom | `#120810` | `#e8a8b8` | `#f5d0d8` | Deep crimson rose |
| `kabhi-jo-badal-barse.html` | Violet monsoon | `#0a0614` | `#c8b0e8` | `#e4d4f4` | Purple / violet emotional sky |

---

## What the designer delivers

Copy-paste friendly checklist per song:

### 1. SVG cover art
- [ ] One `.sp-cover` SVG, **viewBox `0 0 240 240`**
- [ ] Subject centered; safe margin ~10% from edges
- [ ] Works on dark gradient background (`.sp-art-sky`)
- [ ] Optional: separate `.sp-moon` / `.sp-earring` SVGs if not using `.sp-cover`

### 2. CSS background tokens (front + back)
- [ ] `.sp-art-sky` gradient stops (2–3 layers)
- [ ] `.sp-art-stars` dot positions/colors (or approve generated pattern)
- [ ] `.sp-art-glow` position, color, blur
- [ ] Optional `.sp-art-rain` if rain mood
- [ ] Matching `.qr-sky`, `.qr-stars`, `.qr-glow` (and `.qr-rain` if used)

### 3. Palette
- [ ] `:root` hex values: `--dusk`, `--glow`, `--glow-soft`, `--ink`, `--line`
- [ ] QR frame cream + QR dark/light pair

### 4. Optional
- [ ] Drop-shadow color for `.sp-cover`
- [ ] `.qr-dedication` text-shadow color

**Do not deliver:** HTML rewrites, layout changes, interactive player, or audio files.

---

## File list (card HTML only)

| File | Needs from designer |
|------|---------------------|
| `card.html` | Moon + earring SVG; navy/gold sky layers |
| `saiyaan.html` | Diya/moths SVG; teal/amber sky; no dedication text |
| `i-think-they-call-this-love.html` | Guitar SVG; warm lamp palette |
| `cant-help-falling-in-love.html` | Cat SVG; rain + dusk palette |
| `saudebaazi.html` | Bloomed rose SVG; crimson / blush palette |
| `kabhi-jo-badal-barse.html` | Organic cloud SVG; purple-violet emotional sky |

**Not card files:** `index.html` (live audio player), `styles.css` / `player.js` (player page only).

---

## Print workflow (for reference)

1. Open `{song}.html` in browser  
2. Set **QR URL** → **Update QR**  
3. **Print both cards** — front sheet, then back sheet  
4. Fold / glue as physical gift card  

Local preview: `python3 -m http.server 5173` → `http://localhost:5173/{song}.html`
