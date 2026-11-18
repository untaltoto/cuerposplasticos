async function cargarObras() {
  const grilla = document.getElementById("miradas");

  try {
    // Llama a tu propia función serverless en lugar de a Airtable directamente
    const respuesta = await fetch('/api/obras');
    if (!respuesta.ok) throw new Error("No se pudieron cargar las obras.");
    
    const data = await respuesta.json();
    const registros = data.records;

    if (!registros || registros.length === 0) {
      grilla.textContent = "No hay obras registradas.";
      return;
    }

    registros.forEach(registro => {
      const campos = registro.fields;
      if (!campos.Foto) return;

      const tarjeta = document.createElement("div");
      tarjeta.className = "tarjeta";

      const img = document.createElement("img");
      img.src = campos.Foto[0].url;
      img.alt = campos.Autor || "Obra";

      const autor = document.createElement("p");
      autor.textContent = campos.Autor || "Autor anónimo";

      const fecha = document.createElement("p");
      if (campos["Fecha/Hora"]) {
        fecha.textContent = new Date(campos["Fecha/Hora"]).toLocaleString("es-CL");
      }

      tarjeta.append(img, autor, fecha);
      grilla.appendChild(tarjeta);
    });

  } catch (error) {
    grilla.textContent = "Error al cargar las obras.";
    console.error(error);
  }
}

cargarObras();