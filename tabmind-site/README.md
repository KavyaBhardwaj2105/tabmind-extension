# TabMind — Landing Page

This is the marketing/landing website for **TabMind**, a Chrome extension.
It's a plain static site (HTML/CSS/JS, no framework, no build step) — the
simplest and fastest thing to deploy on Vercel.

## Important: this is the WEBSITE, not the extension

Vercel hosts websites. It does **not** host or run Chrome extensions.
The actual TabMind extension (`manifest.json`, `background.js`,
`content.js`, `popup.js`) has to be loaded into Chrome directly or
published to the **Chrome Web Store** — that's a separate process from
this website.

This website's job is to explain the extension and link people to
install it (from the Chrome Web Store once published, or from GitHub
in the meantime).

## Project structure

```
tabmind-site/
├── index.html          → the whole landing page
├── public/
│   └── icons/           → real extension icons (16/32/48/128px)
├── package.json         → lets Vercel recognize this as a Node project
├── vercel.json           → deployment config (security headers, clean URLs)
└── README.md
```

## Deploy to Vercel — 3 ways

### Option A: Vercel CLI (fastest)
```bash
npm install -g vercel
cd tabmind-site
vercel
```
Follow the prompts (log in, confirm project name). It'll give you a
live `.vercel.app` URL immediately, and `vercel --prod` for the
production deployment.

### Option B: GitHub + Vercel dashboard (recommended long-term)
1. Push this folder to a GitHub repo:
   ```bash
   cd tabmind-site
   git init
   git add .
   git commit -m "TabMind landing page"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/tabmind-website.git
   git push -u origin main
   ```
2. Go to https://vercel.com → **Add New Project** → import that GitHub repo.
3. Vercel auto-detects it as a static site. Click **Deploy**.
4. Every future `git push` auto-redeploys.

### Option C: Drag-and-drop
Go to https://vercel.com/new, and drag the whole `tabmind-site` folder
onto the page. No CLI or GitHub needed.

## Before you deploy — update these placeholders

In `index.html`, the "View on GitHub" / "Get TabMind on GitHub" buttons
currently link to:
```
https://github.com/your-username/tabmind
```
Replace `your-username` with your real GitHub username (or swap the
link entirely for your Chrome Web Store listing once the extension is
published there).

## Publishing the actual extension (separate step)

When you're ready to make TabMind installable by anyone (not just
people who clone the repo):
1. Zip the extension folder (`manifest.json`, `background.js`,
   `content.js`, `popup.js`, `popup.html`, `icons/`).
2. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
3. Pay the one-time $5 developer registration fee.
4. Upload the zip, fill in the listing (screenshots, description,
   privacy practices), and submit for review.
5. Once approved, update this website's CTA buttons to link to the
   real Chrome Web Store listing URL.
