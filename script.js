const CAMPOS_DE_TITULO = [
  "Título",
  "Titulo",
  "Nombre",
  "Title",
  "Name",
  "Descripción",
  "Descripcion",
  "Description"
];

function obtenerImagenes(record) {
  const fields = record.fields || {};

  return Object.entries(fields).flatMap(([nombreCampo, valor]) => {
    if (!Array.isArray(valor)) return [];

    return valor
      .filter((adjunto) => adjunto && typeof adjunto.url === "string")
      .map((adjunto) => ({
        url: adjunto.url,
        alt: adjunto.filename || nombreCampo
      }));
  });
}

function obtenerTitulo(fields) {
  for (const campo of CAMPOS_DE_TITULO) {
    const valor = fields[campo];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
  }

  return "";
}

function obtenerTexto(valor) {
  if (typeof valor === "string" || typeof valor === "number") {
    return String(valor).trim();
  }

  if (Array.isArray(valor)) {
    return valor
      .filter((elemento) => typeof elemento === "string")
      .map((elemento) => elemento.trim())
      .filter(Boolean)
      .join(", ");
  }

  return "";
}

function formatearFechaHora(valor) {
  const texto = obtenerTexto(valor);
  if (!texto) return "";

  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? texto : fecha.toLocaleString("es-CL");
}

function agregarDato(tarjeta, etiqueta, valor) {
  const linea = document.createElement("p");
  linea.className = "metadato";
  linea.textContent = `${etiqueta}: ${valor}`;
  tarjeta.append(linea);
}

function mostrarMensaje(contenedor, mensaje, esError = false) {
  const elemento = document.createElement("p");
  elemento.textContent = mensaje;
  if (esError) elemento.setAttribute("role", "alert");
  contenedor.replaceChildren(elemento);
}

function mostrarObras(records, contenedor) {
  const tarjetas = records.flatMap((record) => {
    const fields = record.fields || {};
    const titulo = obtenerTitulo(fields);

    return obtenerImagenes(record).map((imagen) => {
      const tarjeta = document.createElement("article");
      tarjeta.className = "tarjeta";

      const elementoImagen = document.createElement("img");
      elementoImagen.src = imagen.url;
      elementoImagen.alt = titulo || imagen.alt;
      elementoImagen.loading = "lazy";
      tarjeta.append(elementoImagen);

      if (titulo) {
        const pie = document.createElement("p");
        pie.textContent = titulo;
        tarjeta.append(pie);
      }

      agregarDato(tarjeta, "Autor", obtenerTexto(fields.Autor) || "Sin autor");
      agregarDato(
        tarjeta,
        "Fecha/Hora",
        formatearFechaHora(fields["Fecha/Hora"]) || "Sin fecha/hora"
      );

      return tarjeta;
    });
  });

  if (tarjetas.length === 0) {
    mostrarMensaje(contenedor, "No se encontraron imágenes en los registros de Airtable.");
    return;
  }

  contenedor.replaceChildren(...tarjetas);
}

async function cargarObras() {
  const contenedor = document.getElementById("miradas");
  if (!contenedor) return;

  mostrarMensaje(contenedor, "Cargando imágenes...");

  try {
    const respuesta = await fetch("/api/obras");
    let data;

    try {
      data = await respuesta.json();
    } catch {
      throw new Error("La API no devolvió una respuesta JSON válida.");
    }

    if (!respuesta.ok) {
      const detalle = data && typeof data.error === "string" ? data.error : "";
      throw new Error(detalle || `Error al consultar Airtable (${respuesta.status}).`);
    }

    if (!Array.isArray(data.records)) {
      throw new Error("La respuesta de Airtable no contiene una lista de registros.");
    }

    mostrarObras(data.records, contenedor);
  } catch (error) {
    console.error("Error al cargar las imágenes:", error);
    mostrarMensaje(contenedor, `No se pudieron cargar las imágenes: ${error.message}`, true);
  }
}

cargarObras();
