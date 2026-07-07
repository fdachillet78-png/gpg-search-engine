// api/data.js — Lee los datos guardados en Vercel Blob
export default async function handler(req, res) {
  const terminal = req.query.terminal;
  if (!["callao", "t4"].includes(terminal))
    return res.status(400).json({ error: "Terminal inválido" });

  const BASE = process.env.BLOB_BASE_URL; // URL base del blob storage

  async function loadJson(type) {
    try {
      const r = await fetch(`${BASE}/gpg/${terminal}/${type}.json`);
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
