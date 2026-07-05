import { getPieces, getPieceById, getCategories, syncWithDatabase, getSocials } from './storage.js';
import { initAdminUI, renderAdminPiecesList } from './admin.js';

// Application State
let currentLang = 'es';
let currentViewMode = 'grid';
let currentCategory = 'all';
let currentTheme = 'dark';

// i18n Translations
const TRANSLATIONS = {
  es: {
    curator_panel: 'admin',
    theme_dark: 'dark',
    theme_light: 'light',
    view_grid: 'grid',
    view_list: 'list',
    archive_desc: 'archivo curado de piezas gráficas & diseño editorial. formato original 1080x1920.',
    back_to_top: '↑ volver al inicio del archivo',
    back_archive: 'volver al archivo',
    admin_title: 'repositorio personal / panel de admin',
    admin_subtitle: 'gestiona tus piezas gráficas físicas en disco (/uploads), pósters 1080x1920 y base de datos.',
    exit_admin: 'salir del panel',
    add_new_piece: 'subir nueva pieza',
    manage_categories: 'categorías',
    export_json: 'exportar archivo (.json)',
    import_json: 'importar archivo (.json)',
    reset_defaults: 'restaurar muestra',
    saved_pieces: 'piezas en la base de datos local',
    modal_add_title: 'subir nueva pieza a la base de datos',
    label_image: 'imagen de la pieza (1080x1920 vertical recomendado, se guarda como archivo en /uploads)',
    drop_prompt: 'haz clic o arrastra tu imagen aquí (póster / diseño)',
    drop_sub: 'se guardará físicamente en la carpeta public/uploads/',
    label_title: 'título de la obra',
    label_year: 'año',
    label_category: 'categoría / etiqueta',
    label_dimensions: 'proporción / dimensions',
    label_tools: 'herramientas / técnica (ficha técnica)',
    label_desc_es: 'descripción curatorial (español)',
    label_desc_en: 'descripción curatorial (inglés)',
    btn_cancel: 'cancelar',
    btn_save_piece: 'guardar en base de datos',
    modal_cats_title: 'gestionar categorías de la base de datos',
    btn_add: 'agregar',
    footer_tagline: 'archivo digital de piezas gráficas curadas & diseño editorial. sin ruido visual, solo las obras y tipografía neutra.',
    footer_cats: 'categorías',
    footer_lang: 'idioma / language',
    footer_social: 'redes & legal',
    curator_panel_link: '→ admin',
    pieces_unit: 'piezas',
    spec_year: 'año',
    spec_category: 'categoría',
    spec_dimensions: 'dimensiones / formato',
    spec_tools: 'ficha técnica / herramientas',
    curatorial_note: 'nota curatorial / editorial',
    carousel_title: '// archivo continuo — exploración visual',
    about_label: '// ficha del autor — perfil curatorial',
    about_name: 'Andres Holguin',
    about_bio: 'Ingeniero en proceso y artista gráfico de medio tiempo. Vivo en Colombia (sáquenme) y suelo pasarme media vida en Steam.',
    about_badge_1: 'Colombia (sáquenme)',
    about_badge_2: 'Steam Addict',
    about_badge_3: 'Ing. en Sistemas',
    about_badge_4: 'Diseño Digital',
    manage_socials: 'redes sociales (url)',
    modal_socials_title: 'configurar url de redes sociales',
    btn_save_socials: 'guardar redes',
    footer_contact: 'contacto: azzzzdresholguin@gmail.com',
    shutter_showcase_title: '// exhibición aleatoria — transiciones multidireccionales'
  },
  en: {
    curator_panel: 'admin',
    theme_dark: 'dark',
    theme_light: 'light',
    view_grid: 'grid',
    view_list: 'list',
    archive_desc: 'curated archive of graphic & editorial design pieces. original 1080x1920 format.',
    back_to_top: '↑ back to top of archive',
    back_archive: 'back to archive',
    admin_title: 'personal repository / admin panel',
    admin_subtitle: 'manage your local disk artwork files (/uploads), 1080x1920 posters and database.',
    exit_admin: 'exit panel',
    add_new_piece: 'upload new piece',
    manage_categories: 'categories',
    export_json: 'export archive (.json)',
    import_json: 'import archive (.json)',
    reset_defaults: 'restore sample',
    saved_pieces: 'saved pieces in database',
    modal_add_title: 'upload new piece to database',
    label_image: 'artwork image (1080x1920 vertical recommended, saved as physical file in /uploads)',
    drop_prompt: 'click or drag your image here (poster / design)',
    drop_sub: 'stored physically in public/uploads/ folder',
    label_title: 'artwork title',
    label_year: 'year',
    label_category: 'category / tag',
    label_dimensions: 'ratio / dimensions',
    label_tools: 'tools / technique (technical sheet)',
    label_desc_es: 'curatorial description (spanish)',
    label_desc_en: 'curatorial description (english)',
    btn_cancel: 'cancel',
    btn_save_piece: 'save to database',
    modal_cats_title: 'manage archive categories',
    btn_add: 'add',
    footer_tagline: 'digital archive of curated graphic pieces & editorial design. zero visual noise, only artwork and neutral typography.',
    footer_cats: 'categories',
    footer_lang: 'idioma / language',
    footer_social: 'socials & legal',
    curator_panel_link: '→ admin',
    pieces_unit: 'pieces',
    spec_year: 'year',
    spec_category: 'category',
    spec_dimensions: 'dimensions / format',
    spec_tools: 'technical sheet / tools',
    curatorial_note: 'curatorial / editorial note',
    carousel_title: '// continuous archive — visual exploration',
    about_label: '// author profile — curatorial record',
    about_name: 'Andres Holguin',
    about_role: 'Systems Engineer • Digital Design',
    about_bio: 'Engineering student and part-time graphic artist. Living in Colombia (get me out of here) and spending half my life on Steam.',
    about_badge_1: 'Colombia (get me out)',
    about_badge_2: 'Steam Addict',
    about_badge_3: 'Systems Eng.',
    about_badge_4: 'Digital Design',
    manage_socials: 'social links (url)',
    modal_socials_title: 'configure social network urls',
    btn_save_socials: 'save links',
    footer_contact: 'contact: azzzzdresholguin@gmail.com',
    shutter_showcase_title: '// random showcase — multidirectional shutter transitions'
  }
};

function renderSocialLinks() {
  const socials = getSocials();
  const insta = document.getElementById('social-link-instagram');
  const fb = document.getElementById('social-link-facebook');
  const linkedin = document.getElementById('social-link-linkedin');
  const steam = document.getElementById('social-link-steam');

  if (insta && socials.instagram) insta.href = socials.instagram;
  if (fb && socials.facebook) fb.href = socials.facebook;
  if (linkedin && socials.linkedin) linkedin.href = socials.linkedin;
  if (steam && socials.steam) steam.href = socials.steam;
}

function initAboutSection() {
  const section = document.getElementById('about-section');
  const replayBtn = document.getElementById('btn-replay-strip');
  if (!section) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        section.classList.add('is-revealed');
      }
    });
  }, { threshold: 0.2 });

  observer.observe(section);

  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      section.classList.remove('is-revealed');
      void section.offsetWidth;
      section.classList.add('is-revealed');
    });
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await syncWithDatabase();
  initUIListeners();
  initAdminUI(onArchiveDataUpdated);
  initAdminLogin(onArchiveDataUpdated);
  renderCategoryTabs();
  renderFooterCategories();
  renderCarousel();
  initAboutSection();
  renderSocialLinks();
  initRandomShutterShowcase();
  updateUIStrings();
  
  window.addEventListener('limbo:socials-updated', renderSocialLinks);

  // Router check
  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  // Listen to custom updates
  window.addEventListener('limbo:archive-updated', onArchiveDataUpdated);
  window.addEventListener('limbo:categories-updated', () => {
    renderCategoryTabs();
    renderFooterCategories();
  });
});

function initTheme() {
  const saved = localStorage.getItem('limbo_theme') || 'dark';
  setTheme(saved);
}

function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('limbo_theme', theme);
  document.querySelectorAll('#theme-toggle .theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
  });
}

function onArchiveDataUpdated() {
  renderCategoryTabs();
  renderFooterCategories();
  renderGallery();
  renderCarousel();
  initRandomShutterShowcase();
  renderAdminPiecesList(onArchiveDataUpdated);
}

function initUIListeners() {
  // Theme switcher
  document.querySelectorAll('#theme-toggle .theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      if (theme === 'dark' || theme === 'light') {
        setTheme(theme);
      }
    });
  });

  // Language switcher
  document.querySelectorAll('#lang-switch .lang-btn, .footer-list .lang-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.getAttribute('data-lang');
      if (lang && (lang === 'es' || lang === 'en')) {
        currentLang = lang;
        document.querySelectorAll('#lang-switch .lang-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-lang') === currentLang);
        });
        updateUIStrings();
        renderGallery();
        const hash = window.location.hash;
        if (hash.startsWith('#/piezas/')) {
          const id = hash.replace('#/piezas/', '');
          renderDetailView(id);
        }
      }
    });
  });

  // View toggle (grid / list)
  document.querySelectorAll('#view-toggle .view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      if (view === 'grid' || view === 'list') {
        currentViewMode = view;
        document.querySelectorAll('#view-toggle .view-btn').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-view') === currentViewMode);
        });
        const grid = document.getElementById('gallery-grid');
        if (grid) {
          if (currentViewMode === 'list') {
            grid.classList.add('view-mode-list');
          } else {
            grid.classList.remove('view-mode-list');
          }
        }
      }
    });
  });

  // Scroll top button
  const scrollTopBtn = document.getElementById('scroll-top-btn');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

function updateUIStrings() {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Update pieces count text
  const countSpan = document.getElementById('pieces-count');
  if (countSpan) {
    const count = getPieces().filter(p => currentCategory === 'all' || p.category === currentCategory).length;
    countSpan.textContent = `${count} ${dict.pieces_unit}`;
  }
}

// SPA Routing
function handleRoute() {
  const hash = window.location.hash || '#/';
  const galleryView = document.getElementById('gallery-view');
  const detailView = document.getElementById('detail-view');
  const adminView = document.getElementById('admin-view');
  
  const headerEl = document.querySelector('.site-header');
  const navBar = document.querySelector('.site-nav-bar');
  const carouselSec = document.getElementById('archive-carousel');
  const aboutSec = document.getElementById('about-section');
  const randomSec = document.getElementById('random-showcase');
  const scrollTopCont = document.getElementById('scroll-top-container');
  const footerEl = document.querySelector('.site-footer');

  // Hide all main views
  galleryView.classList.add('hidden');
  detailView.classList.add('hidden');
  adminView.classList.add('hidden');

  if (hash === '#/admin') {
    adminView.classList.remove('hidden');
    if (headerEl) headerEl.classList.add('hidden');
    if (navBar) navBar.classList.add('hidden');
    if (carouselSec) carouselSec.classList.add('hidden');
    if (aboutSec) aboutSec.classList.add('hidden');
    if (randomSec) randomSec.classList.add('hidden');
    if (scrollTopCont) scrollTopCont.classList.add('hidden');
    if (footerEl) footerEl.classList.add('hidden');
    checkAdminAuthState(onArchiveDataUpdated);
    document.title = "limbo — repositorio personal / admin";
    window.scrollTo(0, 0);
  } else if (hash.startsWith('#/piezas/')) {
    const id = hash.replace('#/piezas/', '');
    detailView.classList.remove('hidden');
    if (headerEl) headerEl.classList.remove('hidden');
    if (navBar) navBar.classList.remove('hidden');
    if (carouselSec) carouselSec.classList.remove('hidden');
    if (aboutSec) aboutSec.classList.remove('hidden');
    if (randomSec) randomSec.classList.remove('hidden');
    if (scrollTopCont) scrollTopCont.classList.remove('hidden');
    if (footerEl) footerEl.classList.remove('hidden');
    renderDetailView(id);
    window.scrollTo(0, 0);
  } else {
    // Gallery / default
    galleryView.classList.remove('hidden');
    if (headerEl) headerEl.classList.remove('hidden');
    if (navBar) navBar.classList.remove('hidden');
    if (carouselSec) carouselSec.classList.remove('hidden');
    if (aboutSec) aboutSec.classList.remove('hidden');
    if (randomSec) randomSec.classList.remove('hidden');
    if (scrollTopCont) scrollTopCont.classList.remove('hidden');
    if (footerEl) footerEl.classList.remove('hidden');
    renderGallery();
    renderCarousel();
    document.title = "limbo — archivo digital de diseño gráfico";
  }
}

function renderCategoryTabs() {
  const container = document.getElementById('category-tabs');
  if (!container) return;

  const categories = getCategories();
  container.innerHTML = categories.map(cat => `
    <button class="cat-tab ${cat === currentCategory ? 'active' : ''}" data-category="${cat}">${cat}</button>
  `).join('');

  container.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentCategory = tab.getAttribute('data-category');
      container.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderGallery();
    });
  });
}

function renderFooterCategories() {
  const container = document.getElementById('footer-categories-list');
  if (!container) return;
  const categories = getCategories();
  container.innerHTML = categories.map(cat => `
    <li><a href="#/" class="footer-cat-link" data-category="${cat}">${cat}</a></li>
  `).join('');

  container.querySelectorAll('.footer-cat-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentCategory = link.getAttribute('data-category');
      window.location.hash = '#/';
      renderCategoryTabs();
      renderGallery();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

export function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const countSpan = document.getElementById('pieces-count');
  if (!grid) return;

  const allPieces = getPieces();
  const filtered = currentCategory === 'all' 
    ? allPieces 
    : allPieces.filter(p => p.category === currentCategory);

  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
  if (countSpan) {
    countSpan.textContent = `${filtered.length} ${dict.pieces_unit}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; padding: 60px 0; color: #999; text-align: center;">No hay piezas gráficas en la categoría "${currentCategory}".</div>`;
    return;
  }

  grid.innerHTML = filtered.map((piece, index) => {
    const desc = currentLang === 'en' ? (piece.description_en || piece.description_es) : piece.description_es;
    const delay = Math.min(0.5, 0.08 + index * 0.04).toFixed(2);
    return `
      <article class="piece-card" id="card-${piece.id}" style="animation-delay: ${delay}s;">
        <a href="#/piezas/${piece.id}" class="piece-image-link" title="${piece.title}">
          <img src="${piece.image}" alt="${piece.title}" decoding="async" loading="${index < 4 ? 'eager' : 'lazy'}" onerror="this.src='/assets/poster-1.png'" />
        </a>
        <div class="piece-meta-area">
          <div class="piece-title-row">
            <a href="#/piezas/${piece.id}" class="piece-title">${piece.title}</a>
            <span class="piece-year">${piece.year}</span>
          </div>
          <p class="piece-curatorial-text">${desc}</p>
          <div>
            <span class="piece-tag-badge">[${piece.category}] • ${piece.dimensions || '1080x1920'}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderDetailView(pieceId) {
  const container = document.getElementById('detail-content');
  if (!container) return;

  const piece = getPieceById(pieceId);
  if (!piece) {
    container.innerHTML = `<div style="padding: 60px 0; color: #999;">Pieza no encontrada. <a href="#/" style="text-decoration:underline;">Volver al archivo</a></div>`;
    return;
  }

  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
  const desc = currentLang === 'en' ? (piece.description_en || piece.description_es) : piece.description_es;

  // Dynamically update SEO
  document.title = `Limbo — ${piece.title} (${piece.year})`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', desc);

  container.innerHTML = `
    <div class="detail-image-box">
      <div class="ambient-glow-wrapper">
        <img src="${piece.image}" class="ambient-glow-bg" aria-hidden="true" onerror="this.style.display='none'" />
        <img src="${piece.image}" alt="${piece.title}" class="detail-main-img" onerror="this.src='/assets/poster-1.png'" />
      </div>
    </div>
    <aside class="detail-info-box">
      <div class="detail-header">
        <h1 class="detail-title">${piece.title}</h1>
        <p class="detail-subtitle">${piece.year} • [${piece.category}]</p>
      </div>

      <div class="detail-specs-grid">
        <div class="spec-item">
          <span class="spec-label">${dict.spec_year}</span>
          <span class="spec-val">${piece.year}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">${dict.spec_category}</span>
          <span class="spec-val">${piece.category}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">${dict.spec_dimensions}</span>
          <span class="spec-val">${piece.dimensions || '1080 x 1920 px'}</span>
        </div>
        <div class="spec-item">
          <span class="spec-label">${dict.spec_tools}</span>
          <span class="spec-val">${piece.tools || 'Editorial Design / Graphic Art'}</span>
        </div>
      </div>

      <div class="detail-curatorial-section">
        <h4 class="detail-curatorial-label">${dict.curatorial_note}</h4>
        <div class="detail-curatorial-body">
          <p>${desc}</p>
        </div>
      </div>
    </aside>
  `;
}

let carouselRAF = null;
let carouselTranslate = 0;
let carouselVelocity = -1.2;
let isCarouselDragging = false;
let carouselStartX = 0;
let carouselLastX = 0;
let carouselLastTime = 0;
let carouselDidDrag = false;
let carouselInitialized = false;

export function renderCarousel() {
  const track = document.getElementById('carousel-track');
  if (!track) return;
  
  const pieces = getPieces();
  if (pieces.length === 0) {
    track.innerHTML = '';
    return;
  }

  // Duplicate items 4 times to ensure plenty of scrollable width for fast flinging
  const repeated = [...pieces, ...pieces, ...pieces, ...pieces];

  track.innerHTML = repeated.map(p => `
    <a href="#/piezas/${p.id}" class="carousel-item" title="${p.title}" draggable="false">
      <img src="${p.image}" alt="${p.title}" decoding="async" draggable="false" onerror="this.src='/assets/poster-1.png'" />
    </a>
  `).join('');

  if (!carouselInitialized) {
    initCarouselPhysics(track);
    carouselInitialized = true;
  }
}

function initCarouselPhysics(track) {
  const container = track.parentElement || track;
  const baseSpeed = -1.2;
  carouselVelocity = baseSpeed;

  const getSingleWidth = () => {
    return (track.scrollWidth || 1) / 4;
  };

  setTimeout(() => {
    carouselTranslate = -getSingleWidth();
  }, 50);

  const animate = () => {
    if (!isCarouselDragging) {
      carouselVelocity += (baseSpeed - carouselVelocity) * 0.045;
      carouselTranslate += carouselVelocity;
    }

    const singleWidth = getSingleWidth();
    if (singleWidth > 10) {
      if (carouselTranslate <= -singleWidth * 2) {
        carouselTranslate += singleWidth;
      } else if (carouselTranslate >= 0) {
        carouselTranslate -= singleWidth;
      }
    }

    track.style.transform = `translate3d(${carouselTranslate}px, 0, 0)`;
    carouselRAF = requestAnimationFrame(animate);
  };

  if (carouselRAF) cancelAnimationFrame(carouselRAF);
  carouselRAF = requestAnimationFrame(animate);

  const startDrag = (clientX) => {
    isCarouselDragging = true;
    carouselStartX = clientX;
    carouselLastX = clientX;
    carouselLastTime = performance.now();
    carouselDidDrag = false;
    track.style.cursor = 'grabbing';
  };

  const moveDrag = (clientX) => {
    if (!isCarouselDragging) return;
    const now = performance.now();
    const dt = Math.max(8, now - carouselLastTime);
    const deltaX = clientX - carouselLastX;

    if (Math.abs(clientX - carouselStartX) > 5) {
      carouselDidDrag = true;
    }

    carouselTranslate += deltaX;
    const instantVel = (deltaX / dt) * 16;
    carouselVelocity = carouselVelocity * 0.35 + instantVel * 0.65;

    carouselLastX = clientX;
    carouselLastTime = now;
  };

  const endDrag = () => {
    if (!isCarouselDragging) return;
    isCarouselDragging = false;
    track.style.cursor = 'grab';
  };

  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    startDrag(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    moveDrag(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    endDrag();
  });

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      startDrag(e.touches[0].clientX);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      moveDrag(e.touches[0].clientX);
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    endDrag();
  });

  track.addEventListener('click', (e) => {
    if (carouselDidDrag) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
}

let randomShowcaseTimer = null;
let currentShowcaseIndices = [];

export function initRandomShutterShowcase() {
  const container = document.getElementById('random-shutter-grid');
  if (!container) return;

  const pieces = getPieces();
  if (!pieces || pieces.length === 0) {
    container.innerHTML = '';
    return;
  }

  const slotCount = Math.min(5, pieces.length);
  
  currentShowcaseIndices = [];
  const available = pieces.map((_, idx) => idx);
  for (let i = 0; i < slotCount; i++) {
    const randIdx = Math.floor(Math.random() * available.length);
    currentShowcaseIndices.push(available[randIdx]);
    available.splice(randIdx, 1);
  }

  container.innerHTML = currentShowcaseIndices.map((pieceIdx, slotIdx) => {
    const p = pieces[pieceIdx];
    return `
      <div class="shutter-slot" id="shutter-slot-${slotIdx}" data-slot="${slotIdx}">
        <div class="shutter-wipe" id="wipe-${slotIdx}"></div>
        <a href="#/piezas/${p.id}" class="shutter-img-link" title="${p.title}">
          <img src="${p.image}" alt="${p.title}" class="shutter-img" onerror="this.src='/assets/poster-1.png'" />
        </a>
      </div>
    `;
  }).join('');

  if (randomShowcaseTimer) clearInterval(randomShowcaseTimer);
  if (pieces.length > 1) {
    randomShowcaseTimer = setInterval(() => triggerRandomShutterSwap(), 1900);
  }
}

function triggerRandomShutterSwap() {
  const pieces = getPieces();
  const slotCount = currentShowcaseIndices.length;
  if (!pieces || pieces.length <= 1 || slotCount === 0) return;

  const countToChange = Math.min(slotCount, Math.min(pieces.length - 1, Math.floor(Math.random() * 2) + 2));
  const availableSlots = Array.from({ length: slotCount }, (_, i) => i);
  const slotsToChange = [];
  for (let i = 0; i < countToChange; i++) {
    const randIndex = Math.floor(Math.random() * availableSlots.length);
    slotsToChange.push(availableSlots[randIndex]);
    availableSlots.splice(randIndex, 1);
  }

  const currentDisplayed = new Set(currentShowcaseIndices);
  const dirs = ['dir-down', 'dir-up', 'dir-left', 'dir-right'];

  slotsToChange.forEach(slotIdx => {
    const slotEl = document.getElementById(`shutter-slot-${slotIdx}`);
    const wipeEl = document.getElementById(`wipe-${slotIdx}`);
    if (!slotEl || !wipeEl) return;

    const candidates = pieces.map((_, i) => i).filter(i => !currentDisplayed.has(i));
    const newPieceIdx = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : Math.floor(Math.random() * pieces.length);
    
    if (newPieceIdx === currentShowcaseIndices[slotIdx]) return;

    currentDisplayed.delete(currentShowcaseIndices[slotIdx]);
    currentDisplayed.add(newPieceIdx);
    currentShowcaseIndices[slotIdx] = newPieceIdx;

    const newPiece = pieces[newPieceIdx];
    const chosenDir = dirs[Math.floor(Math.random() * dirs.length)];

    wipeEl.className = 'shutter-wipe';
    void wipeEl.offsetWidth;
    wipeEl.classList.add(chosenDir, 'wiping');

    setTimeout(() => {
      const link = slotEl.querySelector('.shutter-img-link');
      const img = slotEl.querySelector('.shutter-img');
      if (link) {
        link.href = `#/piezas/${newPiece.id}`;
        link.title = newPiece.title;
      }
      if (img) {
        img.src = newPiece.image;
        img.alt = newPiece.title;
      }
    }, 310);

    setTimeout(() => {
      wipeEl.classList.remove('wiping', chosenDir);
    }, 680);
  });
}

/* ==========================================================================
   2FA DYNAMIC OTP LOGIN FOR CURATOR ADMIN PANEL
   ========================================================================== */

function checkAdminAuthState(onDataChanged) {
  const loginContainer = document.getElementById('admin-login-container');
  const portalContent = document.getElementById('admin-portal-content');
  const isLogged = sessionStorage.getItem('limbo_admin_logged') === 'true';

  if (isLogged) {
    if (loginContainer) loginContainer.classList.add('hidden');
    if (portalContent) portalContent.classList.remove('hidden');
    renderAdminPiecesList(onDataChanged);
  } else {
    if (loginContainer) loginContainer.classList.remove('hidden');
    if (portalContent) portalContent.classList.add('hidden');
  }
}

function initAdminLogin(onDataChanged) {
  const loginForm = document.getElementById('admin-login-form');
  const userEl = document.getElementById('login-username');
  const passEl = document.getElementById('login-password');
  const btnLogout = document.getElementById('btn-admin-logout');

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const u = (userEl?.value || '').trim();
      const p = (passEl?.value || '').trim();

      if (u === 'admin' && p === 'Virgo242424') {
        sessionStorage.setItem('limbo_admin_logged', 'true');
        if (userEl) userEl.value = '';
        if (passEl) passEl.value = '';
        checkAdminAuthState(onDataChanged);
      } else {
        const card = document.querySelector('.admin-login-card');
        if (card) {
          card.classList.add('error-shake');
          setTimeout(() => card.classList.remove('error-shake'), 500);
        }
        alert('Usuario o contraseña incorrectos.');
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      sessionStorage.removeItem('limbo_admin_logged');
      checkAdminAuthState(onDataChanged);
    });
  }
}

