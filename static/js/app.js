console.log("JS CARGADO");

let entidades = [];

// ===============================
// CARGAR DATOS DESDE FLASK API
// ===============================

fetch('/api/entidades')

  .then(response => {

    if (!response.ok) {
      throw new Error(`HTTP ERROR: ${response.status}`);
    }

    return response.json();
  })

  .then(data => {

    console.log("DATOS RECIBIDOS:", data);

    entidades = data;

    cargarFiltros(data);

    renderizar(data);

  })

  .catch(error => {
    console.error("ERROR CARGANDO JSON:", error);
  });


// ===============================
// FILTROS
// ===============================

const searchInput = document.getElementById("searchText");
const typeFilter = document.getElementById("filterType");
const islandFilter = document.getElementById("filterIsland");

if (searchInput) {
  searchInput.addEventListener("input", filtrar);
}

if (typeFilter) {
  typeFilter.addEventListener("change", filtrar);
}

if (islandFilter) {
  islandFilter.addEventListener("change", filtrar);
}


// ===============================
// CARGAR OPCIONES DE FILTROS
// ===============================

function cargarFiltros(data) {

  const tipos = [...new Set(data.map(e => e.type).filter(Boolean))];

  const islas = [...new Set(
    data.flatMap(e => e.islands || [])
  )];

  // TIPOS
  if (typeFilter) {

    tipos.forEach(tipo => {

      const option = document.createElement("option");

      option.value = tipo;
      option.textContent = tipo;

      typeFilter.appendChild(option);
    });
  }

  // ISLAS
  if (islandFilter) {

    islas.forEach(isla => {

      const option = document.createElement("option");

      option.value = isla;
      option.textContent = isla;

      islandFilter.appendChild(option);
    });
  }
}


// ===============================
// FILTRAR
// ===============================

function filtrar() {

  const texto = searchInput.value.toLowerCase();

  const tipo = typeFilter.value;

  const isla = islandFilter.value;

  const filtrados = entidades.filter(entidad => {

    const coincideTexto =

      entidad.name?.toLowerCase().includes(texto) ||

      entidad.description?.toLowerCase().includes(texto) ||

      entidad.data_categories?.join(" ")
        .toLowerCase()
        .includes(texto);

    const coincideTipo = !tipo || entidad.type === tipo;

    const coincideIsla =

      !isla ||

      entidad.islands?.includes(isla);

    return coincideTexto &&
           coincideTipo &&
           coincideIsla;
  });

  renderizar(filtrados);
}


// ===============================
// RENDERIZAR CARDS
// ===============================

function renderizar(lista) {

  const container = document.getElementById("results");

  if (!container) {
    console.error("NO EXISTE #results");
    return;
  }

  container.innerHTML = "";

  if (lista.length === 0) {

    container.innerHTML = `
      <p>No se encontraron resultados.</p>
    `;

    return;
  }

  lista.forEach(entidad => {

    const card = document.createElement("div");

    card.className = "card";

    const categorias = entidad.data_categories
      ?.slice(0, 5)
      .map(cat => `<span class="badge">${cat}</span>`)
      .join("");

    const formatos = entidad.formats
      ?.slice(0, 5)
      .map(f => `<span class="badge">${f}</span>`)
      .join("");

    card.innerHTML = `

      <h2>${entidad.name}</h2>

      <p>
        <strong>Tipo:</strong>
        ${entidad.type || "N/D"}
      </p>

      <p>
        ${entidad.description || ""}
      </p>

      <p>
        <strong>Datasets:</strong>
        ${entidad.dataset_count ?? "N/D"}
      </p>

      <p>
        <strong>Islas:</strong>
        ${(entidad.islands || []).join(", ")}
      </p>

      <p>
        <strong>Categorías:</strong><br>
        ${categorias || ""}
      </p>

      <p>
        <strong>Formatos:</strong><br>
        ${formatos || ""}
      </p>

      <a href="${entidad.portal_url}"
         target="_blank">
         Abrir portal
      </a>

    `;

    container.appendChild(card);
  });
}