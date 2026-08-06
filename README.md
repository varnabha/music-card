# music-card

Printable music gift cards (**chirkut**) + a live player with hosted audio.

| File | Song | Notes |
|------|------|--------|
| [`index.html`](index.html) | **Player** · all tracks | `?song=<slug>` |
| [`cards.html`](cards.html) | Gallery · Save to `Prints/` | Local export |
| [`card.html`](card.html) | Chaand Baaliyan · Aditya A | Moon art |
| [`saiyaan.html`](saiyaan.html) | Saiyaan · Kailash Kher | Diya / moths |
| [`i-think-they-call-this-love.html`](i-think-they-call-this-love.html) | I Think They Call This Love · Matthew Ifield | Guitar |
| [`cant-help-falling-in-love.html`](cant-help-falling-in-love.html) | Can't Help Falling in Love · Elvis Presley | Cat |
| [`saudebaazi.html`](saudebaazi.html) | Saudebaazi · Javed Bashir | Rose · empty QR slot |
| [`kabhi-jo-badal-barse.html`](kabhi-jo-badal-barse.html) | Kabhi Jo Badal Barse · Arijit Singh | Rain on glass |

## Local

```bash
python3 server.py
# http://localhost:5173/
```

For PNG export into `Prints/`, use `server.py` (not plain `http.server`), then **Save PNGs** on `cards.html`.

## Deploy (Vercel + GitHub)

- **GitHub:** https://github.com/varnabha/music-card  
- **Live:** https://chaand-baaliyan-card.vercel.app  

Player examples:

- https://chaand-baaliyan-card.vercel.app/
- https://chaand-baaliyan-card.vercel.app/?song=saudebaazi
- Print cards: `/card.html`, `/saiyaan.html`, …

Framework Preset: **Other** (static). No build command.
