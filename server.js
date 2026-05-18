'use strict';
require('dotenv').config();

const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app    = express();
const PORT   = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'am-portfolio-jwt-secret-change-in-production';

/* ── Data directory ─────────────────────────────────────── */
const DATA_DIR     = path.join(__dirname, 'data');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const SUBS_FILE    = path.join(DATA_DIR, 'submissions.json');
const SETTINGS_FILE= path.join(DATA_DIR, 'settings.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

/* ── File helpers (synchronous for simplicity) ──────────── */
function readJSON(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

/* ── Seed on first run ──────────────────────────────────── */
(function seed() {
  // Content — seed from existing content.json in root
  if (!fs.existsSync(CONTENT_FILE)) {
    const rootJson = path.join(__dirname, 'content.json');
    if (fs.existsSync(rootJson)) {
      const raw = readJSON(rootJson, {});
      // Strip submissions from the content store
      const { submissions: _, settings: __, ...clean } = raw;
      writeJSON(CONTENT_FILE, clean);
      console.log('  ✓  Content seeded from content.json');
    } else {
      writeJSON(CONTENT_FILE, {});
    }
  }

  // Submissions store
  if (!fs.existsSync(SUBS_FILE)) writeJSON(SUBS_FILE, []);

  // Settings — hash the default password
  if (!fs.existsSync(SETTINGS_FILE)) {
    const rootJson = path.join(__dirname, 'content.json');
    const raw      = fs.existsSync(rootJson) ? readJSON(rootJson, {}) : {};
    const pw       = raw.settings?.adminPassword || process.env.ADMIN_PASSWORD || 'dreey2026';
    writeJSON(SETTINGS_FILE, { adminPasswordHash: bcrypt.hashSync(pw, 10) });
    console.log('  ✓  Settings seeded (admin password hashed)');
  }
})();

/* ── Middleware ─────────────────────────────────────────── */
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname), { index: false }));

/* ── Auth middleware ────────────────────────────────────── */
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try { req.user = jwt.verify(auth.slice(7), SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ═══════════════════════════════════════════════════════════
   PUBLIC API
═══════════════════════════════════════════════════════════ */

app.get('/api/content', (_, res) => {
  res.json(readJSON(CONTENT_FILE, {}));
});

app.post('/api/contact', (req, res) => {
  const { name = '', email = '', service = '', message = '' } = req.body || {};
  if (!name.trim())         return res.status(400).json({ error: 'Name is required' });
  if (!emailRe.test(email)) return res.status(400).json({ error: 'Invalid email address' });

  const subs = readJSON(SUBS_FILE, []);
  subs.unshift({
    id:         Date.now(),
    name:       name.trim(),
    email:      email.trim(),
    service:    service.trim(),
    message:    message.trim(),
    is_read:    0,
    created_at: new Date().toISOString()
  });
  writeJSON(SUBS_FILE, subs);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   ADMIN AUTH
═══════════════════════════════════════════════════════════ */

app.post('/api/admin/login', (req, res) => {
  const { password = '' } = req.body || {};
  const settings = readJSON(SETTINGS_FILE, {});
  if (!settings.adminPasswordHash || !bcrypt.compareSync(password, settings.adminPasswordHash))
    return res.status(401).json({ error: 'Wrong password' });

  const token = jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '7d' });
  res.json({ token });
});

/* ═══════════════════════════════════════════════════════════
   ADMIN CONTENT
═══════════════════════════════════════════════════════════ */

app.get('/api/admin/content', requireAuth, (_, res) => {
  res.json(readJSON(CONTENT_FILE, {}));
});

app.put('/api/admin/content', requireAuth, (req, res) => {
  const incoming = req.body || {};
  const current  = readJSON(CONTENT_FILE, {});
  writeJSON(CONTENT_FILE, { ...current, ...incoming });
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   ADMIN SUBMISSIONS
═══════════════════════════════════════════════════════════ */

app.get('/api/admin/submissions', requireAuth, (_, res) => {
  res.json(readJSON(SUBS_FILE, []));
});

app.put('/api/admin/submissions/:id/read', requireAuth, (req, res) => {
  const id   = Number(req.params.id);
  const subs = readJSON(SUBS_FILE, []).map(s => s.id === id ? { ...s, is_read: 1 } : s);
  writeJSON(SUBS_FILE, subs);
  res.json({ ok: true });
});

app.delete('/api/admin/submissions/:id', requireAuth, (req, res) => {
  const id   = Number(req.params.id);
  const subs = readJSON(SUBS_FILE, []).filter(s => s.id !== id);
  writeJSON(SUBS_FILE, subs);
  res.json({ ok: true });
});

app.delete('/api/admin/submissions', requireAuth, (_, res) => {
  writeJSON(SUBS_FILE, []);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   ADMIN PASSWORD
═══════════════════════════════════════════════════════════ */

app.put('/api/admin/password', requireAuth, (req, res) => {
  const { password = '' } = req.body || {};
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
  const settings = readJSON(SETTINGS_FILE, {});
  settings.adminPasswordHash = bcrypt.hashSync(password, 10);
  writeJSON(SETTINGS_FILE, settings);
  res.json({ ok: true });
});

/* ═══════════════════════════════════════════════════════════
   PAGE ROUTES
═══════════════════════════════════════════════════════════ */
app.get('/admin', (_, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/',      (_, res) => res.sendFile(path.join(__dirname, 'index.html')));

/* ═══════════════════════════════════════════════════════════
   START
═══════════════════════════════════════════════════════════ */
app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────┐
  │   Andrew Muti Portfolio — Server Ready   │
  │   Site:  http://localhost:${PORT}             │
  │   Admin: http://localhost:${PORT}/admin        │
  └──────────────────────────────────────────┘
  `);
});
