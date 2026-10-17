// Motor de reglas del Dado del Mentiroso. Puro: sin Foundry, sin I/O. Lo prueba tests/engine.test.mjs.
// Estado: { jugadores:[{actorId,dadosRestantes,dados}], turno, apuesta:{cantidad,valor,jugadorIx}|null, totalDados, onesWild, isPalificoRound }

export const useWilds = S => !!S.onesWild && !S.isPalificoRound;

export const rollHand = (n, rng = Math.random) =>
  Array.from({ length: n }, () => 1 + Math.floor(rng() * 6)).sort((a, b) => a - b);

/** Dados de toda la mesa que cuentan para `valor` (los 1 son comodín salvo apostando 1 o en palifico). */
export function countFace(S, valor) {
  const wild = useWilds(S) && valor !== 1;
  return S.jugadores.flatMap(j => j.dados).filter(d => d === valor || (wild && d === 1)).length;
}

export function isValidBet(S, { cantidad, valor }) {
  if (!Number.isInteger(cantidad) || !Number.isInteger(valor)) return false;
  if (cantidad < 1 || cantidad > S.totalDados || valor < 1 || valor > 6) return false;
  const p = S.apuesta;
  if (!p) return true;
  if (S.isPalificoRound && valor !== p.valor) return false;
  return cantidad > p.cantidad || (cantidad === p.cantidad && valor > p.valor);
}

/** ¿Puede actuar el jugador `ix`? `ownsActor(actorId)` lo aporta Foundry. */
export function canAct(S, ix, ownsActor) {
  const j = S?.jugadores?.[ix];
  return !!(S?.active && j && S.turno === ix && ownsActor(j.actorId));
}

export function resolveLie(S, callerIx) {
  const p = S.apuesta;
  const total = countFace(S, p.valor);
  const isLiar = total < p.cantidad;
  return { total, isLiar, loserIx: isLiar ? p.jugadorIx : callerIx };
}

/** Calzar. Casa: acierto → los demás pierden 1, fallo → pierdes 2. Clásica: acierto → ganas 1 dado, fallo → pierdes 1. */
export function resolveSpotOn(S, callerIx) {
  const p = S.apuesta;
  const total = countFace(S, p.valor);
  const correct = total === p.cantidad;
  if (S.spotOnRule === "clasica") {
    return correct
      ? { total, correct, loserIxs: [], gainIx: callerIx, diceLost: 0 }
      : { total, correct, loserIxs: [callerIx], gainIx: null, diceLost: 1 };
  }
  return correct
    ? { total, correct, loserIxs: S.jugadores.map((_, i) => i).filter(i => i !== callerIx), gainIx: null, diceLost: 1 }
    : { total, correct, loserIxs: [callerIx], gainIx: null, diceLost: 2 };
}

/** Calzar clásico acertado: +1 dado (sin pasar de los iniciales) y empieza quien calzó. Muta S. */
export function applyGain(S, ix) {
  const j = S.jugadores[ix];
  j.dadosRestantes = Math.min(S.startDice ?? Infinity, j.dadosRestantes + 1);
  S.turno = ix;
}

/** ¿La ronda que va a empezar es palifico? Clásico: solo quien abre con 1 dado y una vez. Casa: si alguien tiene 1. Muta palificoUsado. */
export function isPalificoRound(S) {
  if (!S.palificoRule) return false;
  if (S.palificoMode !== "clasica") return S.jugadores.some(p => p.dadosRestantes === 1);
  const starter = S.jugadores[S.turno];
  if (starter?.dadosRestantes === 1 && !starter.palificoUsado) { starter.palificoUsado = true; return true; }
  return false;
}

/** Memoria de la mesa: cuántas veces pillaron en mentira al apostador. */
export function recordReveal(S, bettorIx, wasLiar) {
  const id = S.jugadores[bettorIx]?.actorId;
  if (!id) return;
  S.memoria ??= {};
  const m = (S.memoria[id] ??= { mentiras: 0, apuestas: 0 });
  m.apuestas++;
  if (wasLiar) m.mentiras++;
}

export function liarRate(S, ix) {
  const m = S.memoria?.[S.jugadores[ix]?.actorId];
  return ((m?.mentiras ?? 0) + 1) / ((m?.apuestas ?? 0) + 2);
}

/** Resta dados, quita eliminados y calcula el turno siguiente. Muta S. */
export function applyLosses(S, loserIxs, diceLost = 1) {
  const old = S.jugadores;
  const nextId = old[loserIxs[0]]?.actorId;
  const eliminated = [];
  for (const i of loserIxs) {
    const l = old[i];
    if (!l) continue;
    l.dadosRestantes = Math.max(0, l.dadosRestantes - diceLost);
    if (l.dadosRestantes === 0) eliminated.push(l);
  }
  S.jugadores = old.filter(p => p.dadosRestantes > 0);
  const ended = S.jugadores.length <= 1;
  if (!ended) {
    S.turno = S.jugadores.findIndex(p => p.actorId === nextId);
    if (S.turno === -1) S.turno = old.findIndex(p => p.actorId === nextId) % S.jugadores.length;
  }
  return { eliminated, ended, winner: ended ? S.jugadores[0] ?? null : null };
}

export function binomTail(k, n, p) {
  const coeff = (m, r) => { let x = 1; for (let i = 1; i <= r; i++) x = x * (m - i + 1) / i; return x; };
  let result = 0;
  for (let i = Math.max(0, k); i <= n; i++) result += coeff(n, i) * p ** i * (1 - p) ** (n - i);
  return result;
}

// --- IA: devuelven { type:"bet", cantidad, valor } o { type:"lie" } ---

export function aiBasic(S, j, rng = Math.random) {
  const p = S.apuesta;
  if (!p) return { type: "bet", cantidad: 1, valor: Math.ceil(rng() * 6) };
  if (S.isPalificoRound || p.cantidad < S.totalDados) return { type: "bet", cantidad: p.cantidad + 1, valor: p.valor };
  if (p.valor < 6) return { type: "bet", cantidad: p.cantidad, valor: p.valor + 1 };
  return { type: "lie" };
}

export function aiExpert(S, j, opts = {}) {
  const { callBelow = 0.3, betAbove = 0.35, bluff = 0, memory = false, rng = Math.random } = opts;
  const p = S.apuesta;
  const own = {};
  for (const d of j.dados) own[d] = (own[d] || 0) + 1;
  if (useWilds(S) && own[1]) for (const d of [2, 3, 4, 5, 6]) own[d] = (own[d] || 0) + own[1];
  const rest = S.totalDados - j.dadosRestantes;
  const pDie = v => (v === 1 || !useWilds(S)) ? 1 / 6 : 2 / 6;
  if (p) {
    // La observadora duda más de quien suele mentir y menos de quien no.
    const call = memory ? callBelow * (0.6 + 0.8 * liarRate(S, p.jugadorIx)) : callBelow;
    const need = p.cantidad - (own[p.valor] || 0);
    if (need > 0 && binomTail(need, rest, pDie(p.valor)) < call) return { type: "lie" };
  }
  for (let c = p ? p.cantidad : 1; c <= S.totalDados; c++) {
    const startV = (S.isPalificoRound && p) ? p.valor : ((p && c === p.cantidad) ? p.valor + 1 : 1);
    for (let v = startV; v <= 6; v++) {
      if (S.isPalificoRound && p && v !== p.valor) continue;
      const need = c - (own[v] || 0);
      if (need >= 0 && binomTail(need, rest, pDie(v)) >= betAbove) return { type: "bet", cantidad: c, valor: v };
    }
  }
  // Sin apuesta segura: la farolera a veces sube lo mínimo en vez de dudar.
  if (p && bluff && rng() < bluff) {
    const b = { cantidad: p.cantidad + 1, valor: p.valor };
    if (isValidBet(S, b)) return { type: "bet", ...b };
  }
  return { type: "lie" };
}

/** Personalidades: la experta con otros umbrales. */
export const PERSONALITIES = {
  farolera: { bluff: 0.6, betAbove: 0.25, callBelow: 0.2 },
  cauta: { callBelow: 0.45, betAbove: 0.5 },
  observadora: { memory: true }
};

export function aiCheater(S) {
  const p = S.apuesta;
  const counts = {};
  S.jugadores.forEach(pl => pl.dados.forEach(d => counts[d] = (counts[d] || 0) + 1));
  const wild = v => (v === 1 || !useWilds(S)) ? counts[v] || 0 : (counts[v] || 0) + (counts[1] || 0);
  if (p && wild(p.valor) < p.cantidad) return { type: "lie" };
  let bestV = 1, bestC = wild(1);
  for (let v = 2; v <= 6; v++) { const c = wild(v); if (c > bestC) { bestC = c; bestV = v; } }
  let c, v;
  if (!p) { c = bestC; v = bestV; }
  else if (S.isPalificoRound) { c = p.cantidad + 1; v = p.valor; }
  else if (bestC > p.cantidad) { c = bestC; v = bestV; }
  else if (bestC === p.cantidad) { c = bestC; v = Math.max(p.valor + 1, bestV); }
  else { c = p.cantidad + 1; v = p.valor; }
  if (v > 6) { c++; v = 1; }
  if (c > S.totalDados) return { type: "lie" };
  return { type: "bet", cantidad: c, valor: v };
}

export const AI = {
  basic: aiBasic, experta: aiExpert, tramposa: aiCheater,
  ...Object.fromEntries(Object.entries(PERSONALITIES).map(([k, o]) => [k, (S, j, rng) => aiExpert(S, j, { ...o, rng: rng ?? Math.random })]))
};
export const decide = (S, j, rng) => (AI[j.level] ?? aiBasic)(S, j, rng);
