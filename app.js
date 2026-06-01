// Estado de la Aplicación
const state = {
  tips: [],
  subjects: [],
  filters: {
    search: "",
    subject: "all",
    category: "all",
    tab: "all"
  },
  editingTipId: null,
  currentTags: []
};

// --- ARRANQUE ---
document.addEventListener("DOMContentLoaded", async () => {
  if (!AUTH.isLoggedIn()) {
    AUTH.loginStudent();
  }
  await bootApp();
});

async function bootApp() {
  applyRoleUI();
  await loadData();
  initEventListeners();
  renderAll();
}

function applyRoleUI() {
  const isAdmin = AUTH.isAdmin();
  document.body.classList.toggle("admin-mode", isAdmin);

  const indicator = document.getElementById("role-indicator");
  if (indicator) {
    indicator.textContent = isAdmin ? "🔑 Administrador" : "🎓 Alumno";
    indicator.className = `role-badge ${isAdmin ? "admin" : "student"}`;
  }
}

// --- CARGA Y PERSISTENCIA DE DATOS ---
async function loadData() {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.tips.length === 0 && data.subjects.length === 0) {
      // Primera ejecución: cargar datos semilla y persistirlos en el servidor
      state.tips     = typeof INITIAL_TIPS     !== "undefined" ? [...INITIAL_TIPS]     : [];
      state.subjects = typeof INITIAL_SUBJECTS !== "undefined" ? [...INITIAL_SUBJECTS] : [];
      saveData();
    } else {
      state.tips     = data.tips;
      state.subjects = data.subjects;
    }
  } catch {
    // Fallback si el servidor no está disponible: usar localStorage o datos semilla
    const t = localStorage.getItem("aitips_tips");
    const s = localStorage.getItem("aitips_subjects");
    state.tips     = t ? JSON.parse(t) : (typeof INITIAL_TIPS     !== "undefined" ? INITIAL_TIPS     : []);
    state.subjects = s ? JSON.parse(s) : (typeof INITIAL_SUBJECTS !== "undefined" ? INITIAL_SUBJECTS : []);
    showToast("Servidor no disponible. Usando datos locales.", "info");
  }
}

function saveData() {
  // Guardar en servidor (fire-and-forget)
  fetch('/api/data', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ tips: state.tips, subjects: state.subjects })
  }).catch(() => showToast("Error al guardar en el servidor.", "danger"));

  // Mantener localStorage como caché offline
  localStorage.setItem("aitips_tips",     JSON.stringify(state.tips));
  localStorage.setItem("aitips_subjects", JSON.stringify(state.subjects));
}

// --- CONFIGURACIÓN DE EVENT LISTENERS ---
function initEventListeners() {
  // Buscador y Filtros
  document.getElementById("search-input").addEventListener("input", e => {
    state.filters.search = e.target.value;
    renderTips();
  });

  document.getElementById("filter-subject").addEventListener("change", e => {
    state.filters.subject = e.target.value;
    renderTips();
  });

  document.getElementById("filter-category").addEventListener("change", e => {
    state.filters.category = e.target.value;
    renderTips();
  });

  // Pestañas rápidas (solo visibles en admin)
  document.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      state.filters.tab = button.dataset.tab;
      renderTips();
    });
  });

  // Botones de header (admin)
  document.getElementById("btn-new-tip").addEventListener("click", () => openTipFormModal());
  document.getElementById("btn-manage-subjects").addEventListener("click", () => openSubjectManagerModal());
  document.getElementById("btn-data-settings").addEventListener("click", () => openDataModal());

  // Logout
  document.getElementById("btn-logout").addEventListener("click", () => {
    AUTH.logout();
    location.reload();
  });

  // Cerrar modales
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.querySelectorAll(".modal-close").forEach(closeBtn => {
    closeBtn.addEventListener("click", () => {
      const modal = closeBtn.closest(".modal-overlay");
      if (modal) closeModal(modal.id);
    });
  });

  // --- FORMULARIO DE TIPS ---
  const tagInputField = document.getElementById("form-tags-input");
  tagInputField.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = tagInputField.value.trim().toLowerCase().replace(",", "");
      if (value && !state.currentTags.includes(value)) {
        state.currentTags.push(value);
        renderFormTags();
        tagInputField.value = "";
      }
    }
  });

  document.getElementById("add-step-btn").addEventListener("click", () => addDynamicInputRow("steps-inputs-container", ""));
  document.getElementById("add-usecase-btn").addEventListener("click", () => addDynamicInputRow("usecases-inputs-container", ""));
  document.getElementById("add-link-btn").addEventListener("click", () => addDynamicLinkRow("links-inputs-container", "", ""));

  document.getElementById("tip-form").addEventListener("submit", e => {
    e.preventDefault();
    saveTipFromForm();
  });

  // --- GESTIÓN DE MATERIAS ---
  document.getElementById("add-subject-form").addEventListener("submit", e => {
    e.preventDefault();
    addNewSubject();
  });

  // --- IMPORTACIÓN / EXPORTACIÓN ---
  document.getElementById("export-json-btn").addEventListener("click", exportDataToJSON);
  document.getElementById("import-file-input").addEventListener("change", importDataFromJSON);

  // --- CAMBIO DE PIN (solo admin) ---
  document.getElementById("btn-change-pin").addEventListener("click", changeAdminPin);
}

// --- CAMBIAR PIN DE ADMIN ---
function changeAdminPin() {
  const newPin = document.getElementById("new-pin-input").value.trim();
  const confirmPin = document.getElementById("confirm-pin-input").value.trim();

  if (!newPin) {
    showToast("El PIN no puede estar vacío.", "danger");
    return;
  }
  if (newPin !== confirmPin) {
    showToast("Los PINs no coinciden.", "danger");
    return;
  }

  AUTH.setPin(newPin);
  document.getElementById("new-pin-input").value = "";
  document.getElementById("confirm-pin-input").value = "";
  showToast("PIN de administrador actualizado correctamente.");
}

// --- RENDERIZACIÓN DE LA UI ---
function renderAll() {
  renderSubjectFilters();
  renderStats();
  renderTips();
}

function renderSubjectFilters() {
  const filterSelect = document.getElementById("filter-subject");
  const formSelect = document.getElementById("form-subject");
  const currentFilterSelection = state.filters.subject;

  filterSelect.innerHTML = '<option value="all">Todas las materias</option>';
  formSelect.innerHTML = '<option value="" disabled selected>Seleccione una materia...</option>';

  state.subjects.sort().forEach(subject => {
    const optFilter = document.createElement("option");
    optFilter.value = subject;
    optFilter.textContent = subject;
    if (subject === currentFilterSelection) optFilter.selected = true;
    filterSelect.appendChild(optFilter);

    const optForm = document.createElement("option");
    optForm.value = subject;
    optForm.textContent = subject;
    formSelect.appendChild(optForm);
  });
}

function renderStats() {
  const isAdmin = AUTH.isAdmin();
  const visibleTips = isAdmin ? state.tips : state.tips.filter(t => t.forStudents);

  document.getElementById("stat-total-tips").textContent = visibleTips.length;
  document.getElementById("stat-total-subjects").textContent = state.subjects.length;
  document.getElementById("stat-total-favorites").textContent = state.tips.filter(t => t.isFavorite).length;
  document.getElementById("stat-total-students").textContent = state.tips.filter(t => t.forStudents).length;
}

function renderTips() {
  const grid = document.getElementById("tips-grid");
  grid.innerHTML = "";
  const isAdmin = AUTH.isAdmin();

  let filteredTips = state.tips.filter(tip => {
    // Alumnos solo ven tips habilitados para estudiantes
    if (!isAdmin && !tip.forStudents) return false;

    const query = state.filters.search.toLowerCase().trim();
    const matchesSearch = !query ||
      tip.title.toLowerCase().includes(query) ||
      tip.description.toLowerCase().includes(query) ||
      (tip.triggerWord && tip.triggerWord.toLowerCase().includes(query)) ||
      tip.category.toLowerCase().includes(query) ||
      tip.tags.some(tag => tag.toLowerCase().includes(query));

    const matchesSubject = state.filters.subject === "all" || tip.subject === state.filters.subject;
    const matchesCategory = state.filters.category === "all" || tip.category === state.filters.category;

    let matchesTab = true;
    if (isAdmin) {
      if (state.filters.tab === "favorites") matchesTab = tip.isFavorite;
      else if (state.filters.tab === "students") matchesTab = tip.forStudents;
    }

    return matchesSearch && matchesSubject && matchesCategory && matchesTab;
  });

  if (filteredTips.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <h3>No se encontraron tips</h3>
        <p>${isAdmin
          ? "Intenta ajustar los filtros o registra un nuevo tip."
          : "No hay prompts disponibles con los filtros actuales."
        }</p>
      </div>
    `;
    return;
  }

  filteredTips.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  filteredTips.forEach(tip => {
    const card = document.createElement("div");
    card.className = "tip-card";
    card.dataset.id = tip.id;

    const tagsHTML = tip.tags.map(tag => `<span class="tag-badge">#${tag}</span>`).join("");

    const headerActions = isAdmin
      ? `<button class="favorite-btn ${tip.isFavorite ? "active" : ""}" onclick="toggleFavorite('${tip.id}', event)" title="${tip.isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}">${tip.isFavorite ? "★" : "☆"}</button>`
      : "";

    const cardFooter = isAdmin
      ? `<div class="student-indicator ${tip.forStudents ? "active" : ""}">
           <span>${tip.forStudents ? "👁️ Compartido con Alumnos" : "🔒 Solo para Docente"}</span>
         </div>
         <div class="card-actions">
           <button class="btn btn-secondary btn-sm" onclick="openTipFormModal('${tip.id}', event)" title="Editar tip">✏️</button>
           <button class="btn btn-danger-outline btn-sm" onclick="deleteTip('${tip.id}', event)" title="Eliminar tip">🗑️</button>
         </div>`
      : `<div class="card-actions student-card-actions">
           <button class="btn btn-secondary btn-sm" onclick="quickCopyPrompt('${tip.id}', event)" title="Copiar prompt">📋 Copiar Prompt</button>
         </div>`;

    card.innerHTML = `
      <div class="tip-card-header">
        <span class="subject-badge" title="${tip.subject}">${tip.subject}</span>
        ${headerActions}
      </div>
      <div class="tip-card-body" onclick="openTipDetailModal('${tip.id}')" style="cursor: pointer;">
        <div class="tip-category">${tip.category}</div>
        <h3 class="tip-title">${escapeHTML(tip.title)}</h3>
        <p class="tip-description">${escapeHTML(tip.description)}</p>
        ${tip.triggerWord ? `<div class="trigger-badge">⚡ Disparador: ${escapeHTML(tip.triggerWord)}</div>` : ""}
        <div class="tag-list">${tagsHTML}</div>
      </div>
      <div class="tip-card-footer">
        ${cardFooter}
      </div>
    `;
    grid.appendChild(card);
  });
}

// --- MANEJO DE MODALES ---
function openModal(modalId) {
  document.getElementById(modalId).classList.add("active");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("active");
}

// --- VISTA DETALLADA DEL TIP ---
function openTipDetailModal(tipId) {
  const tip = state.tips.find(t => t.id === tipId);
  if (!tip) return;

  document.getElementById("detail-subject").textContent = tip.subject;
  document.getElementById("detail-category").textContent = tip.category;
  document.getElementById("detail-title").textContent = tip.title;
  document.getElementById("detail-description").textContent = tip.description;

  const triggerContainer = document.getElementById("detail-trigger-container");
  triggerContainer.innerHTML = tip.triggerWord
    ? `<div class="trigger-badge" style="font-size: 0.9rem; margin-bottom: 1.25rem;">⚡ Palabra Clave / Disparador: <strong>${escapeHTML(tip.triggerWord)}</strong></div>`
    : "";

  document.getElementById("detail-prompt-code").textContent = tip.promptText;

  document.getElementById("detail-copy-btn").onclick = () => copyToClipboard(tip.promptText, "¡Prompt copiado al portapapeles!");
  document.getElementById("detail-markdown-btn").onclick = () => copyToClipboard(generateMarkdownForTip(tip), "¡Tip copiado en formato Markdown!");

  const stepsContainer = document.getElementById("detail-steps");
  stepsContainer.innerHTML = "";
  if (tip.steps && tip.steps.length > 0) {
    document.getElementById("detail-steps-section").style.display = "block";
    tip.steps.forEach(step => {
      const li = document.createElement("li");
      li.textContent = step;
      stepsContainer.appendChild(li);
    });
  } else {
    document.getElementById("detail-steps-section").style.display = "none";
  }

  const usecasesContainer = document.getElementById("detail-usecases");
  usecasesContainer.innerHTML = "";
  if (tip.useCases && tip.useCases.length > 0) {
    document.getElementById("detail-usecases-section").style.display = "block";
    tip.useCases.forEach(uc => {
      const li = document.createElement("li");
      li.textContent = uc;
      usecasesContainer.appendChild(li);
    });
  } else {
    document.getElementById("detail-usecases-section").style.display = "none";
  }

  const linksContainer = document.getElementById("detail-links");
  linksContainer.innerHTML = "";
  if (tip.links && tip.links.length > 0 && tip.links.some(l => l.text && l.url)) {
    document.getElementById("detail-links-section").style.display = "block";
    tip.links.forEach(link => {
      if (link.text && link.url) {
        const a = document.createElement("a");
        a.href = link.url;
        a.target = "_blank";
        a.className = "external-link";
        a.innerHTML = `🔗 ${escapeHTML(link.text)} ↗`;
        linksContainer.appendChild(a);
      }
    });
  } else {
    document.getElementById("detail-links-section").style.display = "none";
  }

  openModal("view-modal");
}

// Copia rápida del prompt desde la tarjeta (modo alumno)
window.quickCopyPrompt = function(tipId, event) {
  event.stopPropagation();
  const tip = state.tips.find(t => t.id === tipId);
  if (tip) copyToClipboard(tip.promptText, "¡Prompt copiado!");
};

// --- FORMULARIO DE CREACIÓN/EDICIÓN ---
function openTipFormModal(tipId = null, event = null) {
  if (event) event.stopPropagation();

  const form = document.getElementById("tip-form");
  form.reset();
  state.currentTags = [];
  document.getElementById("steps-inputs-container").innerHTML = "";
  document.getElementById("usecases-inputs-container").innerHTML = "";
  document.getElementById("links-inputs-container").innerHTML = "";

  if (tipId) {
    state.editingTipId = tipId;
    document.getElementById("form-modal-title").textContent = "Editar Tip de IA";

    const tip = state.tips.find(t => t.id === tipId);
    if (!tip) return;

    document.getElementById("form-title").value = tip.title;
    document.getElementById("form-subject").value = tip.subject;
    document.getElementById("form-category").value = tip.category;
    document.getElementById("form-trigger").value = tip.triggerWord || "";
    document.getElementById("form-description").value = tip.description;
    document.getElementById("form-prompt").value = tip.promptText;
    document.getElementById("form-favorite").checked = tip.isFavorite;
    document.getElementById("form-students").checked = tip.forStudents;

    state.currentTags = [...tip.tags];
    renderFormTags();

    if (tip.steps && tip.steps.length > 0) tip.steps.forEach(step => addDynamicInputRow("steps-inputs-container", step));
    if (tip.useCases && tip.useCases.length > 0) tip.useCases.forEach(uc => addDynamicInputRow("usecases-inputs-container", uc));
    if (tip.links && tip.links.length > 0) tip.links.forEach(link => addDynamicLinkRow("links-inputs-container", link.text, link.url));
  } else {
    state.editingTipId = null;
    document.getElementById("form-modal-title").textContent = "Registrar Nuevo Tip de IA";
    renderFormTags();
    addDynamicInputRow("steps-inputs-container", "");
    addDynamicInputRow("usecases-inputs-container", "");
    addDynamicLinkRow("links-inputs-container", "", "");
  }

  openModal("form-modal");
}

function renderFormTags() {
  const container = document.getElementById("form-tags-list");
  container.innerHTML = "";
  state.currentTags.forEach(tag => {
    const badge = document.createElement("span");
    badge.className = "tag-editor-badge";
    badge.innerHTML = `#${tag}<span class="tag-editor-badge-remove" onclick="removeFormTag('${tag}')">&times;</span>`;
    container.appendChild(badge);
  });
}

function removeFormTag(tag) {
  state.currentTags = state.currentTags.filter(t => t !== tag);
  renderFormTags();
}

function addDynamicInputRow(containerId, value = "") {
  const container = document.getElementById(containerId);
  const div = document.createElement("div");
  div.className = "dynamic-list-item";
  div.innerHTML = `
    <input type="text" class="form-control" value="${escapeHTML(value)}" placeholder="Escribe un ítem..." required>
    <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="padding: 0.7rem 0.9rem;">✕</button>
  `;
  container.appendChild(div);
}

function addDynamicLinkRow(containerId, text = "", url = "") {
  const container = document.getElementById(containerId);
  const div = document.createElement("div");
  div.className = "dynamic-list-item";
  div.innerHTML = `
    <input type="text" class="form-control" style="flex: 2;" value="${escapeHTML(text)}" placeholder="Texto del enlace" required>
    <input type="url" class="form-control" style="flex: 3;" value="${escapeHTML(url)}" placeholder="https://ejemplo.com" required>
    <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="padding: 0.7rem 0.9rem;">✕</button>
  `;
  container.appendChild(div);
}

function saveTipFromForm() {
  const title = document.getElementById("form-title").value.trim();
  const subject = document.getElementById("form-subject").value;
  const category = document.getElementById("form-category").value;
  const triggerWord = document.getElementById("form-trigger").value.trim();
  const description = document.getElementById("form-description").value.trim();
  const promptText = document.getElementById("form-prompt").value.trim();
  const isFavorite = document.getElementById("form-favorite").checked;
  const forStudents = document.getElementById("form-students").checked;

  if (!subject) {
    showToast("Por favor, selecciona una materia o curso.", "danger");
    return;
  }

  const steps = Array.from(document.querySelectorAll("#steps-inputs-container .dynamic-list-item input"))
    .map(inp => inp.value.trim()).filter(Boolean);

  const useCases = Array.from(document.querySelectorAll("#usecases-inputs-container .dynamic-list-item input"))
    .map(inp => inp.value.trim()).filter(Boolean);

  const links = Array.from(document.querySelectorAll("#links-inputs-container .dynamic-list-item"))
    .map(item => {
      const inputs = item.querySelectorAll("input");
      return { text: inputs[0].value.trim(), url: inputs[1].value.trim() };
    }).filter(link => link.text && link.url);

  if (state.editingTipId) {
    const index = state.tips.findIndex(t => t.id === state.editingTipId);
    if (index !== -1) {
      state.tips[index] = { ...state.tips[index], title, subject, category, triggerWord, description, promptText, tags: [...state.currentTags], steps, useCases, links, isFavorite, forStudents };
      showToast("¡Tip actualizado con éxito!");
    }
  } else {
    state.tips.push({
      id: "tip-" + Date.now(),
      title, subject, category, triggerWord, description, promptText,
      tags: [...state.currentTags], steps, useCases, links, isFavorite, forStudents,
      createdAt: new Date().toISOString()
    });
    showToast("¡Nuevo Tip guardado correctamente!");
  }

  saveData();
  closeModal("form-modal");
  renderStats();
  renderTips();
}

// --- GESTIÓN DE MATERIAS ---
function openSubjectManagerModal() {
  renderSubjectManagerList();
  openModal("subject-modal");
}

function renderSubjectManagerList() {
  const container = document.getElementById("subject-manager-list");
  container.innerHTML = "";
  state.subjects.sort().forEach(subject => {
    const div = document.createElement("div");
    div.className = "subject-item";
    div.innerHTML = `
      <span>${escapeHTML(subject)}</span>
      <div class="subject-item-actions">
        <button class="btn btn-secondary btn-sm" onclick="renameSubject('${escapeHTML(subject)}')">✏️</button>
        <button class="btn btn-danger-outline btn-sm" onclick="deleteSubject('${escapeHTML(subject)}')">✕</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function addNewSubject() {
  const input = document.getElementById("form-new-subject");
  const value = input.value.trim();
  if (!value) return;
  if (state.subjects.includes(value)) {
    showToast("La materia ya existe.", "danger");
    return;
  }
  state.subjects.push(value);
  input.value = "";
  saveData();
  renderSubjectFilters();
  renderSubjectManagerList();
  renderStats();
  showToast(`Materia "${value}" agregada.`);
}

function renameSubject(oldName) {
  const newName = prompt(`Modificar el nombre de la materia "${oldName}":`, oldName);
  if (!newName) return;
  const cleanedNewName = newName.trim();
  if (!cleanedNewName || cleanedNewName === oldName) return;
  if (state.subjects.includes(cleanedNewName)) {
    showToast("Ese nombre de materia ya existe.", "danger");
    return;
  }
  state.subjects = state.subjects.map(s => s === oldName ? cleanedNewName : s);
  state.tips = state.tips.map(tip => tip.subject === oldName ? { ...tip, subject: cleanedNewName } : tip);
  saveData();
  renderSubjectFilters();
  renderSubjectManagerList();
  renderTips();
  showToast("Materia renombrada correctamente.");
}

function deleteSubject(subjectName) {
  const linkedTipsCount = state.tips.filter(t => t.subject === subjectName).length;
  let confirmMessage = `¿Estás seguro de que deseas eliminar la materia "${subjectName}"?`;
  if (linkedTipsCount > 0) {
    confirmMessage += `\n\nADVERTENCIA: Hay ${linkedTipsCount} tip(s) asociados. Se asignarán a "Sin Materia".`;
  }
  if (confirm(confirmMessage)) {
    state.subjects = state.subjects.filter(s => s !== subjectName);
    if (linkedTipsCount > 0) {
      if (!state.subjects.includes("Sin Materia")) state.subjects.push("Sin Materia");
      state.tips = state.tips.map(tip => tip.subject === subjectName ? { ...tip, subject: "Sin Materia" } : tip);
    }
    saveData();
    renderSubjectFilters();
    renderSubjectManagerList();
    renderStats();
    renderTips();
    showToast(`Materia "${subjectName}" eliminada.`);
  }
}

// --- OPERACIONES RÁPIDAS EN TARJETAS ---
window.toggleFavorite = function(tipId, event) {
  event.stopPropagation();
  const tip = state.tips.find(t => t.id === tipId);
  if (tip) {
    tip.isFavorite = !tip.isFavorite;
    saveData();
    renderStats();
    renderTips();
    showToast(tip.isFavorite ? "Añadido a favoritos ★" : "Quitado de favoritos ☆");
  }
};

window.deleteTip = function(tipId, event) {
  event.stopPropagation();
  const tip = state.tips.find(t => t.id === tipId);
  if (!tip) return;
  if (confirm(`¿Estás seguro de que deseas eliminar el tip "${tip.title}"?`)) {
    state.tips = state.tips.filter(t => t.id !== tipId);
    saveData();
    renderStats();
    renderTips();
    showToast("Tip eliminado de la base de datos.");
  }
};

// --- PORTABILIDAD Y CONFIGURACIÓN DE DATOS ---
function openDataModal() {
  openModal("data-modal");
}

function exportDataToJSON() {
  const dataToExport = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    subjects: state.subjects,
    tips: state.tips
  };
  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement("a");
  tempLink.href = url;
  tempLink.download = `aitips-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(tempLink);
  tempLink.click();
  document.body.removeChild(tempLink);
  URL.revokeObjectURL(url);
  showToast("Archivo JSON de configuración descargado.");
}

function importDataFromJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.tips || !data.subjects) {
        showToast("Error: Formato de archivo JSON inválido.", "danger");
        return;
      }
      const overwrite = confirm(
        "¿Deseas SOBREESCRIBIR todos los datos actuales con los del archivo?\n\n" +
        "Aceptar: Reemplazará todos tus tips actuales.\n" +
        "Cancelar: Combinará los importados con los existentes."
      );
      if (overwrite) {
        state.tips = data.tips;
        state.subjects = data.subjects;
      } else {
        data.subjects.forEach(sub => { if (!state.subjects.includes(sub)) state.subjects.push(sub); });
        data.tips.forEach(importedTip => {
          const exists = state.tips.some(t => t.id === importedTip.id);
          if (!exists) {
            state.tips.push(importedTip);
          } else {
            importedTip.id = "tip-" + Date.now() + Math.random().toString(36).substring(2, 5);
            state.tips.push(importedTip);
          }
        });
      }
      saveData();
      renderAll();
      closeModal("data-modal");
      showToast("Datos importados y actualizados con éxito.");
      event.target.value = "";
    } catch (err) {
      showToast("Error al decodificar el archivo JSON.", "danger");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

// --- UTILERÍAS ---
function copyToClipboard(text, successMessage) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(successMessage);
  }).catch(() => {
    showToast("No se pudo copiar automáticamente. Hazlo manualmente.", "danger");
  });
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast-notification");
  toast.className = `toast show ${type}`;
  const icon = type === "danger" ? "✕" : type === "info" ? "ℹ" : "✓";
  document.getElementById("toast-message").innerHTML = `<span>${icon}</span> ${message}`;
  setTimeout(() => toast.classList.remove("show"), 3500);
}

function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateMarkdownForTip(tip) {
  let md = `# [Tip] ${tip.title}\n\n`;
  md += `**Materia:** ${tip.subject} | **Categoría:** ${tip.category}\n`;
  if (tip.triggerWord) md += `**Disparador / Trigger:** \`${tip.triggerWord}\`\n`;
  md += `\n## Descripción\n${tip.description}\n\n`;
  md += `## Prompt / Instrucción\n\`\`\`text\n${tip.promptText}\n\`\`\`\n\n`;
  if (tip.steps && tip.steps.length > 0) {
    md += `## Instrucciones de Uso\n`;
    tip.steps.forEach((step, idx) => { md += `${idx + 1}. ${step}\n`; });
    md += `\n`;
  }
  if (tip.useCases && tip.useCases.length > 0) {
    md += `## Casos de Uso recomendados\n`;
    tip.useCases.forEach(uc => { md += `- ${uc}\n`; });
    md += `\n`;
  }
  if (tip.links && tip.links.length > 0 && tip.links.some(l => l.text && l.url)) {
    md += `## Enlaces y Recursos adicionales\n`;
    tip.links.forEach(link => { if (link.text && link.url) md += `- [${link.text}](${link.url})\n`; });
  }
  return md;
}
