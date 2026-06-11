/**
 * Datos Abiertos Canarias
 * Main application — entity search and visualization
 * Version: 3.3
 */

let data = [];
let typeChart = null;


/**
 * Computes the open data maturity level for a normalized entity.
 *
 * Rules of thumb:
 * - high: machine-readable, API available, strong portal technology, and enough datasets
 * - low: non machine-readable or clearly limited transparency-style publication
 * - medium: everything in between
 *
 * @param {Object} e
 * @returns {'low'|'medium'|'high'}
 */
function computeMaturity(e) {
  const hasMachineReadable = e.machine_readable === true;
  const hasApi = e.has_api === true || (Array.isArray(e.apis) && e.apis.length > 0);
  const count = typeof e.dataset_count === 'number' ? e.dataset_count : null;
  const tech = Array.isArray(e.portal_tech)
    ? e.portal_tech.join(' ').toUpperCase()
    : String(e.portal_tech || '').toUpperCase();

  const isStrongTech =
    tech.includes('CKAN') ||
    tech.includes('ARCGIS') ||
    tech.includes('EDATOS') ||
    tech.includes('IDE') ||
    tech.includes('PORTAL GEO');

  const isTransparencyOnly =
    tech.includes('TRANSPARENCIA') ||
    tech.includes('PORTAL ESTÁTICO') ||
    tech.includes('SEDE ELECTRÓNICA');

  if (hasMachineReadable && hasApi && isStrongTech && count !== null && count >= 50) {
    return 'high';
  }

  if (!hasMachineReadable) {
    return 'low';
  }

  if (isTransparencyOnly && !hasApi && (count === null || count < 20)) {
    return 'low';
  }

  return 'medium';
}


/**
 * For entities with entity_kind === 'organismo', derives a more specific subtype
 * based on the entity name and portal technology:
 *
 * - organismo_especializado_geoespacial
 * - organismo_especializado_nacional
 * - organismo_especializado
 *
 * This is useful for improving filters, icons, labels and card presentation
 * without changing the original source data.
 *
 * @param {Object} e
 * @returns {string}
 */
function deriveOrganismoSubtype(e) {
  const kind = e.entity_kind || e.type || 'organismo';
  if (kind !== 'organismo') return kind;

  const name = (e.name || '').toLowerCase();
  const techs = (e.portals || []).flatMap(p => (p.technology || []).map(t => t.toLowerCase()));
  const techStr = techs.join(' ');

  const geoKeywords = ['ogc', 'wms', 'wfs', 'geoespacial', 'openstreetmap', 'grafcan', 'sitcan', 'gis', 'cartografía', 'cartogr'];
  if (geoKeywords.some(k => techStr.includes(k) || name.includes(k))) {
    return 'organismo_especializado_geoespacial';
  }

  const nationalKeywords = [
    'ministerio', 'sepe', 'aena', 'policía nacional', 'policia nacional',
    'european data portal', 'data.europa', 'agencia estatal', 'nacional', 'estatal'
  ];
  if (nationalKeywords.some(k => name.includes(k))) {
    return 'organismo_especializado_nacional';
  }

  return 'organismo_especializado';
}


/**
 * Normalizes a raw entity object from the API into the internal format
 * expected by filters, rendering and UI helpers.
 *
 * Main responsibilities:
 * - choose the most relevant portal
 * - derive machine-readability even when not explicitly declared
 * - normalize dataset count
 * - extract APIs, formats, categories and coordinates
 * - compute maturity at the end
 *
 * @param {Object} e
 * @returns {Object|null}
 */
function normalize(e) {
  if (!e || typeof e !== 'object') return null;

  // Prefer the open data portal; if not present, fallback to the first portal
  const portal = e.portals?.find(p => p.kind === 'open_data') || e.portals?.[0] || null;

  // Pick the first location with valid coordinates for map usage
  const hq = e.locations?.find(
    l => l.coordinates?.lat != null && l.coordinates?.lon != null
  ) || null;

  // Normalize APIs to a guaranteed array
  const apis = portal?.apis && Array.isArray(portal.apis) ? portal.apis : [];

  // Formats can come from several places depending on the source entity
  const formats = portal?.formats || e.formats || e.data?.formats || [];
  const machineReadableFormats = ['CSV', 'JSON', 'GEOJSON', 'XML', 'XLSX', 'ODS'];

  const hasMachineReadableFormat = formats.some(f => {
    const value = String(f || '').trim().toUpperCase();
    return machineReadableFormats.includes(value);
  });

  // Machine-readable se decide SOLO por formatos (ignora lo que venga del JSON)
  const machine_readable = hasMachineReadableFormat;

  // Normalize dataset count to number|null
  const rawCount = portal?.dataset_count ?? e.dataset_count ?? e.data?.count ?? null;
  const parsedCount = rawCount !== null ? Number(rawCount) : null;
  const datasetCount = parsedCount !== null && !isNaN(parsedCount) ? parsedCount : null;

  const normalized = {
    id: e.id || '',
    name: e.name || 'Sin nombre',
    type: deriveOrganismoSubtype(e),
    scope: e.scope || null,
    islands: e.islands || [],
    description: e.description || '',
    portal_url: portal?.url || e.portal_url || e.portal?.url || '#',
    portal_kind: portal?.kind || null,
    portal_tech: portal?.technology || [],
    machine_readable,
    has_api: apis.length > 0 || (portal?.has_api ?? false),
    dataset_count: datasetCount,
    data_categories: portal?.topics || e.data_categories || e.data?.categories || [],
    formats,
    license_summary: portal?.license_summary || null,
    licenses: Array.isArray(portal?.licenses) ? portal.licenses : [],
    apis,
    coordinates: hq
      ? { lat: hq.coordinates.lat, lon: hq.coordinates.lon }
      : (e.coordinates || e.geographic?.coordinates || null),
    verification_status: e.verification?.status || 'pending',
    parent_entity_id: e.parent_entity_id || null,
  };

  // Compute maturity only after every dependent field is normalized
  normalized.maturity = computeMaturity(normalized);

  return normalized;
}


/* =========================================================
   UI state
   ========================================================= */

function showLoading() {
  const container = document.getElementById("results");
  if (!container) return;

  container.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Cargando datos de portales oficiales...</p>
    </div>
  `;
  updateStatsText('Cargando...');
}


/**
 * Renders a user-friendly error block in the results container.
 *
 * @param {string} message
 */
function showError(message) {
  const container = document.getElementById("results");
  if (!container) return;

  container.innerHTML = `
    <div class="error-message">
      <span class="error-icon">⚠️</span>
      <h3>Error al cargar los datos</h3>
      <p>${escapeHtml(message)}</p>
      <button onclick="location.reload()" class="retry-btn">⟳ Reintentar</button>
      <details style="margin-top: 1rem;">
        <summary style="cursor: pointer; color: #666;">💡 Soluciones posibles</summary>
        <ul style="text-align: left; margin-top: 0.5rem;">
          <li>Verifica que el endpoint <code>/api/entidades</code> esté disponible</li>
          <li>Revisa la consola del navegador para más detalles</li>
          <li>Asegúrate de que el servidor esté en ejecución</li>
        </ul>
      </details>
    </div>
  `;
  updateStatsText('Error de carga');
}


/**
 * Updates the compact status text shown above the result grid.
 *
 * @param {string} text
 */
function updateStatsText(text) {
  const statsSpan = document.getElementById("resultsCount");
  if (statsSpan) statsSpan.textContent = text;
}


/**
 * Synchronizes filter UI state after each render.
 *
 * @param {number} filteredCount
 * @param {number} totalCount
 * @param {boolean} hasActiveFilters
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


/* =========================================================
   Data loading
   ========================================================= */

function loadData() {
  showLoading();

  fetch('/api/entidades')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      return r.json();
    })
    .then(json => {
      data = json.flat(Infinity).map(normalize).filter(Boolean);
      filter();
    })
    .catch(error => {
      console.error('Error:', error);
      showError('No se pudo cargar la API /api/entidades. Verifica que el servidor esté en ejecución.');
    });
}


/* =========================================================
   Events and filtering
   ========================================================= */

function setupEventListeners() {
  document.getElementById("searchText")?.addEventListener("input", filter);
  document.getElementById("filterType")?.addEventListener("change", filter);
  document.getElementById("filterIsland")?.addEventListener("change", filter);
  document.getElementById("filterMaturity")?.addEventListener("change", filter);

  const resetBtn = document.getElementById("resetFilters");
  if (resetBtn) resetBtn.addEventListener("click", resetFilters);

  initLayoutToggle();
  initUpdateButton();
}


/**
 * Clears all filters and restores the default full result set.
 */
function resetFilters() {
  const searchText = document.getElementById("searchText");
  const filterType = document.getElementById("filterType");
  const filterIsland = document.getElementById("filterIsland");
  const filterMaturity = document.getElementById("filterMaturity");

  if (searchText) searchText.value = '';
  if (filterType) filterType.value = '';
  if (filterIsland) filterIsland.value = '';
  if (filterMaturity) filterMaturity.value = '';

  filter();
  searchText?.focus();
}


/**
 * Applies text, type, island and maturity filters to the normalized dataset,
 * sorts the result by dataset count and re-renders the cards.
 */
function filter() {
  const text = document.getElementById("searchText")?.value.toLowerCase() || '';
  const type = document.getElementById("filterType")?.value || '';
  const island = document.getElementById("filterIsland")?.value || '';
  const maturity = document.getElementById("filterMaturity")?.value || '';

  const filtered = data.filter(e => {
    const matchText =
      e.name.toLowerCase().includes(text) ||
      e.description.toLowerCase().includes(text) ||
      e.data_categories.join(" ").toLowerCase().includes(text);

    const matchType = !type || e.type === type;
    const matchIsland = !island || e.islands.includes(island) || e.islands.includes("Todas");
    const matchMaturity = !maturity || e.maturity === maturity;

    return matchText && matchType && matchIsland && matchMaturity;
  });

  // Show richer portals first
  filtered.sort((a, b) => {
    const aCount = typeof a.dataset_count === 'number' ? a.dataset_count : 0;
    const bCount = typeof b.dataset_count === 'number' ? b.dataset_count : 0;
    return bCount - aCount;
  });

  render(filtered);

  const hasActiveFilters = text !== '' || type !== '' || island !== '' || maturity !== '';
  updateUI(filtered.length, data.length, hasActiveFilters);
}


/* =========================================================
   Rendering
   ========================================================= */

/**
 * Returns a safe URL for href usage.
 * Non-http(s) protocols and malformed URLs fallback to '#'.
 *
 * @param {string} url
 * @returns {string}
 */
function safeUrl(url) {
  if (!url) return '#';
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol) ? url : '#';
  } catch {
    return '#';
  }
}


const OPEN_LICENSE_KEYWORDS = [
  'cc by', 'cc-by', 'creative commons', 'open data commons', 'odc',
  'odbl', 'pddl', 'mit', 'apache', 'open government', 'iodl',
  'opendatacommons'
];


/**
 * Heuristic detection of whether a license string looks open.
 *
 * @param {string} name
 * @returns {boolean}
 */
function isOpenLicense(name) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return OPEN_LICENSE_KEYWORDS.some(kw => lower.includes(kw));
}


/**
 * Returns the most representative license, prioritizing the one with the
 * highest dataset count when that information is available.
 *
 * @param {Array} licenses
 * @returns {Object|null}
 */
function getPrimaryLicense(licenses) {
  if (!Array.isArray(licenses) || licenses.length === 0) return null;

  return licenses.reduce((best, current) => {
    const bestCount = typeof best.count === 'number' ? best.count : 0;
    const currentCount = typeof current.count === 'number' ? current.count : 0;
    return currentCount > bestCount ? current : best;
  });
}


/**
 * Builds a secondary human-readable summary when the API does not provide
 * a direct license_summary field.
 *
 * Examples:
 * - "1.245 datasets bajo CC BY 4.0"
 * - "120 con CC BY 4.0; 34 con ODbL"
 *
 * @param {string|null} licenseSummary
 * @param {Array} licenses
 * @returns {string|null}
 */
function buildLicenseSummaryText(licenseSummary, licenses) {
  if (licenseSummary) return licenseSummary;

  if (!Array.isArray(licenses) || licenses.length === 0) return null;

  const sorted = [...licenses]
    .filter(l => l.name)
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 2);

  if (sorted.length === 0) return null;

  if (sorted.length === 1) {
    const l = sorted[0];
    return l.count ? `${l.count.toLocaleString('es-ES')} datasets bajo ${l.name}` : l.name;
  }

  return sorted
    .map(l => l.count ? `${l.count.toLocaleString('es-ES')} con ${l.name}` : l.name)
    .join('; ');
}

/**
 * Renders the license block HTML for the card.
 *
 * Compact view:
 * - shows "⚖️ Licencia"
 * - renders license info as badges
 *
 * Detailed view:
 * - shows "📜 Licencias y reutilización"
 * - renders the richer explanatory block
 *
 * @param {Object} e
 * @returns {string}
 */
function renderLicenseBlock(e) {
  const licenses = Array.isArray(e.licenses) ? e.licenses : [];
  const primary = getPrimaryLicense(licenses);
  const licenseSummary = buildLicenseSummaryText(e.license_summary, licenses);

  const primaryLicense = primary?.name || null;
  const showPrimaryLicense = primaryLicense && primaryLicense !== licenseSummary;

  if (!licenseSummary && !primaryLicense) {
    return `
      <div class="card-section card-licenses detail-only">
        <strong>📜 Licencias y reutilización</strong>
        <p class="license-unavailable">Información de licencias no disponible</p>
      </div>
    `;
  }

  const isOpen = primary ? isOpenLicense(primary.name) : false;
  const badgeClass = isOpen ? 'license-badge license-open' : 'license-badge license-restricted';
  const badgeLabel = isOpen ? '✅ Abierta' : '⚠️ Aviso legal';
  const badgeTitle = isOpen
    ? 'Licencia reconocida como abierta (CC BY, ODbL o similar)'
    : 'Aviso legal interno o licencia no estándar';

  return `
    <div class="card-section compact-only">
      <div class="categories-header">
        <strong>⚖️ Licencia</strong>
      </div>
      <div class="badge-container">
        ${licenseSummary ? `<span class="badge">${escapeHtml(licenseSummary)}</span>` : ''}
        ${showPrimaryLicense ? `<span class="badge">${escapeHtml(primaryLicense)}</span>` : ''}
      </div>
    </div>

    <div class="card-section card-licenses detail-only">
      <strong>📜 Licencias y reutilización</strong>
      ${primary ? `
        <div class="license-primary">
          <span class="license-name">${escapeHtml(primary.name)}</span>
          <span class="${badgeClass}" title="${badgeTitle}">${badgeLabel}</span>
        </div>
      ` : ''}
      ${licenseSummary && licenseSummary !== primaryLicense ? `
        <p class="license-summary-text">${escapeHtml(licenseSummary)}</p>
      ` : ''}
    </div>
  `;
}


/**
 * Renders entity cards into the results container.
 *
 * Each card includes:
 * - title and island tag
 * - subtype and scope
 * - machine-readable / API / verification / maturity badges
 * - description with collapsible behaviour
 * - dataset count
 * - categories and formats
 * - APIs and license block in detailed layout
 * - portal link and optional map button
 *
 * @param {Array} list
 */
function render(list) {
  const container = document.getElementById("results");
  if (!container) return;

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
    const allFormats = e.formats || [];
    const coords = e.coordinates;
    const hasCoords = coords && coords.lat != null && coords.lon != null;
    const typeIcon = getTypeIcon(e.type);
    const cardId = 'card-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));
    const apis = e.apis || [];

    // Some APIs may expose the docs URL under different property names
    const apiDocUrl = api =>
      safeUrl(api.documentationUrl || api.documentationurl || api.url || '#');

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
        ${e.machine_readable === true ? `<span class="meta-badge meta-ok" title="Datos reutilizables en formato legible por máquina">✅ Machine-readable</span>` : ''}
        ${e.machine_readable === false ? `<span class="meta-badge meta-warn" title="Solo documentos PDF o HTML">📄 Solo docs</span>` : ''}
        ${e.has_api === true ? `<span class="meta-badge meta-ok" title="Dispone de API pública">🔌 API disponible</span>` : ''}
        ${e.verification_status === 'verified' ? `<span class="meta-badge meta-ok" title="Datos verificados">✔ Verificado</span>` : ''}
        ${e.verification_status === 'estimated' ? `<span class="meta-badge meta-neutral" title="Datos estimados">~ Estimado</span>` : ''}
        ${e.verification_status === 'pending' ? `<span class="meta-badge meta-warn" title="Pendiente de verificación">⏳ Pendiente</span>` : ''}
        ${e.maturity === 'high' ? `<span class="meta-badge maturity-high" title="Ecosistema de datos avanzado (formatos abiertos, APIs y buen volumen de datasets)">🟢 Madurez alta</span>` : ''}
        ${e.maturity === 'medium' ? `<span class="meta-badge maturity-medium" title="Ecosistema de datos intermedio (algunos formatos abiertos o APIs, pero con limitaciones)">🟠 Madurez media</span>` : ''}
        ${e.maturity === 'low' ? `<span class="meta-badge maturity-low" title="Ecosistema de datos básico (principalmente PDFs/HTML o sin APIs)">🔴 Madurez baja</span>` : ''}
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
            <span class="stat-value">${typeof e.dataset_count === 'number' ? e.dataset_count.toLocaleString('es-ES') : '—'}</span>
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

      ${apis.length > 0 ? `
        <div class="card-section card-apis detail-only">
          <div class="categories-header">
            <strong>🔌 APIs disponibles</strong>
          </div>
          <div class="badge-container">
            ${apis.map(api => `
              <a
                href="${apiDocUrl(api)}"
                target="_blank"
                rel="noopener noreferrer"
                class="badge api-badge"
                title="${escapeHtml(api.type || '')}"
              >
                ${escapeHtml(api.name)}${api.type ? ` (${escapeHtml(api.type)})` : ''}
              </a>
            `).join("")}
          </div>
        </div>
      ` : ""}

      ${renderLicenseBlock(e)}

      <div class="card-footer">
        <a href="${safeUrl(e.portal_url)}" target="_blank" rel="noopener noreferrer" class="portal-link">
          🔗 Acceder al portal <span class="arrow">→</span>
        </a>
        ${hasCoords ? `
          <button class="map-button" onclick="window.location.href='/mapa?lat=${coords.lat}&lon=${coords.lon}&name=${encodeURIComponent(e.name)}'">
            <span class="pin-icon">📍</span><span>Ver en mapa</span>
          </button>
        ` : ""}
      </div>
    `;

    container.appendChild(card);
  });
}


/* =========================================================
   Helper functions
   ========================================================= */

/**
 * Returns the emoji icon associated with the normalized entity type.
 *
 * @param {string} type
 * @returns {string}
 */
function getTypeIcon(type) {
  const icons = {
    'gobierno_autonomico': '🏢',
    'organismo_especializado': '📋',
    'organismo_especializado_nacional': '📃',
    'organismo_especializado_geoespacial': '🗺️',
    'cabildo': '🏝️',
    'ayuntamiento': '🏘️',
    'empresa_publica': '🏭',
  };
  return icons[type] || '📊';
}


/**
 * Converts the internal type code to a human-readable label.
 *
 * @param {string} type
 * @returns {string}
 */
function formatType(type) {
  const types = {
    'gobierno_autonomico': 'Gobierno Autonómico',
    'organismo_especializado': 'Organismo Especializado',
    'organismo_especializado_nacional': 'Organismo Especializado Nacional',
    'organismo_especializado_geoespacial': 'Organismo Geoespacial',
    'cabildo': 'Cabildo Insular',
    'ayuntamiento': 'Ayuntamiento',
    'empresa_publica': 'Empresa Pública',
  };
  return types[type] || type || 'Institución';
}


/**
 * Converts scope values to display labels.
 *
 * @param {string} scope
 * @returns {string}
 */
function formatScope(scope) {
  const scopes = {
    'autonomico': 'Autonómico',
    'insular': 'Insular',
    'municipal': 'Municipal',
    'estatal': 'Estatal',
    'europeo': 'Europeo',
  };
  return scopes[scope] || scope;
}


/**
 * Decides whether the scope badge adds useful information for the card.
 * For very obvious entity types, the scope is omitted to reduce noise.
 *
 * @param {string} type
 * @param {string} scope
 * @returns {boolean}
 */
function shouldShowScope(type, scope) {
  if (type === 'gobierno_autonomico') return false;
  if (type === 'cabildo') return false;
  if (type === 'ayuntamiento') return false;
  return !!scope;
}


/**
 * Returns the short island tag displayed in the card header.
 *
 * Rules:
 * - no islands => null
 * - Todas or more than 2 islands => "Canarias"
 * - otherwise => first island name
 *
 * @param {Object} item
 * @returns {string|null}
 */
function getIslandTag(item) {
  const islands = item.islands || [];
  if (islands.length === 0) return null;

  if (islands.includes("Todas") || islands.length > 2) {
    return 'Canarias';
  }

  const islandNames = {
    'Tenerife': 'Tenerife',
    'Gran Canaria': 'Gran Canaria',
    'Lanzarote': 'Lanzarote',
    'Fuerteventura': 'Fuerteventura',
    'La Palma': 'La Palma',
    'La Gomera': 'La Gomera',
    'El Hierro': 'El Hierro',
    'La Graciosa': 'La Graciosa',
  };

  return islandNames[islands[0]] || null;
}


/**
 * Escapes a string for safe insertion into innerHTML.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


/**
 * Escapes a string for safe insertion into HTML attributes.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}


/**
 * Truncates a string to a maximum length.
 *
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}


/* =========================================================
   Dark mode
   ========================================================= */

/**
 * Initializes the dark mode toggle and restores the persisted preference.
 */
function initDarkMode() {
  const toggleBtn = document.getElementById('darkModeToggle');
  if (!toggleBtn) return;

  const savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'enabled') {
    document.documentElement.setAttribute('data-theme', 'dark');
    toggleBtn.innerHTML = '☀️ Modo claro';
  }

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      toggleBtn.innerHTML = '🌙 Modo oscuro';
      localStorage.setItem('darkMode', 'disabled');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      toggleBtn.innerHTML = '☀️ Modo claro';
      localStorage.setItem('darkMode', 'enabled');
    }
  });
}


/* =========================================================
   Update button
   ========================================================= */

/**
 * Initializes the manual update button that triggers the backend refresh.
 *
 * UI flow:
 * - show output area
 * - disable button while request is running
 * - show stdout/stderr summary
 * - reload data if update succeeds
 */
function initUpdateButton() {
  const btn = document.getElementById("updateBtn");
  const output = document.getElementById("updateOutput");
  if (!btn || !output) return;

  btn.addEventListener("click", async () => {
    output.style.display = "block";
    output.textContent = "⏳ Ejecutando actualización de datos...\n";
    btn.disabled = true;

    try {
      const response = await fetch("/run-update", { method: "POST" });
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        output.textContent += "\n✅ Actualización completada\n\n";
        output.textContent += result.stdout || "";
        loadData();
      } else {
        output.textContent += "\n❌ Error en la actualización\n\n";
        output.textContent += result.stderr || result.error || "Error desconocido";
      }
    } catch (err) {
      output.textContent += "\n❌ Error de conexión\n";
      output.textContent += String(err);
    } finally {
      btn.disabled = false;
    }
  });
}


/* =========================================================
   Layout toggle
   ========================================================= */

/**
 * Toggles between compact and detailed card layout.
 */
function initLayoutToggle() {
  const toggleBtn = document.getElementById('layoutToggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isDetailed = document.body.classList.toggle('layout-detailed');
    toggleBtn.textContent = isDetailed ? 'Vista compacta' : 'Vista detallada';
  });
}


/* =========================================================
   Card toggles
   ========================================================= */

/**
 * Expands or collapses the hidden category badges of a card.
 *
 * @param {string} cardId
 */
function toggleCat(cardId) {
  const hiddenDiv = document.getElementById(cardId + '-hidden');
  const btn = document.querySelector(`#${cardId} .toggle-cat-btn`);
  if (!hiddenDiv) return;
  const isVisible = hiddenDiv.style.display === 'flex';
  hiddenDiv.style.display = isVisible ? 'none' : 'flex';
  if (btn) btn.classList.toggle('rotated');
}


/**
 * Expands or collapses the hidden format badges of a card.
 *
 * @param {string} cardId
 */
function toggleFormats(cardId) {
  const hiddenDiv = document.getElementById(cardId + '-formats-hidden');
  const btn = document.querySelector(`#${cardId}-formats .toggle-cat-btn`);
  if (!hiddenDiv) return;
  const isVisible = hiddenDiv.style.display === 'flex';
  hiddenDiv.style.display = isVisible ? 'none' : 'flex';
  if (btn) btn.classList.toggle('rotated');
}


/**
 * Expands or collapses the entity description block.
 *
 * @param {string} descId
 */
function toggleDescription(descId) {
  const descElement = document.getElementById(descId);
  if (!descElement) return;
  const btn = descElement.nextElementSibling;
  if (!btn) return;

  const isCollapsed = descElement.classList.contains('collapsed');
  if (isCollapsed) {
    descElement.classList.remove('collapsed');
    btn.innerHTML = '<span>Ver menos</span><span class="arrow-icon">▲</span>';
  } else {
    descElement.classList.add('collapsed');
    btn.innerHTML = '<span>Ver más</span><span class="arrow-icon">▼</span>';
  }
}


/* =========================================================
   Initialization
   ========================================================= */

/**
 * Bootstraps the application once the DOM is ready.
 */
function init() {
  setupEventListeners();
  loadData();
  initDarkMode();
}

document.addEventListener('DOMContentLoaded', init);