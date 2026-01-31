import express from "express";

const app = express();

// Porta usada pelo Render
const PORT = process.env.PORT || 3000;

// Uma chave simples pra não virar "proxy aberto" pra qualquer pessoa
// Você vai configurar isso no Render depois
const API_KEY = process.env.API_KEY || "";

// Função: valida a chave (opcional, mas recomendado)
function checkKey(req, res) {
  if (!API_KEY) return true; // se você não setar API_KEY no Render, não valida (não recomendo)
  const key = req.query.key;
  if (key !== API_KEY) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "ml-proxy running" });
});

// Endpoint: pega um item do Mercado Livre
app.get("/ml/items/:id", async (req, res) => {
  if (!checkKey(req, res)) return;

  const id = String(req.params.id || "").trim().toUpperCase();

  // valida formato básico
  if (!/^MLB\d+$/.test(id)) {
    return res.status(400).json({ error: "invalid item id (expected MLB123...)" });
  }

  const upstream = `https://api.mercadolibre.com/items/${encodeURIComponent(id)}`;

  try {
    const r = await fetch(upstream, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    const text = await r.text();

    // repassa status e body
    res.status(r.status);
    res.setHeader("content-type", "application/json; charset=utf-8");
    return res.send(text);

  } catch (e) {
    return res.status(500).json({ error: "proxy_failed", details: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`ml-proxy listening on ${PORT}`);
});
