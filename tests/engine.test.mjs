import test from "node:test";
import assert from "node:assert/strict";
import * as E from "../scripts/engine/liars-dice.js";

const mesa = (manos, extra = {}) => ({
  active: true, turno: 0, apuesta: null, onesWild: true, isPalificoRound: false,
  jugadores: manos.map((dados, i) => ({ actorId: `a${i}`, dados, dadosRestantes: dados.length })),
  totalDados: manos.flat().length, ...extra,
});

test("los unos son comodín salvo al apostar unos o en palifico", () => {
  const S = mesa([[1, 2, 2], [1, 3, 6]]);
  assert.equal(E.countFace(S, 2), 4);
  assert.equal(E.countFace(S, 1), 2);
  assert.equal(E.countFace({ ...S, isPalificoRound: true }, 2), 2);
  assert.equal(E.countFace({ ...S, onesWild: false }, 2), 2);
});

test("apuestas válidas e inválidas", () => {
  const S = mesa([[1, 2], [3, 4]], { apuesta: { cantidad: 2, valor: 3, jugadorIx: 0 } });
  assert.ok(E.isValidBet(S, { cantidad: 3, valor: 1 }));
  assert.ok(E.isValidBet(S, { cantidad: 2, valor: 4 }));
  assert.ok(!E.isValidBet(S, { cantidad: 2, valor: 3 }));
  assert.ok(!E.isValidBet(S, { cantidad: 1, valor: 6 }));
  assert.ok(!E.isValidBet(S, { cantidad: 5, valor: 6 }));
  assert.ok(!E.isValidBet(S, { cantidad: 2.5, valor: 6 }));
  assert.ok(!E.isValidBet({ ...S, isPalificoRound: true }, { cantidad: 3, valor: 4 }));
  assert.ok(E.isValidBet({ ...S, isPalificoRound: true }, { cantidad: 3, valor: 3 }));
  assert.ok(E.isValidBet(mesa([[1], [2]]), { cantidad: 1, valor: 1 }));
});

test("solo actúa el dueño del actor al que le toca", () => {
  const S = mesa([[1], [2]], { turno: 1 });
  assert.ok(E.canAct(S, 1, id => id === "a1"));
  assert.ok(!E.canAct(S, 1, id => id === "a0"));
  assert.ok(!E.canAct(S, 0, () => true));
  assert.ok(!E.canAct(null, 0, () => true));
  assert.ok(!E.canAct({ ...S, active: false }, 1, () => true));
});

test("¡Mentira!: pierde el apostador si faltan dados, si no el que duda", () => {
  const S = mesa([[2, 2], [5, 6]], { apuesta: { cantidad: 3, valor: 2, jugadorIx: 0 } });
  assert.deepEqual(E.resolveLie(S, 1), { total: 2, isLiar: true, loserIx: 0 });
  S.apuesta.cantidad = 2;
  assert.deepEqual(E.resolveLie(S, 1), { total: 2, isLiar: false, loserIx: 1 });
});

test("Calzar: acierto quita 1 a los demás, fallo quita 2 al que calza", () => {
  const S = mesa([[2, 2], [5, 6], [3]], { apuesta: { cantidad: 2, valor: 2, jugadorIx: 0 } });
  assert.deepEqual(E.resolveSpotOn(S, 1), { total: 2, correct: true, loserIxs: [0, 2], gainIx: null, diceLost: 1 });
  S.apuesta.cantidad = 3;
  assert.deepEqual(E.resolveSpotOn(S, 1), { total: 2, correct: false, loserIxs: [1], gainIx: null, diceLost: 2 });
});

test("eliminación, turno siguiente y fin de partida", () => {
  const S = mesa([[1], [2, 3], [4, 5]]);
  const r = E.applyLosses(S, [0]);
  assert.equal(r.eliminated.length, 1);
  assert.equal(S.jugadores.length, 2);
  assert.equal(S.turno, 0);
  assert.ok(!r.ended);
  const fin = E.applyLosses(S, [0], 2);
  assert.ok(fin.ended);
  assert.equal(fin.winner.actorId, "a2");
  assert.equal(E.applyLosses(mesa([[1], [2]]), [0, 1]).winner, null);
});

test("binomTail", () => {
  assert.ok(Math.abs(E.binomTail(0, 5, 0.5) - 1) < 1e-12);
  assert.ok(Math.abs(E.binomTail(5, 5, 0.5) - 1 / 32) < 1e-12);
  assert.equal(E.binomTail(3, 2, 0.5), 0);
});

test("rollHand ordena y respeta el rango", () => {
  const h = E.rollHand(50);
  assert.equal(h.length, 50);
  assert.ok(h.every(d => d >= 1 && d <= 6));
  assert.deepEqual(h, [...h].sort((a, b) => a - b));
});

test("IA básica sube cantidad y duda solo en el techo", () => {
  const S = mesa([[1, 2], [3, 4]], { apuesta: { cantidad: 1, valor: 3, jugadorIx: 0 } });
  assert.deepEqual(E.aiBasic(S, S.jugadores[1]), { type: "bet", cantidad: 2, valor: 3 });
  S.apuesta = { cantidad: 4, valor: 6, jugadorIx: 0 };
  assert.deepEqual(E.aiBasic(S, S.jugadores[1]), { type: "lie" });
  S.apuesta = { cantidad: 4, valor: 5, jugadorIx: 0 };
  assert.deepEqual(E.aiBasic(S, S.jugadores[1]), { type: "bet", cantidad: 4, valor: 6 });
});

test("IA experta duda de lo imposible y apuesta lo que tiene", () => {
  const S = mesa([[6, 6, 6], [2, 3]], { apuesta: { cantidad: 5, valor: 4, jugadorIx: 0 } });
  assert.equal(E.aiExpert(S, S.jugadores[1]).type, "lie");
  const T = mesa([[6, 6, 6], [2, 3]]);
  const a = E.aiExpert(T, T.jugadores[0]);
  assert.equal(a.type, "bet");
  assert.ok(E.isValidBet(T, a));
});

test("IA tramposa conoce los dados: duda si miente, sube si no", () => {
  const S = mesa([[2, 2], [5, 6]], { apuesta: { cantidad: 3, valor: 2, jugadorIx: 0 } });
  assert.equal(E.aiCheater(S).type, "lie");
  S.apuesta.cantidad = 1;
  const a = E.aiCheater(S);
  assert.equal(a.type, "bet");
  assert.ok(E.isValidBet(S, a));
});

test("decide elige IA por nivel y cae en básica", () => {
  const S = mesa([[1], [2]]);
  assert.equal(E.decide(S, { level: "basic", dados: [1], dadosRestantes: 1 }, () => 0.5).type, "bet");
  assert.equal(E.decide(S, { level: "x", dados: [1], dadosRestantes: 1 }, () => 0.5).type, "bet");
});

test("Calzar clásico: acierto gana un dado (con tope) y empieza quien calza; fallo pierde uno", () => {
  const S = mesa([[2, 2], [5, 6], [3]], { apuesta: { cantidad: 2, valor: 2, jugadorIx: 0 }, spotOnRule: "clasica", startDice: 3 });
  assert.deepEqual(E.resolveSpotOn(S, 1), { total: 2, correct: true, loserIxs: [], gainIx: 1, diceLost: 0 });
  E.applyGain(S, 1);
  assert.equal(S.jugadores[1].dadosRestantes, 3);
  assert.equal(S.turno, 1);
  E.applyGain(S, 1);
  assert.equal(S.jugadores[1].dadosRestantes, 3);
  S.apuesta.cantidad = 3;
  assert.deepEqual(E.resolveSpotOn(S, 1), { total: 2, correct: false, loserIxs: [1], gainIx: null, diceLost: 1 });
});

test("Palifico de la casa: basta con que alguien tenga 1 dado", () => {
  const S = mesa([[1], [2, 3]], { palificoRule: true });
  assert.ok(E.isPalificoRound(S));
  assert.ok(!E.isPalificoRound({ ...S, palificoRule: false }));
  assert.ok(!E.isPalificoRound(mesa([[1, 2], [2, 3]], { palificoRule: true })));
});

test("Palifico clásico: solo abre quien tiene 1 dado y una vez", () => {
  const S = mesa([[1], [2, 3]], { palificoRule: true, palificoMode: "clasica", turno: 1 });
  assert.ok(!E.isPalificoRound(S));
  S.turno = 0;
  assert.ok(E.isPalificoRound(S));
  assert.ok(!E.isPalificoRound(S));
});

test("memoria: quien miente más sube su tasa de mentiroso", () => {
  const S = mesa([[1], [2]]);
  assert.equal(E.liarRate(S, 0), 0.5);
  E.recordReveal(S, 0, true); E.recordReveal(S, 0, true);
  E.recordReveal(S, 1, false); E.recordReveal(S, 1, false);
  assert.ok(E.liarRate(S, 0) > 0.7);
  assert.ok(E.liarRate(S, 1) < 0.3);
});

test("observadora duda a un mentiroso conocido y deja pasar a uno honrado", () => {
  // Probabilidad real de la apuesta 3×5 para la observadora: 7/27 ≈ 0,26 (umbral base 0,3).
  const crea = () => mesa([[6, 6, 6], [5, 2, 3]], { apuesta: { cantidad: 3, valor: 5, jugadorIx: 0 } });
  const liar = crea(); for (let i = 0; i < 6; i++) E.recordReveal(liar, 0, true);
  const honrado = crea(); for (let i = 0; i < 6; i++) E.recordReveal(honrado, 0, false);
  const opts = { memory: true, callBelow: 0.3, bluff: 1, rng: () => 0 };
  assert.equal(E.aiExpert(liar, liar.jugadores[1], opts).type, "lie");
  assert.equal(E.aiExpert(honrado, honrado.jugadores[1], opts).type, "bet");
});

test("farolera sube lo mínimo en vez de dudar; cauta duda", () => {
  const S = mesa([[6, 6, 6], [2, 3], [4, 4]], { apuesta: { cantidad: 5, valor: 4, jugadorIx: 0 } });
  const j = S.jugadores[1];
  assert.deepEqual(E.aiExpert(S, j, { bluff: 1, callBelow: 0, betAbove: 0.99, rng: () => 0 }), { type: "bet", cantidad: 6, valor: 4 });
  assert.equal(E.aiExpert(S, j, { bluff: 0, callBelow: 0, betAbove: 0.99 }).type, "lie");
  assert.equal(E.decide(S, { ...j, level: "cauta" }).type, "lie");
  assert.ok(["bet", "lie"].includes(E.decide(S, { ...j, level: "farolera" }, () => 0).type));
});
