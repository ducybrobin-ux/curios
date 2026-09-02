import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

/* Mock minimal du DOM : un seul ancêtre #cur-nav avec innerHTML + querySelector. */
const created = {
  anchor: null,
  document: null,
};

class MockClassList {
  constructor() { this._set = new Set(); }
  add(c) { this._set.add(c); }
  remove(c) { this._set.delete(c); }
}

class MockElement {
  constructor(id) {
    this.id = id;
    this.innerHTML = "";
    this.attrs = {};
    this.classList = new MockClassList();
    this.children = [];
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  querySelector(sel) {
    if (sel === ".cur-navbar__brand") return this.brand || null;
    if (sel.startsWith(".cur-nav__link--active")) return this.activeLink || null;
    return null;
  }
  querySelectorAll() { return []; }
  addEventListener() {}
}

function makeDocument(anchor) {
  return {
    readyState: "complete",
    addEventListener() {},
    getElementById(id) { return id === "cur-nav" ? anchor : null; },
  };
}

before(async () => {
  const anchor = new MockElement("cur-nav");
  anchor.setAttribute("data-nav-current", "creer");
  anchor.brand = new MockElement("brand");
  const active = new MockElement("active");
  anchor.activeLink = active;

  globalThis.window = globalThis;
  globalThis.document = makeDocument(anchor);

  created.anchor = anchor;
  created.document = globalThis.document;

  await import("../../js/nav-shell.js");
});

describe("CurNavShell (navigation unifiée)", () => {
  it("expose l'API", () => {
    assert.equal(typeof window.CurNavShell, "object");
    assert.equal(typeof window.CurNavShell.mount, "function");
    assert.ok(Array.isArray(window.CurNavShell.ITEMS));
  });

  it("définit les 5 espaces JOUER/PARCOURS/CRÉER/PILOTER/HUB", () => {
    const ids = window.CurNavShell.ITEMS.map((i) => i.id);
    assert.deepEqual(ids, ["jouer", "parcours", "creer", "piloter", "hub"]);
    assert.ok(window.CurNavShell.ITEMS.every((i) => /\.html$/.test(i.href)));
  });

  it("marque l'espace actif d'après data-nav-current", () => {
    const html = window.CurNavShell.build("creer");
    assert.match(html, /cur-nav__link--active/);
    const uri = html.indexOf("cur-nav__link--active");
    /* Le lien actif renvoie vers atelier.html et porte data-nav='creer' */
    const activeHtml = html.slice(Math.max(0, uri - 60), uri + 80);
    assert.match(activeHtml, /atelier\.html/);
    assert.match(activeHtml, /data-nav="creer"/);
    assert.doesNotMatch(activeHtml, /data-nav="jouer"/);
  });

  it("génère un lien par espace", () => {
    const html = window.CurNavShell.build("jouer");
    const count = (html.match(/class="cur-nav__link/g) || []).length;
    assert.equal(count, 5);
  });

  it("ne ré-injecte pas une deuxième fois (garde-fou data-cur-nav-mounted)", () => {
    const anchor = created.anchor;
    const initial = anchor.innerHTML;
    assert.equal(anchor.getAttribute("data-cur-nav-mounted"), "1");
    window.CurNavShell.mount();
    /* Le garde-fou empêche d'écraser à nouveau le HTML déjà monté. */
    assert.equal(anchor.innerHTML, initial);
  });

  it("ne fait rien s'il n'y a pas d'ancre #cur-nav", () => {
    const orig = globalThis.document.getElementById;
    globalThis.document.getElementById = (id) => (id === "cur-nav" ? null : null);
    assert.doesNotThrow(() => window.CurNavShell.mount());
    globalThis.document.getElementById = orig;
  });
});