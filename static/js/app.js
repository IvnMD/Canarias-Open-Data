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

  // Estado vacío: no hay resultados
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

  // Renderizar cada entidad como una tarjeta
  list.forEach(e => {
    const categories = e.data_categories.slice(0, 6);  // Máximo 6 categorías
    const formats = e.formats.slice(0, 4);             // Máximo 4 formatos
    const coords = e.coordinates;
    const hasCoords = coords && (coords.lat || coords.lon);
    const typeIcon = getTypeIcon(e.type);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <!-- Cabecera de la tarjeta: nombre y etiqueta de isla -->
      <div class="card-header">
        <h3>${escapeHtml(e.name)}</h3>
        ${getIslandTag(e) ? `<span class="island-tag">${getIslandTag(e)}</span>` : ''}
      </div>
      
      <!-- Tipo de institución con icono -->
      <div class="card-type">
        <span class="type-icon">${typeIcon}</span>
        <span class="type-text">${formatType(e.type)}</span>
      </div>
      
      <!-- Descripción (truncada a 120 caracteres) -->
      ${e.description ? `<p class="card-description">${truncate(escapeHtml(e.description), 120)}</p>` : ''}
      
      <!-- Estadísticas: número de datasets -->
      <div class="card-stats">
        <div class="stat">
          <span class="stat-value">${e.dataset_count}</span>
          <span class="stat-label">datasets</span>
        </div>
      </div>
      
      <!-- Categorías de datos -->
      ${categories.length > 0 ? `
        <div class="card-section">
          <strong>📂 Categorías:</strong>
          <div class="badge-container">
            ${categories.map(c => `<span class="badge">${escapeHtml(c)}</span>`).join("")}
          </div>
        </div>
      ` : ""}
      
      <!-- Formatos de datos -->
      ${formats.length > 0 ? `
        <div class="card-section">
          <strong>📄 Formatos:</strong>
          <div class="badge-container">
            ${formats.map(f => `<span class="badge format-badge">${escapeHtml(f)}</span>`).join("")}
          </div>
        </div>
      ` : ""}
      
      <!-- Pie de tarjeta: enlace al portal y coordenadas -->
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
    'canarias': '✨ Canarias'
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

// ==================== INICIALIZACIÓN ====================

/**
 * Inicializa la aplicación
 * Configura los event listeners y carga los datos
 */
function init() {
  setupEventListeners();
  loadData();
}

/**
 * Evento que espera a que el DOM esté completamente cargado
 * antes de inicializar la aplicación
 */
document.addEventListener('DOMContentLoaded', init);