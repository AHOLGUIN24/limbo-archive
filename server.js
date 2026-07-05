import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure directories exist
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'archive.json');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Serve static uploaded files
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Default initial database content (Categories: all & posters only)
const DEFAULT_DB = {
  version: "1.0",
  categories: ['all', 'posters'],
  pieces: [
    {
      id: 'limbo-01-silence',
      title: 'SILENCE — Typographic Study I',
      year: '2026',
      category: 'posters',
      dimensions: '1080 x 1920 px',
      tools: 'Illustrator, InDesign, Swiss Grid System',
      image: '/assets/poster-1.png',
      description_es: 'Composición tipográfica monumental que explora la tensión visual entre el vacío absoluto y la masividad de las formas grotescas. El círculo rojo bermellón actúa como un ancla focal sobre una retícula suiza estricta, evocando la pureza de la Escuela de Basilea.',
      description_en: 'Monumental typographic composition exploring the visual tension between absolute void and the massiveness of grotesque letterforms. The vermilion red circle acts as a focal anchor upon a strict Swiss grid, evoking the purity of the Basel School.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'limbo-02-experimental',
      title: 'Distortion & Form — Archival Series',
      year: '2026',
      category: 'posters',
      dimensions: '1080 x 1920 px',
      tools: 'Photoshop, Custom Glyphs, TouchDesigner',
      image: '/assets/poster-2.png',
      description_es: 'Una investigación sobre la legibilidad en la era digital. Las formas alfabéticas son sometidas a procesos de elongación y síntesis brutalista, contrastando el negro carbón con acentos vibrantes de azul Klein en un diálogo arquitectónico.',
      description_en: 'An investigation into legibility in the digital age. Alphabetic forms undergo processes of elongation and brutalist synthesis, contrasting charcoal black with vibrant accents of Klein blue in an architectural dialogue.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'limbo-03-exhibition',
      title: 'International Typographic Exhibition',
      year: '2025',
      category: 'posters',
      dimensions: '1080 x 1920 px',
      tools: 'InDesign, Figma, Grid Systems',
      image: '/assets/poster-3.png',
      description_es: 'Póster editorial diseñado con disciplina matemática bajo los principios del Estilo Tipográfico Internacional. Bloques de texto milimétricos conviven con una forma orgánica naranja cadmio que desafía la severidad de las columnas verticales.',
      description_en: 'Editorial poster designed with mathematical discipline under the principles of the International Typographic Style. Millimeter-precise text blocks coexist with a cadmium orange organic shape that challenges the severity of vertical columns.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'limbo-04-architectural',
      title: 'Spatial Geometry — Print 04',
      year: '2025',
      category: 'posters',
      dimensions: '1080 x 1920 px',
      tools: 'Illustrator, Vector Geometry',
      image: '/assets/poster-4.png',
      description_es: 'Ejercicio de minimalismo gráfico y delicadeza lineal. La pieza utiliza un contraste sutil entre tonos crudos y negro para construir una ilusión de profundidad espacial y armonía estructural, concebida para galerías de arte de vanguardia.',
      description_en: 'An exercise in graphic minimalism and linear delicacy. The piece utilizes subtle contrast between raw tones and black to construct an illusion of spatial depth and structural harmony, conceived for avant-garde art galleries.',
      createdAt: new Date().toISOString()
    }
  ],
  socials: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    linkedin: 'https://linkedin.com',
    steam: 'https://store.steampowered.com'
  }
};

// Initialize DB file if not exists or update categories if requested
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
      return DEFAULT_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(raw);
    if (!db.socials) {
      db.socials = { ...DEFAULT_DB.socials };
    }
    return db;
  } catch (err) {
    console.error('Error reading database file:', err);
    return DEFAULT_DB;
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const cleanName = `limbo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}${ext}`;
    cb(null, cleanName);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB max file size
    fieldSize: 100 * 1024 * 1024 // 100MB max text field size
  }
});

// API Routes

// Health check / Status
app.get('/api/status', (req, res) => {
  const db = readDB();
  res.json({
    status: 'ok',
    storage: 'local_disk_db',
    dbFile: DB_FILE,
    piecesCount: db.pieces.length,
    categoriesCount: db.categories.length
  });
});

// GET all pieces
app.get('/api/pieces', (req, res) => {
  const db = readDB();
  res.json(db.pieces);
});

// GET single piece
app.get('/api/pieces/:id', (req, res) => {
  const db = readDB();
  const piece = db.pieces.find(p => p.id === req.params.id);
  if (!piece) return res.status(404).json({ error: 'Pieza no encontrada' });
  res.json(piece);
});

// POST new piece (with optional file upload)
app.post('/api/pieces', upload.single('imageFile'), (req, res) => {
  const db = readDB();
  const body = req.body;

  let imagePath = body.image || '/assets/poster-1.png';
  if (req.file) {
    imagePath = `/uploads/${req.file.filename}`;
  }

  const newPiece = {
    id: `limbo-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    title: body.title || 'Untitled Artwork',
    year: body.year || new Date().getFullYear().toString(),
    category: body.category || 'posters',
    dimensions: body.dimensions || '1080 x 1920 px',
    tools: body.tools || '',
    image: imagePath,
    description_es: body.description_es || '',
    description_en: body.description_en || body.description_es || '',
    createdAt: new Date().toISOString()
  };

  db.pieces.unshift(newPiece);
  writeDB(db);

  res.status(201).json({ success: true, piece: newPiece });
});

// PUT update piece
app.put('/api/pieces/:id', upload.single('imageFile'), (req, res) => {
  const db = readDB();
  const index = db.pieces.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Pieza no encontrada' });

  const oldPiece = db.pieces[index];
  const body = req.body;

  let imagePath = oldPiece.image;
  if (req.file) {
    imagePath = `/uploads/${req.file.filename}`;
    if (oldPiece.image && oldPiece.image.startsWith('/uploads/')) {
      const oldFilePath = path.join(UPLOADS_DIR, path.basename(oldPiece.image));
      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch (e) { /* ignore */ }
      }
    }
  } else if (body.image) {
    imagePath = body.image;
  }

  const updatedPiece = {
    ...oldPiece,
    title: body.title !== undefined ? body.title : oldPiece.title,
    year: body.year !== undefined ? body.year : oldPiece.year,
    category: body.category !== undefined ? body.category : oldPiece.category,
    dimensions: body.dimensions !== undefined ? body.dimensions : oldPiece.dimensions,
    tools: body.tools !== undefined ? body.tools : oldPiece.tools,
    image: imagePath,
    description_es: body.description_es !== undefined ? body.description_es : oldPiece.description_es,
    description_en: body.description_en !== undefined ? body.description_en : oldPiece.description_en,
    updatedAt: new Date().toISOString()
  };

  db.pieces[index] = updatedPiece;
  writeDB(db);

  res.json({ success: true, piece: updatedPiece });
});

// DELETE piece
app.delete('/api/pieces/:id', (req, res) => {
  const db = readDB();
  const index = db.pieces.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Pieza no encontrada' });

  const piece = db.pieces[index];
  db.pieces.splice(index, 1);
  writeDB(db);

  if (piece.image && piece.image.startsWith('/uploads/')) {
    const filePath = path.join(UPLOADS_DIR, path.basename(piece.image));
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.error('Could not delete image file:', e); }
    }
  }

  res.json({ success: true, deletedId: req.params.id });
});

// GET categories
app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

// POST category
app.post('/api/categories', (req, res) => {
  const db = readDB();
  const cat = (req.body.name || '').trim().toLowerCase().replace(/\s+/g, '-');
  if (cat && !db.categories.includes(cat)) {
    db.categories.push(cat);
    writeDB(db);
  }
  res.json(db.categories);
});

// DELETE category
app.delete('/api/categories/:name', (req, res) => {
  const db = readDB();
  const cat = req.params.name;
  if (cat !== 'all') {
    db.categories = db.categories.filter(c => c !== cat);
    writeDB(db);
  }
  res.json(db.categories);
});

// POST import JSON archive
app.post('/api/import', (req, res) => {
  try {
    const data = req.body;
    if (data && Array.isArray(data.pieces)) {
      const db = readDB();
      if (Array.isArray(data.categories)) {
        db.categories = data.categories;
      }
      db.pieces = data.pieces;
      writeDB(db);
      return res.json({ success: true, count: db.pieces.length });
    }
    res.status(400).json({ success: false, error: 'Formato JSON inválido.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST reset defaults
app.post('/api/reset', (req, res) => {
  writeDB(DEFAULT_DB);
  res.json({ success: true, count: DEFAULT_DB.pieces.length });
});

// GET socials
app.get('/api/socials', (req, res) => {
  const db = readDB();
  res.json(db.socials || DEFAULT_DB.socials);
});

// POST socials
app.post('/api/socials', (req, res) => {
  const db = readDB();
  db.socials = { ...(db.socials || {}), ...req.body };
  writeDB(db);
  res.json(db.socials);
});

app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`[LIMBO DATABASE SERVER] Activo en puerto ${PORT}`);
  console.log(`[ALMACENAMIENTO DE ARCHIVOS] ${UPLOADS_DIR}`);
  console.log(`[BASE DE DATOS EN DISCO] ${DB_FILE}`);
  console.log(`========================================================\n`);
});
