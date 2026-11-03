import { getStore } from "@netlify/blobs";

export const config = { path: "/api/cartas" };

const clave = (n) => n.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "sin-nombre";
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });
const num = (v, max) => { v = parseInt(v, 10); return v >= 0 && v <= max ? v : 0; };

export default async (req) => {
  const store = getStore("cartas");
  if (req.method === "GET") {
    const { blobs } = await store.list();
    const cartas = (await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })))).filter(Boolean);
    cartas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return json(cartas);
  }
  if (req.method === "POST") {
    let b;
    try { b = await req.json(); } catch { return json({ error: "Datos inválidos" }, 400); }
    const nombre = String(b.nombre || "").trim().slice(0, 40);
    const deseo = String(b.deseo || "").trim().slice(0, 400);
    if (!nombre || !deseo) return json({ error: "Falta nombre o deseo" }, 400);
    await store.setJSON(clave(nombre), {
      nombre, deseo,
      pista: String(b.pista || "").trim().slice(0, 150),
      color: num(b.color, 5),
      papel: num(b.papel, 3),
      fuente: num(b.fuente, 2),
      sello: String(b.sello || "🎁").slice(0, 8),
      fecha: new Date().toISOString(),
    });
    return json({ ok: true });
  }
  return json({ error: "Método no permitido" }, 405);
};
