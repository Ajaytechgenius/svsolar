# Rev Nation Jaipur — Phase 2 Setup Guide

This covers wiring up Supabase (so the site and admin panel are live-connected) and exactly how to get your photos, videos, and frame sequences onto the site.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → sign up (free) → **New Project**
2. Pick any name/region, set a database password (save it somewhere), wait ~2 minutes for it to spin up

## 2. Run the schema

1. In your project, open **SQL Editor** → **New query**
2. Paste the entire contents of `supabase-schema.sql` (included in this delivery)
3. Click **Run**

This creates all seven tables (`services`, `projects`, `frame_sequences`, `testimonials`, `stats`, `leads`, `site_media`), sets up permissions so visitors can only read published content and submit the booking form, creates the three storage buckets (`project-images`, `frame-sequences`, `site-assets`), and seeds the stats/testimonials with the same numbers currently hardcoded on the site — so nothing changes visually the moment you connect it.

> **Already ran this before?** Re-running it is safe — every statement uses `if not exists` / `on conflict` guards. Re-run it now regardless to pick up the new `site_media` table and the `frame_urls` column on `frame_sequences`, both needed for what's below.

## 3. Get your API keys

In your Supabase project: **Project Settings → API**
- Copy the **Project URL**
- Copy the **anon public** key (not the `service_role` one — that one must never go in frontend code)

## 4. Connect the site

Open `config.js` and replace the two placeholder values:

```js
window.REV_NATION_CONFIG = {
  SUPABASE_URL: "https://your-project-ref.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOi..."
};
```

Save it, keep it in the same folder as `index.html` and `admin.html`. That's the only file you need to edit — both the live site and the admin panel read from it.

Once this is filled in, reload `index.html`: stats, testimonials, and any projects you've added will now come from Supabase instead of the built-in placeholder content, and the booking form will save real leads. If `config.js` is ever wrong or Supabase is unreachable, the site silently falls back to its built-in placeholder content instead of breaking — you'll never show visitors a broken page.

## 5. Create your admin login

Supabase Auth needs at least one user to sign into `admin.html`:

1. **Authentication → Users → Add user**
2. Enter your email + a password, and toggle **Auto Confirm User** on (so you don't need to click an email link)
3. Open `admin.html` and sign in with those credentials

Anyone signed in through Supabase Auth has full access to the admin panel — don't share this login, and create separate users if more than one person needs access.

---

## 6. How to upload videos and images

### Hero video, hero poster, before/after photos, service images
All of these now live under **admin.html → Site Media**:
- **Hero video** — upload an mp4 and it replaces the video playing behind the homepage headline
- **Hero poster** — the still frame shown while the video loads
- **Before / After photos** — replace the illustrative graphics in the "Drag to reveal the result" section with real photos of the same car
- **Service panel images** (6 slots, one per service — Modifications, PPF, Ceramic Coating, Detailing, Windshield, Interior) — replace the placeholder icons in "What We Do" with real photos

Each field is independent — upload one or all of them, click **Upload Selected Files**, and the live site picks them up on next load. Leave a slot empty and that part of the site keeps using its built-in placeholder — nothing breaks if you only fill in some of them.

### Project photos, before/after shots, testimonials
- **Projects tab** → fill in the form, attach a cover photo, hit *Add Project*. It uploads to the `project-images` bucket and appears in the live "Recent Builds" gallery immediately.
- **Testimonials tab** → add reviews directly, no file upload needed.
- **Stats tab** → edit the odometer numbers directly.

### Frame sequences (the scroll-scrub canvas effect) — now actually renders on the page
Sequences uploaded through the admin panel now actually play on the live site:

- **Hero sequence** → autoplays as a smooth looping animation in place of the background video
- **Mods sequence** → uploads and saves correctly, but there's no dedicated pinned scene wired to play it yet. Say the word if you want one built.

> **Note:** the old PPF "Signature Sequence" scroll-scrub scene has been replaced with the new **Studio Experience** section (the animated amenity cards — Valet Parking, Waiting Room, etc., pulled from your studio poster). That section doesn't use frame sequences at all, so the `ppf` upload option was removed from the admin panel. If you'd like a scroll-scrub moment back somewhere else on the site, let me know which section and I'll wire it the same way Hero works now.

Steps to upload a sequence:
1. **Shoot or render the sequence** — a turntable video works well; export it as a numbered image sequence (most editing tools, or `ffmpeg`, can do "export frame per file")
2. **Name files so they sort correctly** — `frame-0001.jpg`, `frame-0002.jpg`, etc. Zero-padded numbers matter; without padding, `frame-2.jpg` can sort after `frame-10.jpg` and scramble the sequence
3. **Compress before uploading** — aim for 60–120KB per frame. Large unoptimized frames will make the effect feel sluggish regardless of how good the code is
4. Go to `admin.html` → **Frame Sequences tab**, pick a project (optional), pick the section (currently just Hero), select all frame files at once (they're sorted numerically before upload, so exact selection order doesn't matter), click **Upload Sequence**

If you previously uploaded a sequence tagged `ppf` — it's still stored and recorded, it simply has no section on the site to play in anymore. Safe to leave alone or delete from the Frame Sequences tab.

### The hero video specifically
You now have two ways to set it:
1. **Keep it as a static file** — `assets/hero-reveal.mp4` next to `index.html`, the way it ships by default. Good if you're not changing it often.
2. **Upload it through admin.html → Site Media** — good once you want to swap it without touching files directly, or if you're hosting the site somewhere that makes relative file paths unreliable (see the troubleshooting note below).

If you use option 2, the uploaded version always takes priority over the static file.

### Manual alternative (bulk work, or when the admin panel isn't handy)
You can always drag-and-drop files directly in **Supabase → Storage → [bucket name]** in your browser — useful for bulk-uploading a large frame sequence faster than one-by-one through the admin panel's file input. Just keep the folder structure consistent: `frame-sequences/{project-id or "general"}/{section}/frame-0001.jpg` — and if you upload this way, you'll need to also add the matching record in the `frame_sequences` table (**Table Editor**) including a `frame_urls` array of the public URLs in order, or the sequence won't be picked up by the player.

---

## 7. Troubleshooting: hero shows solid black / nothing plays

If the hero section shows a plain black background with no video, the browser tried to load `assets/hero-reveal.mp4` and failed — almost always because the `assets/` folder wasn't kept alongside `index.html` when the site was uploaded or hosted somewhere. Two fixes, either works:
- Make sure `assets/hero-poster.jpg` and `assets/hero-reveal.mp4` sit in an `assets` folder in the same directory as `index.html` wherever you deploy it
- Or upload the video through **admin.html → Site Media** — once connected to Supabase, that becomes a full URL and no longer depends on local file paths at all

---

## 8. Storage budget reminder

You're on the Supabase **Free** tier (1GB storage) until you upgrade. Rough math:
- Project photos: ~200–400KB each after compression → hundreds fit easily
- One frame sequence (150 frames × ~90KB): ~13MB
- Three or four sequences plus a healthy project gallery will approach the 1GB ceiling

When you're ready to add the PPF and mods frame sequences for real, that's the moment to move to **Pro ($25/mo, 100GB)** — flagged in the original plan, still the right call.

---

## What's next

With this connected, the natural next steps are:
1. A dedicated pinned scroll scene for the **Mods** frame sequence, matching how PPF works today
2. Add the `services` table to the admin panel so the six service *text* items (titles/descriptions, not just images) become editable too
3. Once real project photos and sequences are in throughout, there won't be any placeholder SVG icons left to retire — this is close

Send the word whenever you want me to take on any of these.
