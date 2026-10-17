import test from "node:test";
import assert from "node:assert/strict";
import * as F from "../scripts/engine/farkle.js";

const mesa = (extra = {}) => {
  const S = { jugadores: [{ actorId: "a", puntos: 0, enTablero: false, level: "experta" }, { actorId: "b", puntos: 0, enTablero: false, level: "basic" }],
    turno: 0, meta: 10000, entrada: 0, ultimaVuelta: null, ...extra };
  F.newTurn(S);
  return S;
};

test("puntuación de combinaciones", () => {
  const casos = [[[1], 100], [[5], 50], [[1, 5], 150], [[2], null], [[2, 2, 2], 200], [[1, 1, 1], 1000], [[3, 3, 3], 300],
    [[1, 1, 1, 1], 2000], [[3, 3, 3, 3], 600], [[5, 5, 5, 5, 5], 2000], [[6, 6, 6, 6, 6, 6], 4800],
    [[1, 1, 1, 5], 1050], [[2, 2, 2, 3], null], [[1, 2, 3, 4, 5, 6], 1500], [[2, 2, 3, 3, 4, 4], 1500], [[1, 1, 2, 2, 3, 3], 1500],
    [[2, 2, 2, 2, 3, 3], null], [[], null]];
  for (const [dice, esperado] of casos) assert.equal(F.scoreSet(dice), esperado, JSON.stringify(dice));
});

test("hasScoring: farkle cuando nada puntúa", () => {
  assert.ok(F.hasScoring([2, 3, 4, 6, 6, 6]));
  assert.ok(F.hasScoring([2, 3, 4, 6, 6, 5]));
  assert.ok(F.hasScoring([1, 2, 3, 4, 5, 6]));
  assert.ok(!F.hasScoring([2, 2, 3, 4, 6, 6]));
  assert.ok(!F.hasScoring([2, 3, 4, 6]));
});

test("selecciones posibles", () => {
  const s = F.scoringSubsets([1, 5, 2, 2, 3, 4]);
  assert.deepEqual(s.map(x => x.score).sort((a, b) => a - b), [50, 100, 150]);
  assert.ok(F.scoringSubsets([2, 3, 4, 6, 6, 2]).length === 0);
});

test("tirada con farkle pierde lo acumulado", () => {
  const S = mesa({ turnoPts: 0 });
  S.turnoPts = 450;
  assert.deepEqual(F.applyRoll(S, [2, 2, 3, 4, 6, 6]), { farkle: true });
  assert.equal(S.turnoPts, 0);
  const T = mesa();
  assert.deepEqual(F.applyRoll(T, [1, 2, 3, 4, 4, 6]), { farkle: false });
  assert.equal(T.fase, "elegir");
});

test("apartar y seguir tirando; selección inválida se rechaza", () => {
  const S = mesa();
  F.applyRoll(S, [1, 5, 2, 3, 3, 4]);
  assert.equal(F.applyKeep(S, [2], false).ok, false);            // un 2 no puntúa
  assert.equal(F.applyKeep(S, [], false).ok, false);
  assert.equal(F.applyKeep(S, [9], false).ok, false);
  const r = F.applyKeep(S, [0], false);
  assert.deepEqual([r.ok, r.score, r.hot], [true, 100, false]);
  assert.equal(S.turnoPts, 100);
  assert.equal(S.dadosLibres, 5);
  assert.equal(S.fase, "tirar");
});

test("dados calientes: con los seis puntuando se vuelven a tirar los seis", () => {
  const S = mesa();
  F.applyRoll(S, [1, 2, 3, 4, 5, 6]);
  const r = F.applyKeep(S, [0, 1, 2, 3, 4, 5], false);
  assert.ok(r.hot);
  assert.equal(S.turnoPts, 1500);
  assert.equal(S.dadosLibres, 6);
});

test("plantarse suma, y la entrada mínima bloquea hasta alcanzarla", () => {
  const S = mesa({ entrada: 500 });
  F.applyRoll(S, [1, 5, 2, 3, 3, 4]);
  assert.deepEqual(F.applyKeep(S, [0], true), { ok: false, error: "entrada" });
  assert.equal(S.jugadores[0].puntos, 0);
  S.turnoPts = 400;
  const r = F.applyKeep(S, [0], true);
  assert.ok(r.ok);
  assert.equal(S.jugadores[0].puntos, 500);
  assert.ok(S.jugadores[0].enTablero);
  // ya en tablero: sin mínimo
  S.jugadores[1].enTablero = true;
  S.turno = 1; F.newTurn(S); F.applyRoll(S, [5, 2, 3, 3, 4, 6]);
  assert.ok(F.applyKeep(S, [0], true).ok);
  assert.equal(S.jugadores[1].puntos, 50);
});

test("meta y última vuelta: el resto juega una vez más y gana el que más tiene", () => {
  const S = mesa({ meta: 1000 });
  S.jugadores[0].puntos = 950; S.jugadores[0].enTablero = true;
  F.applyRoll(S, [5, 2, 3, 3, 4, 6]);
  F.applyKeep(S, [0], true);
  assert.equal(S.ultimaVuelta, 0);
  assert.equal(S.jugadores[0].puntos, 1000);
  assert.deepEqual(F.endTurn(S), { ended: false });              // turno de b
  assert.equal(S.turno, 1);
  S.jugadores[1].puntos = 1100;                                  // b supera en su última vuelta
  const fin = F.endTurn(S);
  assert.ok(fin.ended);
  assert.equal(fin.winner.actorId, "b");
});

test("IA: sus selecciones siempre puntúan y respeta la entrada", () => {
  let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const level of Object.keys(F.PERSONALITIES)) {
    for (let i = 0; i < 200; i++) {
      const S = mesa({ entrada: i % 2 ? 500 : 0 });
      S.jugadores[0].level = level;
      const dice = F.rollHand(1 + Math.floor(rng() * 6), rng);
      S.dadosLibres = dice.length;
      if (!F.hasScoring(dice)) continue;
      S.fase = "elegir"; S.mesa = dice; S.turnoPts = Math.floor(rng() * 4) * 100;
      const a = F.decide(S, S.jugadores[0]);
      assert.equal(a.type, "keep");
      assert.notEqual(F.scoreSet(a.indices.map(k => dice[k])), null, `${level} ${dice}`);
      if (a.bank) assert.ok(S.jugadores[0].enTablero || S.turnoPts + F.scoreSet(a.indices.map(k => dice[k])) >= S.entrada);
    }
  }
  assert.deepEqual(F.decide(mesa(), { level: "basic", puntos: 0 }), { type: "roll" });
});

test("IA cauta se planta antes que la farolera con las mismas condiciones", () => {
  const S = mesa();
  S.fase = "elegir"; S.mesa = [1, 2, 3, 4]; S.turnoPts = 300; S.dadosLibres = 4;   // tras apartar el 1 quedan 3 dados y 400 puntos
  S.jugadores[0].enTablero = true;
  const cauta = F.decide(S, { ...S.jugadores[0], level: "cauta" });
  const farolera = F.decide(S, { ...S.jugadores[0], level: "farolera" });
  assert.equal(cauta.bank, true);
  assert.equal(farolera.bank, false);
});
