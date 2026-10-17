// Motor de reglas de Mia / Meyer (Mäxle). Puro: sin Foundry. Lo prueba tests/mia.test.mjs.
// Estado: { jugadores:[{actorId,dadosRestantes (= vidas),dados:[a,b]}], turno, fase:"anunciar"|"decidir", anuncio:{codigo,jugadorIx}|null, memoria }
// Una tirada se anuncia con un código de dos cifras (dado mayor primero): "65", "31", doble "44", Mia "21".
// Quien tiene el turno en fase "decidir" puede dudar o aceptar (y entonces tira él y anuncia algo mayor).

export { rollHand, applyLosses, canAct, recordReveal, liarRate } from "./liars-dice.js";
import { liarRate } from "./liars-dice.js";

/** De menor a mayor. */
export const ORDER = ["31", "32", "41", "42", "43", "51", "52", "53", "54", "61", "62", "63", "64", "65", "11", "22", "33", "44", "55", "66", "21"];
export const MIA = "21";

export const rank = c => ORDER.indexOf(c);
export const isDouble = c => c[0] === c[1];
export const codeFromDice = ([a, b]) => `${Math.max(a, b)}${Math.min(a, b)}`;
export const diceFromCode = c => [Number(c[0]), Number(c[1])];

/** Probabilidad (de 36) de sacar exactamente ese código. */
const weight = c => (isDouble(c) ? 1 : 2);
/** Probabilidad de sacar al menos ese código con una tirada honrada. */
export const pAtLeast = c => ORDER.filter(x => rank(x) >= rank(c)).reduce((n, x) => n + weight(x), 0) / 36;

export const validAnnouncements = prev => (prev ? ORDER.filter(c => rank(c) > rank(prev)) : [...ORDER]);

export function isValidAnnouncement(S, codigo) {
  return S.fase === "anunciar" && ORDER.includes(codigo) && (!S.anuncio || rank(codigo) > rank(S.anuncio.codigo));
}

/** Frente a Mia no se puede aceptar (no hay nada mayor): solo dudar. */
export const canAccept = S => S.fase === "decidir" && S.anuncio?.codigo !== MIA;

/** Duda: pierde el que duda si el anunciante dijo la verdad o se quedó corto; si no, el anunciante. Mia en juego = 2 vidas. */
export function resolveDoubt(S, doubterIx) {
  const a = S.anuncio;
  const real = codeFromDice(S.jugadores[a.jugadorIx].dados);
  const honest = rank(real) >= rank(a.codigo);
  return { real, honest, loserIx: honest ? doubterIx : a.jugadorIx, lives: a.codigo === MIA ? 2 : 1 };
}

// --- IA: { type:"doubt" } | { type:"accept" } | { type:"announce", codigo } ---

export const PERSONALITIES = {
  basic: { doubtBelow: 0.25, bluff: 0, spread: 1 },
  experta: { doubtBelow: 0.35, bluff: 0.1, spread: 3 },
  farolera: { doubtBelow: 0.2, bluff: 0.55, spread: 4 },
  cauta: { doubtBelow: 0.5, bluff: 0, spread: 2 },
  observadora: { doubtBelow: 0.35, bluff: 0.1, spread: 3, memory: true },
  tramposa: { cheat: true, bluff: 0, spread: 1 }
};

/** Elige, entre las primeras `spread` opciones válidas, evitando farolear con Mia salvo que no quede otra. */
function pickBluff(valid, spread, rng) {
  const pool = valid.filter(c => c !== MIA);
  const from = pool.length ? pool : valid;
  return from[Math.floor(rng() * Math.min(spread, from.length))];
}

export function decide(S, j, rng = Math.random) {
  const o = PERSONALITIES[j.level] ?? PERSONALITIES.basic;
  if (S.fase === "decidir") {
    const prev = S.anuncio.codigo;
    if (!canAccept(S)) return { type: "doubt" };
    if (o.cheat) {
      const real = codeFromDice(S.jugadores[S.anuncio.jugadorIx].dados);
      return { type: rank(real) < rank(prev) ? "doubt" : "accept" };
    }
    const limit = o.memory ? o.doubtBelow * (0.6 + 0.8 * liarRate(S, S.anuncio.jugadorIx)) : o.doubtBelow;
    return { type: pAtLeast(prev) < limit ? "doubt" : "accept" };
  }
  const real = codeFromDice(j.dados);
  const valid = validAnnouncements(S.anuncio?.codigo);
  if (valid.includes(real)) {
    if (rng() < o.bluff) {
      const higher = valid.filter(c => rank(c) > rank(real));
      if (higher.length) return { type: "announce", codigo: pickBluff(higher, o.spread, rng) };
    }
    return { type: "announce", codigo: real };
  }
  return { type: "announce", codigo: pickBluff(valid, o.spread, rng) };
}
