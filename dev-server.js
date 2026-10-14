// Локальный запуск без Vercel: node dev-server.js
// Отдаёт сайт и выполняет api/order.js. Переменные берутся из файла .env рядом (BOT_TOKEN=..., CHAT_ID=...).
// Нужен только Node.js 18+. На Vercel этот файл не используется.
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = __dirname;
try {
  fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/).forEach((l) => {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i.exec(l);
    if (m && !l.trim().startsWith("#")) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  });
} catch (e) { console.log("Файл .env не найден: создайте его по образцу .env.example"); }
const handler = require("./api/order.js");
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (u === "/api/order") {
    const a = []; req.on("data", (c) => a.push(c)); req.on("end", async () => {
      try { req.body = JSON.parse(Buffer.concat(a).toString() || "{}"); } catch { req.body = {}; }
      res.status = (c) => { res.statusCode = c; return res; };
      res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
      try { await handler(req, res); } catch (e) { console.log("Ошибка:", e.message); res.status(500).json({ ok: false }); }
    });
    return;
  }
  let p = path.join(ROOT, u === "/" ? "index.html" : u.endsWith("/") ? u + "index.html" : u);
  if (!p.startsWith(ROOT) || /(^|[\\/])(\.env|dev-server\.js)/.test(path.relative(ROOT, p)) ) { res.statusCode = 404; return res.end("Not found"); }
  fs.readFile(p, (e, buf) => {
    if (e) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", MIME[path.extname(p)] || "application/octet-stream"); res.end(buf);
  });
}).listen(process.env.PORT || 3000, () => console.log("Сайт: http://localhost:" + (process.env.PORT || 3000) + "   Админка: http://localhost:" + (process.env.PORT || 3000) + "/admin/"));
