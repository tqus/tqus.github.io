# saad kashif — portfolio

A single-page, terminal-styled portfolio. No build step, no dependencies, no framework — just one `index.html` file. Drop it on GitHub Pages and it's live.

## Preview locally

Just double-click `index.html`, or run a tiny local server:

```bash
cd portfolio
python3 -m http.server 8000
# open http://localhost:8000
```

## Important — I can't do the GitHub upload part for you

I don't have access to a GitHub account, and I'm not able to create one on your behalf — that needs your own email/password and acceptance of GitHub's terms. I've built 100% of the site; the steps below are the last mile, and they're copy‑paste.

## Deploying — two ways to get a short URL

**GitHub Pages URLs work one of two ways**, and it matters which one you're going for:

### Option A — a "project" URL (works immediately, any GitHub account)
Live at: `https://<your-github-username>.github.io/<repo-name>/`

The repo name can be anything short — this doesn't require renaming your account. Good short options tied to your brand (all ≤ 4 characters, check they're not already used by someone else's repo in your account — they won't be):
- `sn1p`
- `s4d`
- `0xsd`

### Option B — a root "username" site (what `sn1per.github.io` would be)
Live at: `https://<username>.github.io/` — but **only if `<username>` is your actual GitHub account username**, exactly. This means either your existing GitHub username already matches, or you create/rename an account to that name (subject to availability — I can't check or reserve this for you).

If you want this, go to github.com, check whether your desired short name is free as a username, then create the repo named exactly `<that-username>.github.io`.

---

## Steps (Option A example, using `sn1p` as the repo name)

1. **Create the repo**
   Go to github.com → New repository → name it `sn1p` → Public → Create repository (don't initialize with a README, you already have one).

2. **Push the code** — from the folder containing `index.html` and `README.md`:

   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/sn1p.git
   git push -u origin main
   ```

3. **Turn on Pages**
   In the repo: Settings → Pages → Source → Deploy from a branch → Branch: `main`, folder `/ (root)` → Save.

4. **Wait ~60 seconds**, then visit `https://<your-username>.github.io/sn1p/`.

For Option B, same steps, just name the repo `<username>.github.io` and it'll be live at the root instead of a subpath.

## Personalizing

Everything is in one file, `index.html`, plainly commented by section:
- `#hero` — name, rotating status lines (edit the `lines` array near the bottom `<script>`)
- `#about` — the `whoami` bio text
- `#projects` — your two project cards
- `#connect` — Instagram / Roblox rows

## A couple of things I made deliberate calls on

- **No external UI/animation libraries.** Everything — the matrix rain, the cursor, the scramble-text hover, the typewriter line, the glitch title — is hand-written vanilla CSS/JS. Zero dependencies means zero build step, nothing to go stale, and it loads instantly, which matters more for a "premium" feel than any plugin would.
- **The Instagram checkmark is a stylistic badge**, not Instagram's official verification mark — I can't display a real platform-verified status since I have no way to confirm it, and copying Meta's actual badge asset isn't something I'll do. It reads as a terminal "confirmed" checkmark instead, consistent with the rest of the aesthetic.
- **Roblox links to a username search** (`roblox.com/search/users?keyword=9qver`) rather than a direct profile — Roblox retired direct username-based profile URLs, so a search link is the one that reliably works.
