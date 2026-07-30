const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'GOWTHAM MOSES';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GMElectrician@2804';
const uploadsDirectory = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'work.json');
const siteFile = path.join(__dirname, 'site.json');
const sessions = new Set();

const defaultSiteSettings = {
  businessName: 'GM ELE WORK',
  heroTitle: 'Powering spaces.',
  heroHighlight: 'Building trust.',
  heroText: 'Professional electrical work for homes, shops and commercial spaces. Safe installations, clean finishing, and work you can rely on.',
  whatsappUrl: 'https://wa.me/'
};

fs.mkdirSync(uploadsDirectory, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]');
if (!fs.existsSync(siteFile)) fs.writeFileSync(siteFile, JSON.stringify(defaultSiteSettings, null, 2));

function readWork() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function saveWork(items) {
  fs.writeFileSync(dataFile, JSON.stringify(items, null, 2));
}

function readSiteSettings() {
  return { ...defaultSiteSettings, ...JSON.parse(fs.readFileSync(siteFile, 'utf8')) };
}

function saveSiteSettings(settings) {
  fs.writeFileSync(siteFile, JSON.stringify(settings, null, 2));
}

const storage = multer.diskStorage({
  destination: uploadsDirectory,
  filename: (request, file, done) => {
    const extension = path.extname(file.originalname).toLowerCase();
    done(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (request, file, done) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) return done(null, true);
    done(new Error('Only image and video files are allowed.'));
  }
});

app.use(express.json());
app.use('/uploads', express.static(uploadsDirectory));
app.use(express.static(__dirname));

function ownerOnly(request, response, next) {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token || !sessions.has(token)) return response.status(401).json({ error: 'Owner login required.' });
  next();
}

app.get('/api/work', (request, response) => response.json(readWork()));
app.get('/api/site', (request, response) => response.json(readSiteSettings()));

app.post('/api/login', (request, response) => {
  const { username, password } = request.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return response.status(401).json({ error: 'Incorrect username or password.' });
  }
  const token = crypto.randomUUID();
  sessions.add(token);
  response.json({ token });
});

app.put('/api/site', ownerOnly, (request, response) => {
  const current = readSiteSettings();
  const clean = value => String(value || '').trim();
  const settings = {
    businessName: clean(request.body.businessName) || current.businessName,
    heroTitle: clean(request.body.heroTitle) || current.heroTitle,
    heroHighlight: clean(request.body.heroHighlight) || current.heroHighlight,
    heroText: clean(request.body.heroText) || current.heroText,
    whatsappUrl: clean(request.body.whatsappUrl) || current.whatsappUrl
  };
  if (!/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(settings.whatsappUrl)) {
    return response.status(400).json({ error: 'Enter a valid WhatsApp link starting with https://wa.me/.' });
  }
  saveSiteSettings(settings);
  response.json(settings);
});

app.post('/api/work', ownerOnly, upload.single('media'), (request, response) => {
  if (!request.file) return response.status(400).json({ error: 'Choose a photo or video first.' });
  const items = readWork();
  const item = {
    id: crypto.randomUUID(),
    title: (request.body.title || 'ELE Work Project').trim(),
    category: (request.body.category || 'Electrical Work').trim(),
    type: request.file.mimetype.startsWith('video/') ? 'video' : 'image',
    url: `/uploads/${request.file.filename}`,
    createdAt: new Date().toISOString()
  };
  items.unshift(item);
  saveWork(items);
  response.status(201).json(item);
});

app.delete('/api/work/:id', ownerOnly, (request, response) => {
  const items = readWork();
  const item = items.find(entry => entry.id === request.params.id);
  if (!item) return response.status(404).json({ error: 'Project not found.' });
  const filePath = path.join(uploadsDirectory, path.basename(item.url));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  saveWork(items.filter(entry => entry.id !== item.id));
  response.status(204).end();
});

app.use((error, request, response, next) => {
  if (error instanceof multer.MulterError) return response.status(400).json({ error: error.message });
  if (error) return response.status(400).json({ error: error.message || 'Upload failed.' });
  next();
});

app.listen(PORT, () => console.log(`ELE Work is running at http://localhost:${PORT}`));
