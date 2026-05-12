let data = [];

// Normaliza ambos esquemas del JSON a un formato unificado
function normalize(e) {
  return {
    name:          e.name || "Sin nombre",
    type:          e.type || "N/D",
    portal_url:    e.portal_url || e.portal?.url || "#",
    dataset_count: e.dataset_count ?? e.data?.count ?? "N/D",
    data_categories: e.data_categories || e.data?.categories || [],
    formats:       e.formats || e.data?.formats || [],
    coordinates:   e.coordinates || e.geographic?.coordinates || null,
    island:        e.island  || null,
    islands:       e.islands || null,
    description:   e.description || "",
  };
}

// Carga el JSON de entidades desde la raíz del proyecto
fetch('../entidades.json')
  .then(r => r.json())
  .then(json => {
    data = json.flat(Infinity).map(normalize);
    render(data);
  });

// Escucha cambios en los filtros de búsqueda
document.getElementById("searchText").addEventListener("input", filter);
document.getElementById("filterType").addEventListener("change", filter);
document.getElementById("filterIsland").addEventListener("change", filter);

// Filtra las entidades según texto, tipo e isla seleccionados
function filter() {
  const text   = document.getElementById("searchText").value.toLowerCase();
  const type   = document.getElementById("filterType").value;
  const island = document.getElementById("filterIsland").value;

  const filtered = data.filter(e => {
    const matchText =
      e.name.toLowerCase().includes(text) ||
      e.description.toLowerCase().includes(text) ||
      e.data_categories.join(" ").toLowerCase().includes(text);

    const matchType   = !type   || e.type === type;
    const matchIsland = !island ||
      e.island?.includes(island) ||
      e.islands?.includes(island) ||
      e.island === "canarias";

    return matchText && matchType && matchIsland;
  });

  render(filtered);
}

// Genera y muestra las tarjetas de las entidades en el DOM
function render(list) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  list.forEach(e => {
    const categories = e.data_categories.slice(0, 5);
    const formats    = e.formats.slice(0, 5);
    const coords     = e.coordinates;
    const hasCoords  = coords && (coords.lat || coords.lon);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h3>${e.name}</h3>
      <p><strong>Tipo:</strong> ${e.type}</p>
      <p><strong>Portal:</strong> <a href="${e.portal_url}" target="_blank">Abrir</a></p>
      <p><strong>Datasets:</strong> ${e.dataset_count}</p>
      ${categories.length > 0 ? `
        <p><strong>Categorías:</strong><br>
          ${categories.map(c => `<span class="badge">${c}</span>`).join("")}
        </p>` : ""}
      ${formats.length > 0 ? `
        <p><strong>Formatos:</strong><br>
          ${formats.map(f => `<span class="badge">${f}</span>`).join("")}
        </p>` : ""}
      ${hasCoords ? `<p>📍 ${coords.lat}, ${coords.lon}</p>` : ""}
    `;

    container.appendChild(card);
  });
}
