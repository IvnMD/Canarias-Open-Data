/**
 * ============================================================
 * DATOS ABIERTOS CANARIAS - APLICACIÓN PRINCIPAL
 * ============================================================
 * Descripción: Aplicación para buscar y visualizar entidades
 *              de datos abiertos de Canarias
 * Autor: Datos Abiertos Canarias
 * Versión: 3.0 — adaptada al schema entidades_v2
 * ============================================================
 */

// ==================== VARIABLES GLOBALES ====================

/**
 * Almacena todas las entidades cargadas desde el JSON
 * @type {Array}
 */
let data = [];
let typeChart = null;

// ==================== FUNCIONES DE NORMALIZACIÓN ====================

/**
 * Normaliza los datos de una entidad al formato interno de la app.
 * Lee el nuevo schema v2: entity_kind, scope, portals[], locations[].
 * @param {Object} e - Objeto original del JSON
 * @returns {Object} - Objeto normalizado con estructura consistente
 */
function normalize(e) {
  // Portal principal: primer portal del array, preferiblemente open_data
  const portal = e.portals?.find(p => p.kind === 'open_data') || e.portals?.[0] || null;

  // Coordenadas: primera sede (headquarters) con coordenadas
  const hq = e.locations?.find(l => l.coordinates?.lat && l.coordinates?.lon) || null;

  return {
    id:             e.id || '',
    name:           e.name || 'Sin nombre',

    // Tipo e ámbito — nuevo schema
    type:           e.entity_kind || 'organismo',   // entity_kind → tipo base
    scope:          e.scope || null,                 // autonomico, insular, municipal…

    // Islas
    islands:        e.islands || [],

    // Descripción
    description:    e.description || '',

    // Portal principal (extraído de portals[])
    portal_url:     portal?.url || '#',
    portal_kind:    portal?.kind || null,            // open_data | transparencia | estadistica…
    portal_tech:    portal?.technology || [],
    machine_readable: portal?.machine_readable ?? null,
    has_api:        portal?.has_api ?? null,

    // Datos del portal
    dataset_count:  portal?.dataset_count ?? 'Sin publicar',
    data_categories: portal?.topics || [],
    formats:        portal?.formats || [],
    license_summary: portal?.license_summary || null,

    // Coordenadas
    coordinates: hq
      ? { lat: hq.coordinates.lat, lon: hq.coordinates.lon }
      : null,

    // Verificación
    verification_status: e.verification?.status || 'pending',

    // Relación jerárquica
    parent_entity_id: e.parent_entity_id || null,
  };
}

// ==================== FUNCIONES DE UI Y ESTADOS ====================

function showLoading() {
  const container = document.getElementById("results");
  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Cargando datos de portales oficiales...</p>
    </div>
  `;
  updateStatsText('Cargando...');
}

function showError(message) {
  const container = document.getElementById("results");
  container.innerHTML = `
    <div class="error-message">
      <span class="error-icon">⚠️</span>
      <h3>Error al cargar los datos</h3>
      <p>${message}</p>
      <button onclick="location.reload()" class="retry-btn">⟳ Reintentar</button>
      <details style="margin-top: 1rem;">
        <summary style="cursor: pointer; color: #666;">💡 Soluciones posibles</summary>
        <ul style="text-align: left; margin-top: 0.5rem;">
          <li>Asegúrate de tener el archivo JSON en la carpeta raíz</li>
          <li>Ejecuta la página con un servidor local: <code>python -m http.server 8000</code></li>
          <li>Verifica que el archivo se llame <code>entidades.json</code></li>
        </ul>
      </details>
    </div>
  `;
  updateStatsText('Error de carga');
}

function updateStatsText(text) {
  const statsSpan = document.getElementById("resultsCount");
  if (statsSpan) statsSpan.textContent = text;
}

function updateUI(filteredCount, totalCount, hasActiveFilters) {
  const resetBtn = document.getElementById("resetFilters");
  if (resetBtn) {
    resetBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';
  }
  if (hasActiveFilters && filteredCount !== totalCount) {
    updateStatsText(`${filteredCount} de ${totalCount} entidades`);
  } else {
    updateStatsText(`${filteredCount} ${filteredCount === 1 ? 'entidad encontrada' : 'entidades encontradas'}`);
  }
}

// ==================== CARGA DE DATOS ====================

function loadData() {
  showLoading();

  fetch('/api/entidades')
    .then(r => {
      if (!r.ok) throw new Error('No se pudo cargar el archivo');
      return r.json();
    })
    .then(json => {
      data = json.flat(Infinity).map(normalize);
      filter();
    })
    .catch(error => {
      console.error('Error:', error);
      showError('No se pudo cargar el archivo entidades.json. Verifica que existe en la carpeta raíz.');
    });
}

// ==================== EVENTOS Y FILTROS ====================

function setupEventListeners() {
  document.getElementById("searchText").addEventListener("input", filter);
  document.getElementById("filterType").addEventListener("change", filter);
  document.getElementById("filterIsland").addEventListener("change", filter);

  const resetBtn = document.getElementById("resetFilters");
  if (resetBtn) resetBtn.addEventListener("click", resetFilters);
}

function resetFilters() {
  document.getElementById("searchText").value = '';
  document.getElementById("filterType").value = '';
  document.getElementById("filterIsland").value = '';
  filter();
  document.getElementById("searchText").focus();
}

/**
 * Función principal de filtrado.
 * Usa los nuevos campos: e.type (entity_kind), e.islands[], e.data_categories (topics)
 */
function filter() {
  const text   = document.getElementById("searchText").value.toLowerCase();
  const type   = document.getElementById("filterType").value;
  const island = document.getElementById("filterIsland").value;

  const filtered = data.filter(e => {
    // Búsqueda de texto en nombre, descripción y categorías/topics
    const matchText =
      e.name.toLowerCase().includes(text) ||
      e.description.toLowerCase().includes(text) ||
      e.data_categories.join(" ").toLowerCase().includes(text);

    // Filtro por entity_kind (nuevo campo 'type' en el objeto normalizado)
    const matchType = !type || e.type === type;

    // Filtro por isla: islands[] puede incluir "Todas" (ámbito autonómico)
    const matchIsland = !island ||
      e.islands.includes(island) ||
      e.islands.includes("Todas");

    return matchText && matchType && matchIsland;
  });

  render(filtered);

  const hasActiveFilters = text !== '' || type !== '' || island !== '';
  updateUI(filtered.length, data.length, hasActiveFilters);
}

// ==================== RENDERIZADO ====================

/**
 * Genera y muestra las tarjetas de las entidades en el DOM.
 * Muestra badges adicionales: machine_readable, has_api, verification_status.
 */
function render(list) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        <h3>No se encontraron resultados</h3>
        <p>Intenta con otros términos de búsqueda o elimina algunos filtros</p>
        <button onclick="resetFilters()" class="reset-btn-empty">Limpiar filtros</button>
      </div>
    `;
    return;
  }

  list.forEach(e => {
    const allCategories = e.data_categories || [];
    const allFormats    = e.formats || [];
    const coords        = e.coordinates;
    const hasCoords     = coords && coords.lat && coords.lon;
    const typeIcon      = getTypeIcon(e.type);
    const cardId        = 'card-' + Math.random().toString(36).substr(2, 8);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-header">
        <h3>${escapeHtml(e.name)}</h3>
        ${getIslandTag(e) ? `<span class="island-tag">${getIslandTag(e)}</span>` : ''}
      </div>

      <div class="card-type">
        <span class="type-icon">${typeIcon}</span>
        <span class="type-text">${formatType(e.type)}</span>
        ${shouldShowScope(e.type, e.scope) ? `<span class="scope-badge">${formatScope(e.scope)}</span>` : ''}
      </div>

      <div class="card-meta-badges">
        ${e.machine_readable === true  ? `<span class="meta-badge meta-ok" title="Datos reutilizables en formato legible por máquina">✅ Machine-readable</span>` : ''}
        ${e.machine_readable === false ? `<span class="meta-badge meta-warn" title="Solo documentos PDF o HTML">📄 Solo docs</span>` : ''}
        ${e.has_api === true           ? `<span class="meta-badge meta-ok" title="Dispone de API pública">🔌 API disponible</span>` : ''}
        ${e.verification_status === 'verified'  ? `<span class="meta-badge meta-ok" title="Datos verificados">✔ Verificado</span>` : ''}
        ${e.verification_status === 'estimated' ? `<span class="meta-badge meta-neutral" title="Datos estimados">~ Estimado</span>` : ''}
        ${e.verification_status === 'pending'   ? `<span class="meta-badge meta-warn" title="Pendiente de verificación">⏳ Pendiente</span>` : ''}
      </div>

      ${e.description ? `
        <div class="description-container">
          <div class="description-text collapsed" id="desc-${cardId}">
            ${escapeHtml(e.description)}
          </div>
          <button class="toggle-desc-btn" onclick="toggleDescription('desc-${cardId}')">
            <span>Ver más</span>
            <span class="arrow-icon">▼</span>
          </button>
        </div>
      ` : ''}

      <div class="card-stats">
        <div class="stat">
          <span class="stat-value">${e.dataset_count}</span>
          <span class="stat-label">datasets</span>
        </div>
      </div>

      ${allCategories.length > 0 ? `
        <div class="card-section" id="${cardId}">
          <div class="categories-header">
            <strong>📂 Categorías</strong>
            ${allCategories.length > 4 ? `
              <button class="toggle-cat-btn" onclick="toggleCat('${cardId}')">▶</button>
            ` : ''}
          </div>
          <div class="badge-container" id="${cardId}-visible">
            ${allCategories.slice(0, 4).map(c => `<span class="badge">${escapeHtml(c)}</span>`).join("")}
          </div>
          <div class="badge-container" id="${cardId}-hidden" style="display:none;">
            ${allCategories.slice(4).map(c => `<span class="badge">${escapeHtml(c)}</span>`).join("")}
          </div>
        </div>
      ` : ""}

      ${allFormats.length > 0 ? `
        <div class="card-section" id="${cardId}-formats">
          <div class="categories-header">
            <strong>📄 Formatos</strong>
            ${allFormats.length > 4 ? `
              <button class="toggle-cat-btn" onclick="toggleFormats('${cardId}')">▶</button>
            ` : ''}
          </div>
          <div class="badge-container" id="${cardId}-formats-visible">
            ${allFormats.slice(0, 4).map(f => `<span class="badge format-badge">${escapeHtml(f)}</span>`).join("")}
          </div>
          <div class="badge-container" id="${cardId}-formats-hidden" style="display:none;">
            ${allFormats.slice(4).map(f => `<span class="badge format-badge">${escapeHtml(f)}</span>`).join("")}
          </div>
        </div>
      ` : ""}

      <div class="card-footer">
        <a href="${e.portal_url}" target="_blank" rel="noopener noreferrer" class="portal-link">
          🔗 Acceder al portal <span class="arrow">→</span>
        </a>
        ${hasCoords ? `<span class="coordinates">📍 ${coords.lat}, ${coords.lon}</span>` : ""}
      </div>
    `;

    container.appendChild(card);
  });
}

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Icono según entity_kind (nuevo campo 'type' en objeto normalizado)
 */
function getTypeIcon(type) {
  const icons = {
    'gobierno_autonomico': '🏢',
    'organismo':           '📋',
    'cabildo':             '🏝️',
    'ayuntamiento':        '🏘️',
    'empresa_publica':     '🏭',
  };
  return icons[type] || '📊';
}

/**
 * Nombre legible del entity_kind
 */
function formatType(type) {
  const types = {
    'gobierno_autonomico': 'Gobierno Autonómico',
    'organismo':           'Organismo',
    'cabildo':             'Cabildo Insular',
    'ayuntamiento':        'Ayuntamiento',
    'empresa_publica':     'Empresa Pública',
  };
  return types[type] || type || 'Institución';
}

/**
 * Nombre legible del scope
 */
function formatScope(scope) {
  const scopes = {
    'autonomico': 'Autonómico',
    'insular':    'Insular',
    'municipal':  'Municipal',
    'estatal':    'Estatal',
    'europeo':    'Europeo',
  };
  return scopes[scope] || scope;
}

/**
 * Etiqueta de isla para la cabecera de la tarjeta.
 * Si islands[] incluye más de una isla o "Todas", muestra "Canarias".
 */
function getIslandTag(item) {
  const islands = item.islands || [];
  if (islands.length === 0) return null;

  if (islands.includes("Todas") || islands.length > 2) {
    return '🏝️ Canarias';
  }

  const islandNames = {
    'Tenerife':       '🏝️ Tenerife',
    'Gran Canaria':   '🏝️ Gran Canaria',
    'Lanzarote':      '🏝️ Lanzarote',
    'Fuerteventura':  '🏝️ Fuerteventura',
    'La Palma':       '🏝️ La Palma',
    'La Gomera':      '🏝️ La Gomera',
    'El Hierro':      '🏝️ El Hierro',
    'La Graciosa':    '🏝️ La Graciosa',
  };

  return islandNames[islands[0]] || null;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}
/**
 * Cuando debe mostrar el scope la tarjeta
 * En gobierno y cabildos el scope es siempre obvio, no hace falta repetirlo
 * @param {*} type 
 * @param {*} scope 
 * @returns 
 */
function shouldShowScope(type, scope) {
  if (type === 'gobierno_autonomico') return false;
  if (type === 'cabildo') return false;
  if (type === 'ayuntamiento') return false;
  return !!scope;
}

// ==================== MODO OSCURO ====================

function initDarkMode() {
  const toggleBtn = document.getElementById('darkModeToggle');
  if (!toggleBtn) return;

  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'enabled') {
    document.body.classList.add('dark-mode');
    toggleBtn.innerHTML = '☀️ Modo claro';
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
      document.body.classList.remove('dark-mode');
      toggleBtn.innerHTML = '🌙 Modo oscuro';
      localStorage.setItem('darkMode', 'disabled');
    } else {
      document.body.classList.add('dark-mode');
      toggleBtn.innerHTML = '☀️ Modo claro';
      localStorage.setItem('darkMode', 'enabled');
    }
  });
}

// ==================== TOGGLES ====================

function toggleCat(cardId) {
  const hiddenDiv = document.getElementById(cardId + '-hidden');
  const btn = document.querySelector(`#${cardId} .toggle-cat-btn`);
  const isVisible = hiddenDiv.style.display === 'flex';
  hiddenDiv.style.display = isVisible ? 'none' : 'flex';
  if (btn) btn.classList.toggle('rotated');
}

function toggleFormats(cardId) {
  const hiddenDiv = document.getElementById(cardId + '-formats-hidden');
  const btn = document.querySelector(`#${cardId}-formats .toggle-cat-btn`);
  const isVisible = hiddenDiv.style.display === 'flex';
  hiddenDiv.style.display = isVisible ? 'none' : 'flex';
  if (btn) btn.classList.toggle('rotated');
}

function toggleDescription(descId) {
  const descElement = document.getElementById(descId);
  const btn = descElement.nextElementSibling;
  const isCollapsed = descElement.classList.contains('collapsed');
  if (isCollapsed) {
    descElement.classList.remove('collapsed');
    btn.innerHTML = '<span>Ver menos</span><span class="arrow-icon">▲</span>';
  } else {
    descElement.classList.add('collapsed');
    btn.innerHTML = '<span>Ver más</span><span class="arrow-icon">▼</span>';
  }
}

// ==================== INICIALIZACIÓN ====================

function init() {
  setupEventListeners();
  loadData();
  initDarkMode();
}

document.addEventListener('DOMContentLoaded', init);