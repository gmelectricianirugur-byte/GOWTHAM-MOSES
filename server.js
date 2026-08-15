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
const partnersFile = path.join(__dirname, 'partners.json');
const sessions = new Set();

const defaultSiteSettings = {
  businessName: 'GM ELE WORK',
  heroTitle: 'Powering spaces.',
  heroHighlight: 'Building trust.',
  heroText: 'Professional electrical work for homes, shops and commercial spaces. Safe installations, clean finishing, and work you can rely on.',
  whatsappUrl: 'https://wa.me/'
};
const defaultPartners = [
  { id: crypto.randomUUID(), name: 'VoltPro Electricals', type: 'Electrical supplier', description: 'Quality cables, switches, lighting and electrical materials for every type of installation.', location: 'Your City, India', instagramUrl: 'https://instagram.com/', whatsappUrl: 'https://wa.me/', youtubeUrl: '', createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), name: 'Luma Lighting Studio', type: 'Lighting partner', description: 'Creative LED and decorative lighting solutions that bring every space to life.', location: 'Your City, India', instagramUrl: 'https://instagram.com/', whatsappUrl: '', youtubeUrl: 'https://youtube.com/', createdAt: new Date().toISOString() },
  { id: crypto.randomUUID(), name: 'SunGrid Energy', type: 'Solar solutions', description: 'Reliable solar installation and energy-saving systems for homes and businesses.', location: 'Your City, India', instagramUrl: '', whatsappUrl: 'https://wa.me/', youtubeUrl: 'https://youtube.com/', createdAt: new Date().toISOString() }
];

fs.mkdirSync(uploadsDirectory, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]');
if (!fs.existsSync(siteFile)) fs.writeFileSync(siteFile, JSON.stringify(defaultSiteSettings, null, 2));
if (!fs.existsSync(partnersFile)) fs.writeFileSync(partnersFile, JSON.stringify(defaultPartners, null, 2));

function readWork() {
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function saveWork(items) {
  fs.writeFileSync(dataFile, JSON.stringify(items, null, 2));
}

function readPartners() {
  return JSON.parse(fs.readFileSync(partnersFile, 'utf8'));
}

function savePartners(partners) {
  fs.writeFileSync(partnersFile, JSON.stringify(partners, null, 2));
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
app.get('/api/partners', (request, response) => response.json(readPartners()));
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

app.post('/api/partners', ownerOnly, (request, response) => {
  const clean = value => String(value || '').trim();
  const name = clean(request.body.name);
  if (!name) return response.status(400).json({ error: 'Enter the partner name.' });
  const partner = {
    id: crypto.randomUUID(),
    name,
    type: clean(request.body.type) || 'Trusted partner',
    description: clean(request.body.description),
    location: clean(request.body.location),
    instagramUrl: clean(request.body.instagramUrl),
    whatsappUrl: clean(request.body.whatsappUrl),
    youtubeUrl: clean(request.body.youtubeUrl),
    createdAt: new Date().toISOString()
  };
  const partners = readPartners();
  partners.unshift(partner);
  savePartners(partners);
  response.status(201).json(partner);
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

app.delete('/api/partners/:id', ownerOnly, (request, response) => {
  const partners = readPartners();
  if (!partners.some(partner => partner.id === request.params.id)) return response.status(404).json({ error: 'Partner not found.' });
  savePartners(partners.filter(partner => partner.id !== request.params.id));
  response.status(204).end();
});

app.use((error, request, response, next) => {
  if (error instanceof multer.MulterError) return response.status(400).json({ error: error.message });
  if (error) return response.status(400).json({ error: error.message || 'Upload failed.' });
  next();
});

app.listen(PORT, () => console.log(`ELE Work is running at http://localhost:${PORT}`));
