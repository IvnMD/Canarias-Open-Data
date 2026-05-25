/**
 * Datos Abiertos Canarias
 * Main application — entity search and visualization
 * Version: 3.2
 */

let data = [];
let typeChart = null;

/**
 * Computes the open data maturity level for a normalized entity.
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
 * - organismo_especializado_geoespacial: uses geospatial tech (OGC, WMS, WFS,
 *   OpenStreetMap, GRAFCAN, SITCAN, GIS, cartografía)
 * - organismo_especializado_nacional: national or European bodies not specific
 *   to Canarias (ministerio, SEPE, AENA, policía nacional, european data portal…)
 * - organismo_especializado: all other regional Canarian organisms
 *
 * All other entity_kind values are returned unchanged.
 *
 * @param {Object} e - Raw entity object from the API response
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

  const nationalKeywords = ['ministerio', 'sepe', 'aena', 'policía nacional', 'policia nacional',
    'european data portal', 'data.europa', 'agencia estatal', 'nacional', 'estatal'];
  if (nationalKeywords.some(k => name.includes(k))) {
    return 'organismo_especializado_nacional';
  }

  return 'organismo_especializado';
}

/**
 * Normalizes a raw entity object from the API into the internal format.
 *
 * Supports the current schema: entity_kind, scope, portals[], locations[].
 * The open_data portal is preferred when multiple portals are present;
 * otherwise the first entry is used as a fallback.
 *
 * dataset_count is always stored as number|null — never a string — so
 * downstream comparisons and sort logic can rely on typeof checks safely.
 *
 * @param {Object} e - Raw entity object from the API response
 * @returns {Object|null} Normalized entity, or null if the input is invalid
 */
function normalize(e) {
  if (!e || typeof e !== 'object') return null;

  const portal = e.portals?.find(p => p.kind === 'open_data') || e.portals?.[0] || null;

  const hq = e.locations?.find(
    l => l.coordinates?.lat != null && l.coordinates?.lon != null
  ) || null;

  const apis = portal?.apis && Array.isArray(portal.apis) ? portal.apis : [];

  const formats = portal?.formats || e.formats || e.data?.formats || [];
  const machineReadableFormats = ['CSV', 'JSON', 'GEOJSON', 'XML', 'XLSX', 'ODS'];
  const hasMachineReadableFormat = formats.some(f =>
    machineReadableFormats.includes(String(f).toUpperCase())
  );

  const rawCount = portal?.dataset_count ?? e.dataset_count ?? e.data?.count ?? null;
  const parsedCount = rawCount !== null ? Number(rawCount) : null;
  const datasetCount = parsedCount !== null && !isNaN(parsedCount) ? parsedCount : null;

  const normalized = {
    id: e.id || '',
    name: e.name || 'Sin nombre',

    // Derive a specific subtype for 'organismo' entities based on name/tech
    type: deriveOrganismoSubtype(e),
    scope: e.scope || null,

    islands: e.islands || [],
    description: e.description || '',

    portal_url: portal?.url || e.portal_url || e.portal?.url || '#',
    portal_kind: portal?.kind || null,
    portal_tech: portal?.technology || [],

    machine_readable: portal?.machine_readable ?? hasMachineReadableFormat,

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

  normalized.maturity = computeMaturity(normalized);

  return normalized;
}

// UI state

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
 * @param {string} message
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
 * @param {string} text
 */
function updateStatsText(text) {
  const statsSpan = document.getElementById("resultsCount");
  if (statsSpan) statsSpan.textContent = text;
}

/**
 * Updates the results counter and the visibility of the reset button.
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

// Data loading

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

// Events and filtering

function setupEventListeners() {
  document.getElementById("searchText").addEventListener("input", filter);
  document.getElementById("filterType").addEventListener("change", filter);
  document.getElementById("filterIsland").addEventListener("change", filter);
  document.getElementById("filterMaturity").addEventListener("change", filter);

  const resetBtn = document.getElementById("resetFilters");
  if (resetBtn) resetBtn.addEventListener("click", resetFilters);

  initLayoutToggle();
}

function resetFilters() {
  document.getElementById("searchText").value = '';
  document.getElementById("filterType").value = '';
  document.getElementById("filterIsland").value = '';
  document.getElementById("filterMaturity").value = '';
  filter();
  document.getElementById("searchText").focus();
}

/**
 * Filters and re-renders the entity list based on the current values of the
 * search field and the type/island selects.
 *
 * Each entity's type is already a derived subtype (organismo_especializado,
 * organismo_especializado_nacional, organismo_especializado_geoespacial), so
 * the filter compares directly without any mapping.
 */
function filter() {
  const text = document.getElementById("searchText").value.toLowerCase();
  const type = document.getElementById("filterType").value;
  const island = document.getElementById("filterIsland").value;
  const maturity = document.getElementById("filterMaturity").value;

  const filtered = data.filter(e => {
    const matchText =
      e.name.toLowerCase().includes(text) ||
      e.description.toLowerCase().includes(text) ||
      e.data_categories.join(" ").toLowerCase().includes(text);

    // Types are already derived subtypes — compare directly
    const matchType = !type || e.type === type;

    const matchIsland = !island ||
      e.islands.includes(island) ||
      e.islands.includes("Todas");

    const matchMaturity = !maturity || e.maturity === maturity;

    return matchText && matchType && matchIsland && matchMaturity;
  });

  filtered.sort((a, b) => {
    const aCount = typeof a.dataset_count === 'number' ? a.dataset_count : 0;
    const bCount = typeof b.dataset_count === 'number' ? b.dataset_count : 0;
    return bCount - aCount;
  });

  render(filtered);

  const hasActiveFilters = text !== '' || type !== '' || island !== '' || maturity !== '';
  updateUI(filtered.length, data.length, hasActiveFilters);
}

// Rendering

/**
 * Validates a URL and returns it only if the protocol is http or https.
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

/**
 * Renders entity cards into the results container.
 *
 * @param {Array} list - Normalized and filtered entity list
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
    const allFormats = e.formats || [];
    const coords = e.coordinates;

    const hasCoords = coords && coords.lat != null && coords.lon != null;
    const typeIcon = getTypeIcon(e.type);
    const cardId = 'card-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10));
    const apis = e.apis || [];
    const licenses = Array.isArray(e.licenses) ? e.licenses : [];
    const primaryLicense = licenses[0]?.name || null;
    const licenseSummary = e.license_summary || null;

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
          <span class="stat-value">${e.dataset_count ?? '—'}</span>
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
      
    ${licenseSummary || primaryLicense ? `
       <div class="card-section">
       <div class="categories-header">
      <strong>⚖️ Licencia</strong>
       </div>
        <div class="badge-container">
         ${licenseSummary ? `<span class="badge">${escapeHtml(licenseSummary)}</span>` : ''}
         ${primaryLicense && primaryLicense !== licenseSummary ? `<span class="badge">${escapeHtml(primaryLicense)}</span>` : ''}
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

      <div class="card-footer">
        <a href="${safeUrl(e.portal_url)}" target="_blank" rel="noopener noreferrer" class="portal-link">
          🔗 Acceder al portal <span class="arrow">→</span>
        </a>
        ${hasCoords ? `
      <button class="map-button" onclick="window.location.href='/mapa?lat=${coords.lat}&lon=${coords.lon}&name=${encodeURIComponent(e.name)}'" >
        <span class="pin-icon">📍</span><span>Ver en mapa</span>
      </button>
      ` : ""}
            </div>
          `;

    container.appendChild(card);
  });
}

// Helper functions

/**
 * Returns a display icon for a given entity type.
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
 * Returns the Spanish display label for a given entity type.
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
 * Returns the Spanish display label for a given scope value.
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
 * Returns whether the scope badge should be shown for a given entity type.
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
 * Returns the island label for a card header.
 *
 * @param {Object} item - Normalized entity
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

function updateData() {
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("updateBtn");
    const output = document.getElementById("updateOutput");

    // Seguridad extra
    if (!btn) {
      console.error("❌ Botón updateBtn no encontrado en el DOM");
      return;
    }

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      output.textContent = "⏳ Ejecutando actualización...\n";

      try {
        const response = await fetch("/run-update", {
          method: "POST"
        });

        const data = await response.json();

        if (data.success) {
          output.textContent += "✅ Actualización completada\n\n";
          output.textContent += data.stdout;
        } else {
          output.textContent += "❌ Error\n\n";
          output.textContent += data.stderr || data.error;
        }

      } catch (err) {
        output.textContent += "❌ Error de conexión\n";
        output.textContent += err.toString();
      } finally {
        btn.disabled = false;
      }
    });
  });
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
 * Truncates a string to the given length, appending an ellipsis if needed.
 *
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
function truncate(str, length) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

// Dark mode

/**
 * Reads the persisted dark mode preference from localStorage and wires up
 * the toggle button. Operates on document.documentElement via data-theme
 * attribute instead of body.classList, which allows CSS variables to cascade
 * from :root and avoids FOUC when the preference is restored on load.
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
document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // Elementos del DOM
  // =========================
  const updateBtn = document.getElementById("updateBtn");
  const output = document.getElementById("updateOutput");
  const entidadesContainer = document.getElementById("entidades");

  // =========================
  // Seguridad básica
  // =========================
  if (!updateBtn) {
    console.error("❌ No se encontró el botón #updateBtn");
    return;
  }

  // =========================
  // Cargar entidades al iniciar
  // =========================
  cargarEntidades();

  // =========================
  // Evento botón actualizar
  // =========================
  updateBtn.addEventListener("click", async () => {
    updateBtn.disabled = true;
    output.textContent = "⏳ Ejecutando actualización de datos...\n";

    try {
      const response = await fetch("/run-update", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Error HTTP " + response.status);
      }

      const data = await response.json();

      if (data.success) {
        output.textContent += "✅ Actualización completada\n\n";
        output.textContent += data.stdout || "";

        // 🔄 Recargar datos tras la actualización
        await cargarEntidades();
      } else {
        output.textContent += "❌ Error en la actualización\n\n";
        output.textContent += data.stderr || data.error || "Error desconocido";
      }

    } catch (err) {
      output.textContent += "❌ Error de conexión\n";
      output.textContent += err.toString();
    } finally {
      updateBtn.disabled = false;
    }
  });

  // =========================
  // Función: cargar entidades
  // =========================
  async function cargarEntidades() {
    try {
      const response = await fetch("/api/entidades");

      if (!response.ok) {
        throw new Error("Error HTTP " + response.status);
      }

      const entidades = await response.json();
      renderEntidades(entidades);

    } catch (err) {
      console.error("❌ Error cargando entidades:", err);
    }
  }

  // =========================
  // Renderizar entidades
  // =========================
  function renderEntidades(entidades) {
    if (!entidadesContainer) return;

    entidadesContainer.innerHTML = "";

    entidades.forEach(entidad => {
      const div = document.createElement("div");
      div.className = "entidad";

      div.innerHTML = `
        <h3>${entidad.nombre}</h3>
        <p><strong>Última actualización:</strong> ${entidad.last_updated || "—"}</p>
        <p><strong>Tipo de API:</strong> ${entidad.api_type_detected || "—"}</p>
      `;

      entidadesContainer.appendChild(div);
    });
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("updateBtn");
  const output = document.getElementById("updateOutput");

  if (!btn || !output) return;

  btn.addEventListener("click", async () => {
    output.style.display = "none";
    output.textContent = "⏳ Actualizando datos...";
    output.style.display = "block";

    btn.disabled = true;

    try {
      const res = await fetch("/run-update");
      const data = await res.json();

      output.textContent = data.message || "✔ Proceso completado";
    } catch (err) {
      output.textContent = "❌ Error al ejecutar el script";
    } finally {
      btn.disabled = false;
    }
  });
});
// Layout toggle

/**
 * Wires up the compact/detailed layout toggle button.
 */
function initLayoutToggle() {
  const toggleBtn = document.getElementById('layoutToggle');
  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isDetailed = document.body.classList.toggle('layout-detailed');
    toggleBtn.textContent = isDetailed ? 'Vista compacta' : 'Vista detallada';
  });
}

// Card toggles

function toggleCat(cardId) {
  const hiddenDiv = document.getElementById(cardId + '-hidden');
  const btn = document.querySelector(`#${cardId} .toggle-cat-btn`);
  if (!hiddenDiv) return;
  const isVisible = hiddenDiv.style.display === 'flex';
  hiddenDiv.style.display = isVisible ? 'none' : 'flex';
  if (btn) btn.classList.toggle('rotated');
}

function toggleFormats(cardId) {
  const hiddenDiv = document.getElementById(cardId + '-formats-hidden');
  const btn = document.querySelector(`#${cardId}-formats .toggle-cat-btn`);
  if (!hiddenDiv) return;
  const isVisible = hiddenDiv.style.display === 'flex';
  hiddenDiv.style.display = isVisible ? 'none' : 'flex';
  if (btn) btn.classList.toggle('rotated');
}

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

// Initialization

function init() {
  setupEventListeners();
  loadData();
  initDarkMode();
}

document.addEventListener('DOMContentLoaded', init);
