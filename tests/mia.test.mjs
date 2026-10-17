import test from "node:test";
import assert from "node:assert/strict";
import * as M from "../scripts/engine/mia.js";

const mesa = (manos, extra = {}) => ({
  active: true, turno: 0, fase: "decidir", anuncio: null,
  jugadores: manos.map((dados, i) => ({ actorId: `a${i}`, dados, dadosRestantes: 3 })), ...extra
});

test("el orden cubre las 21 combinaciones, sin repetidos, y Mia es la mayor", () => {
  assert.equal(new Set(M.ORDER).size, 21);
  assert.equal(M.ORDER.at(-1), "21");
  const todas = new Set();
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) todas.add(M.codeFromDice([a, b]));
  assert.deepEqual([...todas].sort(), [...M.ORDER].sort());
});

test("códigos: dado mayor primero, dobles y Mia", () => {
  assert.equal(M.codeFromDice([3, 5]), "53");
  assert.equal(M.codeFromDice([5, 3]), "53");
  assert.equal(M.codeFromDice([4, 4]), "44");
  assert.equal(M.codeFromDice([1, 2]), "21");
  assert.equal(M.codeFromDice([1, 3]), "31");
  assert.ok(M.rank("65") < M.rank("11") && M.rank("66") < M.rank("21"));
  assert.deepEqual(M.diceFromCode("53"), [5, 3]);
});

test("probabilidades suman 1 y son decrecientes", () => {
  assert.equal(M.pAtLeast("31"), 1);
  assert.ok(Math.abs(M.pAtLeast("21") - 2 / 36) < 1e-12);
  assert.ok(Math.abs(M.pAtLeast("66") - 3 / 36) < 1e-12);
  for (let i = 1; i < M.ORDER.length; i++) assert.ok(M.pAtLeast(M.ORDER[i]) < M.pAtLeast(M.ORDER[i - 1]));
});

test("anuncios válidos: solo mayores, y sin previo vale todo", () => {
  assert.equal(M.validAnnouncements(null).length, 21);
  assert.deepEqual(M.validAnnouncements("66"), ["21"]);
  assert.deepEqual(M.validAnnouncements("21"), []);
  const S = mesa([[1, 2], [3, 4]], { fase: "anunciar", anuncio: { codigo: "54", jugadorIx: 0 } });
  assert.ok(M.isValidAnnouncement(S, "61"));
  assert.ok(!M.isValidAnnouncement(S, "54"));
  assert.ok(!M.isValidAnnouncement(S, "41"));
  assert.ok(!M.isValidAnnouncement(S, "99"));
  assert.ok(!M.isValidAnnouncement({ ...S, fase: "decidir" }, "61"));
});

test("frente a Mia no se puede aceptar", () => {
  assert.ok(M.canAccept(mesa([[1, 2], [3, 4]], { anuncio: { codigo: "65", jugadorIx: 0 } })));
  assert.ok(!M.canAccept(mesa([[1, 2], [3, 4]], { anuncio: { codigo: "21", jugadorIx: 0 } })));
  assert.ok(!M.canAccept(mesa([[1, 2], [3, 4]], { fase: "anunciar" })));
});

test("duda: pierde el que duda si era verdad o se quedó corto; si no, el anunciante; Mia vale 2", () => {
  const S = mesa([[6, 5], [3, 4]], { anuncio: { codigo: "64", jugadorIx: 0 } });
  assert.deepEqual(M.resolveDoubt(S, 1), { real: "65", honest: true, loserIx: 1, lives: 1 });
  S.anuncio.codigo = "65";
  assert.equal(M.resolveDoubt(S, 1).loserIx, 1);
  S.anuncio.codigo = "11";
  assert.deepEqual(M.resolveDoubt(S, 1), { real: "65", honest: false, loserIx: 0, lives: 1 });
  S.anuncio.codigo = "21";
  assert.deepEqual(M.resolveDoubt(S, 1), { real: "65", honest: false, loserIx: 0, lives: 2 });
  const T = mesa([[1, 2], [3, 4]], { anuncio: { codigo: "21", jugadorIx: 0 } });
  assert.deepEqual(M.resolveDoubt(T, 1), { real: "21", honest: true, loserIx: 1, lives: 2 });
});

test("las vidas se pierden con applyLosses y empieza el perdedor", () => {
  const S = mesa([[1, 2], [3, 4], [5, 6]]);
  M.applyLosses(S, [1], 2);
  assert.equal(S.jugadores[1].dadosRestantes, 1);
  assert.equal(S.turno, 1);
  const r = M.applyLosses(S, [1], 1);
  assert.equal(r.eliminated.length, 1);
  assert.equal(S.jugadores.length, 2);
});

test("IA: duda siempre frente a Mia y la tramposa solo cuando miente", () => {
  const S = mesa([[6, 5], [3, 4]], { anuncio: { codigo: "21", jugadorIx: 0 } });
  assert.equal(M.decide(S, { ...S.jugadores[1], level: "basic" }).type, "doubt");
  const T = mesa([[6, 5], [3, 4]], { anuncio: { codigo: "64", jugadorIx: 0 } });
  assert.equal(M.decide(T, { ...T.jugadores[1], level: "tramposa" }).type, "accept");
  T.anuncio.codigo = "11";
  assert.equal(M.decide(T, { ...T.jugadores[1], level: "tramposa" }).type, "doubt");
});

test("IA: acepta lo fácil, duda lo improbable y sus anuncios son siempre válidos", () => {
  const facil = mesa([[6, 5], [3, 4]], { anuncio: { codigo: "32", jugadorIx: 0 } });
  assert.equal(M.decide(facil, { ...facil.jugadores[1], level: "experta" }).type, "accept");
  const dificil = mesa([[6, 5], [3, 4]], { anuncio: { codigo: "55", jugadorIx: 0 } });
  assert.equal(M.decide(dificil, { ...dificil.jugadores[1], level: "experta" }).type, "doubt");
  for (const level of Object.keys(M.PERSONALITIES)) {
    for (const dados of [[1, 3], [6, 6], [2, 1], [5, 4]]) {
      for (const prev of [null, "42", "65", "44", "66"]) {
        const S = mesa([[1, 1], dados], { fase: "anunciar", turno: 1, anuncio: prev ? { codigo: prev, jugadorIx: 0 } : null });
        const a = M.decide(S, { ...S.jugadores[1], level }, () => 0.5);
        assert.equal(a.type, "announce");
        assert.ok(M.isValidAnnouncement(S, a.codigo), `${level} ${dados} tras ${prev}: ${a.codigo}`);
      }
    }
  }
});

test("la observadora duda más a un mentiroso conocido", () => {
  const crea = () => mesa([[6, 5], [3, 4]], { anuncio: { codigo: "63", jugadorIx: 0 } });
  const liar = crea(); for (let i = 0; i < 8; i++) M.recordReveal(liar, 0, true);
  const honrado = crea(); for (let i = 0; i < 8; i++) M.recordReveal(honrado, 0, false);
  const j = { actorId: "a1", dados: [3, 4], level: "observadora" };
  assert.equal(M.decide(liar, j).type, "doubt");
  assert.equal(M.decide(honrado, j).type, "accept");
});
