let data = [];

// Carga el JSON de entidades desde la raíz del proyecto
fetch('../entidades.json')
  .then(r => r.json())
  .then(json => {
    data = json.flat();
    render(data);
  });

// Escucha cambios en los filtros de búsqueda
document.getElementById("searchText").addEventListener("input", filter);
document.getElementById("filterType").addEventListener("change", filter);
document.getElementById("filterIsland").addEventListener("change", filter);

// Filtra las entidades según texto, tipo e isla seleccionados
function filter() {
  const text = document.getElementById("searchText").value.toLowerCase();
  const type = document.getElementById("filterType").value;
  const island = document.getElementById("filterIsland").value;

  const filtered = data.filter(e => {

    // Comprueba si el texto coincide con nombre, descripción o categorías
    const matchText =
      (e.name || "").toLowerCase().includes(text) ||
      (e.description || "").toLowerCase().includes(text) ||
      (e.data_categories || []).join(" ").toLowerCase().includes(text);

    // Comprueba si el tipo seleccionado coincide (o si no hay filtro de tipo)
    const matchType = !type || e.type === type;

    // Comprueba si la isla seleccionada coincide, incluyendo entidades de ámbito regional
    const matchIsland =
      !island ||
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

    // Limita a 5 categorías y 5 formatos por tarjeta
    const categories = (e.data_categories || []).slice(0, 5);
    const formats = (e.formats || []).slice(0, 5);

    container.innerHTML += `
      <div class="card">
        <h3>${e.name}</h3>

        <p><strong>Tipo:</strong> ${e.type}</p>
        <p><strong>Portal:</strong> 
          <a href="${e.portal_url}" target="_blank">Abrir</a>
        </p>

        <p><strong>Dataset:</strong> ${e.dataset_count || "N/D"}</p>

        <p><strong>Categorías:</strong><br>
          ${categories.map(c => `<span class="badge">${c}</span>`).join("")}
        </p>

        <p><strong>Formatos:</strong><br>
          ${formats.map(f => `<span class="badge">${f}</span>`).join("")}
        </p>

        ${
          e.coordinates
            ? `<p>📍 ${e.coordinates.lat}, ${e.coordinates.lon}</p>`
            : ""
        }
      </div>
    `;
  });
}
