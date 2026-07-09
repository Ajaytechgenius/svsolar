# GitHub Pages Deployment + SEO Guide — SVSOLAR

## Part 1 — Deploy to GitHub Pages with svsolar.online

### Files you need (all included, upload every single one)
`index.html`, `styles.css`, `script.js`, `privacy.html`, `terms.html`, `robots.txt`, `sitemap.xml`, `og-image.png`, `CNAME`

The `CNAME` file (no extension, just contains the text `svsolar.online`) is what tells GitHub Pages which custom domain to serve. Don't skip it.

### Steps
1. Create a **public** GitHub repository (e.g. `svsolar-website`). Free GitHub Pages requires the repo to be public — see the security note below on what this means for you.
2. Upload all 9 files to the root of the `main` branch (drag-and-drop works fine on github.com — no git command line needed).
3. Go to **Settings → Pages**.
4. Under "Build and deployment," set **Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
5. Under "Custom domain," enter `svsolar.online` and save. (GitHub will read the `CNAME` file automatically — you may need to re-enter it once for GitHub to start the domain verification process.)
6. **Domain verification (GitHub requires this now):** GitHub will show you a TXT record to add at your domain registrar to prove you own `svsolar.online`. Add it, then click verify in GitHub's settings.
7. **Point your DNS at your registrar** (wherever you bought svsolar.online — Hostinger, GoDaddy, BigRock, etc.):

   | Type | Host | Value |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | yourgithubusername.github.io |

8. DNS changes can take anywhere from a few minutes to 24 hours to propagate. Once it's live, go back to **Settings → Pages** and check **Enforce HTTPS** — this gives you the padlock/SSL for free.

### A note on how updates work
Every time you want to change something, you (or I, if you paste me the new file) upload the updated file to the same repo — GitHub Pages rebuilds automatically within about a minute. No separate deploy step.

---

## Part 2 — Security notes for GitHub-hosted static sites

**The good news:** this site has no backend, no database, and no login system — it's just HTML/CSS/JS files. That rules out most common attacks (SQL injection, server exploits, data breaches) because there's no server-side code or database to attack in the first place.

**What's actually different with GitHub specifically:**

1. **Public repo = public source, permanently.** With free GitHub Pages, your repository must be public, meaning anyone can browse or clone your exact source files — not just view what a browser shows, but the raw files including any comments. This is a bigger exposure than just having a live website (which people can already inspect via dev tools). Practical takeaway: **never commit anything sensitive** — no API keys, no real customer data, no passwords — to this repo, ever.

2. **Git history is forever unless deliberately scrubbed.** If you ever accidentally commit something sensitive and then delete it in a later commit, it's usually still recoverable from git history. If that happens, don't just delete-and-recommit — tell me and we'll walk through properly purging it.

3. **The biggest real risk is your GitHub account itself**, not the hosting. Since the site is static, whoever can push to this repo can change what every visitor sees — including, in theory, injecting malicious JavaScript. **Turn on two-factor authentication (2FA) on your GitHub account.** This is the single most impactful security step available to you here.

4. **Dangling domain risk, for later:** if you ever stop using GitHub Pages for this domain, remove the DNS records pointing to it. Domain records left pointing at an unclaimed GitHub Pages site is a known way sites get silently taken over by someone else.

5. Your **contact form has no backend to breach** — it just opens a pre-filled WhatsApp message. There's no database of customer submissions sitting anywhere for anyone to steal.

---

## Part 3 — Ranking for "best solar company in Sikar" / "Shree Vinayak Solar Agency"

### Already done on the site (as of this update)
- Title tag: `Shree Vinayak Solar Agency (SVSOLAR) — Best Solar Company in Sikar, Rajasthan`
- Meta description targets the same phrasing
- Full business name now appears in the nav, hero, footer, and structured data (`name` + `alternateName` in the LocalBusiness schema) — this consistency across visible text *and* schema is what search engines use to confirm your business identity
- Open Graph/Twitter tags updated to match, with a branded share image

### Google Search Console — steps
You mentioned uploading an XML file already — quick clarification, since there are two separate things that sound similar:
- **Ownership verification** (proves the site is yours) — usually a small HTML file or a DNS TXT record, not the sitemap
- **Sitemap submission** (tells Google what pages exist) — this is `sitemap.xml`, submitted *inside* the Search Console dashboard, not just uploaded to the repo

Make sure both are actually done:
1. **Google Search Console → Add Property → Domain** (use the domain property type — it covers `www` and non-`www` and all subpages automatically). Verify via the DNS TXT record method, since you already have DNS access from the GitHub Pages setup above.
2. **Search Console → Sitemaps** (left sidebar) → enter `sitemap.xml` → Submit. This is separate from just having the file exist at `svsolar.online/sitemap.xml`.
3. **URL Inspection tool** → paste `https://svsolar.online/` → **Request Indexing**. This nudges Google to crawl it sooner instead of waiting.

### Beyond tags — what actually moves "best solar in Sikar" rankings
Meta tags help Google understand the page; they rarely win the ranking on their own for competitive local phrases. In order of real impact:

1. **Google Business Profile** — for "best solar in Sikar"-style searches, this often outranks every website. Set it up with the exact same name, address, and phone as the site (matching "NAP" data across the web is a real ranking factor). Free.
2. **Reviews.** Once you have a few completed installs, ask for Google reviews. A handful of genuine 5-star reviews mentioning "Sikar" and "solar" in the text does more for this specific search phrase than almost anything on the website itself.
3. **Consistent listings** — same name/address/phone on JustDial, Sulekha, IndiaMART, Facebook.
4. **Backlinks** — even one link from a local Sikar news site, business directory, or a supplier/partner's website helps meaningfully.
5. **Fresh content over time** — a short "PM Surya Ghar Subsidy Sikar: Full Guide" style page, added a few months from now, is a strong long-term move. Not urgent today, but worth knowing it's the next lever once the basics are live.

None of this replaces the tags — it's what makes the tags actually pay off.
