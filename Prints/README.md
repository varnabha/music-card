# Prints

Exported card images go here (`{slug}-front.png`, `{slug}-back.png`, optional art).

## How to save (writes into this folder)

1. Start the project server (required for direct `Prints/` writes):
   ```bash
   python3 server.py
   ```
2. Open http://localhost:5173/cards.html (or any card page)
3. Click **Save all PNGs** / **Save PNGs** — files land in this `Prints/` folder via `POST /api/save-print`

No folder picker needed when using `server.py`.

### Optional: headless regenerate everything

```bash
python3 server.py
node scripts/capture-prints.mjs
```

## Files written

| Pattern | What |
|---------|------|
| `{slug}-front.png` | Rounded Spotify player card |
| `{slug}-back.png` | Rounded QR / back card |
| `{slug}-art.svg` | Cover SVG (when the card uses SVG art) |
| `{slug}-art.png` | Cover image (e.g. Saudebaazi rose) |

Slugs: `chaand-baaliyan`, `saiyaan`, `i-think-they-call-this-love`, `cant-help-falling-in-love`, `saudebaazi`, `kabhi-jo-badal-barse`
