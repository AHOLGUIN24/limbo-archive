import { 
  getPieces, 
  getPieceById, 
  addPiece, 
  updatePiece, 
  deletePiece, 
  getCategories, 
  addCategory, 
  deleteCategory, 
  exportToJSON, 
  importFromJSON, 
  resetToDefaults,
  getSocials,
  saveSocials
} from './storage.js';

let currentImageBase64OrUrl = '';
let currentImageFile = null;
let isEditingId = null;

export function initAdminUI(onDataChanged) {
  const btnNewModal = document.getElementById('btn-show-new-modal');
  const pieceModal = document.getElementById('piece-modal');
  const closePieceModal = document.getElementById('close-piece-modal');
  const cancelPieceBtn = document.getElementById('cancel-piece-btn');
  const pieceForm = document.getElementById('piece-form');
  const modalTitle = document.getElementById('modal-title');
  
  const btnManageCats = document.getElementById('btn-manage-categories');
  const catsModal = document.getElementById('categories-modal');
  const closeCatsModal = document.getElementById('close-cats-modal');
  const btnAddCat = document.getElementById('btn-add-cat');
  const newCatInput = document.getElementById('new-cat-input');

  const btnExport = document.getElementById('btn-export-archive');
  const btnImport = document.getElementById('btn-import-archive');
  const importInput = document.getElementById('import-file-input');
  const btnReset = document.getElementById('btn-reset-archive');

  const dropZone = document.getElementById('image-drop-zone');
  const fileInput = document.getElementById('image-file-input');
  const imgPreview = document.getElementById('image-preview');
  const urlInput = document.getElementById('image-url-input');
  const promptBox = document.getElementById('drop-zone-prompt');

  // Open Add Piece Modal
  if (btnNewModal) {
    btnNewModal.addEventListener('click', () => {
      isEditingId = null;
      pieceForm.reset();
      currentImageBase64OrUrl = '';
      currentImageFile = null;
      imgPreview.src = '';
      imgPreview.classList.add('hidden');
      promptBox.classList.remove('hidden');
      urlInput.value = '';
      modalTitle.textContent = 'subir nueva pieza al archivo';
      populateCategorySelect();
      pieceModal.classList.remove('hidden');
    });
  }

  // Close Modals
  const closePiece = () => pieceModal.classList.add('hidden');
  if (closePieceModal) closePieceModal.addEventListener('click', closePiece);
  if (cancelPieceBtn) cancelPieceBtn.addEventListener('click', closePiece);
  if (pieceModal) {
    pieceModal.addEventListener('click', (e) => {
      if (e.target === pieceModal) closePiece();
    });
  }

  if (btnManageCats) {
    btnManageCats.addEventListener('click', () => {
      renderCategoriesModalList();
      catsModal.classList.remove('hidden');
    });
  }

  const closeCats = () => catsModal.classList.add('hidden');
  if (closeCatsModal) closeCatsModal.addEventListener('click', closeCats);
  if (catsModal) {
    catsModal.addEventListener('click', (e) => {
      if (e.target === catsModal) closeCats();
    });
  }

  // Image Drag & Drop and File Input
  if (dropZone) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#111';
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = '#e5e5e5';
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#e5e5e5';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  if (urlInput) {
    urlInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        currentImageBase64OrUrl = val;
        currentImageFile = null;
        imgPreview.src = val;
        imgPreview.classList.remove('hidden');
        promptBox.classList.add('hidden');
      } else if (!currentImageBase64OrUrl.startsWith('data:')) {
        currentImageBase64OrUrl = '';
        currentImageFile = null;
        imgPreview.src = '';
        imgPreview.classList.add('hidden');
        promptBox.classList.remove('hidden');
      }
    });
  }

  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) return;
    currentImageFile = file;
    currentImageBase64OrUrl = '';
    imgPreview.src = URL.createObjectURL(file);
    imgPreview.classList.remove('hidden');
    promptBox.classList.add('hidden');
    if (urlInput) urlInput.value = '';
  }

  // Submit Piece Form
  if (pieceForm) {
    pieceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('piece-title').value.trim();
      const year = document.getElementById('piece-year').value.trim();
      const category = document.getElementById('piece-category').value;
      const dimensions = document.getElementById('piece-dimensions').value.trim() || '1080 x 1920 px';
      const tools = document.getElementById('piece-tools').value.trim();
      const description_es = document.getElementById('piece-desc-es').value.trim();
      const description_en = document.getElementById('piece-desc-en').value.trim() || description_es;

      const finalImage = currentImageFile ? '' : (currentImageBase64OrUrl || urlInput.value.trim() || '/assets/poster-1.png');

      const data = {
        title,
        year,
        category,
        dimensions,
        tools,
        image: finalImage,
        description_es,
        description_en
      };

      const submitBtn = pieceForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : 'guardar en archivo';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'subiendo imagen... ⌛';
      }

      try {
        if (isEditingId) {
          await updatePiece(isEditingId, data, currentImageFile);
        } else {
          await addPiece(data, currentImageFile);
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }

      closePiece();
      renderAdminPiecesList(onDataChanged);
      if (onDataChanged) onDataChanged();
    });
  }

  // Categories Modal logic
  if (btnAddCat && newCatInput) {
    btnAddCat.addEventListener('click', async () => {
      const val = newCatInput.value.trim();
      if (val) {
        await addCategory(val);
        newCatInput.value = '';
        renderCategoriesModalList();
        if (onDataChanged) onDataChanged();
      }
    });
    newCatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnAddCat.click();
      }
    });
  }

  // Export / Import / Reset
  if (btnExport) btnExport.addEventListener('click', () => exportToJSON());
  if (btnImport) btnImport.addEventListener('click', () => importInput.click());
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const res = await importFromJSON(event.target.result);
          if (res.success) {
            alert(`¡Archivo importado con éxito! Se restauraron ${res.count} piezas en la base de datos.`);
            renderAdminPiecesList(onDataChanged);
            if (onDataChanged) onDataChanged();
          } else {
            alert(`Error al importar: ${res.error}`);
          }
        };
        reader.readAsText(e.target.files[0]);
      }
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (confirm('¿Estás seguro de restaurar las piezas de muestra iniciales y categorías por defecto en la base de datos?')) {
        await resetToDefaults();
        renderAdminPiecesList(onDataChanged);
        if (onDataChanged) onDataChanged();
      }
    });
  }

  // Manage Social Links Modal
  const btnManageSocials = document.getElementById('btn-manage-socials');
  const socialsModal = document.getElementById('socials-modal');
  const closeSocialsModal = document.getElementById('close-socials-modal');
  const cancelSocialsBtn = document.getElementById('btn-cancel-socials');
  const socialsForm = document.getElementById('socials-form');

  if (btnManageSocials && socialsModal) {
    btnManageSocials.addEventListener('click', () => {
      const soc = getSocials();
      const insta = document.getElementById('social-input-instagram');
      const fb = document.getElementById('social-input-facebook');
      const linkedin = document.getElementById('social-input-linkedin');
      const steam = document.getElementById('social-input-steam');
      if (insta) insta.value = soc.instagram || '';
      if (fb) fb.value = soc.facebook || '';
      if (linkedin) linkedin.value = soc.linkedin || '';
      if (steam) steam.value = soc.steam || '';
      socialsModal.classList.remove('hidden');
    });
  }
  if (closeSocialsModal && socialsModal) closeSocialsModal.addEventListener('click', () => socialsModal.classList.add('hidden'));
  if (cancelSocialsBtn && socialsModal) cancelSocialsBtn.addEventListener('click', () => socialsModal.classList.add('hidden'));
  if (socialsForm && socialsModal) {
    socialsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newSoc = {
        instagram: (document.getElementById('social-input-instagram')?.value || '').trim(),
        facebook: (document.getElementById('social-input-facebook')?.value || '').trim(),
        linkedin: (document.getElementById('social-input-linkedin')?.value || '').trim(),
        steam: (document.getElementById('social-input-steam')?.value || '').trim()
      };
      await saveSocials(newSoc);
      socialsModal.classList.add('hidden');
      alert('¡URLs de redes sociales actualizadas exitosamente!');
    });
  }

  // Listen to external updates
  window.addEventListener('limbo:archive-updated', () => {
    renderAdminPiecesList(onDataChanged);
  });
  window.addEventListener('limbo:categories-updated', () => {
    populateCategorySelect();
    renderCategoriesModalList();
  });
}

function populateCategorySelect() {
  const select = document.getElementById('piece-category');
  if (!select) return;
  const cats = getCategories().filter(c => c !== 'all');
  select.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

export function renderAdminPiecesList(onDataChanged) {
  const container = document.getElementById('admin-pieces-container');
  const countSpan = document.getElementById('admin-pieces-count');
  if (!container) return;

  const pieces = getPieces();
  if (countSpan) countSpan.textContent = pieces.length;

  if (pieces.length === 0) {
    container.innerHTML = `<div class="admin-piece-row" style="justify-content:center; color:#999;">El repositorio está vacío. Sube tu primera pieza con el botón de arriba.</div>`;
    return;
  }

  container.innerHTML = pieces.map(p => `
    <div class="admin-piece-row">
      <div class="admin-row-left">
        <img src="${p.image}" class="admin-thumb" alt="${p.title}" onerror="this.src='/assets/poster-1.png'" />
        <div class="admin-row-info">
          <span class="admin-row-title">${p.title}</span>
          <span class="admin-row-meta">${p.year} • [${p.category}] • ${p.dimensions || '1080x1920'}</span>
        </div>
      </div>
      <div class="admin-row-actions">
        <button class="btn-icon edit-btn" data-id="${p.id}">editar</button>
        <button class="btn-icon delete delete-btn" data-id="${p.id}">eliminar</button>
      </div>
    </div>
  `).join('');

  // Bind Edit buttons
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const piece = getPieceById(id);
      if (piece) openEditModal(piece);
    });
  });

  // Bind Delete buttons
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('¿Deseas eliminar esta pieza y su archivo físico de tu repositorio personal?')) {
        await deletePiece(id);
        renderAdminPiecesList(onDataChanged);
        if (onDataChanged) onDataChanged();
      }
    });
  });
}

function openEditModal(piece) {
  isEditingId = piece.id;
  const pieceModal = document.getElementById('piece-modal');
  const modalTitle = document.getElementById('modal-title');
  const imgPreview = document.getElementById('image-preview');
  const promptBox = document.getElementById('drop-zone-prompt');
  const urlInput = document.getElementById('image-url-input');

  modalTitle.textContent = `editar pieza: ${piece.title}`;
  
  populateCategorySelect();
  document.getElementById('piece-title').value = piece.title || '';
  document.getElementById('piece-year').value = piece.year || '';
  document.getElementById('piece-category').value = piece.category || 'posters';
  document.getElementById('piece-dimensions').value = piece.dimensions || '1080 x 1920 px';
  document.getElementById('piece-tools').value = piece.tools || '';
  document.getElementById('piece-desc-es').value = piece.description_es || '';
  document.getElementById('piece-desc-en').value = piece.description_en || '';

  currentImageBase64OrUrl = piece.image || '';
  currentImageFile = null;
  if (currentImageBase64OrUrl) {
    imgPreview.src = currentImageBase64OrUrl;
    imgPreview.classList.remove('hidden');
    promptBox.classList.add('hidden');
    if (!currentImageBase64OrUrl.startsWith('data:')) {
      urlInput.value = currentImageBase64OrUrl;
    } else {
      urlInput.value = '';
    }
  } else {
    imgPreview.src = '';
    imgPreview.classList.add('hidden');
    promptBox.classList.remove('hidden');
    urlInput.value = '';
  }

  pieceModal.classList.remove('hidden');
}

export function renderCategoriesModalList() {
  const container = document.getElementById('cats-list-container');
  if (!container) return;
  const cats = getCategories();

  container.innerHTML = cats.map(c => `
    <li class="cat-item-row">
      <span>${c} ${c === 'all' ? '<small style="color:#999;">(predeterminada)</small>' : ''}</span>
      ${c !== 'all' ? `<button class="btn-icon delete del-cat-btn" data-cat="${c}">eliminar</button>` : ''}
    </li>
  `).join('');

  container.querySelectorAll('.del-cat-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cat = btn.getAttribute('data-cat');
      await deleteCategory(cat);
      renderCategoriesModalList();
      window.dispatchEvent(new CustomEvent('limbo:categories-updated'));
    });
  });
}
