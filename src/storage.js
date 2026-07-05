// Storage and Database API client wrapper
// Connects to Local Node/Express Backend (/api) or falls back to localStorage

const API_BASE = '/api';
const LOCAL_STORAGE_KEY = 'limbo_archive_data';

// Default initial database content (used as fallback if backend is offline)
const DEFAULT_DATA = {
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

let inMemoryData = null;

// Initialize & Sync from Backend
export async function syncWithDatabase() {
  try {
    const res = await fetch(`${API_BASE}/pieces`);
    if (res.ok) {
      const pieces = await res.json();
      const catsRes = await fetch(`${API_BASE}/categories`);
      const categories = catsRes.ok ? await catsRes.json() : ['all', 'posters'];
      const socRes = await fetch(`${API_BASE}/socials`);
      const socials = socRes.ok ? await socRes.json() : DEFAULT_DATA.socials;
      inMemoryData = { version: "1.0", categories, pieces, socials };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
      return inMemoryData;
    }
  } catch (err) {
    console.warn('[LIMBO STORAGE] Servidor backend no disponible. Intentando cargar archivo estático /data/archive.json...', err);
  }

  // Try loading static JSON from Vercel/CDN (/data/archive.json) with anti-cache timestamp
  try {
    const staticRes = await fetch(`/data/archive.json?t=${Date.now()}`);
    if (staticRes.ok) {
      const staticData = await staticRes.json();
      if (staticData && staticData.pieces) {
        inMemoryData = staticData;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
        return inMemoryData;
      }
    }
  } catch (err) {
    console.warn('[LIMBO STORAGE] No se pudo cargar /data/archive.json estático.', err);
  }

  // Fallback to localStorage or defaults
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      inMemoryData = JSON.parse(cached);
      return inMemoryData;
    } catch (e) { /* ignore */ }
  }

  inMemoryData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
  return inMemoryData;
}

export function getPieces() {
  if (!inMemoryData) {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    inMemoryData = cached ? JSON.parse(cached) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  return inMemoryData.pieces || [];
}

export function getPieceById(id) {
  const pieces = getPieces();
  return pieces.find(p => p.id === id);
}

export function getCategories() {
  if (!inMemoryData) {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    inMemoryData = cached ? JSON.parse(cached) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  return inMemoryData.categories || ['all', 'posters'];
}

// Save piece (supports physical file upload via FormData)
export async function savePiece(pieceData, imageFile = null) {
  try {
    const formData = new FormData();
    Object.keys(pieceData).forEach(key => {
      if (pieceData[key] !== undefined && pieceData[key] !== null) {
        formData.append(key, pieceData[key]);
      }
    });
    if (imageFile) {
      formData.append('imageFile', imageFile);
    }

    let url = `${API_BASE}/pieces`;
    let method = 'POST';
    if (pieceData.id && pieceData.id.startsWith('limbo-') && !pieceData.isNew) {
      url = `${API_BASE}/pieces/${pieceData.id}`;
      method = 'PUT';
    }

    const res = await fetch(url, { method, body: formData });
    if (res.ok) {
      await syncWithDatabase();
      window.dispatchEvent(new CustomEvent('limbo:archive-updated'));
      return { success: true };
    }
  } catch (err) {
    console.warn('[LIMBO STORAGE] Error guardando en servidor:', err);
  }

  // Fallback local save
  let finalImage = pieceData.image || '/assets/poster-1.png';
  if (imageFile) {
    try {
      finalImage = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(imageFile);
      });
    } catch (e) { /* keep existing */ }
  }

  const pieces = getPieces();
  const cleanData = { ...pieceData, image: finalImage };
  if (pieceData.id && !pieceData.isNew) {
    const index = pieces.findIndex(p => p.id === pieceData.id);
    if (index !== -1) {
      pieces[index] = { ...pieces[index], ...cleanData };
    }
  } else {
    const newPiece = {
      ...cleanData,
      id: `limbo-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString()
    };
    pieces.unshift(newPiece);
  }
  inMemoryData.pieces = pieces;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
  window.dispatchEvent(new CustomEvent('limbo:archive-updated'));
  return { success: true };
}

export async function addPiece(data, imageFile = null) {
  return savePiece({ ...data, isNew: true }, imageFile);
}

export async function updatePiece(id, data, imageFile = null) {
  return savePiece({ ...data, id, isNew: false }, imageFile);
}

export async function deletePiece(id) {
  try {
    const res = await fetch(`${API_BASE}/pieces/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await syncWithDatabase();
      window.dispatchEvent(new CustomEvent('limbo:archive-updated'));
      return { success: true };
    }
  } catch (err) {
    console.warn('[LIMBO STORAGE] Error borrando del servidor:', err);
  }

  // Fallback local delete
  inMemoryData.pieces = getPieces().filter(p => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
  window.dispatchEvent(new CustomEvent('limbo:archive-updated'));
  return { success: true };
}

export async function addCategory(name) {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      await syncWithDatabase();
      window.dispatchEvent(new CustomEvent('limbo:categories-updated'));
      return { success: true };
    }
  } catch (err) {
    console.warn('[LIMBO STORAGE] Error añadiendo categoría en servidor:', err);
  }

  const cats = getCategories();
  const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-');
  if (cleanName && !cats.includes(cleanName)) {
    cats.push(cleanName);
    inMemoryData.categories = cats;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
    window.dispatchEvent(new CustomEvent('limbo:categories-updated'));
  }
  return { success: true };
}

export async function deleteCategory(name) {
  if (name === 'all') return { success: false };
  try {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
    if (res.ok) {
      await syncWithDatabase();
      window.dispatchEvent(new CustomEvent('limbo:categories-updated'));
      return { success: true };
    }
  } catch (err) {
    console.warn('[LIMBO STORAGE] Error borrando categoría en servidor:', err);
  }

  inMemoryData.categories = getCategories().filter(c => c !== name);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
  window.dispatchEvent(new CustomEvent('limbo:categories-updated'));
  return { success: true };
}

export async function exportToJSON() {
  const data = {
    version: "1.0",
    categories: getCategories(),
    pieces: getPieces(),
    exportedAt: new Date().toISOString()
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `limbo-archive-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importFromJSON(jsonString) {
  try {
    const data = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    return await importArchiveJSON(data);
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function importArchiveJSON(jsonData) {
  try {
    const res = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonData)
    });
    if (res.ok) {
      await syncWithDatabase();
      window.dispatchEvent(new CustomEvent('limbo:archive-updated'));
      return { success: true };
    }
  } catch (err) {
    console.warn('[LIMBO STORAGE] Error importando en servidor:', err);
  }

  inMemoryData = jsonData;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
  window.dispatchEvent(new CustomEvent('limbo:archive-updated'));
  return { success: true };
}

export async function resetToDefaults() {
  return await resetArchiveToDefaults();
}

export async function resetArchiveToDefaults() {
  try {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    if (res.ok) {
      await syncWithDatabase();
      window.dispatchEvent(new CustomEvent('limbo:archive-updated'));
      return { success: true };
    }
  } catch (err) {
    console.warn('[LIMBO STORAGE] Error reseteando en servidor:', err);
  }

  inMemoryData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
  window.dispatchEvent(new CustomEvent('limbo:archive-updated'));
  return { success: true };
}

export function getSocials() {
  if (!inMemoryData) {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    inMemoryData = cached ? JSON.parse(cached) : JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
  return inMemoryData.socials || {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    linkedin: 'https://linkedin.com',
    steam: 'https://store.steampowered.com'
  };
}

export async function saveSocials(newSocials) {
  try {
    const res = await fetch(`${API_BASE}/socials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSocials)
    });
    if (res.ok) {
      await syncWithDatabase();
      window.dispatchEvent(new CustomEvent('limbo:socials-updated'));
      return { success: true };
    }
  } catch (err) {
    console.warn('[LIMBO STORAGE] Error guardando sociales en servidor, usando local:', err);
  }

  if (!inMemoryData) getPieces();
  inMemoryData.socials = { ...(inMemoryData.socials || {}), ...newSocials };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(inMemoryData));
  window.dispatchEvent(new CustomEvent('limbo:socials-updated'));
  return { success: true };
}
