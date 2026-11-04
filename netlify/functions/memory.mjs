// Cofre de memória do Alfred (Netlify Function + Netlify Blobs).
// Guarda o Second Brain, a conversa, os contatos e os lembretes na nuvem,
// para que o Alfred lembre de tudo em qualquer navegador ou aparelho.
// Cada cofre é identificado por um código derivado da chave do Claude (SHA-256),
// então só quem tem a mesma chave consegue ler ou gravar.
import { getStore } from "@netlify/blobs";

const MAX_BYTES = 5 * 1024 * 1024;

export default async (req) => {
  const id = req.headers.get("x-alfred-id") || "";
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response("id inválido", { status: 400 });

  const store = getStore("alfred-memory");

  if (req.method === "GET") {
    const data = await store.get(id, { type: "json" });
    return Response.json(data ?? null, { headers: { "cache-control": "no-store" } });
  }

  if (req.method === "PUT") {
    const body = await req.text();
    if (body.length > MAX_BYTES) return new Response("grande demais", { status: 413 });
    let data;
    try { data = JSON.parse(body); } catch { return new Response("json inválido", { status: 400 }); }
    if (!data || typeof data !== "object" || data.v !== 1) return new Response("formato inválido", { status: 400 });
    await store.setJSON(id, data);
    return Response.json({ ok: true, at: data.at ?? null });
  }

  return new Response("método não permitido", { status: 405 });
};

export const config = { path: "/api/memory" };
