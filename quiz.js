/* RA1 · Exercices interactifs (QCM, Vrai/Faux, questions courtes) et sommaire actif.
   Balisage attendu (voir _kit.html) :
   - .qcm[data-answer="A,C"]  > .q, ol.opts > li[data-k], .corr
   - .vf[data-answer="V|F"]   > .q, .corr
   - .qc                      > .q, details > summary + .sol
   - .serie                   > header (h3 + .score), questions…  (bouton « Corriger toute la série » ajouté)
*/
(function () {
  "use strict";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text != null) n.textContent = text;
    return n;
  }
  function parseAnswer(s) {
    return (s || "").split(/[\s,;]+/).map(function (x) { return x.trim().toUpperCase(); }).filter(Boolean);
  }

  /* ---------------- QCM ---------------- */
  function setupQcm(box) {
    var answer = parseAnswer(box.getAttribute("data-answer"));
    var corr = $(".corr", box);
    if (corr) corr.hidden = true;
    var q = $(".q", box);
    if (q && answer.length > 1 && !$(".multi", q)) {
      // indication volontairement absente : en examen, on ne sait pas combien de réponses sont justes
    }
    var items = $all("ol.opts > li", box);
    var buttons = items.map(function (li) {
      var k = (li.getAttribute("data-k") || "").toUpperCase();
      var btn = el("button", { type: "button", "class": "opt", "aria-pressed": "false", "data-k": k });
      var kk = el("span", { "class": "k" }, k);
      var txt = el("span", { "class": "t" });
      while (li.firstChild) txt.appendChild(li.firstChild);
      var mark = el("span", { "class": "mark" });
      btn.appendChild(kk); btn.appendChild(txt); btn.appendChild(mark);
      li.appendChild(btn);
      btn.addEventListener("click", function () {
        if (box.classList.contains("is-checked")) return;
        btn.setAttribute("aria-pressed", btn.getAttribute("aria-pressed") === "true" ? "false" : "true");
      });
      return btn;
    });

    var actions = el("div", { "class": "q-actions" });
    var check = el("button", { type: "button", "class": "btn primary" }, "Vérifier");
    var show = el("button", { type: "button", "class": "btn ghost" }, "Voir la correction");
    var reset = el("button", { type: "button", "class": "btn ghost", hidden: "" }, "Recommencer");
    var verdict = el("span", { "class": "verdict", "aria-live": "polite" });
    actions.appendChild(check); actions.appendChild(show); actions.appendChild(reset); actions.appendChild(verdict);
    var opts = $("ol.opts", box);
    opts.parentNode.insertBefore(actions, opts.nextSibling);

    function grade(reveal) {
      var chosen = buttons.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })
        .map(function (b) { return b.getAttribute("data-k"); });
      var ok = chosen.length === answer.length && chosen.every(function (k) { return answer.indexOf(k) > -1; });
      buttons.forEach(function (b) {
        var k = b.getAttribute("data-k");
        var isAns = answer.indexOf(k) > -1;
        var picked = chosen.indexOf(k) > -1;
        b.classList.remove("is-good", "is-bad", "is-missed");
        var mark = $(".mark", b);
        mark.textContent = "";
        if (isAns && picked) { b.classList.add("is-good"); mark.textContent = "juste"; }
        else if (isAns && !picked) { b.classList.add(reveal ? "is-good" : "is-missed"); mark.textContent = reveal ? "réponse" : "oubliée"; }
        else if (!isAns && picked) { b.classList.add("is-bad"); mark.textContent = "fausse"; }
        b.disabled = true;
      });
      box.classList.add("is-checked");
      box.setAttribute("data-result", reveal && chosen.length === 0 ? "vu" : (ok ? "ok" : "ko"));
      if (reveal && chosen.length === 0) {
        verdict.textContent = "Réponse : " + answer.join(", ");
        verdict.className = "verdict";
      } else if (ok) {
        verdict.textContent = "Juste !";
        verdict.className = "verdict ok";
      } else {
        verdict.textContent = "Pas tout à fait — bonne(s) réponse(s) : " + answer.join(", ");
        verdict.className = "verdict ko";
      }
      if (corr) corr.hidden = false;
      check.hidden = true; show.hidden = true; reset.hidden = false;
      updateSerie(box);
    }
    check.addEventListener("click", function () { grade(false); });
    show.addEventListener("click", function () { grade(true); });
    reset.addEventListener("click", function () {
      buttons.forEach(function (b) {
        b.disabled = false; b.setAttribute("aria-pressed", "false");
        b.classList.remove("is-good", "is-bad", "is-missed"); $(".mark", b).textContent = "";
      });
      box.classList.remove("is-checked"); box.removeAttribute("data-result");
      verdict.textContent = ""; verdict.className = "verdict";
      if (corr) corr.hidden = true;
      check.hidden = false; show.hidden = false; reset.hidden = true;
      updateSerie(box);
    });
    box._grade = function () { if (!box.classList.contains("is-checked")) grade(true); };
  }

  /* ---------------- Vrai / Faux ---------------- */
  function setupVf(box) {
    var ans = (box.getAttribute("data-answer") || "").trim().toUpperCase().charAt(0); // V ou F
    var corr = $(".corr", box);
    if (corr) corr.hidden = true;
    var wrap = el("div", { "class": "q-actions" });
    var bv = el("button", { type: "button", "class": "btn" }, "Vrai");
    var bf = el("button", { type: "button", "class": "btn" }, "Faux");
    var reset = el("button", { type: "button", "class": "btn ghost", hidden: "" }, "Recommencer");
    var verdict = el("span", { "class": "verdict", "aria-live": "polite" });
    wrap.appendChild(bv); wrap.appendChild(bf); wrap.appendChild(reset); wrap.appendChild(verdict);
    var q = $(".q", box);
    q.parentNode.insertBefore(wrap, q.nextSibling);

    function choose(k, reveal) {
      var right = ans === "V" ? bv : bf;
      var picked = k === "V" ? bv : (k === "F" ? bf : null);
      [bv, bf].forEach(function (b) { b.disabled = true; b.classList.remove("is-good", "is-bad"); });
      right.classList.add("is-good");
      if (picked && picked !== right) picked.classList.add("is-bad");
      var ok = picked === right;
      box.classList.add("is-checked");
      box.setAttribute("data-result", picked ? (ok ? "ok" : "ko") : "vu");
      verdict.textContent = picked ? (ok ? "Juste !" : "Raté — la bonne réponse est « " + (ans === "V" ? "Vrai" : "Faux") + " »")
                                   : "Réponse : " + (ans === "V" ? "Vrai" : "Faux");
      verdict.className = "verdict" + (picked ? (ok ? " ok" : " ko") : "");
      if (corr) corr.hidden = false;
      reset.hidden = false;
      updateSerie(box);
    }
    bv.addEventListener("click", function () { choose("V"); });
    bf.addEventListener("click", function () { choose("F"); });
    reset.addEventListener("click", function () {
      [bv, bf].forEach(function (b) { b.disabled = false; b.classList.remove("is-good", "is-bad"); });
      box.classList.remove("is-checked"); box.removeAttribute("data-result");
      verdict.textContent = ""; verdict.className = "verdict";
      if (corr) corr.hidden = true;
      reset.hidden = true;
      updateSerie(box);
    });
    box._grade = function () { if (!box.classList.contains("is-checked")) choose(null, true); };
  }

  /* ---------------- Mémoire des erreurs (navigateur uniquement) ---------------- */
  var RES_KEY = "ra1-resultats";
  var store = {};
  try { store = JSON.parse(window.localStorage.getItem(RES_KEY) || "{}") || {}; } catch (e) { store = {}; }
  function saveResult(item) {
    var r = item.getAttribute("data-result");
    if (!item._key || !r) return;
    var v = r === "ok" ? "ok" : "ko"; // « vu » sans répondre = à revoir
    store[item._key] = v;
    item.setAttribute("data-prev", v);
    try { window.localStorage.setItem(RES_KEY, JSON.stringify(store)); } catch (e) { /* stockage indisponible */ }
  }

  /* ---------------- Séries ---------------- */
  function updateSerie(item) {
    if (item.hasAttribute("data-result")) saveResult(item);
    var serie = item.closest(".serie");
    if (!serie) return;
    var items = $all(".qcm, .vf", serie);
    var done = items.filter(function (i) { return i.hasAttribute("data-result"); });
    var good = items.filter(function (i) { return i.getAttribute("data-result") === "ok"; });
    if (serie._refreshErr) serie._refreshErr();
    var score = $(".score", serie);
    if (score) score.textContent = done.length
      ? good.length + " juste(s) · " + done.length + " / " + items.length + " faites"
      : items.length + " questions";
  }
  function setupSerie(serie) {
    var items = $all(".qcm, .vf", serie);
    var qcs = $all(".qc details", serie);
    var head = $(":scope > header", serie);
    if (head && !$(".score", head)) head.appendChild(el("span", { "class": "score" }));
    if (items.length || qcs.length) {
      var foot = el("div", { "class": "serie__foot" });
      var all = el("button", { type: "button", "class": "btn primary" }, "Corriger toute la série");
      var hide = el("button", { type: "button", "class": "btn ghost" }, "Tout recommencer");
      foot.appendChild(all); foot.appendChild(hide);
      if (items.length) {
        var errs = el("button", { type: "button", "class": "btn ghost", "aria-pressed": "false" });
        var label = function () {
          var n = items.filter(function (i) { return i.getAttribute("data-prev") === "ko"; }).length;
          errs.textContent = serie.classList.contains("only-errors")
            ? "Afficher toute la série"
            : "Revoir seulement mes erreurs (" + n + ")";
          errs.disabled = !serie.classList.contains("only-errors") && n === 0;
        };
        errs.addEventListener("click", function () {
          serie.classList.toggle("only-errors");
          errs.setAttribute("aria-pressed", serie.classList.contains("only-errors") ? "true" : "false");
          label();
        });
        serie._refreshErr = label;
        label();
        foot.appendChild(errs);
      }
      serie.appendChild(foot);
      all.addEventListener("click", function () {
        items.forEach(function (i) { if (i._grade) i._grade(); });
        qcs.forEach(function (d) { d.open = true; });
      });
      hide.addEventListener("click", function () {
        $all(".q-actions .btn.ghost:not([hidden])", serie).forEach(function (b) {
          if (b.textContent === "Recommencer") b.click();
        });
        qcs.forEach(function (d) { d.open = false; });
      });
    }
    if (items.length) updateSerie(items[0]);
  }

  /* ---------------- Sommaire actif ---------------- */
  function setupToc() {
    var links = $all(".toc a[href^='#']");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = decodeURIComponent(a.getAttribute("href").slice(1));
      var t = document.getElementById(id);
      if (t) map[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("is-active"); });
          var a = map[e.target.id];
          if (a) a.classList.add("is-active");
        }
      });
    }, { rootMargin: "-15% 0px -75% 0px" });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
    // Sur grand écran le sommaire est toujours ouvert
    var det = $(".toc details");
    if (det && window.matchMedia && window.matchMedia("(min-width: 1100px)").matches) det.open = true;
  }

  /* ---------------- Vue complète / essentielle ---------------- */
  var MODE_KEY = "ra1-vue";
  function setupModes() {
    if (!$(".notion")) return;
    var bar = $(".topbar__in");
    if (!bar) return;
    var btn = el("button", { type: "button", "class": "mode-toggle", "aria-pressed": "false",
      title: "Cache les explications longues : il reste définitions, pièges, mnémos, « À retenir », schémas et tableaux" });
    bar.appendChild(btn);
    function apply(on) {
      document.documentElement.classList.toggle("mode-essentiel", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "Vue essentielle ✓" : "Vue essentielle";
    }
    var saved = false;
    try { saved = window.localStorage.getItem(MODE_KEY) === "essentiel"; } catch (e) { /* stockage indisponible */ }
    apply(saved);
    btn.addEventListener("click", function () {
      var on = !document.documentElement.classList.contains("mode-essentiel");
      apply(on);
      try { window.localStorage.setItem(MODE_KEY, on ? "essentiel" : "complet"); } catch (e) { /* ignoré */ }
    });
  }

  /* ---------------- Lexique en flashcards ---------------- */
  function setupLexique(dl) {
    var bar = el("div", { "class": "lex-tools" });
    var btn = el("button", { type: "button", "class": "btn", "aria-pressed": "false" }, "Mode flashcards : cacher les définitions");
    var info = el("span", { "class": "muted lex-info", hidden: "" }, "Clique sur un mot pour voir sa définition.");
    bar.appendChild(btn); bar.appendChild(info);
    dl.parentNode.insertBefore(bar, dl);
    var items = $all(":scope > div", dl);
    items.forEach(function (it) {
      it.addEventListener("click", function () {
        if (dl.classList.contains("is-quiz")) it.classList.toggle("is-open");
      });
      it.addEventListener("keydown", function (e) {
        if ((e.key === "Enter" || e.key === " ") && dl.classList.contains("is-quiz")) { e.preventDefault(); it.classList.toggle("is-open"); }
      });
    });
    btn.addEventListener("click", function () {
      var on = !dl.classList.contains("is-quiz");
      dl.classList.toggle("is-quiz", on);
      items.forEach(function (it) {
        it.classList.remove("is-open");
        if (on) { it.setAttribute("tabindex", "0"); it.setAttribute("role", "button"); }
        else { it.removeAttribute("tabindex"); it.removeAttribute("role"); }
      });
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.textContent = on ? "Afficher toutes les définitions" : "Mode flashcards : cacher les définitions";
      info.hidden = !on;
    });
  }

  /* ---------------- Programme 7 jours (accueil) ---------------- */
  var PROG_KEY = "ra1-programme";
  function setupProgramme() {
    var boxes = $all(".prog input[type='checkbox']");
    if (!boxes.length) return;
    var state = {};
    try { state = JSON.parse(window.localStorage.getItem(PROG_KEY) || "{}") || {}; } catch (e) { state = {}; }
    boxes.forEach(function (b) { b.checked = !!state[b.id]; });
    var doneEl = $("#prog-done"), totalEl = $("#prog-total"), fill = $(".prog-bar__fill");
    function refresh() {
      var done = boxes.filter(function (b) { return b.checked; }).length;
      if (doneEl) doneEl.textContent = done;
      if (totalEl) totalEl.textContent = boxes.length;
      if (fill) fill.style.width = Math.round(100 * done / boxes.length) + "%";
      $all(".prog > li.day").forEach(function (day) {
        var own = $all("input[type='checkbox']", day);
        var n = own.filter(function (b) { return b.checked; }).length;
        var c = $(".day__count", day);
        if (c) c.textContent = n + " / " + own.length;
        day.classList.toggle("is-done", n === own.length);
      });
    }
    function save() {
      state = {};
      boxes.forEach(function (b) { if (b.checked) state[b.id] = true; });
      try { window.localStorage.setItem(PROG_KEY, JSON.stringify(state)); } catch (e) { /* stockage indisponible */ }
    }
    boxes.forEach(function (b) { b.addEventListener("change", function () { save(); refresh(); }); });
    var reset = $("#prog-reset"), armed = null;
    if (reset) reset.addEventListener("click", function () {
      if (!armed) {
        reset.textContent = "Clique encore pour tout décocher";
        armed = setTimeout(function () { armed = null; reset.textContent = "Tout décocher"; }, 4000);
        return;
      }
      clearTimeout(armed); armed = null; reset.textContent = "Tout décocher";
      boxes.forEach(function (b) { b.checked = false; });
      save(); refresh();
    });
    refresh();
  }

  function init() {
    try { setupProgramme(); } catch (e) { console.error(e); }
    try { setupModes(); } catch (e) { console.error(e); }
    $all("dl.lexique").forEach(function (d) { try { setupLexique(d); } catch (e) { console.error(e); } });
    var page = (location.pathname.split("/").pop() || "index.html");
    $all(".qcm, .vf").forEach(function (q, i) {
      q._key = page + "#" + i;
      if (store[q._key]) q.setAttribute("data-prev", store[q._key]);
    });
    $all(".qcm").forEach(function (b) { try { setupQcm(b); } catch (e) { console.error(e); } });
    $all(".vf").forEach(function (b) { try { setupVf(b); } catch (e) { console.error(e); } });
    $all(".serie").forEach(function (s) { try { setupSerie(s); } catch (e) { console.error(e); } });
    setupToc();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
