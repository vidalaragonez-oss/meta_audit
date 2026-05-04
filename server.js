// ─────────────────────────────────────────────────────────────────
// TS · Meta Audit — Proxy Server (Anthropic)
// node server.js → abre http://localhost:3000
// ─────────────────────────────────────────────────────────────────
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const ANTHROPIC_KEY = "SUA_CHAVE_ANTHROPIC_AQUI"; // 👈 console.anthropic.com → API Keys

const server = http.createServer(async (req, res) => {

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  // ── Proxy para Anthropic ──────────────────────────────────────
  if (req.method === "POST" && req.url === "/api/claude") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        payload.model = "claude-sonnet-4-20250514";
        payload.max_tokens = payload.max_tokens || 2048;

        const upstream = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(payload),
        });

        const data = await upstream.json();

        console.log("── Anthropic response status:", upstream.status, "────────");
        if (data.error) console.error("Erro:", JSON.stringify(data.error));

        res.writeHead(upstream.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      } catch (e) {
        console.error("Proxy error:", e.message);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: e.message } }));
      }
    });
    return;
  }

  // ── Serve meta-audit.html ─────────────────────────────────────
  if (req.method === "GET" && (req.url === "/" || req.url === "/meta-audit.html")) {
    const file = path.join(__dirname, "meta-audit.html");
    if (!fs.existsSync(file)) {
      res.writeHead(404); res.end("meta-audit.html não encontrado na mesma pasta.");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(file));
    return;
  }

  res.writeHead(404); res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`\n✅  Servidor rodando em http://localhost:${PORT}`);
  console.log(`   Abra essa URL no navegador para usar o Meta Audit.\n`);
});