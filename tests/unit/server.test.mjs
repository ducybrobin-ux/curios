/* server.test.mjs — Tests unitaires pour @curios/server
 *
 * Tests des endpoints API et de la logique métier.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "../../packages/server/src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

let server;
let baseUrl;
let authToken;

function fetch(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = { ...options.headers };
    if (options.auth && authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers,
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          resolve({
            status: res.statusCode,
            json: () => JSON.parse(body),
            text: () => body,
          });
        });
      }
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function jsonPost(path, data, options = {}) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
}

before(async () => {
  // Nettoyer l'ancien mot de passe s'il existe
  const authFile = path.join(ROOT, "data", "auth.json");
  if (fs.existsSync(authFile)) fs.unlinkSync(authFile);

  const { server: s, config } = createServer({ root: ROOT, port: 0 });
  server = s;
  await new Promise((resolve) => server.listen(0, resolve));
  const addr = server.address();
  baseUrl = `http://localhost:${addr.port}`;

  // Setup du mot de passe
  const setupRes = await jsonPost("/api/auth/setup", { password: "test1234" });
  assert.equal(setupRes.status, 200);
  authToken = (await setupRes.json()).token;
});

after(() => {
  server.closeAllConnections();
  server.close();
  // Nettoyer
  const authFile = path.join(ROOT, "data", "auth.json");
  if (fs.existsSync(authFile)) fs.unlinkSync(authFile);
});

describe("GET /api/ip", () => {
  it("returns server IP info", async () => {
    const res = await fetch("/api/ip");
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(data.ip);
    assert.ok(data.port);
    assert.ok(data.url);
    assert.ok(data.lanUrl);
  });
});

describe("Auth", () => {
  it("setup creates password and returns token", async () => {
    // Already done in before(), but test the /me endpoint
    const res = await fetch("/api/auth/me", { auth: true });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.authenticated, true);
  });

  it("rejects wrong password", async () => {
    const res = await jsonPost("/api/auth/login", { password: "wrong" });
    assert.equal(res.status, 401);
  });

  it("accepts correct password", async () => {
    const res = await jsonPost("/api/auth/login", { password: "test1234" });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(data.token);
  });

  it("rejects unauthenticated POST to protected endpoints", async () => {
    const res = await jsonPost("/api/editor", { test: true });
    assert.equal(res.status, 401);
  });

  it("allows authenticated POST to protected endpoints", async () => {
    const res = await jsonPost("/api/editor", { test: true }, { auth: true });
    assert.equal(res.status, 200);
  });

  it("allows unauthenticated GET to /api/editor", async () => {
    const res = await fetch("/api/editor");
    assert.equal(res.status, 200);
  });

  it("rejects unauthenticated GET to /api/report", async () => {
    const res = await fetch("/api/report");
    assert.equal(res.status, 401);
  });

  it("allows authenticated GET to /api/report", async () => {
    const res = await fetch("/api/report", { auth: true });
    assert.equal(res.status, 200);
  });

  it("logout invalidates token", async () => {
    const loginRes = await jsonPost("/api/auth/login", { password: "test1234" });
    const tempToken = (await loginRes.json()).token;

    // Use temp token
    const meRes = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert.equal(meRes.status, 200);

    // Logout
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${tempToken}` },
    });

    // Token should be invalid now
    const meRes2 = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${tempToken}` },
    });
    assert.equal(meRes2.status, 401);
  });
});

describe("GET /api/board", () => {
  it("returns initial board state", async () => {
    const res = await fetch("/api/board");
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.seq, 0);
    assert.deepEqual(data.message, {});
    assert.equal(data.challenge, null);
    assert.equal(data.challengeSeq, 0);
    assert.deepEqual(data.logoutTeams, []);
    assert.equal(data.logoutSeq, 0);
  });
});

describe("POST /api/board message", () => {
  it("broadcasts a message", async () => {
    const res = await jsonPost("/api/board", {
      action: "message",
      text: "Bonjour tout le monde !",
    }, { auth: true });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.ok, true);
    assert.ok(data.seq > 0);

    // Verify the message is now on the board
    const board = await fetch("/api/board");
    const state = board.json();
    assert.equal(state.message.fr, "Bonjour tout le monde !");
    assert.equal(state.seq, data.seq);
  });
});

describe("POST /api/board challenge", () => {
  it("pushes a challenge (strips answer)", async () => {
    const res = await jsonPost("/api/board", {
      action: "challenge",
      challenge: { id: "q1", question: "Combien font 2+2 ?", answer: "4" },
    }, { auth: true });
    assert.equal(res.status, 200);

    const board = await fetch("/api/board");
    const state = board.json();
    assert.ok(state.challenge);
    assert.equal(state.challenge.id, "q1");
    assert.equal(state.challenge.answer, undefined); // stripped
  });
});

describe("POST /api/board clear", () => {
  it("clears message and challenge", async () => {
    const res = await jsonPost("/api/board", { action: "clear" }, { auth: true });
    assert.equal(res.status, 200);

    const board = await fetch("/api/board");
    const state = board.json();
    assert.deepEqual(state.message, {});
    assert.equal(state.challenge, null);
  });
});

describe("POST /api/answer", () => {
  it("accepts an answer", async () => {
    const res = await jsonPost("/api/answer", {
      team: "Famille Dupont",
      text: "4",
      challengeId: "q1",
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);

    const answers = await fetch("/api/answers");
    const data = answers.json();
    assert.equal(data.answers.length, 1);
    assert.equal(data.answers[0].team, "Famille Dupont");
    assert.equal(data.answers[0].text, "4");
  });
});

describe("POST /api/pos", () => {
  it("records a GPS position", async () => {
    const res = await jsonPost("/api/pos", {
      team: "Famille Martin",
      lat: 46.03,
      lng: 2.55,
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);

    const positions = await fetch("/api/pos");
    const data = positions.json();
    assert.ok(data.positions.length > 0);
    assert.equal(data.positions[0].team, "Famille Martin");
  });
});

describe("POST /api/finish", () => {
  it("records a team finish", async () => {
    const res = await jsonPost("/api/finish", {
      team: "Famille Dupont",
      stars: 5,
      seconds: 1200,
      balises: 8,
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);

    const finishes = await fetch("/api/finish");
    const data = finishes.json();
    assert.ok(data.finishes.length > 0);
    assert.equal(data.finishes[0].team, "Famille Dupont");
    assert.equal(data.finishes[0].stars, 5);
  });
});

describe("POST /api/validations", () => {
  it("validates a balise for a team", async () => {
    const res = await jsonPost("/api/validations", {
      team: "Famille Dupont",
      balise: "B1",
    });
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok(data.balises.includes("B1"));

    const all = await fetch("/api/validations");
    const allData = all.json();
    assert.ok(allData.validations["Famille Dupont"]);
    assert.ok(allData.validations["Famille Dupont"].includes("B1"));
  });
});

describe("POST /api/urgency", () => {
  it("records an urgency alert", async () => {
    const res = await jsonPost("/api/urgency", {
      team: "Famille Martin",
      type: "lost",
      lat: 46.03,
      lng: 2.55,
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);

    const urgencies = await fetch("/api/urgency");
    const data = urgencies.json();
    assert.ok(data.urgencies.length > 0);
    assert.equal(data.urgencies[0].team, "Famille Martin");
    assert.equal(data.urgencies[0].type, "lost");
  });
});

describe("POST /api/urgency/resolve", () => {
  it("resolves an urgency", async () => {
    const res = await jsonPost("/api/urgency/resolve", {
      team: "Famille Martin",
    });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);

    const urgencies = await fetch("/api/urgency");
    const data = urgencies.json();
    const open = data.urgencies.filter((u) => u.team === "Famille Martin");
    assert.equal(open.length, 0);
  });
});

describe("GET /api/wifi", () => {
  it("returns wifi config", async () => {
    const res = await fetch("/api/wifi");
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok("ssid" in data);
    assert.ok("password" in data);
    assert.ok("security" in data);
  });
});

describe("GET /api/map", () => {
  it("returns map URL", async () => {
    const res = await fetch("/api/map");
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok("url" in data);
  });
});

describe("GET /api/editor", () => {
  it("returns editor data", async () => {
    const res = await fetch("/api/editor");
    assert.equal(res.status, 200);
    const data = res.json();
    assert.ok("data" in data);
  });
});

describe("Packs API", () => {
  it("GET /api/packs lists the active pack", async () => {
    const res = await fetch("/api/packs");
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.ok, true);
    // Le pack actif (par défaut packdemo) est marqué ACTIVE, les autres ne le sont pas.
    const actifs = data.packs.filter((p) => p.state === "ACTIVE");
    assert.equal(actifs.length, 1);
    assert.equal(actifs[0].id, "packdemo");
    const phantom = data.packs.find((p) => p.id === "phantom-cybersecurite");
    assert.ok(phantom, "phantom-cybersecurite must be listed");
    assert.equal(phantom.state, "DISABLED");
  });

  it("GET /api/packs/:id returns the pack bundle", async () => {
    const res = await fetch("/api/packs/phantom-cybersecurite");
    assert.equal(res.status, 200);
    const data = res.json();
    assert.equal(data.ok, true);
    assert.equal(data.id, "phantom-cybersecurite");
    assert.equal(data.bundle.pack.id, "phantom-cybersecurite");
    assert.equal(data.bundle.balises.length, 9);
    assert.equal(data.bundle.decouvertes.length, 9);
  });

  it("GET /api/packs/:id 404 for unknown pack", async () => {
    const res = await fetch("/api/packs/inexistant");
    assert.equal(res.status, 404);
  });

  it("POST /api/packs/activate requires auth", async () => {
    const res = await jsonPost("/api/packs/activate", { id: "phantom-cybersecurite" });
    assert.equal(res.status, 401);
  });
});

describe("Static files", () => {
  it("serves index.html", async () => {
    const res = await fetch("/");
    assert.equal(res.status, 200);
    const text = res.text();
    assert.ok(text.includes("<!DOCTYPE html>") || text.includes("<html"));
  });

  it("sert les pages sans extension (URLs nues → .html)", async () => {
    for (const path of ["/editeur", "/dashboard", "/atelier", "/studio", "/catalogue"]) {
      const res = await fetch(path);
      assert.equal(res.status, 200, `GET ${path} doit être servi`);
      const text = res.text();
      assert.ok(text.includes("<!DOCTYPE html>") || text.includes("<html"), `${path} doit renvoyer du HTML`);
    }
  });

  it("renvoie 404 pour un chemin sans extension inexistant", async () => {
    const res = await fetch("/aucune-page-existante-xyz");
    assert.equal(res.status, 404);
  });
});
