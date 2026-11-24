export default async function handler(req, res) {
  const TOKEN = process.env.AIRTABLE_TOKEN;
  const BASE_ID = process.env.AIRTABLE_BASE_ID;
  const TABLA = "Fotos";

  if (!TOKEN || !BASE_ID) {
    return res.status(500).json({ error: "Faltan configurar las variables de entorno en Vercel." });
  }

  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLA)}`;

  try {
    // 1. SI ES UNA PETICIÓN DE LECTURA (GET)
    if (req.method === 'GET') {
      const parametros = new URLSearchParams({
        filterByFormula: '{Estado} = "Aprobado"'
      });
      const respuesta = await fetch(`${url}?${parametros.toString()}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
      });

      if (!respuesta.ok) {
        const errorText = await respuesta.text();
        return res.status(respuesta.status).json({ error: errorText });
      }

      const data = await respuesta.json();
      return res.status(200).json(data);
    }

    // 2. SI ES UNA PETICIÓN DE ESCRITURA (POST)
    if (req.method === 'POST') {
      const datosParaAirtable = { fields: req.body };

      const respuesta = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosParaAirtable)
      });

      if (!respuesta.ok) {
        const errorText = await respuesta.text();
        return res.status(respuesta.status).json({ error: errorText });
      }

      const data = await respuesta.json();
      return res.status(200).json(data);
    }

    // Si usan otro método que no permitimos
    return res.status(405).json({ error: 'Método no permitido.' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}