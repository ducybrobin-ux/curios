/* hub-api.test.mjs — HubApi (client fetch) + stats du dashboard Hub */
import { describe, it, before } from "node:test";
import assert from "node:assert/strict";

function makeFakeFetch(routes) {
  const calls = [];
  async function fakeFetch(url, opts) {
    calls.push({ url, opts });
    const route = routes[url];
    if (route && route.status != null && route.status !== 200) {
      return { ok: false, status: route.status, json: async () => route.body || {} };
    }
    if (route == null) {
      throw new Error("network-error");
    }
    return { ok: true, status: 200, json: async () => route.body };
  }
  return { fakeFetch, calls };
}

function makeDocument() {
  const values = {};
  const elements = {};
  for (const id of [
    "hub-stat-projets",
    "hub-stat-sessions",
    "hub-stat-packs",
    "hub-stat-teams",
  ]) {
    elements[id] = { textContent: "—" };
    values[id] = elements[id];
  }
  return {
    getElementById(id) { return elements[id] || null; },
    values,
  };
}

let tokenValue = "";
const routes = {
  "/api/hub/analytics": {
    body: {
      totals: { projets: 3, parcours: 2, packs: 1, clients: 0, sessions: 2, materiel: 0, devis: 0 },
      byStatus: { projetsActive: 2, projetsDraft: 1, sessionsActive: 1 },
    },
  },
  "/api/packs": { body: { ok: true, total: 11, packs: [] } },
  "/api/pos": { body: { seq: 1, positions: [{ team: "A" }, { team: "B" }, { team: "C" }], statuses: [] } },
};

let fake;
let dom;

before(async () => {
  fake = makeFakeFetch(routes);
  dom = makeDocument();

  globalThis.window = globalThis;
  globalThis.fetch = fake.fakeFetch;
  globalThis.HubAuth = { getToken: () => tokenValue };
  globalThis.HubShell = { escHtml: (s) => String(s) };
  globalThis.document = dom;

  await import("../../js/hub-api.js");
  await import("../../js/hub-pages/dashboard.js");
});

describe("HubApi", () => {
  it("expose getJson", () => {
    assert.equal(typeof window.HubApi.getJson, "function");
  });

  it("ajoute le token Bearer du Hub quand présent", async () => {
    tokenValue = "tok-abc";
    const data = await window.HubApi.getJson("/api/hub/analytics");
    assert.equal(data.totals.projets, 3);
    const call = fake.calls.find((c) => c.url === "/api/hub/analytics");
    assert.ok(call);
    assert.equal(call.opts.headers.Authorization, "Bearer tok-abc");
  });

  it("ne met pas de header Authorization sans token", async () => {
    tokenValue = "";
    const data = await window.HubApi.getJson("/api/packs");
    assert.equal(data.total, 11);
    const call = fake.calls.find((c) => c.url === "/api/packs");
    assert.equal(call.opts.headers.Authorization, undefined);
  });

  it("renvoie null si le serveur répond 401", async () => {
    const routes401 = { "/api/hub/analytics": { status: 401, body: { error: "unauthorized" } } };
    const f = makeFakeFetch(routes401);
    const prev = globalThis.fetch;
    globalThis.fetch = f.fakeFetch;
    try {
      const data = await window.HubApi.getJson("/api/hub/analytics");
      assert.equal(data, null);
    } finally {
      globalThis.fetch = prev;
    }
  });

  it("renvoie null si le réseau échoue (mode hors-ligne)", async () => {
    const f = makeFakeFetch({});
    const prev = globalThis.fetch;
    globalThis.fetch = f.fakeFetch;
    try {
      const data = await window.HubApi.getJson("/api/packs");
      assert.equal(data, null);
    } finally {
      globalThis.fetch = prev;
    }
  });
});

describe("Dashboard Hub — stats câblées", () => {
  it("remplit les 4 stats depuis analytics/packs/pos", async () => {
    tokenValue = "tok-abc";
    fake = makeFakeFetch(routes);
    globalThis.fetch = fake.fakeFetch;

    await window.HubDashboard.load();

    assert.equal(dom.values["hub-stat-projets"].textContent, "2");
    assert.equal(dom.values["hub-stat-sessions"].textContent, "1");
    assert.equal(dom.values["hub-stat-packs"].textContent, "11");
    assert.equal(dom.values["hub-stat-teams"].textContent, "3");
  });

  it("laisse les tirets si les données sont indisponibles", async () => {
    tokenValue = "";
    for (const id of Object.keys(dom.values)) dom.values[id].textContent = "—";
    fake = makeFakeFetch({});
    globalThis.fetch = fake.fakeFetch;

    await window.HubDashboard.load();

    assert.equal(dom.values["hub-stat-projets"].textContent, "—");
    assert.equal(dom.values["hub-stat-packs"].textContent, "—");
    assert.equal(dom.values["hub-stat-teams"].textContent, "—");
  });

  it("renderDashboard inclut des ancres de stats id", () => {
    const html = window.renderDashboard({ name: "Test" });
    assert.match(html, /id="hub-stat-projets"/);
    assert.match(html, /id="hub-stat-sessions"/);
    assert.match(html, /id="hub-stat-packs"/);
    assert.match(html, /id="hub-stat-teams"/);
  });
});