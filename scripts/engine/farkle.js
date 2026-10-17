// Motor de reglas de Diez Mil / Farkle. Puro: sin Foundry. Lo prueba tests/farkle.test.mjs.
// Estado: { jugadores:[{actorId,puntos,enTablero}], turno, fase:"tirar"|"elegir", mesa:[dados tirados], apartados:[[dados]],
//           turnoPts, dadosLibres, meta, entrada, ultimaVuelta:null|ix }
// Puntuación: 1 = 100, 5 = 50; trío = valor×100 (los unos 1000); cuarteto ×2, quinteto ×4, sexteto ×8 sobre el trío;
// escalera 1-6 = 1500; tres parejas = 1500. Si ningún dado puntúa: FARKLE (se pierde lo acumulado en el turno).
// Con los seis dados puntuando («dados calientes») se vuelven a tirar los seis.

export { rollHand } from "./liars-dice.js";

export const FULL = 6;

const counts = dice => { const c = [0, 0, 0, 0, 0, 0, 0]; for (const d of dice) c[d]++; return c; };

/** Puntos si TODOS los dados dados puntúan; null si alguno sobra (o no hay dados). */
export function scoreSet(dice) {
  if (!dice.length) return null;
  const c = counts(dice);
  if (dice.length === FULL) {
    if (c.slice(1).every(n => n === 1)) return 1500;
    if (c.slice(1).filter(n => n === 2).length === 3) return 1500;
  }
  let total = 0;
  for (let v = 1; v <= 6; v++) {
    const n = c[v];
    if (!n) continue;
    if (n >= 3) total += (v === 1 ? 1000 : v * 100) * 2 ** (n - 3);
    else if (v === 1) total += 100 * n;
    else if (v === 5) total += 50 * n;
    else return null;
  }
  return total;
}

/** ¿Hay alguna forma de puntuar con estos dados? */
export function hasScoring(dice) {
  const c = counts(dice);
  if (c[1] || c[5] || c.some(n => n >= 3)) return true;
  return dice.length === FULL && scoreSet(dice) !== null;
}

/** Todas las selecciones posibles que puntúan por completo: [{indices, score}]. */
export function scoringSubsets(dice) {
  const out = [];
  for (let mask = 1; mask < 1 << dice.length; mask++) {
    const indices = [];
    for (let i = 0; i < dice.length; i++) if (mask & (1 << i)) indices.push(i);
    const score = scoreSet(indices.map(i => dice[i]));
    if (score !== null) out.push({ indices, score });
  }
  return out;
}

export function newTurn(S) {
  S.fase = "tirar";
  S.mesa = [];
  S.apartados = [];
  S.turnoPts = 0;
  S.dadosLibres = FULL;
}

/** Registra una tirada. Si no puntúa: farkle (turnoPts a 0). Muta S. */
export function applyRoll(S, dice) {
  S.mesa = [...dice];
  if (!hasScoring(dice)) { S.turnoPts = 0; return { farkle: true }; }
  S.fase = "elegir";
  return { farkle: false };
}

/** Aparta dados (todos deben puntuar) y sigue tirando o se planta. Muta S. */
export function applyKeep(S, indices, bank) {
  if (S.fase !== "elegir") return { ok: false, error: "fase" };
  const idx = [...new Set(indices)];
  if (!idx.length || idx.some(i => !Number.isInteger(i) || i < 0 || i >= S.mesa.length)) return { ok: false, error: "seleccion" };
  const kept = idx.map(i => S.mesa[i]);
  const score = scoreSet(kept);
  if (score === null) return { ok: false, error: "seleccion" };
  const me = S.jugadores[S.turno];
  const total = S.turnoPts + score;
  if (bank && !me.enTablero && total < S.entrada) return { ok: false, error: "entrada" };

  S.turnoPts = total;
  S.apartados.push(kept);
  const left = S.mesa.filter((_, i) => !idx.includes(i));
  const hot = left.length === 0;
  S.mesa = [];
  S.dadosLibres = hot ? FULL : left.length;
  if (hot) S.apartados = [];
  if (!bank) { S.fase = "tirar"; return { ok: true, score, hot, banked: 0 }; }

  me.puntos += S.turnoPts;
  me.enTablero = true;
  const banked = S.turnoPts;
  if (S.ultimaVuelta == null && me.puntos >= S.meta) S.ultimaVuelta = S.turno;
  return { ok: true, score, hot, banked, bank: true };
}

/** Pasa el turno. Devuelve { ended, winner } (la última vuelta termina al volver al que llegó a la meta). */
export function endTurn(S) {
  S.turno = (S.turno + 1) % S.jugadores.length;
  if (S.ultimaVuelta != null && S.turno === S.ultimaVuelta) {
    const winner = S.jugadores.reduce((best, j) => (j.puntos > best.puntos ? j : best), S.jugadores[S.ultimaVuelta]);
    return { ended: true, winner };
  }
  newTurn(S);
  return { ended: false };
}

// --- IA ---

/** Probabilidad de farkle con n dados y ganancia media esperada de una tirada. */
const P_FARKLE = [0, 2 / 3, 4 / 9, 0.2778, 0.1574, 0.0772, 0.0231];
const GAIN = [0, 60, 110, 190, 260, 330, 400];

export const PERSONALITIES = {
  basic: { risk: 0.7 },
  experta: { risk: 1 },
  cauta: { risk: 0.5 },
  farolera: { risk: 1.6 },
  observadora: { risk: 1, adaptive: true },
  tramposa: { risk: 1, cheat: true }
};

const worthRolling = (T, dice, risk) => (1 - P_FARKLE[dice]) * GAIN[dice] * risk > P_FARKLE[dice] * T;

export function decide(S, j) {
  if (S.fase === "tirar") return { type: "roll" };
  const o = PERSONALITIES[j.level] ?? PERSONALITIES.experta;
  const leader = Math.max(...S.jugadores.filter(p => p !== j).map(p => p.puntos));
  let risk = o.risk;
  if (o.adaptive && leader - j.puntos > 2000) risk *= 1.4;

  // Mejor selección: puntos ahora + valor esperado de seguir con los dados que quedan.
  let best = null;
  for (const s of scoringSubsets(S.mesa)) {
    const rem = S.mesa.length - s.indices.length;
    const dice = rem === 0 ? FULL : rem;
    const T = S.turnoPts + s.score;
    const next = Math.max(0, (1 - P_FARKLE[dice]) * GAIN[dice] * risk - P_FARKLE[dice] * T) * 0.5;
    const value = s.score + next;
    if (!best || value > best.value) best = { ...s, value, T, dice };
  }
  const total = j.puntos + best.T;
  let bank;
  if (!j.enTablero && best.T < S.entrada) bank = false;
  else if (S.ultimaVuelta != null) bank = total > leader;           // última vuelta: solo plantarse si ya gana
  else if (total >= S.meta) bank = true;
  else bank = !worthRolling(best.T, best.dice, risk);
  return { type: "keep", indices: best.indices, bank };
}
