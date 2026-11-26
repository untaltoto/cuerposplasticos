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

function ordenarRegistrosCronologicamente(records) {
  return records
    .map((record, indice) => {
      const fecha = new Date(obtenerTexto((record.fields || {})["Fecha/Hora"]));
      return {
        record,
        indice,
        tiempo: Number.isNaN(fecha.getTime()) ? null : fecha.getTime()
      };
    })
    .sort((a, b) => {
      if (a.tiempo === null) return b.tiempo === null ? a.indice - b.indice : 1;
      if (b.tiempo === null) return -1;
      return a.tiempo - b.tiempo || a.indice - b.indice;
    })
    .map(({ record }) => record);
}

function agregarDato(tarjeta, valor) {
  if (!valor) return;

  const linea = document.createElement("p");
  linea.className = "metadato";
  linea.textContent = valor;
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

      agregarDato(tarjeta, obtenerTexto(fields.Autor));
      agregarDato(tarjeta, formatearFechaHora(fields["Fecha/Hora"]));

      return tarjeta;
    });
  });

  if (tarjetas.length === 0) {
    mostrarMensaje(contenedor, "No se encontraron imágenes en los registros de Airtable.");
    return;
  }

  contenedor.replaceChildren(...tarjetas);
}

function ajustarTituloMovil() {
  const titulo = document.querySelector("header h1");
  if (!titulo) return;

  const subtitulo = document.querySelector("header h2 span");
  const palabras = Array.from(titulo.querySelectorAll("span"));
  if (palabras.length !== 2) return;

  if (!window.matchMedia("(max-width: 600px)").matches) {
    palabras.forEach((palabra) => {
      palabra.style.removeProperty("font-size");
      palabra.style.removeProperty("letter-spacing");
    });
    if (subtitulo) {
      subtitulo.style.removeProperty("font-size");
      subtitulo.style.removeProperty("transform");
    }
    return;
  }

  const ancho = titulo.getBoundingClientRect().width;
  if (!ancho) return;

  const medirTexto = (elemento) => {
    const rango = document.createRange();
    rango.selectNodeContents(elemento);
    return rango.getBoundingClientRect().width;
  };

  palabras.forEach((palabra) => {
    palabra.style.fontSize = "100px";
    palabra.style.letterSpacing = "0px";
  });

  const anchoBase = Math.max(...palabras.map(medirTexto));
  const tamano = (ancho / anchoBase) * 100;

  palabras.forEach((palabra, indice) => {
    palabra.style.fontSize = `${tamano}px`;
    if (indice === 0) return;

    const cantidadDeLetras = Array.from(palabra.textContent.trim()).length;
    const espacio = (ancho - medirTexto(palabra)) / cantidadDeLetras;
    palabra.style.letterSpacing = `${Math.max(0, espacio)}px`;
  });

  if (subtitulo) {
    subtitulo.style.transform = "none";
    const contexto = document.createElement("canvas").getContext("2d");
    if (!contexto) {
      subtitulo.style.fontSize = `${(ancho / medirTexto(subtitulo)) * 100}px`;
      return;
    }

    const palabra = palabras[1];
    contexto.font = getComputedStyle(palabra).font;
    const medidaPalabra = contexto.measureText(palabra.textContent.trim());
    const espacioLetra = parseFloat(getComputedStyle(palabra).letterSpacing) || 0;
    const letras = Array.from(palabra.textContent.trim()).length;
    const anchoTintaPalabra =
      medidaPalabra.actualBoundingBoxLeft +
      medidaPalabra.actualBoundingBoxRight +
      Math.max(0, letras - 1) * espacioLetra;
    const centroTintaPalabra =
      (medidaPalabra.actualBoundingBoxRight -
        medidaPalabra.actualBoundingBoxLeft -
        medidaPalabra.width) /
      2;

    if (
      !Number.isFinite(anchoTintaPalabra) ||
      anchoTintaPalabra <= 0 ||
      !Number.isFinite(centroTintaPalabra)
    ) {
      subtitulo.style.fontSize = `${(ancho / medirTexto(subtitulo)) * 100}px`;
      return;
    }

    subtitulo.style.fontSize = "100px";
    let tamano = 100;

    for (let intento = 0; intento < 4; intento++) {
      subtitulo.style.fontSize = `${tamano}px`;
      contexto.font = getComputedStyle(subtitulo).font;
      const medidaSubtitulo = contexto.measureText(subtitulo.textContent.trim());
      const anchoTintaSubtitulo =
        medidaSubtitulo.actualBoundingBoxLeft +
        medidaSubtitulo.actualBoundingBoxRight;

      if (!Number.isFinite(anchoTintaSubtitulo) || anchoTintaSubtitulo <= 0) {
        subtitulo.style.fontSize = `${(ancho / medirTexto(subtitulo)) * 100}px`;
        return;
      }

      tamano *= anchoTintaPalabra / anchoTintaSubtitulo;
    }

    subtitulo.style.fontSize = `${tamano}px`;
    contexto.font = getComputedStyle(subtitulo).font;
    const medidaFinal = contexto.measureText(subtitulo.textContent.trim());
    const centroTintaSubtitulo =
      (medidaFinal.actualBoundingBoxRight -
        medidaFinal.actualBoundingBoxLeft -
        medidaFinal.width) /
      2;

    subtitulo.style.transform = `translateX(${centroTintaPalabra - centroTintaSubtitulo}px)`;
  }
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

    mostrarObras(ordenarRegistrosCronologicamente(data.records), contenedor);
  } catch (error) {
    console.error("Error al cargar las imágenes:", error);
    mostrarMensaje(contenedor, `No se pudieron cargar las imágenes: ${error.message}`, true);
  }
}

ajustarTituloMovil();
window.addEventListener("resize", ajustarTituloMovil);
cargarObras();
