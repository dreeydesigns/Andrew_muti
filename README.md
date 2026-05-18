# Andrew Muti — Portfolio Site

Personal portfolio for Andrew Muti, Creative Director and founder of Dreeydesigns.

**Live site:** https://andrewmuti.vercel.app  
**Admin panel:** https://andrewmuti.vercel.app/admin  
**GitHub repo:** https://github.com/dreeydesigns/Andrew-Muti

---

## Daily Content Updates (No Terminal Required)

### Updating text, stats, experience, etc.

1. Go to **https://andrewmuti.vercel.app/admin**
2. Enter your passcode (default: `dreey2026`)
3. Edit whatever you need — text, stats, projects, etc.
4. Click **Save Changes**
5. Click **Export JSON** → this downloads `content.json` to your computer
6. Go to **https://github.com/dreeydesigns/Andrew-Muti**
7. Click on `content.json` in the file list
8. Click the **pencil icon** (Edit this file)
9. Select all the text → paste your downloaded JSON
10. Click **Commit changes**
11. Vercel auto-deploys in ~30 seconds. Done.

### Replacing your photo

Same process — upload your photo in the Admin → Intro section, export JSON, commit to GitHub.

### Changing the main `index.html` (if code was updated)

Same process — find `index.html` on GitHub, click pencil, paste new code, commit.

---

## Environment Variables (Vercel Dashboard)

Set these in your Vercel project settings under **Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `RESEND_API_KEY` | Your Resend API key (for email notifications on contact form) |
| `CONTACT_TO_EMAIL` | `Dreeydesigns@gmail.com` |

---

## File Structure

```
/
├── index.html          ← The portfolio site
├── admin.html          ← The admin panel
├── content.json        ← All site data (text, image URLs)
├── vercel.json         ← Vercel config
├── .gitignore
├── README.md
├── /api
│   └── contact.js      ← Vercel serverless contact handler
└── /images
    └── .gitkeep
```

---

## Stack

- **Frontend:** Pure HTML5 + CSS3 + Vanilla JavaScript (no build step)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Contact API:** Vercel Serverless Function
- **Email:** Resend (optional)
- **Images:** Cloudinary CDN (optional, configure in Admin → Settings)

---

## Admin Default Passcode

`dreey2026` — change this immediately in **Admin → Settings**.
