// api/data.js — Lee los datos guardados en Vercel Blob (store privado)
import { list } from "@vercel/blob";
 
export default async function handler(req, res) {
  const terminal = req.query.terminal;
  if (!["callao", "t4"].includes(terminal))
    return res.status(400).json({ error: "Terminal inválido" });
 
  async function loadJson(type) {
    try {
      // Listar blobs con el prefijo exacto para obtener la URL con token de acceso
      const { blobs } = await list({
        prefix: `gpg/${terminal}/${type}.json`,
        token:  process.env.BLOB_READ_WRITE_TOKEN,
      });
      if (!blobs.length) return null;
      const r = await fetch(blobs[0].downloadUrl || blobs[0].url);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }
 
  const [gpglist, polines, coa, meta] = await Promise.all([
    loadJson("gpglist"),
    loadJson("polines"),
    loadJson("coa"),
    loadJson("meta"),
  ]);
 
  res.json({ terminal, gpglist, polines, coa, updatedAt: meta?.updatedAt || null });
}
