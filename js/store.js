/* Хранилище вместо сервера: правки админки и заявки лежат в localStorage браузера.
   Исходные данные берутся из data/config.js. */
(function () {
  "use strict";
  var K = { cfg: "tehpark.config", orders: "tehpark.orders", pw: "tehpark.pw", sess: "tehpark.session" };
  function rd(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function wr(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  window.Store = {
    defaults: function () { return clone(window.TEHPARK_DEFAULT || {}); },
    config: function () { var c = rd(K.cfg, null); return c && c.brand && Array.isArray(c.items) ? c : this.defaults(); },
    isCustom: function () { return rd(K.cfg, null) != null; },
    saveConfig: function (c) { return wr(K.cfg, c); },
    resetConfig: function () { del(K.cfg); },
    orders: function () { return rd(K.orders, []); },
    addOrder: function (o) { return wr(K.orders, [o].concat(rd(K.orders, [])).slice(0, 300)); },
    clearOrders: function () { del(K.orders); },
    /* Пароль админки: пока не задан свой, действует пароль по умолчанию. Хранится только хэш. */
    DEFAULT_PW: "admin",
    hash: function (s) {
      var enc = new TextEncoder().encode("tehpark:" + s);
      return crypto.subtle.digest("SHA-256", enc).then(function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); });
    },
    pwHash: function () { return rd(K.pw, null); },
    setPwHash: function (h) { return wr(K.pw, h); },
    session: function () { try { return sessionStorage.getItem(K.sess) === "1"; } catch (e) { return false; } },
    setSession: function (on) { try { on ? sessionStorage.setItem(K.sess, "1") : sessionStorage.removeItem(K.sess); } catch (e) {} }
  };
})();
