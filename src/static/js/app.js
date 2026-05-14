/**
 * ============================================================
 * DATOS ABIERTOS CANARIAS - APLICACIÓN PRINCIPAL
 * ============================================================
 * Descripción: Aplicación para buscar y visualizar entidades
 *              de datos abiertos de Canarias
 * Autor: Datos Abiertos Canarias
 * Versión: 2.0
 * ============================================================
 */

// ==================== VARIABLES GLOBALES ====================

/** 
 * Almacena todas las entidades cargadas desde el JSON
 * @type {Array} - Lista de entidades normalizadas
 */
let data = [];
let typeChart = null;
// ==================== FUNCIONES DE NORMALIZACIÓN ====================

/**
 * Normaliza los datos de una entidad a un formato unificado
 * Soporta dos esquemas de JSON diferentes (original y portal)
 * @param {Object} e - Objeto original de la entidad
 * @returns {Object} - Objeto normalizado con estructura consistente
 */
function normalize(e) {
  return {
    name: e.name || "Sin nombre",                                          // Nombre de la entidad
    type: e.type || "N/D",                                                  // Tipo de institución
    portal_url: e.portal_url || e.portal?.url || "#",                      // URL del portal
    dataset_count: e.dataset_count ?? e.data?.count ?? "Sin publicar",     // Número de datasets
    data_categories: e.data_categories || e.data?.categories || [],        // Categorías de datos
    formats: e.formats || e.data?.formats || [],                           // Formatos disponibles
    coordinates: e.coordinates || e.geographic?.coordinates || null,       // Coordenadas geográficas
    island: e.island || null,                                              // Isla principal
    islands: e.islands || null,                                            // Múltiples islas
    description: e.description || "",                                       // Descripción
  };
}

// ==================== FUNCIONES DE UI Y ESTADOS ====================

/**
 * Muestra un indicador de carga mientras se cargan los datos
 * También actualiza el contador de resultados
 */
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

/**
 * Muestra un mensaje de error cuando falla la carga de datos
 * Incluye soluciones posibles y botón para reintentar
 * @param {string} message - Mensaje de error a mostrar
 */
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

/**
 * Actualiza el texto del contador de resultados
 * @param {string} text - Texto a mostrar en el contador
 */
function updateStatsText(text) {
  const statsSpan = document.getElementById("resultsCount");
  if (statsSpan) {
    statsSpan.textContent = text;
  }
}

/**
 * Actualiza la interfaz según los filtros activos
 * Controla la visibilidad del botón reset y el contador
 * @param {number} filteredCount - Cantidad de resultados filtrados
 * @param {number} totalCount - Cantidad total de entidades
 * @param {boolean} hasActiveFilters - Indica si hay filtros activos
 */
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

/**
 * Carga el archivo JSON de entidades desde el servidor
 * La ruta es relativa: ../entidades.json (un nivel arriba)
 * Una vez cargado, normaliza los datos y aplica los filtros
 */
function loadData() {
  showLoading();

  // Usando la ruta original que funcionaba
  fetch('/api/entidades')
    .then(r => {
      if (!r.ok) throw new Error('No se pudo cargar el archivo');
      return r.json();
    })
    .then(json => {
      // Aplana estructuras anidadas y normaliza cada entidad
      data = json.flat(Infinity).map(normalize);
      filter(); // Aplica filtros iniciales y renderiza
    })
    .catch(error => {
      console.error('Error:', error);
      showError('No se pudo cargar el archivo entidades.json. Verifica que existe en la carpeta raíz.');
    });
}

// ==================== EVENTOS Y FILTROS ====================

/**
 * Configura los event listeners para los elementos de filtrado
 * - Búsqueda por texto: evento 'input' para respuesta en tiempo real
 * - Filtros de tipo e isla: evento 'change'
 * - Botón reset: evento 'click'
 */
function setupEventListeners() {
  document.getElementById("searchText").addEventListener("input", filter);
  document.getElementById("filterType").addEventListener("change", filter);
  document.getElementById("filterIsland").addEventListener("change", filter);

  const resetBtn = document.getElementById("resetFilters");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetFilters);
  }
}

/**
 * Reinicia todos los filtros a sus valores por defecto
 * Limpia el campo de búsqueda y los selects
 * Vuelve a aplicar los filtros y enfoca el campo de búsqueda
 */
function resetFilters() {
  document.getElementById("searchText").value = '';
  document.getElementById("filterType").value = '';
  document.getElementById("filterIsland").value = '';
  filter(); // Re-renderiza sin filtros
  document.getElementById("searchText").focus();
}

/**
 * Función principal de filtrado
 * Aplica tres tipos de filtros:
 * 1. Texto: busca en nombre, descripción y categorías
 * 2. Tipo: gobierno, organismo, cabildo, ayuntamiento
 * 3. Isla: Tenerife, Gran Canaria, etc.
 * 
 * Actualiza la UI con los resultados y los contadores
 */
function filter() {
  const text = document.getElementById("searchText").value.toLowerCase();
  const type = document.getElementById("filterType").value;
  const island = document.getElementById("filterIsland").value;

  const filtered = data.filter(e => {
    // Filtro por texto (nombre, descripción o categorías)
    const matchText =
      e.name.toLowerCase().includes(text) ||
      e.description.toLowerCase().includes(text) ||
      e.data_categories.join(" ").toLowerCase().includes(text);

    // Filtro por tipo de institución
    const matchType = !type || e.type === type;

    // Filtro por isla (incluye 'canarias' como ámbito regional)
    const matchIsland = !island ||
      e.island?.includes(island) ||
      e.islands?.includes(island) ||
      e.island === "canarias";

    return matchText && matchType && matchIsland;
  });

  render(filtered);

  // Actualizar UI con contadores
  const hasActiveFilters = text !== '' || type !== '' || island !== '';
  updateUI(filtered.length, data.length, hasActiveFilters);
}

// ==================== RENDERIZADO ====================

/**
 * Genera y muestra las tarjetas de las entidades en el DOM
 * @param {Array} list - Lista de entidades a renderizar
 * 
 * Características:
 * - Muestra mensaje si no hay resultados
 * - Limita a 6 categorías y 4 formatos por tarjeta
 * - Incluye iconos según tipo de institución
 * - Escape HTML para seguridad
 * - Truncado de descripciones largas
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
    const visibleCount = 4;  // Número de categorías visibles inicialmente
    const visibleCategories = allCategories.slice(0, visibleCount);
    const hiddenCategories = allCategories.slice(visibleCount);
    const hasMore = hiddenCategories.length > 0;

    const allFormats = e.formats || [];
    const coords = e.coordinates;
    const hasCoords = coords && (coords.lat || coords.lon);
    const typeIcon = getTypeIcon(e.type);

    // ID único para cada tarjeta
    const cardId = 'card-' + Math.random().toString(36).substr(2, 8);

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

  // Inicializar los botones de toggle después de renderizar
  document.querySelectorAll('.toggle-categories-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const cardId = this.getAttribute('data-card');
      const container = document.getElementById(cardId);
      const hiddenBadges = container.querySelectorAll('.category-hidden');
      const isExpanded = this.classList.contains('expanded');

      if (isExpanded) {
        // Contraer
        hiddenBadges.forEach(badge => badge.style.display = 'none');
        this.classList.remove('expanded');
        const hiddenCount = hiddenBadges.length;
        this.innerHTML = `<span>(${hiddenCount})</span><span class="arrow-icon">▼</span>`;
      } else {
        // Expandir
        hiddenBadges.forEach(badge => badge.style.display = 'inline-block');
        this.classList.add('expanded');
        this.innerHTML = `<span></span><span class="arrow-icon">▲</span>`;
      }
    });
  });
}

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Obtiene el icono correspondiente al tipo de institución
 * @param {string} type - Tipo de institución
 * @returns {string} - Emoji/icono representativo
 */
function getTypeIcon(type) {
  const icons = {
    'gobierno_autonomico': '🏢',           // Gobierno
    'organismo_especializado': '📋',       // Organismo
    'organismo_especializado_geoespacial': '🗺️', // Geoespacial
    'cabildo': '🏝️',                      // Cabildo
    'ayuntamiento': '🏘️'                  // Ayuntamiento
  };
  return icons[type] || '📊';  // Icono por defecto
}

/**
 * Formatea el tipo de institución para mostrarlo en español
 * @param {string} type - Tipo de institución (clave en inglés)
 * @returns {string} - Nombre formateado en español
 */
function formatType(type) {
  const types = {
    'gobierno_autonomico': 'Gobierno Autonómico',
    'organismo_especializado': 'Organismo Especializado',
    'organismo_especializado_nacional': 'Organismo Especializado Nacional',
    'organismo_especializado_geoespacial': 'Organismo Geoespacial',
    'cabildo': 'Cabildo Insular',
    'ayuntamiento': 'Ayuntamiento'
  };
  return types[type] || type || 'Institución';
}

/**
 * Obtiene la etiqueta HTML de la isla con su icono
 * @param {Object} item - Entidad que contiene información de isla
 * @returns {string|null} - Etiqueta HTML formateada o null si no hay isla
 */
function getIslandTag(item) {
  const islands = [item.island, item.islands].flat().filter(Boolean);
  if (islands.length === 0) return null;

  const islandNames = {
    'Tenerife': '🏝️ Tenerife',
    'Gran Canaria': '🏝️ Gran Canaria',
    'Lanzarote': '🏝️ Lanzarote',
    'Fuerteventura': '🏝️ Fuerteventura',
    'La Palma': '🏝️ La Palma',
    'La Gomera': '🏝️ La Gomera',
    'El Hierro': '🏝️ El Hierro',
  };

  const firstIsland = islands[0];
  return islandNames[firstIsland] || null;
}

/**
 * Escapa caracteres HTML para prevenir XSS (Cross-Site Scripting)
 * @param {string} str - Texto a escapar
 * @returns {string} - Texto seguro para insertar en HTML
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} str - Texto a truncar
 * @param {number} length - Longitud máxima permitida
 * @returns {string} - Texto truncado con '...' si excede la longitud
 */
function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

// ==================== MODO OSCURO ====================

/**
 * Inicializa el modo oscuro
 * - Detecta preferencia guardada en localStorage
 * - Configura el botón para alternar entre modos
 * - Persiste la elección del usuario
 */
function initDarkMode() {
  const toggleBtn = document.getElementById('darkModeToggle');
  if (!toggleBtn) return;

  // Cargar preferencia guardada
  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'enabled') {
    document.body.classList.add('dark-mode');
    toggleBtn.innerHTML = '☀️ Modo claro';
  }

  // Evento del botón
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

/**
 * Alterna la visibilidad de las categorías extra en una tarjeta
 * @param {string} cardId - ID único de la tarjeta (ej: "card-xyz123")
 * 
 * Cómo funciona:
 * - Cuando haces clic en la flecha ▶, busca el div con las categorías ocultas
 * - Si están ocultas → las muestra y gira la flecha ▼
 * - Si están visibles → las oculta y vuelve la flecha ▶
 * 
 * 1. Buscar el div que contiene las categorías extra (las que están ocultas)
 * 2. Buscar el botón de la flecha dentro de esta tarjeta
 * 3. Preguntar si las categorías extra están visibles ahora
 * 4. Si están visibles → las oculta. Si están ocultas → las muestra
 * 5. Girar la flecha 90 grados (▶ se convierte en ▼ y viceversa)
 */
function toggleCat(cardId) {

  const hiddenDiv = document.getElementById(cardId + '-hidden');
  const btn = document.querySelector(`#${cardId} .toggle-cat-btn`);
  const isVisible = hiddenDiv.style.display === 'flex';
  hiddenDiv.style.display = isVisible ? 'none' : 'flex';
  if (btn) {
    btn.classList.toggle('rotated');
  }
}

/**
 * Alterna la visibilidad de los formatos extra en una tarjeta
 * @param {string} cardId - ID único de la tarjeta 
 */
function toggleFormats(cardId) {

  const hiddenDiv = document.getElementById(cardId + '-formats-hidden');
  const btn = document.querySelector(`#${cardId}-formats .toggle-cat-btn`);
  const isVisible = hiddenDiv.style.display === 'flex';
  hiddenDiv.style.display = isVisible ? 'none' : 'flex';
  if (btn) {
    btn.classList.toggle('rotated');
  }
}

/**
 * Alterna la descripción entre colapsada y expandida
 * @param {string} descId - ID del elemento de descripción
 */
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

/**
 * Inicializa la aplicación
 * Configura los event listeners y carga los datos
 */
function init() {
  setupEventListeners();
  loadData();
  initDarkMode();
}

/**
 * Evento que espera a que el DOM esté completamente cargado
 * antes de inicializar la aplicación
 */
document.addEventListener('DOMContentLoaded', init);