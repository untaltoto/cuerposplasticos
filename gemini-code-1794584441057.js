// CONFIGURACIÓN DE TU AIRTABLE
const AIRTABLE_BASE_ID = 'TU_BASE_ID'; // Lo encuentras en airtable.com/api
const AIRTABLE_TABLE_NAME = 'Fotografias'; // Nombre de tu tabla
const AIRTABLE_API_KEY = 'TU_PAT_TOKEN'; // Tu Personal Access Token de Airtable

const gridContainer = document.getElementById('grid-container');

async function fetchArchivePhotos() {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`
      }
    });

    const data = await response.json();

    // Limpia la grilla antes de cargar
    gridContainer.innerHTML = '';

    // Recorre los registros devueltos por Airtable
    data.records.forEach(record => {
      const photos = record.fields.Fotografia; // Nombre exacto del campo en Airtable
      if (photos && photos.length > 0) {
        photos.forEach(photo => {
          const imgElement = document.createElement('img');
          imgElement.src = photo.url;
          imgElement.alt = "Registro Cuerpos Plásticos";
          imgElement.className = "grid-item";
          gridContainer.appendChild(imgElement);
        });
      }
    });
  } catch (error) {
    console.error("Error al recuperar el archivo de Airtable:", error);
  }
}

// Carga las fotos inmediatamente al entrar a la página
fetchArchivePhotos();