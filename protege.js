export default async function handler(req, res) {
  // Estas variables se leen de forma segura desde los ajustes de Vercel
  const TOKEN = "pat4RLZUrB16cmvlQ.ae3f0a5a9c16b99c05344ea73be567615519c6820b1a4979ab8735814b6afa69";
  const BASE_ID = "appYafElG9tb42Uzj";
  const TABLA = "Fotos";

  try {
    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLA)}`;
    const respuesta = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (!respuesta.ok) {
      const errorText = await respuesta.text();
      return res.status(respuesta.status).json({ error: errorText });
    }

    const data = await respuesta.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}