/* Логика сайта: берёт данные из data/config.json и рисует страницу, попап и календарь. */
(function () {
  "use strict";
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) {
    Array.prototype.slice.call(document.querySelectorAll("animateTransform")).forEach(function (n) { n.parentNode.removeChild(n); });
  }
  var ART = { ex: ["#ex", ""], mini: ["#ex", "translate(34,34) scale(.72)"], lo: ["#lo", ""], cr: ["#cr", ""], pu: ["#pu", ""], ge: ["#ge", ""] };
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var iso = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  var addDays = function (s, n) { var p = s.split("-"); return iso(new Date(+p[0], +p[1] - 1, +p[2] + n)); };
  var diff = function (a, b) { var x = a.split("-"), y = b.split("-"); return Math.round((Date.UTC(+y[0], +y[1] - 1, +y[2]) - Date.UTC(+x[0], +x[1] - 1, +x[2])) / 864e5); };
  var dm = function (s) { var p = s.split("-"); return p[2] + "." + p[1]; };
  var esc = function (x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var pl = function (n) { var m = n % 100, d = n % 10; return (m > 10 && m < 20) ? "суток" : d === 1 ? "сутки" : "суток"; };
  var TODAY = iso(new Date());
  var C = null, M = null, lastFocus = null;
  var rub = function (n) { return Math.round(n).toLocaleString(C.brand.locale) + " " + C.brand.currency; };
  var pct = function (days) { var p = 0; C.discounts.forEach(function (d) { if (days >= d.from && d.pct > p) p = d.pct; }); return p; };
  var delivMax = function () { return C.delivery.base + C.delivery.perKm * C.delivery.maxKm; };

  function ranges(it) {
    return (it.booked || []).map(function (b) {
      var a = typeof b[0] === "number" ? addDays(TODAY, b[0]) : b[0], e = typeof b[1] === "number" ? addDays(TODAY, b[1]) : b[1];
      return [a, e];
    });
  }
  function conflict(it, f, t) { return ranges(it).filter(function (r) { return f <= r[1] && t >= r[0]; })[0] || null; }
  function isBusy(it, s) { return ranges(it).some(function (r) { return s >= r[0] && s <= r[1]; }); }
  function nextFree(it, len) { var st = addDays(TODAY, 1), i; for (i = 0; i < 400; i++) { if (!conflict(it, st, addDays(st, len - 1))) return st; st = addDays(st, 1); } return st; }
  function firstFree(it) { var d = TODAY, i; for (i = 0; i < 400; i++) { if (!isBusy(it, d)) return d; d = addDays(d, 1); } return d; }
  function status(it) {
    var cur = ranges(it).filter(function (r) { return r[0] <= TODAY && TODAY <= r[1]; })[0];
    return cur ? { no: true, text: "Занята до " + dm(addDays(cur[1], 1)) } : { no: false, text: "В наличии" };
  }
  function artPic(it) {
    var a = ART[it.art] || ART.ex;
    return '<div class="pic"><svg viewBox="0 0 200 120" role="img" aria-label="' + esc(it.name) + '"><use href="' + a[0] + '"' + (a[1] ? ' transform="' + a[1] + '"' : "") + '/></svg><span class="chip">' + esc(it.chip) + "</span></div>";
  }
  function pic(it, i) {
    if (it.image) return '<div class="pic photo' + (it.fit === "cover" ? " cover" : "") + '" style="--src:url(\'' + esc(it.image).replace(/'/g, "%27") + '\')"><img data-item="' + i + '" src="' + esc(it.image) + '" alt="' + esc(it.name) + '" loading="lazy" decoding="async"><span class="chip">' + esc(it.chip) + "</span></div>";
    return artPic(it);
  }

  function render(cfg) {
    C = cfg;
    var b = C.brand;
    document.title = b.name + " — " + b.tagline;
    $("brandName").textContent = b.name;
    Array.prototype.forEach.call(document.querySelectorAll(".js-phone"), function (n) { n.textContent = b.phone; if (n.tagName === "A") n.href = "tel:" + String(b.phone).replace(/[^\d+]/g, ""); });
    var addr = (b.address || "").trim();
    Array.prototype.forEach.call(document.querySelectorAll(".js-addr"), function (n) { n.textContent = addr; });
    $("addrBar").hidden = !addr; $("baseBox").hidden = !addr;
    $("hours").textContent = b.hours;
    $("heroTitle").textContent = C.hero.title; $("heroText").textContent = C.hero.text;
    if (C.hero.image) {
      var sc = $("scene");
      if (sc && sc.tagName.toLowerCase() === "svg") {
        var ph = document.createElement("div"); ph.className = "pic photo scene-photo"; ph.id = "scene";
        ph.style.setProperty("--src", "url('" + C.hero.image.replace(/'/g, "%27") + "')");
        ph.innerHTML = '<img src="' + esc(C.hero.image) + '" alt="" decoding="async">';
        sc.parentNode.replaceChild(ph, sc);
      }
    }
    $("facts").innerHTML = C.facts.map(function (f) { return '<div class="fact"><b>' + esc(f.value) + "</b><span>" + esc(f.label) + "</span></div>"; }).join("");
    $("cards").innerHTML = C.items.map(function (it, i) {
      var st = status(it);
      return '<article class="card" data-i="' + i + '">' + pic(it, i) + "<h3>" + esc(it.name) + '</h3><div class="meta">' + esc(it.specs[0][0]) + " " + esc(it.specs[0][1]) + " · " + esc(it.specs[1][1]) + '</div><div class="status' + (st.no ? " no" : "") + '">' + st.text + '</div><div class="price">' + rub(it.price) + ' <small>/ сутки</small></div><button class="go" type="button" data-i="' + i + '"><span>Рассчитать и заказать</span><i aria-hidden="true">→</i></button></article>';
    }).join("");
    $("howLead").textContent = "Четыре шага от заявки до возврата техники.".replace("Четыре", ["Ноль", "Один шаг", "Два шага", "Три шага", "Четыре"][C.steps.length] || "Несколько");
    $("steps").innerHTML = C.steps.map(function (s) { return '<div class="step"><h3>' + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></div>"; }).join("");
    var ds = C.discounts.slice().sort(function (a, c) { return a.from - c.from; }), rows = "";
    var prev = 1;
    ds.forEach(function (d) { rows += "<tr><td>" + (prev === d.from - 1 ? prev : prev + "–" + (d.from - 1)) + " " + pl(d.from - 1) + "</td><td>0%</td></tr>"; prev = d.from; });
    rows = ds.length ? "" : "";
    var tiers = [{ from: 1, pct: 0 }].concat(ds);
    rows = tiers.map(function (t, i) { var nxt = tiers[i + 1]; var range = nxt ? (nxt.from - 1 === t.from ? t.from : t.from + "–" + (nxt.from - 1)) + " " + pl(nxt.from - 1) : "от " + t.from + " " + pl(t.from); return "<tr><td>" + range + "</td><td>" + t.pct + "%</td></tr>"; }).join("");
    $("discRows").innerHTML = rows;
    $("termsList").innerHTML = ["Доставка: " + Math.round(C.delivery.base).toLocaleString(b.locale) + " " + b.currency + " плюс " + C.delivery.perKm + " " + b.currency + " за километр от базы."].concat(C.notes).map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("");
    $("faqList").innerHTML = C.faq.map(function (f) { return "<details><summary>" + esc(f.q) + "</summary><p>" + esc(f.a) + "</p></details>"; }).join("");
    $("footBrand").textContent = b.name + " · " + b.tagline; $("footNote").textContent = C.footer || "";
  }

  // --- календарь
  function monthFirst(s) { return s.slice(0, 8) + "01"; }
  function addMonths(first, n) { var p = first.split("-"); return iso(new Date(+p[0], +p[1] - 1 + n, 1)); }
  function renderCal() {
    var it = M.item, p = M.view.split("-"), y = +p[0], mo = +p[1] - 1;
    var label = new Date(y, mo, 1).toLocaleDateString(C.brand.locale, { month: "long", year: "numeric" }).replace(/\s*г\.$/, ""); label = label.charAt(0).toUpperCase() + label.slice(1);
    var lead = (new Date(y, mo, 1).getDay() + 6) % 7, dim = new Date(y, mo + 1, 0).getDate(), i, h;
    h = '<div class="cal-head"><button type="button" class="cal-nav" data-nav="-1" aria-label="Предыдущий месяц"' + (M.view <= monthFirst(TODAY) ? " disabled" : "") + '>‹</button><span>' + label + '</span><button type="button" class="cal-nav" data-nav="1" aria-label="Следующий месяц">›</button></div><div class="cal-grid">';
    ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].forEach(function (w) { h += '<div class="cal-wd">' + w + "</div>"; });
    for (i = 0; i < lead; i++) h += "<span></span>";
    for (i = 1; i <= dim; i++) {
      var s = y + "-" + pad(mo + 1) + "-" + pad(i), past = s < TODAY, busy = !past && isBusy(it, s), cls = "day";
      if (s === TODAY) cls += " today";
      if (past) cls += " past"; else if (busy) cls += " busy";
      if (M.from && s === M.from) cls += " start" + (M.to ? " has-end" : "");
      if (M.to && s === M.to) cls += " end";
      if (M.from && M.to && s > M.from && s < M.to) cls += " in";
      h += '<button type="button" class="' + cls + '" data-d="' + s + '"' + ((past || busy) ? " disabled" : "") + ' aria-label="' + s + (busy ? ", занято" : "") + '">' + i + "</button>";
    }
    h += '</div><div class="cal-legend">Зачёркнутые дни заняты. Нажмите дату начала, затем дату окончания.</div>';
    $("cal").innerHTML = h;
  }

  function openModal(i) {
    var it = C.items[i]; lastFocus = document.activeElement;
    var from = firstFree(it), st = status(it), op = it.operator;
    M = { item: it, from: from, to: null, view: monthFirst(from), hint: "" };
    $("sheet").innerHTML =
      '<button class="x" type="button" id="mClose" aria-label="Закрыть">×</button>' +
      "<div>" + pic(it, i) + '<h2 id="mTitle">' + esc(it.name) + '</h2><div class="status' + (st.no ? " no" : "") + '">' + st.text + "</div>" +
      '<dl class="specs">' + it.specs.map(function (x) { return "<div><dt>" + esc(x[0]) + "</dt><dd>" + esc(x[1]) + "</dd></div>"; }).join("") + "<div><dt>Цена за сутки</dt><dd>" + rub(it.price) + "</dd></div>" +
      (op ? "<div><dt>Оператор</dt><dd>" + (op.required ? "обязателен, " : "по желанию, ") + rub(op.price) + "/смена</dd></div>" : "") + "</dl></div>" +
      '<form id="mForm" class="mform" novalidate><div><div class="sub" style="font-size:14px;font-weight:600;margin-bottom:8px">Даты аренды</div><div class="cal" id="cal"></div><p class="selline" id="mSel" aria-live="polite"></p></div>' +
      '<div class="estimate" aria-live="polite"><div class="total-l" id="mDays"></div><div class="range" id="mRange"></div><div class="lines" id="mLines"></div></div>' +
      '<div class="field"><label for="mName">Имя</label><input id="mName" type="text" autocomplete="name" placeholder="Иван"></div>' +
      '<div class="field"><label for="mPhone">Телефон</label><input id="mPhone" type="tel" autocomplete="tel" placeholder="+7 900 000-00-00"></div>' +
      '<div class="field"><label for="mNote">Адрес объекта или комментарий (по желанию)</label><input id="mNote" type="text" placeholder="Город, улица"></div>' +
      '<input class="hp" id="mHp" name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="msg err" id="mErr" role="alert"></p><button class="btn" type="submit" id="mSubmit">Заказать эту технику</button></form>';
    // При скрытии прокрутки страница расширяется на ширину полосы и «прыгает» вправо: компенсируем отступом.
    var sw = window.innerWidth - document.documentElement.clientWidth;
    $("modal").hidden = false; document.body.style.overflow = "hidden";
    if (sw > 0) document.body.style.paddingRight = "calc(16px + " + sw + "px)";
    renderCal(); mUpdate(); $("mClose").focus();
  }
  function closeModal() { $("modal").hidden = true; document.body.style.overflow = ""; document.body.style.paddingRight = ""; M = null; if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  function mUpdate() {
    if (!M || !$("mSel")) return null;
    var it = M.item, f = M.from, t = M.to, op = it.operator;
    $("mSubmit").disabled = !(f && t);
    if (!f || !t) {
      $("mSel").textContent = M.hint || (f ? "Начало: " + dm(f) + ". Выберите дату окончания." : "Выберите дату начала.");
      $("mDays").textContent = "Примерная стоимость"; $("mRange").textContent = "—"; $("mLines").innerHTML = "";
      return null;
    }
    var days = diff(f, t) + 1, p = pct(days), rent = it.price * days, disc = rent * p / 100;
    var opAll = op ? op.price * days : 0, base = rent - disc + (op && op.required ? opAll : 0), max = base + (op && !op.required ? opAll : 0) + delivMax();
    $("mSel").textContent = "С " + dm(f) + " по " + dm(t) + " · " + days + " " + pl(days);
    $("mDays").textContent = "Примерная стоимость за " + days + " " + pl(days);
    $("mRange").textContent = "от " + rub(base) + " до " + rub(max);
    $("mLines").innerHTML = "<div><span>Аренда: " + days + " × " + rub(it.price) + "</span><span>" + rub(rent) + "</span></div>" +
      (p ? "<div><span>Скидка " + p + "%</span><span>−" + rub(disc) + "</span></div>" : "") +
      (op ? "<div><span>Оператор " + (op.required ? "(обязателен)" : "(если нужен)") + "</span><span>" + rub(opAll) + "</span></div>" : "") +
      "<div><span>Доставка (зависит от расстояния)</span><span>" + rub(C.delivery.base) + "–" + rub(delivMax()) + "</span></div>" +
      "<div><span>«От»: без доставки" + (op && !op.required ? " и оператора" : "") + ". «До»: с ними, доставка на " + C.delivery.maxKm + " км</span><span></span></div>";
    return { days: days, base: base, max: max, f: f, t: t };
  }

  document.addEventListener("click", function (e) {
    var card = e.target.closest("#cards [data-i]");
    if (card) { openModal(+card.dataset.i); return; }
    if (!$("modal").hidden) {
      if (e.target === $("modal") || e.target.closest("#mClose") || e.target.closest("#mDone")) { closeModal(); return; }
      var nav = e.target.closest("[data-nav]");
      if (nav && M) { M.view = addMonths(M.view, +nav.dataset.nav); renderCal(); var nb = $("cal").querySelector('[data-nav="' + nav.dataset.nav + '"]'); if (nb && !nb.disabled) nb.focus(); return; }
      var day = e.target.closest("[data-d]");
      if (day && M) {
        var d = day.dataset.d; M.hint = "";
        if (!M.from || M.to) { M.from = d; M.to = null; }
        else if (d < M.from) { M.from = d; }
        else if (conflict(M.item, M.from, d)) { M.from = d; M.to = null; M.hint = "В этот промежуток попадают занятые дни. Выберите другие даты."; }
        else { M.to = d; }
        renderCal(); mUpdate();
        var nd = $("cal").querySelector('[data-d="' + d + '"]'); if (nd) nd.focus();
      }
    }
  });
  // Заявка всегда сохраняется в браузере (её видно в админке на этом же устройстве).
  // Если в админке указан адрес приёма заявок (orders.endpoint, например Cloudflare Worker), она ещё и отправляется туда.
  function live() { return true; }
  function remote() { return !!(C.orders && C.orders.endpoint); }
  function send(payload) {
    payload.page = location.href;
    if (C.orders && C.orders.chatId) payload.chatId = C.orders.chatId;
    if (C.orders && C.orders.chatId) payload.chatId = C.orders.chatId;
    var rec = JSON.parse(JSON.stringify(payload)); delete rec.website;
    rec.time = new Date().toISOString(); rec.est = payload.type === "order" ? "от " + Math.round(payload.estimateFrom).toLocaleString("ru-RU") + " до " + Math.round(payload.estimateTo).toLocaleString("ru-RU") + " " + payload.currency : "";
    if (payload.website) return Promise.resolve();
    if (!remote()) { rec.sent = false; rec.error = "адрес приёма заявок не задан"; Store.addOrder(rec); return Promise.resolve(); }
    return fetch(C.orders.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error("fail"); rec.sent = true; Store.addOrder(rec); })
      .catch(function (e) { rec.sent = false; rec.error = "не удалось отправить (" + e.message + ")"; Store.addOrder(rec); throw e; });
  }
  function failText() { return "Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам: " + C.brand.phone; }

  document.addEventListener("submit", function (e) {
    var btn;
    if (e.target.id === "mForm") {
      e.preventDefault();
      var r = mUpdate(); if (!r) return;
      var name = $("mName").value.trim(), phone = $("mPhone").value.trim();
      if (!name) { $("mErr").textContent = "Введите имя."; $("mName").focus(); return; }
      if (phone.replace(/\D/g, "").length < 10) { $("mErr").textContent = "Введите телефон полностью, не меньше 10 цифр."; $("mPhone").focus(); return; }
      $("mErr").textContent = "";
      var item = M.item;
      var done = function () {
        $("sheet").innerHTML = '<button class="x" type="button" id="mClose" aria-label="Закрыть">×</button><div class="done"><h3 id="mTitle">' + (live() ? "Заявка отправлена" : "Заявка оформлена") + "</h3><div>" + esc(item.name) + "<br>" + dm(r.f) + " – " + dm(r.t) + ", " + r.days + " " + pl(r.days) + "<br>Примерно от " + rub(r.base) + " до " + rub(r.max) + '</div><div class="small">Менеджер позвонит на ' + esc(phone) + ", уточнит детали и подтвердит цену." + "" + '</div><button class="btn" type="button" id="mDone">Закрыть</button></div>';
        $("mDone").focus();
      };
            btn = $("mSubmit"); btn.disabled = true; btn.textContent = "Отправляем…";
      send({ type: "order", item: item.name, from: r.f, to: r.t, days: r.days, estimateFrom: r.base, estimateTo: r.max, currency: C.brand.currency, name: name, phone: phone, note: $("mNote").value.trim(), website: $("mHp").value })
        .then(done)
        .catch(function () { btn.disabled = false; btn.textContent = "Заказать эту технику"; $("mErr").textContent = failText(); });
    } else if (e.target.id === "f") {
      e.preventDefault();
      var err = $("e"), ok = $("ok"); err.textContent = ""; ok.textContent = "";
      if (!$("n").value.trim()) { err.textContent = "Введите имя."; $("n").focus(); return; }
      if ($("p").value.replace(/\D/g, "").length < 10) { err.textContent = "Введите телефон полностью, не меньше 10 цифр."; $("p").focus(); return; }
      btn = e.target.querySelector("button[type=submit]"); btn.disabled = true; btn.textContent = "Отправляем…";
      send({ type: "callback", name: $("n").value.trim(), phone: $("p").value.trim(), note: $("c").value.trim(), website: $("hp").value })
        .then(function () { ok.textContent = "Спасибо! Мы получили ваш номер и скоро перезвоним."; e.target.reset(); })
        .catch(function () { err.textContent = failText(); })
        .then(function () { btn.disabled = false; btn.textContent = "Перезвоните мне"; });
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("modal").hidden) closeModal(); });

  // Если фото не найдено, вместо него рисуется иллюстрация из поля "art".
  document.addEventListener("error", function (e) {
    var im = e.target;
    if (!im || im.tagName !== "IMG" || im.dataset.item == null) return;
    var holder = im.closest(".pic"), it = C.items[+im.dataset.item], tmp = document.createElement("div");
    tmp.innerHTML = artPic(it); holder.parentNode.replaceChild(tmp.firstChild, holder);
  }, true);

  render(Store.config());

  // Шапка: на телефоне меню выпадающее; при прокрутке вниз шапка прячется, вверх появляется.
  (function () {
    var top = $("top"), btn = $("menuBtn"), menu = $("menu"), last = window.pageYOffset, prog = false, timer = 0;
    function setMenu(on) { menu.classList.toggle("open", on); btn.setAttribute("aria-expanded", on ? "true" : "false"); if (on) top.classList.remove("hide"); }
    btn.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) {
      if (!e.target.closest("a")) return;
      setMenu(false); prog = true; top.classList.add("hide"); clearTimeout(timer); timer = setTimeout(function () { prog = false; }, 1500); // пока страница едет к блоку, шапку не показываем
    });
    document.addEventListener("click", function (e) { if (menu.classList.contains("open") && !e.target.closest("#top")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("scroll", function () {
      var y = window.pageYOffset, d = y - last; last = y;
      if (menu.classList.contains("open")) return;
      if (prog) { clearTimeout(timer); timer = setTimeout(function () { prog = false; }, 200); return; }
      if (y < 60) { top.classList.remove("hide"); return; }
      if (d > 6) top.classList.add("hide"); else if (d < -6) top.classList.remove("hide");
    }, { passive: true });
  })();

})();
