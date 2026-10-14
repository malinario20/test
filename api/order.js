// Приём заявок с сайта → Telegram. Работает на Vercel автоматически (папка api/).
// Токен бота: переменная окружения BOT_TOKEN (Vercel → Settings → Environment Variables). Чат: из заявки (задаётся в админке), а если там пусто, из переменной CHAT_ID.
const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const clip = (s, n) => String(s == null ? "" : s).trim().slice(0, n);
const dm = (s) => String(s).split("-").reverse().slice(0, 2).join(".");
const rub = (n) => Math.round(+n || 0).toLocaleString("ru-RU");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const d = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  if (d.website) return res.status(200).json({ ok: true }); // поле-ловушка для спам-ботов
  const name = clip(d.name, 80), phone = clip(d.phone, 30), note = clip(d.note, 500);
  if (!name || phone.replace(/\D/g, "").length < 10 || (d.type !== "order" && d.type !== "callback")) return res.status(400).json({ ok: false });
  const fromSite = String(d.chatId || "").split(",").map((x) => x.trim()).filter((x) => /^(-?\d{4,20}|@\w{5,32})$/.test(x)).slice(0, 5);
  const chats = fromSite.length ? fromSite : String(process.env.CHAT_ID || "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!process.env.BOT_TOKEN || !chats.length) return res.status(500).json({ ok: false, error: "Не задан токен бота или чат" });
  const L = [d.type === "callback" ? "📞 <b>Просьба перезвонить</b>" : "🚜 <b>Новая заявка на аренду</b>"];
  if (d.type === "order") L.push("Техника: <b>" + esc(clip(d.item, 120)) + "</b>", "Даты: " + dm(clip(d.from, 10)) + " – " + dm(clip(d.to, 10)) + " (" + (+d.days || 0) + " сут.)", "Ориентир: от " + rub(d.estimateFrom) + " до " + rub(d.estimateTo) + " " + esc(clip(d.currency, 4)));
  L.push("Имя: " + esc(name), "Телефон: " + esc(phone));
  if (note) L.push((d.type === "order" ? "Комментарий: " : "Задача: ") + esc(note));
  const rs = await Promise.all(chats.map((chat_id) => fetch("https://api.telegram.org/bot" + process.env.BOT_TOKEN + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id, text: L.join("\n"), parse_mode: "HTML", disable_web_page_preview: true }) }).then((r) => r.json()).catch(() => ({ ok: false }))));
  return rs.some((r) => r.ok) ? res.status(200).json({ ok: true }) : res.status(502).json({ ok: false });
};
